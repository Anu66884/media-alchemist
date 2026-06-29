/* ── INPUT MODE SWITCHER ───────────────────────────────────────────────────── */
let currentMode = 'file';

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('filePanel').classList.toggle('hidden', mode !== 'file');
  document.getElementById('youtubePanel').classList.toggle('hidden', mode !== 'youtube');
  document.getElementById('modeFileBtn').classList.toggle('active', mode === 'file');
  document.getElementById('modeYtBtn').classList.toggle('active', mode === 'youtube');
}

/* ── YOUTUBE PREVIEW ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const ytInput = document.getElementById('yt_url');
  if (ytInput) {
    ytInput.addEventListener('input', () => {
      const url = ytInput.value.trim();
      const id  = extractYouTubeId(url);
      const wrap  = document.getElementById('ytPreviewWrap');
      const frame = document.getElementById('ytPreviewFrame');
      if (id) {
        frame.src = `https://www.youtube.com/embed/${id}`;
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
        frame.src = '';
      }
    });
  }
});

function extractYouTubeId(url) {
  const m = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ── FILE HANDLING ─────────────────────────────────────────────────────────── */
const dropZone    = document.getElementById('dropZone');
const fileInput   = document.getElementById('audio_file');
const dropInner   = document.getElementById('dropInner');
const filePreview = document.getElementById('filePreview');
const audioPlayer = document.getElementById('audioPlayer');

function formatBytes(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showFilePreview(file) {
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatBytes(file.size);
  dropInner.classList.add('hidden');
  filePreview.classList.remove('hidden');
  audioPlayer.src = URL.createObjectURL(file);
  audioPlayer.classList.remove('hidden');
}

function clearFile() {
  fileInput.value = '';
  dropInner.classList.remove('hidden');
  filePreview.classList.add('hidden');
  audioPlayer.classList.add('hidden');
  audioPlayer.src = '';
}

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) showFilePreview(fileInput.files[0]);
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (['mp3','wav','m4a','ogg','flac'].includes(ext)) {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    showFilePreview(file);
  } else {
    showError('Unsupported file type. Please upload MP3, WAV, M4A, OGG, or FLAC.');
  }
});

/* ── PROGRESS ──────────────────────────────────────────────────────────────── */
const STEPS = ['step1','step2','step3','step4'];
let currentStep = -1;

function activateStep(index) {
  STEPS.forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active','done');
    if (i < index)   el.classList.add('done');
    if (i === index) el.classList.add('active');
  });
  currentStep = index;
}

function completeAllSteps() {
  STEPS.forEach(id => {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id).classList.add('done');
  });
}

/* ── ERRORS ────────────────────────────────────────────────────────────────── */
function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorBox').classList.remove('hidden');
}
function hideError() {
  document.getElementById('errorBox').classList.add('hidden');
}

/* ── SOCIAL PARSER ─────────────────────────────────────────────────────────── */
function parseSocialKit(text) {
  const extract = (headerRe, nextRe) => {
    const m = text.match(new RegExp(headerRe + '\\s*([\\s\\S]*?)(?=' + nextRe + '|$)', 'i'));
    return m ? m[1].trim() : '';
  };
  return {
    linkedin:  extract('##\\s*LinkedIn Post', '##\\s*(?:Twitter|X)'),
    twitter:   extract('##\\s*(?:Twitter|X)[^\\n]*', '##\\s*(?:Instagram|TikTok)'),
    instagram: extract('##\\s*(?:Instagram|TikTok)[^\\n]*', '$^'),
  };
}

function renderTweets(text) {
  const container = document.getElementById('twitterContent');
  container.innerHTML = '';
  const tweets = text.split(/\n(?=\d+\/)/).map(t => t.trim()).filter(Boolean);
  const items  = tweets.length > 1 ? tweets : [text.trim()];
  items.forEach(tweet => {
    const len  = tweet.length;
    const card = document.createElement('div');
    card.className = 'tweet-card';
    card.innerHTML =
      `<div>${tweet.replace(/\n/g,'<br>')}</div>` +
      `<div class="tweet-char-count ${len <= 280 ? 'count-ok':'count-bad'}">${len} / 280</div>`;
    container.appendChild(card);
  });
}

/* ── MAIN RUN ──────────────────────────────────────────────────────────────── */
async function runAlchemy() {
  hideError();

  const tone     = document.getElementById('tone').value;
  const audience = document.getElementById('audience').value;
  const ytUrl    = document.getElementById('yt_url') ? document.getElementById('yt_url').value.trim() : '';

  // Validation
  if (currentMode === 'file') {
    if (!fileInput.files || !fileInput.files[0]) {
      showError('Please upload an audio file first.');
      return;
    }
  }
  if (currentMode === 'youtube') {
    if (!ytUrl) {
      showError('Please paste a YouTube URL.');
      return;
    }
    if (!extractYouTubeId(ytUrl)) {
      showError("That doesn't look like a valid YouTube URL.");
      return;
    }
  }

  // Update step label
  document.getElementById('step1sub').textContent =
    currentMode === 'youtube' ? 'Downloading YouTube audio…' : 'Reading your audio file…';

  // Disable button
  const runBtn   = document.getElementById('runBtn');
  const runLabel = document.getElementById('runBtnLabel');
  runBtn.disabled = true;
  runLabel.textContent = 'Processing…';

  // Show progress
  document.getElementById('progressPanel').classList.remove('hidden');
  document.getElementById('outputPanel').classList.add('hidden');
  activateStep(0);
  document.getElementById('progressPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const formData = new FormData();
    formData.append('tone',       tone);
    formData.append('audience',   audience);
    formData.append('input_mode', currentMode);

    if (currentMode === 'file') {
      formData.append('audio_file', fileInput.files[0]);
    } else {
      formData.append('yt_url', ytUrl);
    }

    // Animate steps while waiting
    const stepTimer = setInterval(() => {
      if (currentStep < 3) activateStep(currentStep + 1);
    }, currentMode === 'youtube' ? 8000 : 5000);

    const res  = await fetch('/process', { method: 'POST', body: formData });
    clearInterval(stepTimer);
    const data = await res.json();

    if (!res.ok || data.error) {
      showError(data.error || 'An unknown error occurred.');
      resetRunButton();
      return;
    }

    completeAllSteps();

    // Populate show notes
    document.getElementById('showNotesContent').innerHTML = marked.parse(data.show_notes);
    document.getElementById('showNotesRaw').value         = data.show_notes;

    // Populate blog post
    document.getElementById('blogPostContent').innerHTML  = marked.parse(data.blog_post);
    document.getElementById('blogPostRaw').value          = data.blog_post;

    // Populate social kit
    const social = parseSocialKit(data.social_kit);
    document.getElementById('linkedinContent').textContent  = social.linkedin;
    document.getElementById('linkedinRaw').value            = social.linkedin;
    document.getElementById('instagramContent').textContent = social.instagram;
    document.getElementById('instagramRaw').value           = social.instagram;
    document.getElementById('twitterRaw').value             = social.twitter;
    document.getElementById('socialKitRaw').value           = data.social_kit;
    renderTweets(social.twitter);

    // Populate transcript
    document.getElementById('transcriptContent').textContent = data.transcript;
    document.getElementById('transcriptRaw').value           = data.transcript;

    // Show output
    document.getElementById('outputPanel').classList.remove('hidden');
    document.getElementById('outputPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showError('Network error: ' + err.message);
  }

  resetRunButton();
}

function resetRunButton() {
  document.getElementById('runBtn').disabled = false;
  document.getElementById('runBtnLabel').textContent = 'Run Media Alchemy';
}

function resetAll() {
  clearFile();
  const ytUrl = document.getElementById('yt_url');
  if (ytUrl) ytUrl.value = '';
  const ytWrap = document.getElementById('ytPreviewWrap');
  if (ytWrap) ytWrap.classList.add('hidden');
  const ytFrame = document.getElementById('ytPreviewFrame');
  if (ytFrame) ytFrame.src = '';
  document.getElementById('progressPanel').classList.add('hidden');
  document.getElementById('outputPanel').classList.add('hidden');
  hideError();
  STEPS.forEach(id => document.getElementById(id).classList.remove('active','done'));
  currentStep = -1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── TABS ──────────────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ── COPY & DOWNLOAD ───────────────────────────────────────────────────────── */
function copyRaw(id) {
  navigator.clipboard.writeText(document.getElementById(id).value).then(flashCopied);
}

function flashCopied() {
  const t = document.createElement('div');
  t.textContent = '✅ Copied!';
  Object.assign(t.style, {
    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
    background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: '99px',
    fontSize: '0.85rem', fontWeight: '600', zIndex: '9999',
    boxShadow: '0 4px 16px rgba(5,150,105,0.35)', transition: 'opacity 0.3s',
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1800);
}

function downloadTxt(id, filename) {
  const text = document.getElementById(id).value;
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
