export function renderRiskAnalysis(navigate) {
  const t = window.__t;
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title">${t('riskTitle')}</h2>
      <p class="page-subtitle">${t('riskSub')}</p>
    </header>

    <div id="risk-content-area">
      <!-- Loading State -->
      <div id="risk-loading" style="text-align:center; padding:var(--space-10);">
        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--primary); animation: pulse 1.5s infinite;">security</span>
        <p style="margin-top:var(--space-4); color:var(--on-surface-variant); font-weight:600;">Gemini AI is checking for drug interactions...</p>
      </div>

      <!-- No Risk Found -->
      <div id="risk-safe" style="display:none; text-align:center; padding:var(--space-10); background:var(--surface-container-low); border-radius:var(--radius-2xl);">
        <span class="material-symbols-outlined" style="font-size:4rem; color:#2E7D32;">check_circle</span>
        <h3 style="margin-top:var(--space-4); color:var(--primary); font-family:var(--font-headline);">No Significant Risks Detected</h3>
        <p style="margin-top:var(--space-2); color:var(--on-surface-variant);">Your scanned medication does not appear to have major interactions with your existing regimen.</p>
        <button class="btn-primary" style="margin-top:var(--space-6); width:100%; justify-content:center;" onclick="window.navigate('home')">Return Home</button>
      </div>

      <!-- Interaction Detected -->
      <div id="risk-danger" style="display:none;" class="risk-bento">
        <!-- Status Card -->
        <div class="risk-status-card" style="background:var(--error-container); border:none;">
          <div class="status-header">
            <span class="material-symbols-outlined" style="color:var(--error);">warning</span>
            <span class="status-title" style="color:var(--on-error-container);">${t('cautionTitle')}</span>
          </div>
          <p id="risk-message" style="color:var(--on-error-container); line-height:1.6;">
            <!-- Real message goes here -->
          </p>
        </div>

        <!-- Interaction Card -->
        <div class="risk-interaction-card">
          <div class="deco-circle"></div>
          <span class="label-caps" style="display:block; margin-bottom:var(--space-4);">${t('conflictAlert')}</span>
          <div class="pills">
            <div class="pill-icon pill-icon--a"><span class="material-symbols-outlined">pill</span></div>
            <div class="pill-icon pill-icon--b"><span class="material-symbols-outlined">pill</span></div>
          </div>
          <div id="risk-drugs-title" class="interaction-title">Interaction Found</div>
          <div class="interaction-desc">
            <p id="risk-description"></p>
          </div>
        </div>

        <!-- Cascade Note (Conditional) -->
        <div id="risk-cascade-container" style="display:none;" class="risk-cascade-card">
          <div class="risk-cascade-icon">
            <span class="material-symbols-outlined">medical_information</span>
          </div>
          <div>
            <h4>${t('cascadeNote')}</h4>
            <p>${t('cascadeDesc')}</p>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="risk-action-bar">
          <div style="flex:1;">
            <h4>${t('takeAction')}</h4>
            <p>${t('takeActionDesc')}</p>
          </div>
          <div class="risk-action-buttons">
            <button class="btn-action-primary" onclick="window.showToast('Contacting doctor...', true)">
              <span class="material-symbols-outlined">call</span>
              ${t('contactDoctor')}
            </button>
            <button class="btn-action-ghost" onclick="window.showToast('Report saved to profile')">
              <span class="material-symbols-outlined">share</span>
              ${t('shareReport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

export async function initRiskAnalysis() {
  const loading = document.getElementById('risk-loading');
  const safeArea = document.getElementById('risk-safe');
  const dangerArea = document.getElementById('risk-danger');
  const riskMsg = document.getElementById('risk-message');
  const riskTitle = document.getElementById('risk-drugs-title');
  const riskDesc = document.getElementById('risk-description');
  const cascadeContainer = document.getElementById('risk-cascade-container');

  if (!loading) return;

  try {
    const lastScan = JSON.parse(sessionStorage.getItem('lastScan') || '{}');
    const medication = lastScan.medication;
    
    // Get existing medications from DB
    const { api } = await import('../api.js');
    const userId = localStorage.getItem('userId');
    const existingMeds = (userId && userId !== '1') ? await api.getPrescriptions(userId) : [];
    
    const allMeds = existingMeds.map(m => m.medication);
    if (medication) allMeds.push(medication);

    if (allMeds.length < 2) {
      loading.style.display = 'none';
      safeArea.style.display = 'block';
      return;
    }

    const result = await api.checkInteractions(allMeds);

    loading.style.display = 'none';
    const hasInteractions = result.pairs && result.pairs.length > 0;
    if (hasInteractions) {
      dangerArea.style.display = 'grid';
      const topPair = result.pairs[0];
      riskMsg.innerText = result.summary || "Potential risks detected in your current combination.";
      riskTitle.innerText = `Potential Interaction: ${topPair.drugA} + ${topPair.drugB}`;
      riskDesc.innerText = topPair.message || "These medications may interact. Consult your doctor.";
      if (result.pairs.some(p => p.cascade)) cascadeContainer.style.display = 'flex';
    } else {
      safeArea.style.display = 'block';
    }
  } catch (err) {
    loading.innerHTML = `<p style="color:var(--error)">Error: ${err.message}</p>`;
    window.showToast("Risk Analysis Error: " + err.message, true);
  }
}
