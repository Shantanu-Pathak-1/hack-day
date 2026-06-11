/* ===================================================
   MailGenius – AI Email Generator
   Powered by Google Gemini API
   =================================================== */

// ── State ──────────────────────────────────────────
const state = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  emailType: 'professional',
  emailTypePrompt: 'Write a professional business email',
  tone: 'professional',
  length: 'standard',
  generatedEmail: '',
  generatedSubject: '',
  history: [],
  isGenerating: false,
};

// ── DOM Refs ────────────────────────────────────────
const $ = id => document.getElementById(id);
const apiModal = $('api-key-modal');
const apiInput = $('api-key-input');
const saveKeyBtn = $('save-api-key-btn');
const toggleVisBtn = $('toggle-key-visibility');
const changeKeyBtn = $('change-key-btn');
const app = $('app');
const modelSelect = $('model-select');
const clearBtn = $('clear-btn');
const generateBtn = $('generate-btn');
const generateBtnText = $('generate-btn-text');
const copyBtn = $('copy-btn');
const regenerateBtn = $('regenerate-btn');
const improveBtn = $('improve-btn');
const retryBtn = $('retry-btn');
const emptyState = $('empty-state');
const loadingState = $('loading-state');
const outputContent = $('output-content');
const errorState = $('error-state');
const outputEmail = $('output-email');
const outputSubject = $('output-subject');
const subjectBadge = $('subject-badge-wrap');
const wordCount = $('word-count');
const charCount = $('char-count');
const readTime = $('read-time');
const sentimentBadge = $('sentiment-badge');
const historyList = $('history-list');
const improveModal = $('improve-modal');
const improveInstructions = $('improve-instructions');
const improveCancelBtn = $('improve-cancel-btn');
const improveSubmitBtn = $('improve-submit-btn');
const toast = $('toast');
const toastMessage = $('toast-message');
const toneSelector = $('tone-selector');
const lengthSelector = $('length-selector');
const emailTypeGrid = $('email-type-grid');

// ── Particles Canvas ────────────────────────────────
(function initParticles() {
  const canvas = $('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '139, 92, 246' : '6, 182, 212',
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
    animFrame = requestAnimationFrame(animate);
  }

  init();
  animate();
  window.addEventListener('resize', init);
})();

// ── API Key Management ──────────────────────────────
function loadSavedKey() {
  const saved = localStorage.getItem('mailgenius_api_key');
  if (saved) {
    state.apiKey = saved;
    showApp();
  }
}

function showApp() {
  apiModal.classList.remove('active');
  app.classList.remove('hidden');
}

function showApiModal() {
  apiModal.classList.add('active');
  app.classList.add('hidden');
  apiInput.value = '';
}

saveKeyBtn.addEventListener('click', () => {
  const key = apiInput.value.trim();
  if (!key) {
    showToast('⚠️ Please enter your Gemini API key first', 'error');
    apiInput.focus();
    return;
  }
  if (key.length < 10) {
    showToast('⚠️ API key looks too short. Please check and try again.', 'error');
    apiInput.focus();
    return;
  }
  state.apiKey = key;
  localStorage.setItem('mailgenius_api_key', key);
  showApp();
  showToast('✅ API key saved! Ready to generate emails.', 'success');
});

apiInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveKeyBtn.click();
});

toggleVisBtn.addEventListener('click', () => {
  const isPassword = apiInput.type === 'password';
  apiInput.type = isPassword ? 'text' : 'password';
});

changeKeyBtn.addEventListener('click', showApiModal);

// ── Model Selection ─────────────────────────────────
modelSelect.addEventListener('change', () => {
  state.model = modelSelect.value;
});

// ── Email Type Selection ────────────────────────────
emailTypeGrid.addEventListener('click', e => {
  const btn = e.target.closest('.type-btn');
  if (!btn) return;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.emailType = btn.dataset.type;
  state.emailTypePrompt = btn.dataset.prompt;
});

// ── Tone Selection ──────────────────────────────────
toneSelector.addEventListener('click', e => {
  const btn = e.target.closest('.tone-btn');
  if (!btn) return;
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.tone = btn.dataset.tone;
});

// ── Length Selection ────────────────────────────────
lengthSelector.addEventListener('click', e => {
  const btn = e.target.closest('.length-btn');
  if (!btn) return;
  document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.length = btn.dataset.length;
});

// ── Templates ───────────────────────────────────────
const templates = {
  'tpl-job-application': {
    type: 'professional',
    typePrompt: 'Write a professional business email',
    tone: 'professional',
    context: 'I am applying for the Software Engineer position at your company. I have 5 years of experience in full-stack development using React and Node.js. I am excited about the opportunity and believe my skills align perfectly with your team\'s needs. I have attached my resume and portfolio for review.',
  },
  'tpl-partnership': {
    type: 'cold-outreach',
    typePrompt: 'Write a compelling cold outreach networking email',
    tone: 'persuasive',
    context: 'I want to propose a strategic partnership between our companies. Our product complements their service and together we can offer more value to customers. I would like to schedule a call to explore mutual benefits and potential revenue sharing opportunities.',
  },
  'tpl-meeting-request': {
    type: 'professional',
    typePrompt: 'Write a professional business email',
    tone: 'friendly',
    context: 'I would like to schedule a 30-minute meeting to discuss the Q3 project roadmap. I am available Monday through Wednesday next week. Please share your preferred time slot and I will send a calendar invite.',
  },
  'tpl-product-launch': {
    type: 'newsletter',
    typePrompt: 'Write an engaging marketing newsletter email',
    tone: 'persuasive',
    context: 'We are launching our new AI-powered analytics dashboard next week. It features real-time insights, custom reports, and seamless integrations. Early adopters get 30% off for 6 months. We want to generate excitement and drive sign-ups.',
  },
};

document.querySelectorAll('.template-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tpl = templates[btn.id];
    if (!tpl) return;
    // Update type
    document.querySelectorAll('.type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === tpl.type);
    });
    state.emailType = tpl.type;
    state.emailTypePrompt = tpl.typePrompt;
    // Update tone
    document.querySelectorAll('.tone-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tone === tpl.tone);
    });
    state.tone = tpl.tone;
    // Fill context
    $('email-context').value = tpl.context;
    showToast('📋 Template loaded!', 'success');
  });
});

// ── Clear Form ──────────────────────────────────────
clearBtn.addEventListener('click', () => {
  $('sender-name').value = '';
  $('recipient-name').value = '';
  $('recipient-role').value = '';
  $('subject-line').value = '';
  $('email-context').value = '';
  showPanel('empty');
  copyBtn.disabled = true;
  regenerateBtn.disabled = true;
  improveBtn.disabled = true;
  state.generatedEmail = '';
  state.generatedSubject = '';
});

// ── Panel Management ────────────────────────────────
function showPanel(panel) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  outputContent.classList.add('hidden');
  errorState.classList.add('hidden');
  if (panel === 'empty') emptyState.classList.remove('hidden');
  if (panel === 'loading') loadingState.classList.remove('hidden');
  if (panel === 'output') outputContent.classList.remove('hidden');
  if (panel === 'error') errorState.classList.remove('hidden');
}

// ── Loading Steps Animation ─────────────────────────
let stepTimer;
function animateLoadingSteps() {
  const steps = [$('step-1'), $('step-2'), $('step-3')];
  let current = 0;
  steps.forEach(s => { s.classList.remove('active', 'done'); });
  steps[0].classList.add('active');

  stepTimer = setInterval(() => {
    steps[current].classList.remove('active');
    steps[current].classList.add('done');
    current++;
    if (current < steps.length) {
      steps[current].classList.add('active');
    } else {
      clearInterval(stepTimer);
    }
  }, 1200);
}

// ── Countdown for rate-limit retry ─────────────────
function showCountdown(seconds, attempt, maxAttempts) {
  return new Promise(resolve => {
    const loadingText = document.querySelector('.loading-text');
    const originalText = loadingText ? loadingText.textContent : '';
    let remaining = seconds;

    // Show countdown in loading panel
    function tick() {
      if (loadingText) {
        loadingText.textContent = `⏳ Rate limit hit — retrying in ${remaining}s... (attempt ${attempt}/${maxAttempts - 1})`;
      }
      showToast(`⏳ Rate limit — auto-retrying in ${remaining}s`, 'error');
      if (remaining <= 0) {
        if (loadingText) loadingText.textContent = 'Retrying...';
        resolve();
        return;
      }
      remaining--;
      setTimeout(tick, 1000);
    }
    tick();
  });
}

// ── Build Gemini Prompt ─────────────────────────────
function buildPrompt(forImprovement = false, improvementInstructions = '') {
  const senderName = $('sender-name').value.trim() || 'the sender';
  const recipientName = $('recipient-name').value.trim() || 'the recipient';
  const recipientRole = $('recipient-role').value.trim();
  const subjectHint = $('subject-line').value.trim();
  const context = $('email-context').value.trim();
  const language = $('language-select').value;
  const includeCTA = $('opt-cta').checked;
  const includeSignature = $('opt-signature').checked;
  const generateSubject = $('opt-subject').checked;
  const useEmoji = $('opt-emoji').checked;

  const lengthGuide = {
    brief: '100–150 words – concise and punchy',
    standard: '200–300 words – balanced and complete',
    detailed: '350–500 words – thorough and comprehensive',
  }[state.length];

  if (forImprovement) {
    return `You are an expert email copywriter. Below is an email that was previously generated. 
Improve it based on these instructions: "${improvementInstructions}"

ORIGINAL EMAIL:
${state.generatedEmail}

OUTPUT REQUIREMENTS:
- Return ONLY the improved email body (no explanations, no labels)
- Keep it in ${language}
- Maintain ${state.tone} tone
- Length: ${lengthGuide}
${generateSubject ? '- Start with "SUBJECT: [subject line]" on the very first line, then a blank line, then the email body' : ''}
${includeSignature ? `- End with a professional signature for ${senderName}` : ''}`;
  }

  return `You are an expert email copywriter. Your task is to ${state.emailTypePrompt}.

DETAILS:
- From: ${senderName}
- To: ${recipientName}${recipientRole ? ` (${recipientRole})` : ''}
${subjectHint ? `- Suggested subject: ${subjectHint}` : ''}
- Context/Purpose: ${context || 'No additional context provided – make reasonable assumptions.'}

EMAIL REQUIREMENTS:
- Tone: ${state.tone}
- Length: ${lengthGuide}
- Language: ${language}
${includeCTA ? '- Include a clear and compelling call-to-action' : '- No call-to-action needed'}
${includeSignature ? `- End with a professional sign-off and signature for ${senderName}` : '- Skip the signature'}
${useEmoji ? '- Use emojis tastefully where appropriate' : '- Do NOT use emojis'}

OUTPUT FORMAT:
${generateSubject ? '- FIRST LINE must be: "SUBJECT: [your subject line here]"\n- Then a BLANK LINE\n- Then the full email body' : '- Output ONLY the email body, no subject line, no labels'}
- Do NOT include any preamble, explanations, or notes outside the email
- Format paragraphs naturally with proper spacing
- Make this email stand out and achieve its purpose effectively`;
}

// ── Call Gemini API (with auto-retry on rate limit) ───
async function callGemini(prompt, attempt = 1) {
  const MAX_ATTEMPTS = 4;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${state.apiKey}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error('Network error. Please check your internet connection.');
  }

  // ── Rate limit: auto-retry with countdown ──
  if (response.status === 429) {
    if (attempt >= MAX_ATTEMPTS) {
      throw new Error('Rate limit exceeded. Please wait 1–2 minutes before trying again (free tier limit).');
    }
    const waitSec = attempt * 15; // 15s, 30s, 45s
    await showCountdown(waitSec, attempt, MAX_ATTEMPTS);
    return callGemini(prompt, attempt + 1);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    if (response.status === 400) throw new Error('Invalid API key or bad request. Please check your Gemini API key.');
    if (response.status === 403) throw new Error('API key does not have permission. Make sure Gemini API is enabled in Google AI Studio.');
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini. Please try again.');
  return text.trim();
}

// ── Parse Generated Email ───────────────────────────
function parseGeneratedEmail(rawText) {
  const generateSubject = $('opt-subject').checked;
  if (generateSubject && rawText.toUpperCase().startsWith('SUBJECT:')) {
    const lines = rawText.split('\n');
    const subjectLine = lines[0].replace(/^SUBJECT:\s*/i, '').trim();
    const body = lines.slice(1).join('\n').trimStart();
    return { subject: subjectLine, body };
  }
  return { subject: $('subject-line').value.trim() || '', body: rawText };
}

// ── Update Output Stats ─────────────────────────────
function updateStats(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  wordCount.textContent = `${words} words`;
  charCount.textContent = `${chars} chars`;
  readTime.textContent = `~${minutes} min read`;

  // Sentiment badge
  const tone = state.tone;
  sentimentBadge.className = 'sentiment-badge';
  if (['professional', 'formal'].includes(tone)) {
    sentimentBadge.textContent = '🎯 Professional';
    sentimentBadge.classList.add('sentiment-professional');
  } else if (['persuasive', 'urgent'].includes(tone)) {
    sentimentBadge.textContent = '⚡ Persuasive';
    sentimentBadge.classList.add('sentiment-persuasive');
  } else {
    sentimentBadge.textContent = '✨ Friendly';
    sentimentBadge.classList.add('sentiment-positive');
  }
}

// ── Stream Text Effect ──────────────────────────────
async function streamText(element, text, delayMs = 8) {
  element.textContent = '';
  element.classList.add('stream-cursor');
  const chunks = text.split('');
  let i = 0;

  return new Promise(resolve => {
    function addChunk() {
      if (i >= chunks.length) {
        element.classList.remove('stream-cursor');
        resolve();
        return;
      }
      const batchSize = 3;
      for (let b = 0; b < batchSize && i < chunks.length; b++, i++) {
        element.textContent += chunks[i];
      }
      element.scrollTop = element.scrollHeight;
      setTimeout(addChunk, delayMs);
    }
    addChunk();
  });
}

// ── Add to History ──────────────────────────────────
function addToHistory(subject, preview) {
  const item = {
    id: Date.now(),
    subject: subject || preview.slice(0, 40) + '...',
    type: state.emailType,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    email: state.generatedEmail,
    subjectLine: state.generatedSubject,
  };
  state.history.unshift(item);
  if (state.history.length > 10) state.history.pop();
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">Generated emails will appear here</p>';
    return;
  }
  historyList.innerHTML = state.history.map(item => `
    <div class="history-item" data-id="${item.id}" role="button" tabindex="0">
      <div class="history-item-title">${escapeHtml(item.subject)}</div>
      <div class="history-item-meta">${item.type} · ${item.time}</div>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const item = state.history.find(h => h.id === Number(el.dataset.id));
      if (!item) return;
      state.generatedEmail = item.email;
      state.generatedSubject = item.subjectLine;
      displayOutput(item.subjectLine, item.email);
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Display Output ──────────────────────────────────
async function displayOutput(subject, body) {
  showPanel('output');
  copyBtn.disabled = false;
  regenerateBtn.disabled = false;
  improveBtn.disabled = false;

  if (subject) {
    subjectBadge.style.display = 'flex';
    outputSubject.textContent = subject;
  } else {
    subjectBadge.style.display = 'none';
  }

  await streamText(outputEmail, body);
  updateStats(body);
}

// ── Main Generate Function ──────────────────────────
async function generateEmail(improvementMode = false, improvementInstructions = '') {
  if (state.isGenerating) return;

  const context = $('email-context').value.trim();
  if (!improvementMode && !context) {
    showToast('✍️ Please describe the purpose of your email first', 'error');
    $('email-context').focus();
    return;
  }

  state.isGenerating = true;
  generateBtn.disabled = true;
  generateBtnText.textContent = 'Generating...';

  showPanel('loading');
  animateLoadingSteps();

  try {
    const prompt = buildPrompt(improvementMode, improvementInstructions);
    const rawText = await callGemini(prompt);
    const { subject, body } = parseGeneratedEmail(rawText);

    state.generatedEmail = body;
    state.generatedSubject = subject;

    clearInterval(stepTimer);

    // All steps done
    [$('step-1'), $('step-2'), $('step-3')].forEach(s => {
      s.classList.remove('active');
      s.classList.add('done');
    });

    await new Promise(r => setTimeout(r, 300)); // brief pause

    await displayOutput(subject, body);

    if (!improvementMode) {
      addToHistory(subject, body);
    }

    showToast('✅ Email generated successfully!', 'success');
  } catch (err) {
    clearInterval(stepTimer);
    showPanel('error');
    $('error-message').textContent = err.message || 'An unexpected error occurred.';
    showToast(`❌ ${err.message || 'Generation failed'}`, 'error');
    console.error('Gemini API Error:', err);
  } finally {
    state.isGenerating = false;
    generateBtn.disabled = false;
    generateBtnText.textContent = 'Generate Email';
  }
}

// ── Event Listeners ─────────────────────────────────
generateBtn.addEventListener('click', () => generateEmail());
retryBtn.addEventListener('click', () => generateEmail());
regenerateBtn.addEventListener('click', () => generateEmail());

copyBtn.addEventListener('click', async () => {
  const text = state.generatedSubject
    ? `Subject: ${state.generatedSubject}\n\n${state.generatedEmail}`
    : state.generatedEmail;
  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Email copied to clipboard!', 'success');
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  } catch {
    showToast('❌ Failed to copy. Please select and copy manually.', 'error');
  }
});

$('copy-subject-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(state.generatedSubject);
    showToast('📋 Subject copied!', 'success');
  } catch { /* silent fail */ }
});

improveBtn.addEventListener('click', () => {
  improveInstructions.value = '';
  improveModal.classList.add('active');
  setTimeout(() => improveInstructions.focus(), 100);
});

improveCancelBtn.addEventListener('click', () => {
  improveModal.classList.remove('active');
});

improveSubmitBtn.addEventListener('click', () => {
  const instructions = improveInstructions.value.trim();
  if (!instructions) {
    improveInstructions.focus();
    return;
  }
  improveModal.classList.remove('active');
  generateEmail(true, instructions);
});

improveModal.addEventListener('click', e => {
  if (e.target === improveModal) improveModal.classList.remove('active');
});

// Track edits to output
outputEmail.addEventListener('input', () => {
  state.generatedEmail = outputEmail.textContent;
  updateStats(state.generatedEmail);
});

// ── Toast ────────────────────────────────────────────
let toastTimer;
function showToast(message, type = '') {
  clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// ── Initialize ───────────────────────────────────────
loadSavedKey();

// Pre-fill with demo values in development to help test
// (Remove these in production)
// $('sender-name').value = 'Alex Johnson';
// $('recipient-name').value = 'Sarah Chen';
// $('recipient-role').value = 'VP of Product at TechCorp';
// $('email-context').value = 'Following up on my proposal sent last week about integrating our API. Would love to schedule a demo call this week.';
