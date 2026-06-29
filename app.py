import os
import re
import time
import tempfile
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from groq import Groq
import yt_dlp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "ogg", "flac"}

# ── PUT YOUR GROQ API KEY HERE ────────────────────────────────────────────────
GROQ_API_KEY = "PUT YOUR GROQ API KEY HERE"
# ─────────────────────────────────────────────────────────────────────────────

TONE_GUIDE = {
    "Professional": "Use a polished, authoritative, executive tone. Avoid slang. Prioritise clarity and credibility.",
    "Casual":       "Use a warm, conversational, friendly tone. Short sentences. Relatable language.",
    "Hype":         "Use high-energy, punchy, exciting language. Use power words. Create urgency and FOMO.",
    "Technical":    "Use precise, technical language. Welcome jargon. Focus on accuracy and depth.",
}

AUDIENCE_GUIDE = {
    "General":              "Write for a broad general audience.",
    "B2B / Founders":       "Write for startup founders, operators, and business decision-makers.",
    "Developers":           "Write for software engineers and technical practitioners.",
    "Creators & Marketers": "Write for content creators, marketers, and growth professionals.",
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def download_youtube_audio(url: str, out_dir: str) -> str:
    out_template = os.path.join(out_dir, "yt_audio.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    for f in Path(out_dir).iterdir():
        if f.suffix in (".mp3", ".m4a", ".webm", ".ogg"):
            return str(f)
    raise FileNotFoundError("YouTube audio download failed.")


def transcribe_audio(client: Groq, audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=(Path(audio_path).name, f.read()),
            model="whisper-large-v3-turbo",
            response_format="text",
        )
    return transcription.strip() if isinstance(transcription, str) else transcription.text.strip()


def chat(client: Groq, system: str, user: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def build_base_system(tone: str, audience: str) -> str:
    return (
        "You are an expert content strategist and copywriter. "
        f"Tone directive: {TONE_GUIDE[tone]} "
        f"Audience directive: {AUDIENCE_GUIDE[audience]} "
        "Always produce clean, publication-ready content."
    )


def generate_show_notes(client, transcript, tone, audience):
    system = build_base_system(tone, audience) + " You are also an expert podcast producer."
    prompt = (
        f"Podcast transcript:\n\n{transcript}\n\n"
        "Generate structured show notes in Markdown:\n"
        "1. 3-sentence episode summary at the top.\n"
        "2. '## Timestamps' with entries like `MM:SS - Topic` (~130 wpm).\n"
        "3. '## Key Takeaways' with 3-5 bullet points."
    )
    return chat(client, system, prompt)


def generate_blog_post(client, transcript, tone, audience):
    system = build_base_system(tone, audience) + " You are also an expert blog writer."
    prompt = (
        f"Podcast transcript:\n\n{transcript}\n\n"
        "Write a 500-word blog post in Markdown:\n"
        "- # H1 title\n- Strong intro\n- 2-3 ## H2 sections\n"
        "- ## Key Takeaways with 3 bullets\n- Closing call-to-action.\n"
        "Do not copy the transcript verbatim."
    )
    return chat(client, system, prompt)


def generate_social_kit(client, transcript, tone, audience):
    system = build_base_system(tone, audience) + " You are also a social media expert."
    prompt = (
        f"Podcast transcript:\n\n{transcript}\n\n"
        "Generate a social media kit with exactly these three ## sections:\n\n"
        "## LinkedIn Post\n150-200 words. Hook, insights, closing question.\n\n"
        "## Twitter Thread\n4-6 tweets numbered 1/, 2/... Each under 280 chars.\n\n"
        "## Instagram Caption\n80-120 words with 2-3 emojis. End with 8-12 hashtags."
    )
    return chat(client, system, prompt)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/process", methods=["POST"])
def process():
    tmp_dir = None
    try:
        tone       = request.form.get("tone", "Professional")
        audience   = request.form.get("audience", "General")
        yt_url     = request.form.get("yt_url", "").strip()
        input_mode = request.form.get("input_mode", "file")

        client = Groq(api_key=GROQ_API_KEY)

        tmp_dir    = tempfile.mkdtemp()
        audio_path = None

        if input_mode == "youtube":
            if not yt_url:
                return jsonify({"error": "Please paste a YouTube URL."}), 400
            if "youtube.com" not in yt_url and "youtu.be" not in yt_url:
                return jsonify({"error": "Please enter a valid YouTube URL."}), 400
            audio_path = download_youtube_audio(yt_url, tmp_dir)
        else:
            if "audio_file" not in request.files or request.files["audio_file"].filename == "":
                return jsonify({"error": "Please upload an audio file."}), 400
            file = request.files["audio_file"]
            if not allowed_file(file.filename):
                return jsonify({"error": "Unsupported file type. Use MP3, WAV, M4A, OGG, or FLAC."}), 400
            audio_path = os.path.join(tmp_dir, file.filename)
            file.save(audio_path)

        transcript = transcribe_audio(client, audio_path)
        show_notes = generate_show_notes(client, transcript, tone, audience)
        blog_post  = generate_blog_post(client, transcript, tone, audience)
        social_kit = generate_social_kit(client, transcript, tone, audience)

        return jsonify({
            "transcript": transcript,
            "show_notes": show_notes,
            "blog_post":  blog_post,
            "social_kit": social_kit,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if tmp_dir:
            import shutil
            shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
