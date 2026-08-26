// Symptom Checker & Voice Input
let _symptomsRecognition = null;

export function cleanupSymptoms() {
  if (_symptomsRecognition) {
    try { _symptomsRecognition.abort(); } catch(e) {}
    _symptomsRecognition = null;
  }
}

export function renderSymptoms(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title">${t('symTitle')}</h2>
      <p class="page-subtitle">${t('symSub')}</p>
    </header>

    <!-- Real Voice & Text Input -->
    <div style="background:var(--surface-container-low); border-radius:var(--radius-2xl); padding:var(--space-6); text-align:center; margin-bottom:var(--space-8);">
      <div style="position:relative; margin-bottom:var(--space-4);">
        <textarea id="symptom-input" placeholder="e.g. I feel dizzy and have a headache..." 
          style="width:100%; min-height:120px; padding:var(--space-4); border-radius:var(--radius-xl); border:2px solid var(--outline-variant); background:var(--surface); font-family:inherit; resize:none;"></textarea>
        
        <button id="voice-btn" class="scanner-btn-circle--capture" style="position:absolute; bottom:12px; right:12px; width:3rem; height:3rem; border-radius:var(--radius-full); background:var(--primary); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <span class="material-symbols-outlined" style="font-size:1.5rem;">mic</span>
        </button>
      </div>
      
      <p style="color:var(--on-surface-variant); font-size:0.875rem;">${t('voiceAvailable')}</p>
      
      <button id="analyze-btn" class="btn-primary" style="width:100%; margin-top:var(--space-4); justify-content:center; padding:var(--space-4);">
        <span class="material-symbols-outlined">psychology</span>
        Check for Medication Correlations
      </button>
    </div>

    <!-- Real AI Response Area -->
    <div id="analysis-result-container" style="display:none; margin-bottom:var(--space-8);">
      <div class="card" style="border-left:4px solid var(--primary); background:var(--primary-fixed-dim);">
        <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-2);">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.25rem;">auto_awesome</span>
          <span style="font-weight:700; color:var(--primary); font-size:0.875rem;">AI Health Insights</span>
        </div>
        <p id="analysis-text" style="font-size:0.875rem; color:var(--on-primary-fixed); line-height:1.6;"></p>
      </div>
    </div>

    <!-- Alert Doctor Action -->
    <button class="btn-secondary" style="width:100%; justify-content:center; padding:var(--space-4); font-size:1rem; border-radius:var(--radius-xl);">
      <span class="material-symbols-outlined">send_to_mobile</span>
      ${t('flagSymptoms')}
    </button>
  </div>
  `;
}

// Attach Event Listeners
export function initSymptoms() {
  const input = document.getElementById('symptom-input');
  const voiceBtn = document.getElementById('voice-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultContainer = document.getElementById('analysis-result-container');
  const resultText = document.getElementById('analysis-text');

  if (!voiceBtn || !analyzeBtn) return;

  // 1. Voice Integration (Real Web Speech API)
  voiceBtn.onclick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.showToast('Speech recognition not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    _symptomsRecognition = recognition;
    recognition.lang = 'en-US';
    recognition.start();
    
    voiceBtn.style.background = '#d32f2f'; // Visual indicator
    window.showToast('Listening...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      input.value = transcript;
      voiceBtn.style.background = '';
    };

    recognition.onerror = () => {
      voiceBtn.style.background = '';
      window.showToast('Voice error. Please try typing.');
    };
  };

  // 2. Real AI Analysis
  analyzeBtn.onclick = async () => {
    const symptoms = input.value.trim();
    if (!symptoms) {
      window.showToast('Please describe how you feel first.');
      return;
    }

    try {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Analyzing...';
      
      const userId = localStorage.getItem('userId');
      const finalUserId = (userId && userId !== '1') ? userId : null;
      const { api } = await import('../api.js');
      const data = await api.analyzeSymptoms(finalUserId, symptoms);
      
      resultText.innerText = data.analysis;
      resultContainer.style.display = 'block';
      window.showToast('Analysis complete!');
    } catch (err) {
      window.showToast('Analysis Error: ' + err.message);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span class="material-symbols-outlined">psychology</span> Check for Medication Correlations';
    }
  };
}
