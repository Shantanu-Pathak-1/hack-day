/* MailGenius – app.js (Responsive version) */

// ── State ───────────────────────────────────────────
const state = {
  apiKey: '',
  model: 'gemini-3.5-flash',
  emailType: 'professional',
  emailTypePrompt: 'Write a professional business email',
  tone: 'professional',
  length: 'standard',
  generatedEmail: '',
  generatedSubject: '',
  isGenerating: false,
  isDemo: false,
};

// ── DOM Helpers ─────────────────────────────────────
const $ = id => document.getElementById(id);
const apiModal     = $('api-key-modal');
const apiInput     = $('api-key-input');
const saveKeyBtn   = $('save-api-key-btn');
const skipKeyBtn   = $('skip-api-key-btn');
const toggleVis    = $('toggle-vis');
const eyeOpen      = $('eye-open');
const eyeClosed    = $('eye-closed');
const changeKeyBtn = $('change-key-btn');
const app          = $('app');
const modelSelect  = $('model-select');
const typeStrip    = $('type-strip');
const toneSelector = $('tone-selector');
const lengthSelector = $('length-selector');
const generateBtn  = $('generate-btn');
const generateText = $('generate-btn-text');
const emptyState   = $('empty-state');
const loadingState = $('loading-state');
const errorState   = $('error-state');
const outputContent= $('output-content');
const outputEmail  = $('output-email');
const outputSubject= $('output-subject');
const subjectWrap  = $('subject-wrap');
const wordCountEl  = $('word-count');
const charCountEl  = $('char-count');
const readTimeEl   = $('read-time');
const loadingText  = $('loading-text');
const copyBtn      = $('copy-btn');
const regenerateBtn= $('regenerate-btn');
const improveBtn   = $('improve-btn');
const retryBtn     = $('retry-btn');
const improveModal = $('improve-modal');
const improveInstr = $('improve-instructions');
const improveCancelBtn = $('improve-cancel-btn');
const improveSubmitBtn = $('improve-submit-btn');
const toast        = $('toast');
const toastMsg     = $('toast-msg');
const formPanel    = $('tab-form');
const outputPanel  = $('tab-output');

// ── API Key ─────────────────────────────────────────
function loadSavedKey() {
  if (window.GEMINI_API_KEY) {
    state.apiKey = window.GEMINI_API_KEY;
    state.isDemo = false;
    if (changeKeyBtn) changeKeyBtn.style.display = 'none';
    showApp();
    return;
  }
  const saved = localStorage.getItem('mailgenius_key');
  const isDemo = localStorage.getItem('mailgenius_demo') === 'true';
  if (saved) {
    state.apiKey = saved;
    state.isDemo = false;
    showApp();
  } else if (isDemo) {
    state.apiKey = '';
    state.isDemo = true;
    showApp();
  } else {
    window.location.href = 'login.html';
  }
}

function showApp() {
  apiModal.classList.remove('active');
  app.classList.remove('hidden');
}

function showApiModal() {
  state.isDemo = false;
  apiModal.classList.add('active');
  app.classList.add('hidden');
  apiInput.value = '';
}

saveKeyBtn.addEventListener('click', () => {
  const key = apiInput.value.trim();
  if (!key) { showToast('⚠️ Please paste your API key', 'error'); return; }
  if (key.length < 10) { showToast('⚠️ Key too short — please check it', 'error'); return; }
  state.apiKey = key;
  state.isDemo = false;
  localStorage.setItem('mailgenius_key', key);
  showApp();
  showToast('✅ Ready! Generate your first email', 'success');
});

skipKeyBtn.addEventListener('click', () => {
  state.apiKey = '';
  state.isDemo = true;
  showApp();
  showToast('🚀 Running in Demo Mode (Generations will use Mock AI templates)', 'success');
});

apiInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKeyBtn.click(); });

toggleVis.addEventListener('click', () => {
  const isPass = apiInput.type === 'password';
  apiInput.type = isPass ? 'text' : 'password';
  eyeOpen.style.display = isPass ? 'none' : '';
  eyeClosed.style.display = isPass ? '' : 'none';
});

changeKeyBtn.addEventListener('click', () => {
  localStorage.removeItem('mailgenius_key');
  localStorage.removeItem('mailgenius_demo');
  window.location.href = 'login.html';
});
modelSelect.addEventListener('change', () => { state.model = modelSelect.value; saveFormDraft(); });

// ── Mobile Tabs ─────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'form') {
      formPanel.classList.remove('tab-hidden');
      outputPanel.classList.add('tab-hidden');
    } else {
      outputPanel.classList.remove('tab-hidden');
      formPanel.classList.add('tab-hidden');
    }
  });
});

const defaultTypeTemplates = {
  professional: {
    context: "I would like to schedule a 30-minute sync meeting to discuss the Q3 project roadmap and timelines. Please share your availability next week.",
    tone: "professional"
  },
  sales: {
    context: "Introduce our automated customer workflow platform which helps support teams cut resolve times by 45%. Request a quick 10-minute demo next Thursday.",
    tone: "persuasive"
  },
  'follow-up': {
    context: "Follow up on the project proposal I sent last week. Ask if they have had a chance to review it, and request a sync to discuss details.",
    tone: "friendly"
  },
  'cold-outreach': {
    context: "Propose a strategic partnership between our two companies where our product complements their service. Request a brief call to explore synergies.",
    tone: "persuasive"
  },
  'thank-you': {
    context: "Express my sincere appreciation for your time, guidance, and invaluable mentorship during the Q2 launch. Your feedback helped us refine our approach.",
    tone: "friendly"
  },
  apology: {
    context: "Sincerely apologize for the unexpected server outage yesterday. Acknowledge the critical nature of our services, and offer a 15% credit on their next invoice.",
    tone: "formal"
  },
  newsletter: {
    context: "Announce the release of our new real-time AI developer dashboard. Showcase its features and offer early-bird adopters a 30% discount for 6 months.",
    tone: "persuasive"
  },
  feedback: {
    context: "Thank the client for attending our product demo yesterday. Ask them to share their honest feedback by filling out a quick 2-minute survey.",
    tone: "friendly"
  },
  invitation: {
    context: "Invite the recipient to our upcoming startup networking panel and seminar next Thursday evening at 7 PM. Drinks and appetizers will be served.",
    tone: "friendly"
  },
  complaint: {
    context: "Firmly address the issue of the delayed shipment of our office hardware order. Mention the delay is impacting operations, and request immediate tracking updates.",
    tone: "formal"
  }
};

// ── Email Type Strip ────────────────────────────────
typeStrip.addEventListener('click', e => {
  const pill = e.target.closest('.type-pill');
  if (!pill) return;
  document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  state.emailType = pill.dataset.type;
  state.emailTypePrompt = pill.dataset.prompt;

  // Load default template context and tone
  const tplData = defaultTypeTemplates[state.emailType];
  if (tplData) {
    const contextInput = $('email-context');
    if (contextInput) {
      contextInput.value = tplData.context;
      
      // Trigger pulse animation
      contextInput.classList.remove('input-highlight-pulse');
      void contextInput.offsetWidth; // trigger reflow
      contextInput.classList.add('input-highlight-pulse');
      setTimeout(() => contextInput.classList.remove('input-highlight-pulse'), 800);
    }
    if (tplData.tone) {
      state.tone = tplData.tone;
      toneSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.toggle('active', p.dataset.tone === tplData.tone));
    }
  }

  saveFormDraft();
});

// ── Tone ────────────────────────────────────────────
toneSelector.addEventListener('click', e => {
  const pill = e.target.closest('.opt-pill');
  if (!pill) return;
  toneSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  state.tone = pill.dataset.tone;
  saveFormDraft();
});

// ── Length ──────────────────────────────────────────
lengthSelector.addEventListener('click', e => {
  const pill = e.target.closest('.opt-pill');
  if (!pill) return;
  lengthSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  state.length = pill.dataset.length;
  saveFormDraft();
});

// ── Quick Templates ─────────────────────────────────
const templatesData = [
  {
    id: 'tpl-job-application',
    title: 'Job Application',
    desc: 'Apply for roles with full-stack experience details.',
    icon: '💼',
    category: 'career',
    badge: 'Career',
    type: 'professional',
    tone: 'professional',
    typePrompt: 'Write a professional business email',
    context: 'I am applying for the Software Engineer position at your company. I have 5 years of experience in full-stack development using React and Node.js. I believe my skills align perfectly with your team\'s needs. My resume and portfolio are attached.',
  },
  {
    id: 'tpl-partnership',
    title: 'Partnership Pitch',
    desc: 'Propose strategic collaborations and revenue sharing.',
    icon: '🤝',
    category: 'outreach',
    badge: 'Sales',
    type: 'cold-outreach',
    tone: 'persuasive',
    typePrompt: 'Write a compelling cold outreach networking email',
    context: 'I want to propose a strategic partnership between our companies. Our product complements their service and together we can offer more value to customers. I would like to schedule a call to explore mutual benefits and potential revenue sharing.',
  },
  {
    id: 'tpl-meeting-request',
    title: 'Meeting Request',
    desc: 'Request a quick sync on Q3 roadmap or check-ins.',
    icon: '📅',
    category: 'outreach',
    badge: 'Sync',
    type: 'professional',
    tone: 'friendly',
    typePrompt: 'Write a professional business email',
    context: 'I would like to schedule a 30-minute meeting to discuss the Q3 project roadmap. I am available Monday through Wednesday next week. Please share your preferred time and I will send a calendar invite.',
  },
  {
    id: 'tpl-product-launch',
    title: 'Product Launch',
    desc: 'Draft marketing announcements with early-bird discounts.',
    icon: '🚀',
    category: 'marketing',
    badge: 'Launch',
    type: 'newsletter',
    tone: 'persuasive',
    typePrompt: 'Write an engaging marketing newsletter email',
    context: 'We are launching our new AI-powered analytics dashboard next week. It features real-time insights, custom reports, and seamless integrations. Early adopters get 30% off for 6 months. Drive excitement and sign-ups.',
  },
  {
    id: 'tpl-salary-negotiation',
    title: 'Salary Negotiation',
    desc: 'Professionally request compensation review based on achievements.',
    icon: '💰',
    category: 'career',
    badge: 'Career',
    type: 'professional',
    tone: 'formal',
    typePrompt: 'Write a professional business email',
    context: 'I would like to request a formal review of my current compensation. Over the past year, I have successfully led three major product launches, increased team velocity by 25%, and consistently exceeded my performance key indicators. I look forward to discussing how my compensation can align with my contributions.',
  },
  {
    id: 'tpl-customer-support',
    title: 'Apology & Refund',
    desc: 'Address service downtime or delayed orders with refunds.',
    icon: '🛠️',
    category: 'support',
    badge: 'Support',
    type: 'apology',
    tone: 'formal',
    typePrompt: 'Write a sincere apology email',
    context: 'I am writing to sincerely apologize for the unexpected server outage yesterday. We understand how critical our services are to your business. To make things right, we are automatically issuing a 15% credit to your next invoice. We have patched the underlying issue to prevent future occurrences.',
  },
  {
    id: 'tpl-sales-cold',
    title: 'Cold Sales Pitch',
    desc: 'Hook potential leads with short, high-value value propositions.',
    icon: '🔥',
    category: 'outreach',
    badge: 'Sales',
    type: 'sales',
    tone: 'persuasive',
    typePrompt: 'Write a persuasive sales outreach email',
    context: 'I saw your recent LinkedIn post about challenges scaling your team\'s customer service response time. Our platform helps support teams cut resolve times by 45% using automated workflows. Are you free for a 10-minute demo next Thursday?',
  },
  {
    id: 'tpl-feedback-request',
    title: 'Feedback Request',
    desc: 'Polite request asking users for feedback after product demo.',
    icon: '⭐',
    category: 'marketing',
    badge: 'Feedback',
    type: 'feedback',
    tone: 'friendly',
    typePrompt: 'Write a polite feedback request email',
    context: 'Thank you for attending our product demo yesterday. We want to ensure we are building the absolute best tool for developers, and we would love to hear your honest feedback. It takes less than 2 minutes to fill out this quick survey.',
  }
];

let activeFilter = 'all';
let searchQuery = '';

function renderTemplates() {
  const container = $('templates-container');
  const countEl = $('tpl-count');
  if (!container) return;

  container.innerHTML = '';
  
  const filtered = templatesData.filter(tpl => {
    const matchesFilter = activeFilter === 'all' || tpl.category === activeFilter;
    const matchesSearch = tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tpl.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} template${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 24px 10px; color: var(--tx3); font-size: 0.82rem; font-weight: 500;">
        No templates found
      </div>
    `;
    return;
  }

  filtered.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.id = tpl.id;
    card.innerHTML = `
      <div class="tpl-header">
        <span class="tpl-icon bg-purple-500/10 text-purple-400" style="background-color: rgba(139, 92, 246, 0.1);">${tpl.icon}</span>
        <span class="tpl-badge">${tpl.badge}</span>
      </div>
      <h4 class="tpl-title">${tpl.title}</h4>
      <p class="tpl-desc">${tpl.desc}</p>
    `;

    card.addEventListener('click', () => {
      // Set type
      document.querySelectorAll('.type-pill').forEach(p => p.classList.toggle('active', p.dataset.type === tpl.type));
      state.emailType = tpl.type;
      state.emailTypePrompt = tpl.typePrompt;
      
      // Set tone
      toneSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.toggle('active', p.dataset.tone === tpl.tone));
      state.tone = tpl.tone;
      
      // Fill context
      const contextInput = $('email-context');
      contextInput.value = tpl.context;
      
      // Highlight Pulse Animation
      contextInput.classList.remove('input-highlight-pulse');
      // trigger reflow
      void contextInput.offsetWidth;
      contextInput.classList.add('input-highlight-pulse');
      setTimeout(() => contextInput.classList.remove('input-highlight-pulse'), 800);

      saveFormDraft();
      showToast(`📋 ${tpl.title} template loaded!`, 'success');
    });

    container.appendChild(card);
  });
}

// Wire search and filter controls
const searchInput = $('tpl-search');
const filterChips = document.querySelectorAll('#tpl-filters .filter-chip');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTemplates();
  });
}

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderTemplates();
  });
});

// ── Templates Collapse/Expand Toggle ──────────────────
const tplToggleBtn = $('templates-toggle-btn');
const tplChevron = $('templates-toggle-chevron');
const tplContent = $('templates-collapsible-content');

// Load saved collapsed state (default is true/collapsed to save space, or false if not set yet. Let's make it collapsed by default!)
let tplCollapsed = localStorage.getItem('mailgenius_tpl_collapsed') !== 'false';

function setTemplatesCollapsedState(collapsed) {
  if (collapsed) {
    tplContent.style.maxHeight = tplContent.scrollHeight + 'px';
    void tplContent.offsetHeight; // force reflow
    tplContent.style.maxHeight = '0px';
    tplContent.style.opacity = '0';
    tplContent.style.pointerEvents = 'none';
    tplChevron.style.transform = 'rotate(180deg)';
    localStorage.setItem('mailgenius_tpl_collapsed', 'true');
    if (tplToggleBtn) tplToggleBtn.title = "Expand Templates";
  } else {
    tplContent.style.maxHeight = tplContent.scrollHeight + 'px';
    tplContent.style.opacity = '1';
    tplContent.style.pointerEvents = 'all';
    tplChevron.style.transform = 'rotate(0deg)';
    localStorage.setItem('mailgenius_tpl_collapsed', 'false');
    if (tplToggleBtn) tplToggleBtn.title = "Collapse Templates";
    
    // Set to max-height 'none' after transition to allow dynamic resizing when filtering
    setTimeout(() => {
      if (localStorage.getItem('mailgenius_tpl_collapsed') === 'false') {
        tplContent.style.maxHeight = 'none';
      }
    }, 300);
  }
}

if (tplToggleBtn && tplChevron && tplContent) {
  tplToggleBtn.addEventListener('click', () => {
    tplCollapsed = !tplCollapsed;
    setTemplatesCollapsedState(tplCollapsed);
  });

  // Apply state on init
  if (tplCollapsed) {
    const origTransition = tplContent.style.transition;
    tplContent.style.transition = 'none';
    setTemplatesCollapsedState(true);
    requestAnimationFrame(() => {
      tplContent.style.transition = origTransition;
    });
  } else {
    tplContent.style.maxHeight = 'none';
  }
}

// Run initial render
renderTemplates();

// ── Panel Switch ────────────────────────────────────
function showPanel(panel) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  outputContent.classList.add('hidden');
  if (panel === 'empty')   emptyState.classList.remove('hidden');
  if (panel === 'loading') loadingState.classList.remove('hidden');
  if (panel === 'error')   errorState.classList.remove('hidden');
  if (panel === 'output')  outputContent.classList.remove('hidden');
}

// ── Loading Steps ────────────────────────────────────
let stepTimer;
function startSteps() {
  const steps = [$('step-1'), $('step-2'), $('step-3')];
  let cur = 0;
  steps.forEach(s => s.classList.remove('active','done'));
  steps[0].classList.add('active');
  stepTimer = setInterval(() => {
    steps[cur].classList.replace('active','done');
    cur++;
    if (cur < steps.length) steps[cur].classList.add('active');
    else clearInterval(stepTimer);
  }, 1200);
}

// ── Countdown (rate limit) ──────────────────────────
function countdown(secs, attempt, max) {
  return new Promise(resolve => {
    let rem = secs;
    function tick() {
      if (loadingText) loadingText.textContent = `⏳ Rate limit — retrying in ${rem}s (attempt ${attempt}/${max-1})`;
      showToast(`⏳ Auto-retry in ${rem}s`, 'error');
      if (rem <= 0) { if (loadingText) loadingText.textContent = 'Retrying…'; resolve(); return; }
      rem--;
      setTimeout(tick, 1000);
    }
    tick();
  });
}

// ── Prompt Builder ───────────────────────────────────
function buildPrompt(improve = false, instructions = '') {
  const sender    = $('sender-name').value.trim() || 'the sender';
  const recipient = $('recipient-name').value.trim() || 'the recipient';
  const role      = $('recipient-role').value.trim();
  const context   = $('email-context').value.trim();
  const language  = $('language-select').value;
  const cta       = $('opt-cta').checked;
  const sig       = $('opt-signature').checked;
  const subj      = $('opt-subject').checked;
  const emoji     = $('opt-emoji').checked;
  
  const lenGuide = {
    brief: {
      range: '80–120 words',
      structure: '1–2 short paragraphs.'
    },
    standard: {
      range: '150–250 words',
      structure: '2–3 detailed paragraphs. Must feel fully written, realistic, and complete.'
    },
    detailed: {
      range: '250–400 words',
      structure: '3–4 comprehensive paragraphs, optionally containing clear bullet points for readability.'
    }
  }[state.length] || { range: '150–250 words', structure: '2–3 detailed paragraphs.' };

  const toneInstruction = {
    professional: 'professional, respectful, clear, and business-appropriate',
    friendly: 'warm, welcoming, positive, and polite',
    persuasive: 'compelling, active, benefit-oriented, and convincing',
    formal: 'traditional, elegant, highly polite, and strictly structured',
    casual: 'relaxed, friendly, conversational, and direct',
    urgent: 'prompt, clear, time-sensitive, and actionable'
  }[state.tone] || 'business-appropriate';

  if (improve) return `You are an expert email copywriter. Improve the following email based on these instructions: "${instructions}"

ORIGINAL EMAIL:
${state.generatedEmail}

Requirements for the improved version:
- Language: ${language}
- Tone: ${state.tone} (must sound ${toneInstruction})
- Length: ${lenGuide.range} (structure: ${lenGuide.structure})
- Return ONLY the improved email text. Do not include any explanations, preambles, or formatting markup outside the email.
- Ensure natural paragraph spacing with clean line breaks.
- Avoid any placeholders like brackets []. Use realistic content instead.
${subj ? '- First line must be "SUBJECT: [improved subject]", followed by a blank line, and then the email body.' : ''}
${sig ? `- Include a professional sign-off and signature for ${sender} at the end.` : ''}`;

  return `You are an expert email copywriter. Your task is to write a high-quality email.
Type/Topic: ${state.emailTypePrompt}

From: ${sender}
To: ${recipient}${role ? ` (${role})` : ''}
Purpose & Context: ${context || 'General professional outreach'}

Strict Guidelines:
1. Tone: Must be ${state.tone} (${toneInstruction}).
2. Length & Structure: Must be within ${lenGuide.range} consisting of ${lenGuide.structure}. Do NOT write a lazy or extremely short summary.
3. Realistic Details: Write actual plausible details based on the context. Never use placeholders in the main email body. However, DO NOT invent fake employer names or fabricate specific quantitative statistics/percentages unless they are explicitly provided in the context. Describe the situation and details in a strong, realistic, and general professional manner instead. For contact details or signature links, use clearly marked brackets (e.g., '[Your Phone Number]', '[Your Portfolio/LinkedIn]') so the user knows exactly what to edit.
4. Language: Translate/write the email entirely in ${language}.
5. ${cta ? 'Call-to-Action: Include a clear, polite next step or call-to-action paragraph.' : 'No explicit call-to-action is required.'}
6. ${sig ? `Signature: End the email with a professional sign-off and signature block for "${sender}".` : 'Signature: Do not include a signature block.'}
7. ${emoji ? 'Emojis: Incorporate 1-3 emojis tastefully to fit the tone.' : 'Emojis: Do NOT use any emojis.'}

Output Format:
${subj ? '- Line 1 must be: "SUBJECT: [compelling subject line here]"\n- Line 2 must be a blank line\n- Line 3 onwards must be the email body.' : '- Output ONLY the email body. Do not generate a subject line.'}
- Do NOT wrap the output in markdown code blocks (\`\`\`).
- Do NOT write any introduction (like "Here is your email:") or post-explanation.
- Use natural paragraph spacing (double line breaks between paragraphs).`;
}

// ── Gemini API Call ──────────────────────────────────
async function callGemini(prompt, attempt = 1) {
  const MAX = 4;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${state.apiKey}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, topK: 40, topP: 0.95, maxOutputTokens: 8000 },
      }),
    });
  } catch { throw new Error('Network error — please check your internet connection.'); }

  if (res.status === 429) {
    if (attempt >= MAX) throw new Error('Rate limit exceeded. Wait 1–2 minutes and try again (free tier limit).');
    await countdown(attempt * 15, attempt, MAX);
    return callGemini(prompt, attempt + 1);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${res.status}`;
    if (res.status === 400) throw new Error('Invalid API key or bad request. Check your Gemini key.');
    if (res.status === 403) throw new Error('API key lacks permission. Enable Gemini API in Google AI Studio.');
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini. Please try again.');
  return text.trim();
}

// ── Mock Gemini API Call for Demo Mode ───────────────
async function callMockGemini(prompt) {
  // Simulate network request duration so judges can see the steps loading
  await new Promise(resolve => setTimeout(resolve, 2500));

  const type = state.emailType;
  const tone = state.tone;
  const length = state.length;
  const context = $('email-context').value.trim() || 'the project roadmap';
  const sender = $('sender-name').value.trim() || 'John Smith';
  const recipient = $('recipient-name').value.trim() || 'Jane Doe';
  const role = $('recipient-role').value.trim();
  const lang = $('language-select').value;
  const withSubj = $('opt-subject').checked;
  const withSig = $('opt-signature').checked;

  let subject = `Follow up: ${context.slice(0, 25)}...`;
  let body = '';

  const signatureText = withSig ? `\n\nBest regards,\n${sender}` : '';
  const ctaText = $('opt-cta').checked ? `\n\nPlease let me know your thoughts on this by Friday so we can coordinate accordingly.` : '';
  
  if (type === 'professional') {
    subject = `Discussion and Next Steps: ${context.slice(0, 25)}`;
    body = `Dear ${recipient},${role ? ` (${role})` : ''}

I hope this email finds you well.

I am writing to share some progress regarding our discussion on ${context}. Our team has prepared the initial outlines, and we are on track with the planned timeline.

${ctaText}${signatureText}`;
  } else if (type === 'sales') {
    subject = `Streamlining email workflows for ${recipient}`;
    body = `Hi ${recipient},

Hope you're doing well.

I noticed your team is working on expanding operations, and I wanted to share a solution that helps teams write and coordinate emails up to 10x faster using tailored AI templates.

Would you have 10 minutes next week for a brief walkthrough?${signatureText}`;
  } else if (type === 'follow-up') {
    subject = `Following up: ${context.slice(0, 25)}`;
    body = `Hi ${recipient},

I hope you're having a great week.

I wanted to quickly follow up on the project proposal for ${context}. Please let me know if you have had a chance to look it over or if we should schedule a call to review details.

${ctaText}${signatureText}`;
  } else if (type === 'thank-you') {
    subject = `Thank you for your support`;
    body = `Dear ${recipient},

I am writing to express my sincere appreciation for your time and guidance regarding ${context}. Your feedback was extremely helpful in refining our approach.

Thank you once again for your support.${signatureText}`;
  } else if (type === 'apology') {
    subject = `Sincere apology regarding the delay`;
    body = `Dear ${recipient},

Please accept my apologies for the delay regarding ${context}. We encountered an unexpected issue but have since resolved it.

Thank you for your patience and understanding.${signatureText}`;
  } else {
    subject = `Update regarding ${context.slice(0, 25)}`;
    body = `Hello ${recipient},

I hope this email finds you well. 

This is a quick note to update you on ${context}. We will keep you updated as things progress.

${ctaText}${signatureText}`;
  }

  // Handle translation simulated responses
  if (lang !== 'English') {
    if (lang === 'Hindi') {
      body = `नमस्ते ${recipient},\n\nयह ${context} के संबंध में एक ईमेल है।\n\nसादर,\n${sender}`;
      subject = `विषय: ${subject.replace(/^SUBJECT:\s*/i, '')}`;
    } else if (lang === 'Spanish') {
      body = `Estimado ${recipient},\n\nLe escribo con respecto a ${context}.\n\nAtentamente,\n${sender}`;
      subject = `ASUNTO: ${subject.replace(/^SUBJECT:\s*/i, '')}`;
    } else {
      body = `[Mock translation to ${lang}]\n\nDear ${recipient},\n\nRegarding ${context}.\n\nSincerely,\n${sender}`;
    }
  }

  if (withSubj) {
    return `SUBJECT: ${subject.replace(/^SUBJECT:\s*/i, '')}\n\n${body}`;
  } else {
    return body;
  }
}

// ── Parse Subject ────────────────────────────────────
function parseEmail(raw) {
  const genSubj = $('opt-subject').checked;
  if (genSubj && raw.toUpperCase().startsWith('SUBJECT:')) {
    const lines = raw.split('\n');
    const subject = lines[0].replace(/^SUBJECT:\s*/i, '').trim();
    const body = lines.slice(1).join('\n').trimStart();
    return { subject, body };
  }
  return { subject: $('subject-line')?.value?.trim() || '', body: raw };
}

// ── Stream Text ──────────────────────────────────────
function streamText(el, text) {
  return new Promise(resolve => {
    el.textContent = '';
    el.classList.add('cursor');
    const chars = text.split('');
    let i = 0;
    function next() {
      if (i >= chars.length) { el.classList.remove('cursor'); resolve(); return; }
      for (let b = 0; b < 80 && i < chars.length; b++, i++) el.textContent += chars[i];
      el.scrollTop = el.scrollHeight;
      setTimeout(next, 5);
    }
    next();
  });
}

// ── Update Stats ─────────────────────────────────────
function updateStats(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  wordCountEl.textContent = `${words} words`;
  charCountEl.textContent = `${text.length} chars`;
  readTimeEl.textContent = `~${Math.max(1, Math.ceil(words / 200))} min read`;
}

// ── Switch to output tab (mobile) ────────────────────
function switchToOutputTab() {
  const isMobile = window.matchMedia('(max-width:768px)').matches;
  if (!isMobile) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'output'));
  formPanel.classList.add('tab-hidden');
  outputPanel.classList.remove('tab-hidden');
}

// ── Display Output ───────────────────────────────────
async function displayOutput(subject, body) {
  showPanel('output');
  switchToOutputTab();

  if (subject) { subjectWrap.style.display = 'flex'; outputSubject.textContent = subject; }
  else { subjectWrap.style.display = 'none'; }

  await streamText(outputEmail, body);
  updateStats(body);
}

// ── Main: Generate ───────────────────────────────────
async function generateEmail(improve = false, instructions = '') {
  if (state.isGenerating) return;

  const context = $('email-context').value.trim();
  if (!improve && !context) {
    showToast('✍️ Please describe your email purpose first', 'error');
    $('email-context').focus();
    return;
  }

  state.isGenerating = true;
  generateBtn.disabled = true;
  generateText.textContent = 'Generating…';

  showPanel('loading');
  if (loadingText) loadingText.textContent = 'Crafting your email…';
  startSteps();

  try {
    const prompt = buildPrompt(improve, instructions);
    const raw = state.isDemo ? await callMockGemini(prompt) : await callGemini(prompt);
    console.log("Raw response from Gemini:", raw);
    const { subject, body } = parseEmail(raw);

    state.generatedEmail = body;
    state.generatedSubject = subject;

    clearInterval(stepTimer);
    [$('step-1'),$('step-2'),$('step-3')].forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    await new Promise(r => setTimeout(r, 250));

    await displayOutput(subject, body);
    saveFormDraft();
    showToast('✅ Email generated!', 'success');
  } catch (err) {
    clearInterval(stepTimer);
    showPanel('error');
    $('error-message').textContent = err.message || 'Something went wrong.';
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    state.isGenerating = false;
    generateBtn.disabled = false;
    generateText.textContent = 'Generate Email';
  }
}

// ── Button Events ────────────────────────────────────
generateBtn.addEventListener('click', (e) => { if (e) e.preventDefault(); generateEmail(); });
retryBtn.addEventListener('click', (e) => { if (e) e.preventDefault(); generateEmail(); });
regenerateBtn.addEventListener('click', (e) => { if (e) e.preventDefault(); generateEmail(); });

copyBtn.addEventListener('click', async (e) => {
  if (e) e.preventDefault();
  const text = state.generatedSubject ? `Subject: ${state.generatedSubject}\n\n${state.generatedEmail}` : state.generatedEmail;
  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Copied to clipboard!', 'success');
  } catch { showToast('❌ Copy failed — select manually', 'error'); }
});

$('copy-subject-btn').addEventListener('click', async (e) => {
  if (e) e.preventDefault();
  try { await navigator.clipboard.writeText(state.generatedSubject); showToast('📋 Subject copied!', 'success'); }
  catch { /* silent */ }
});

improveBtn.addEventListener('click', (e) => {
  if (e) e.preventDefault();
  improveInstr.value = '';
  improveModal.classList.add('active');
  setTimeout(() => improveInstr.focus(), 80);
});
improveCancelBtn.addEventListener('click', (e) => { if (e) e.preventDefault(); improveModal.classList.remove('active'); });
improveModal.addEventListener('click', e => { if (e.target === improveModal) { if (e) e.preventDefault(); improveModal.classList.remove('active'); } });
improveSubmitBtn.addEventListener('click', (e) => {
  if (e) e.preventDefault();
  const inst = improveInstr.value.trim();
  if (!inst) { improveInstr.focus(); return; }
  improveModal.classList.remove('active');
  generateEmail(true, inst);
});

outputEmail.addEventListener('input', () => {
  state.generatedEmail = outputEmail.textContent;
  updateStats(state.generatedEmail);
  saveFormDraft();
});

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ── Persistence ──────────────────────────────────────
function saveFormDraft() {
  const draft = {
    sender: $('sender-name')?.value || '',
    recipient: $('recipient-name')?.value || '',
    role: $('recipient-role')?.value || '',
    context: $('email-context')?.value || '',
    language: $('language-select')?.value || 'English',
    cta: $('opt-cta')?.checked,
    sig: $('opt-signature')?.checked,
    subj: $('opt-subject')?.checked,
    emoji: $('opt-emoji')?.checked,
    tone: state.tone,
    length: state.length,
    emailType: state.emailType,
    emailTypePrompt: state.emailTypePrompt,
    generatedEmail: state.generatedEmail,
    generatedSubject: state.generatedSubject,
    model: state.model
  };
  localStorage.setItem('mailgenius_draft_form', JSON.stringify(draft));
}

function restoreFormDraft() {
  const saved = localStorage.getItem('mailgenius_draft_form');
  if (!saved) return;
  try {
    const draft = JSON.parse(saved);
    if (draft.sender !== undefined && $('sender-name')) $('sender-name').value = draft.sender;
    if (draft.recipient !== undefined && $('recipient-name')) $('recipient-name').value = draft.recipient;
    if (draft.role !== undefined && $('recipient-role')) $('recipient-role').value = draft.role;
    if (draft.context !== undefined && $('email-context')) $('email-context').value = draft.context;
    if (draft.language !== undefined && $('language-select')) $('language-select').value = draft.language;
    
    if (draft.cta !== undefined && $('opt-cta')) $('opt-cta').checked = draft.cta;
    if (draft.sig !== undefined && $('opt-signature')) $('opt-signature').checked = draft.sig;
    if (draft.subj !== undefined && $('opt-subject')) $('opt-subject').checked = draft.subj;
    if (draft.emoji !== undefined && $('opt-emoji')) $('opt-emoji').checked = draft.emoji;

    if (draft.tone) {
      state.tone = draft.tone;
      toneSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.toggle('active', p.dataset.tone === draft.tone));
    }
    if (draft.length) {
      state.length = draft.length;
      lengthSelector.querySelectorAll('.opt-pill').forEach(p => p.classList.toggle('active', p.dataset.length === draft.length));
    }
    if (draft.emailType) {
      state.emailType = draft.emailType;
      state.emailTypePrompt = draft.emailTypePrompt || '';
      document.querySelectorAll('.type-pill').forEach(p => p.classList.toggle('active', p.dataset.type === draft.emailType));
    }
    if (draft.model && $('model-select')) {
      state.model = draft.model;
      $('model-select').value = draft.model;
    }

    if (draft.generatedEmail) {
      state.generatedEmail = draft.generatedEmail;
      state.generatedSubject = draft.generatedSubject || '';
      
      showPanel('output');
      if (state.generatedSubject) {
        subjectWrap.style.display = 'flex';
        outputSubject.textContent = state.generatedSubject;
      } else {
        subjectWrap.style.display = 'none';
      }
      outputEmail.textContent = state.generatedEmail;
      updateStats(state.generatedEmail);
    }
  } catch (e) {
    console.error('Failed to restore draft:', e);
  }
}

// Wire input auto-save listeners
['sender-name', 'recipient-name', 'recipient-role', 'email-context', 'language-select'].forEach(id => {
  $(id)?.addEventListener('input', saveFormDraft);
});
['opt-cta', 'opt-signature', 'opt-subject', 'opt-emoji'].forEach(id => {
  $(id)?.addEventListener('change', saveFormDraft);
});

// ── Init ─────────────────────────────────────────────
loadSavedKey();
restoreFormDraft();

function hidePagePreloader() {
  const preloader = $('page-preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => {
        preloader.remove();
      }, 300);
    }, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hidePagePreloader);
} else {
  hidePagePreloader();
}
