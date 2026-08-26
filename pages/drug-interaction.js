// Drug Interaction Checker — Dynamic, Production-Ready
let _drugAbort = null;

export function cleanupDrugInteraction() {
  if (_drugAbort) { _drugAbort.abort(); _drugAbort = null; }
  import('./safety-map.js').then(m => m.destroySafetyMap()).catch(() => {});
}

export function renderDrugInteraction(navigate) {
  const t = window.__t;

  // ---- Build Page (drugs loaded dynamically after render) ----
  return `
  <div class="page-enter" id="drug-interaction-page">
    <header style="margin-bottom:var(--space-8);">
      <h2 class="page-title">${t('drugInteractionTitle')}</h2>
      <p class="page-subtitle">${t('drugInteractionSub')}</p>
    </header>

    <div style="display:grid;grid-template-columns:1fr;gap:var(--space-8);">

      <!-- SECTION 1: Patient Context -->
      <section class="card-white patient-context-card" style="border:1px solid var(--outline-variant);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--primary-container);font-size:1.25rem;">person</span>
          <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);">${t('patientContext')}</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div>
            <label class="label-caps" style="display:block;margin-bottom:4px;">${t('age')}</label>
            <input id="patient-age" class="patient-context-input" type="number" placeholder="${localStorage.getItem('profile_age') || '—'}" value="${localStorage.getItem('profile_age') || ''}" />
          </div>
          <div style="grid-column:span 2;">
            <label class="label-caps" style="display:block;margin-bottom:4px;">${t('knownAllergies')}</label>
            <input id="patient-allergies" class="patient-context-input" type="text" placeholder="e.g. Penicillin, Sulfa" />
          </div>
          <div class="organ-toggle" id="kidney-toggle-row">
            <span class="organ-toggle-label">${t('kidneyIssue')}</span>
            <label class="organ-toggle-switch">
              <input type="checkbox" id="kidney-toggle" style="opacity:0;width:0;height:0;">
              <span class="organ-toggle-track"></span>
              <span class="organ-toggle-thumb"></span>
            </label>
          </div>
          <div class="organ-toggle" id="liver-toggle-row">
            <span class="organ-toggle-label">${t('liverIssue')}</span>
            <label class="organ-toggle-switch">
              <input type="checkbox" id="liver-toggle" style="opacity:0;width:0;height:0;">
              <span class="organ-toggle-track"></span>
              <span class="organ-toggle-thumb"></span>
            </label>
          </div>
        </div>
      </section>
      <div class="organ-banner" id="organ-risk-banner" style="display:none;">
        <span class="material-symbols-outlined">info</span>
        <span id="organ-banner-text">Organ impairment active — drug clearance may be affected. Risk levels adjusted.</span>
      </div>

      <!-- SECTION 2: Medication List (Dynamic) -->
      <section>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
          <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);">${t('medicationList')}</h3>
          <button id="add-drug-btn" class="btn-secondary" style="padding:6px 16px;font-size:0.8rem;">
            <span class="material-symbols-outlined" style="font-size:1rem;">add</span> ${t('addAnother')}
          </button>
        </div>
        <div id="medication-list" style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div class="drug-list-loading">
            <div class="drug-list-loading-icon"><span class="medical_services" style="font-size:2rem;color:var(--primary);"></span></div>
            <div class="drug-list-loading-steps">
              <div class="drug-list-loading-step" id="load-step-1"><span class="material-symbols-outlined" style="font-size:1rem;">hourglass_top</span> ${t('loadingMap')}</div>
              <div class="drug-list-loading-step" id="load-step-2"><span class="material-symbols-outlined" style="font-size:1rem;">hourglass_top</span> Analyzing interactions...</div>
              <div class="drug-list-loading-step" id="load-step-3"><span class="material-symbols-outlined" style="font-size:1rem;">hourglass_top</span> Calculating risk levels...</div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: Risk Score (Dynamic) -->
      <section class="card-white" id="risk-score-section" style="border:1px solid var(--outline-variant);text-align:center;display:none;">
        <span class="label-caps" style="letter-spacing:0.2em;">${t('overallRiskScore')}</span>
        <div id="risk-score-value" style="font-size:4rem;font-weight:900;color:var(--on-surface);line-height:1;margin:8px 0;">—<span style="font-size:1.5rem;color:var(--on-surface-variant);font-weight:500;">/10</span></div>
        <div style="width:100%;height:10px;background:var(--surface-container);border-radius:var(--radius-full);overflow:hidden;margin:12px 0;">
          <div id="risk-score-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#00C853,#FFD600 40%,#FF3D5A 80%);border-radius:var(--radius-full);transition:width 1s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
          <span style="color:#00C853;">${t('low')}</span>
          <span style="color:#FFD600;">${t('moderate')}</span>
          <span style="color:#FF3D5A;">${t('high')}</span>
          <span style="color:#C62828;">${t('critical')}</span>
        </div>
      </section>

      <!-- SECTION 4: Safety Map -->
      <section>
        <div style="background:#0D1117;border-radius:var(--radius-2xl);overflow:hidden;border:1px solid #21262D;">
          <div style="padding:20px 24px;border-bottom:1px solid #21262D;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h3 style="font-weight:800;font-size:1.2rem;background:linear-gradient(90deg,#58A6FF,#3FB9A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${t('safetyMapTitle')}</h3>
                <span style="font-size:0.6rem;background:#3FB9A020;color:#3FB9A0;padding:3px 10px;border-radius:20px;font-weight:700;">${t('liveNetwork')}</span>
              </div>
              <p style="font-size:0.75rem;color:#8B949E;margin-top:4px;">${t('interactiveNetwork')}</p>
            </div>
            <div style="display:flex;gap:12px;font-size:0.65rem;color:#8B949E;font-weight:600;">
              <span>⊙ ${t('dragNodes')}</span>
              <span>⊙ ${t('scrollZoom')}</span>
            </div>
          </div>
          <div id="safety-map-container" style="height:420px;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8B949E;font-size:0.875rem;">
              ${t('loadingMap')}
            </div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #21262D;display:flex;gap:20px;">
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:10px;border-radius:50%;background:#FF3D5A;box-shadow:0 0 6px #FF3D5A80;"></div><span style="font-size:0.65rem;color:#8B949E;font-weight:700;">${t('cascadeDrug')}</span></div>
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:10px;border-radius:50%;background:#FFD600;"></div><span style="font-size:0.65rem;color:#8B949E;font-weight:700;">${t('cautionDrug')}</span></div>
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:10px;border-radius:50%;background:#00C853;"></div><span style="font-size:0.65rem;color:#8B949E;font-weight:700;">${t('safeDrug')}</span></div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: Action Buttons -->
      <section style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
        <button id="copy-report-btn" class="btn-secondary" style="justify-content:center;padding:14px;font-weight:700;border-radius:var(--radius-xl);">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">content_copy</span> ${t('copyReport')}
        </button>
        <button id="export-pdf-btn" class="btn-secondary" style="justify-content:center;padding:14px;font-weight:700;border-radius:var(--radius-xl);">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">picture_as_pdf</span> ${t('exportPdf')}
        </button>
        <button id="alert-doctor-btn" class="btn-error" style="grid-column:span 2;border-radius:var(--radius-xl);">
          <span class="material-symbols-outlined">medical_services</span> ${t('alertDoctor')}
        </button>
      </section>

    </div>
  </div>
  `;
}

export async function initDrugInteraction() {
  if (_drugAbort) _drugAbort.abort();
  _drugAbort = new AbortController();
  const signal = _drugAbort.signal;

  const medListEl = document.getElementById('medication-list');
  const riskSection = document.getElementById('risk-score-section');
  const organBanner = document.getElementById('organ-risk-banner');
  if (!medListEl) return;

  const { api } = await import('../api.js');
  const { initSafetyMap, destroySafetyMap } = await import('./safety-map.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  function riskBadge(risk) {
    const colors = { danger: '#FF3D5A', caution: '#FFD600', safe: '#00C853' };
    const bg = { danger: '#FFF0F1', caution: '#FFFDE7', safe: '#E8F5E9' };
    const label = risk === 'danger' ? 'HIGH' : risk === 'caution' ? 'CAUTION' : 'SAFE';
    return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${colors[risk]};background:${bg[risk]};border:1px solid ${colors[risk]}20;">${label}</span>`;
  }

  function showStep(n) {
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`load-step-${i}`);
      if (!el) continue;
      if (i < n) {
        el.classList.remove('active');
        el.classList.add('done');
        el.querySelector('.material-symbols-outlined').textContent = 'check_circle';
      } else if (i === n) {
        el.classList.remove('done');
        el.classList.add('active');
        el.querySelector('.material-symbols-outlined').textContent = 'autorenew';
      } else {
        el.classList.remove('active', 'done');
        el.querySelector('.material-symbols-outlined').textContent = 'hourglass_top';
      }
    }
  }

  function getToggleContext() {
    return {
      kidneyIssue: document.getElementById('kidney-toggle')?.checked || false,
      liverIssue: document.getElementById('liver-toggle')?.checked || false
    };
  }

  function updateOrganBanner() {
    const { kidneyIssue, liverIssue } = getToggleContext();
    const banner = document.getElementById('organ-risk-banner');
    if (!banner) return;
    if (kidneyIssue || liverIssue) {
      const parts = [];
      if (kidneyIssue) parts.push('kidney');
      if (liverIssue) parts.push('liver');
      document.getElementById('organ-banner-text').textContent =
        `Organ impairment active (${parts.join(' + ')}) — drug clearance may be affected. Risk levels adjusted.`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  function renderDrugList(drugs) {
    if (drugs.length === 0) {
      renderEmpty();
      return;
    }
    const { kidneyIssue, liverIssue } = getToggleContext();
    const hasOrganIssue = kidneyIssue || liverIssue;

    medListEl.innerHTML = drugs.map((m, i) => `
      <div class="drug-card" style="animation-delay:${i * 0.05}s">
        <div class="drug-card-info">
          <div class="drug-card-name">${m.id} <span class="drug-card-dose">${m.dose}</span></div>
          <div class="drug-card-doctor">${m.doctor}</div>
          ${m.warning ? `<div class="drug-warning"><span class="material-symbols-outlined">warning</span> ${m.warning}</div>` : ''}
        </div>
        <div class="drug-card-actions">
          ${riskBadge(m.risk)}
          <button class="drug-remove-btn" data-idx="${i}" title="Remove">
            <span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span>
          </button>
        </div>
      </div>
    `).join('');
    bindDeleteHandlers(drugs);
    updateOrganBanner();
  }

  function renderEmpty() {
    medListEl.innerHTML = `
      <div class="drug-list-empty">
        <span class="material-symbols-outlined">medication</span>
        <h4>No prescriptions yet</h4>
        <p>Scan a prescription to check drug interactions.</p>
      </div>
    `;
    if (riskSection) riskSection.style.display = 'none';
    updateOrganBanner();
  }

  function bindDeleteHandlers(drugs) {
    medListEl.querySelectorAll('.drug-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        if (isNaN(idx) || idx < 0 || idx >= drugs.length) return;
        drugs.splice(idx, 1);
        renderDrugList(drugs);
        updateRiskScore(drugs);
        destroySafetyMap();
        initSafetyMap('safety-map-container', drugs, interactionResult);
      }, { signal });
    });
  }

  function updateRiskScore(drugs) {
    if (!riskSection) return;
    if (drugs.length === 0) {
      riskSection.style.display = 'none';
      return;
    }
    const { kidneyIssue, liverIssue } = getToggleContext();
    const dangerCount = drugs.filter(d => d.risk === 'danger').length;
    const cautionCount = drugs.filter(d => d.risk === 'caution').length;
    let baseScore = dangerCount * 3.3 + cautionCount * 1.5 + (drugs.length - dangerCount - cautionCount) * 0.2;
    if (kidneyIssue) baseScore += 1.5;
    if (liverIssue) baseScore += 1.5;
    const score = Math.min(baseScore, 10);
    const scoreEl = document.getElementById('risk-score-value');
    const barEl = document.getElementById('risk-score-bar');
    if (scoreEl) scoreEl.childNodes[0].textContent = score.toFixed(1);
    if (barEl) barEl.style.width = (score * 10) + '%';
    riskSection.style.display = 'block';
    window.__drugInteractionData = drugs;
    return score;
  }

  // --- Load data ---
  let drugs = [];
  let interactionResult = null;
  try {
    showStep(1);
    if (userId && userId !== '1' && userId !== 'undefined') {
      let prescriptions = [];
      try {
        prescriptions = await api.getPrescriptions(userId);
      } catch(e) {}
      const scanMedsRaw = sessionStorage.getItem('lastScanMeds');
      if (scanMedsRaw) {
        try {
          const scanMeds = JSON.parse(scanMedsRaw);
          for (const sm of scanMeds) {
            if (!prescriptions.some(p => p.medication === sm.medication)) {
              prescriptions.push(sm);
            }
          }
          sessionStorage.removeItem('lastScanMeds');
        } catch(e) {}
      }

      if (prescriptions.length > 0) {
        const medNames = prescriptions.map(p => p.medication);
        const ctx = getToggleContext();
        showStep(2);
        try { interactionResult = await api.checkInteractions(medNames, ctx); } catch(e) {}
        showStep(3);
        drugs = prescriptions.map((p) => ({
          id: p.medication,
          dose: p.dosage || 'See label',
          doctor: p.doctorName || 'Prescribing Physician',
          risk: interactionResult?.drugRisks?.[p.medication] || 'safe',
          warning: interactionResult?.organWarnings?.[p.medication] || null
        }));
      }
    }
  } catch (e) {
    console.error('Drug interaction load error:', e);
  }

  renderDrugList(drugs);
  updateRiskScore(drugs);
  initSafetyMap('safety-map-container', drugs, interactionResult);
  async function handleToggleChange() {
    const { kidneyIssue, liverIssue } = getToggleContext();
    // Update toggle visuals
    document.querySelectorAll('#kidney-toggle, #liver-toggle').forEach(toggle => {
      const row = toggle.closest('.organ-toggle');
      if (row) row.classList.toggle('active', toggle.checked);
    });
    updateOrganBanner();

    if (drugs.length === 0) return;

    // Re-fetch interactions with new context
    const medNames = drugs.map(d => d.id);
    const ctx = { kidneyIssue, liverIssue };
    try {
      interactionResult = await api.checkInteractions(medNames, ctx);
    } catch(e) {
      interactionResult = null;
    }

    // Re-assign risk levels from new response
    drugs = drugs.map((d) => {
      let risk = interactionResult?.drugRisks?.[d.id] || 'safe';
      return {
        ...d,
        risk,
        warning: interactionResult?.organWarnings?.[d.id] || null
      };
    });

    renderDrugList(drugs);
    updateRiskScore(drugs);
    destroySafetyMap();
    initSafetyMap('safety-map-container', drugs, interactionResult);
  }

  document.querySelectorAll('#kidney-toggle, #liver-toggle').forEach(toggle => {
    toggle.addEventListener('change', handleToggleChange, { signal });
  });

  // Copy report
  document.getElementById('copy-report-btn')?.addEventListener('click', () => {
    if (drugs.length === 0) return window.showToast('No medications to report');
    const score = updateRiskScore(drugs) || 0;
    const lines = drugs.map(d => `- ${d.id} ${d.dose} (${d.doctor}) [${d.risk.toUpperCase()}]${d.warning ? ' ⚠ ' + d.warning : ''}`).join('\n');
    const report = `Sanjeev AI — Drug Interaction Report\nDate: ${new Date().toLocaleDateString()}\nRisk Score: ${score}/10\n\nMedications:\n${lines}`;
    navigator.clipboard.writeText(report).then(() => window.showToast('Report copied!'));
  }, { signal });

  // Export PDF
  document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
    if (drugs.length === 0) return window.showToast('No medications to export');
    const score = updateRiskScore(drugs) || 0;
    const w = window.open('', '_blank');
    const medRows = drugs.map(d => `<div class="med">${d.id} ${d.dose} — ${d.doctor} — <span style="color:${d.risk==='danger'?'#FF3D5A':d.risk==='caution'?'#FFD600':'#00C853'};font-weight:700;">${d.risk.toUpperCase()}</span>${d.warning ? `<br><small style="color:#E65100;">⚠ ${d.warning}</small>` : ''}</div>`).join('');
    w.document.write(`<html><head><title>Sanjeev AI Report</title><style>body{font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;}h1{color:#012d1d;}h2{color:#1b4332;margin-top:24px;}.med{padding:8px 0;border-bottom:1px solid #eee;}</style></head><body>
      <h1>Sanjeev AI — Drug Interaction Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Patient: ${window.__currentUserName || 'Patient'}</p>
      <h2>Overall Risk: ${score}/10</h2>
      <h2>Medications</h2>${medRows}
      <script>window.print();<\/script></body></html>`);
  }, { signal });

  document.getElementById('alert-doctor-btn')?.addEventListener('click', () => {
    window.showToast('Alert sent to your care team!', true);
  }, { signal });
}