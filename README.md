# ⚗️ Media Alchemist

> Transform any podcast or YouTube video into a complete, publish-ready content kit — powered by Groq AI.

![Media Alchemist Banner](https://img.shields.io/badge/Powered%20by-Groq%20AI-orange?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🎯 What It Does

Upload an audio file or paste a YouTube link — Media Alchemist uses AI to automatically generate:

| Output | Description |
|--------|-------------|
| 📋 **Show Notes** | Episode summary + inferred timestamps + key takeaways |
| 📝 **Blog Post** | 500-word structured article ready to publish |
| 💼 **LinkedIn Post** | Professional hook-driven post with engagement question |
| 🐦 **Twitter Thread** | 4–6 tweet thread with character count checker |
| 📸 **Instagram Caption** | Punchy caption with emojis and hashtags |
| 🎙️ **Full Transcript** | Clean, readable text of the entire audio |

---

## 🧠 AI Tools Used

| Tool | Purpose |
|------|---------|
| **Groq Whisper** (`whisper-large-v3-turbo`) | Ultra-fast audio transcription |
| **Groq LLaMA 3.3 70B** (`llama-3.3-70b-versatile`) | Content generation across all output types |
| **yt-dlp** | YouTube audio extraction |

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** Vanilla JS, HTML, CSS (no frameworks)
- **AI API:** [Groq](https://groq.com) (free tier)
- **Audio:** yt-dlp + FFmpeg for YouTube support

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- FFmpeg installed ([download here](https://ffmpeg.org/download.html) or `winget install ffmpeg`)
- Free Groq API key from [console.groq.com](https://console.groq.com/keys)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/media-alchemist.git
cd media-alchemist

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your Groq API key
# Open app.py and replace line 11:
GROQ_API_KEY = "your_gsk_key_here"

# 4. Run the app
python app.py
```

Then open `http://127.0.0.1:5000` in your browser.

---

## 📸 App Preview

### Home Screen
Clean, minimal input panel with file upload and YouTube link support.

### Output Dashboard
Four-tab results panel — Show Notes, Blog Post, Social Kit, and Transcript — each with one-click copy and download.

---

## 💡 How It Works

```
Audio File / YouTube URL
        ↓
   yt-dlp extracts audio (YouTube only)
        ↓
   Groq Whisper transcribes speech → text
        ↓
   Four parallel prompts sent to LLaMA 3.3:
   ├── Show Notes prompt   → structured Markdown
   ├── Blog Post prompt    → 500-word article
   └── Social Kit prompt   → LinkedIn + Twitter + Instagram
        ↓
   Results rendered in tabbed dashboard
```

---

## 🎨 Features

- 🌓 Clean light UI — no clutter, no dark mode overwhelm
- 📁 Drag & drop file upload
- ▶️ YouTube video preview on paste
- 🎚️ Tone selector — Professional, Casual, Hype, or Technical
- 👥 Audience selector — General, B2B, Developers, Creators
- 📋 One-click copy for every output
- ⬇️ Download buttons for every output (.md / .txt)

---

## 📝 Project Reflection

This project was built to explore **practical AI integration** in a real content workflow. 

The core challenge was prompt engineering — getting a single LLM to produce four distinct types of content (structured notes, long-form writing, and three platform-specific social formats) with consistent quality. The solution was using **separate system prompts per task**, each tuned to the specific format and platform conventions, while injecting shared tone and audience parameters across all of them.

Using **Groq's API** was a deliberate choice: its free tier is generous, its inference speed is dramatically faster than most alternatives, and Whisper support means audio transcription and text generation happen through a single provider with no extra setup.

Key learnings:
- Prompt specificity matters enormously — vague prompts produce generic output; format instructions (character limits, heading structure, numbered tweets) dramatically improve results
- Separating concerns per prompt (one prompt = one job) produces better output than asking one prompt to do everything
- Building a real end-to-end pipeline forces you to think about error handling, latency, and UX in ways that toy demos don't

---

## 📄 License

MIT — free to use, modify, and build on.
