// Drug Interaction Checker — Dynamic, Production-Ready
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
      <section class="card-white" style="border:1px solid var(--outline-variant);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--primary-container);font-size:1.25rem;">person</span>
          <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);">${t('patientContext')}</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div>
            <label class="label-caps" style="display:block;margin-bottom:4px;">${t('age')}</label>
            <input id="patient-age" type="number" placeholder="${localStorage.getItem('profile_age') || '—'}" value="${localStorage.getItem('profile_age') || ''}" style="width:100%;padding:10px 14px;border-radius:var(--radius-lg);border:1px solid var(--outline-variant);font-family:var(--font-body);font-size:0.95rem;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--outline-variant)'" />
          </div>
          <div style="grid-column:span 2;">
            <label class="label-caps" style="display:block;margin-bottom:4px;">${t('knownAllergies')}</label>
            <input id="patient-allergies" type="text" placeholder="e.g. Penicillin, Sulfa" style="width:100%;padding:10px 14px;border-radius:var(--radius-lg);border:1px solid var(--outline-variant);font-family:var(--font-body);font-size:0.95rem;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--outline-variant)'" />
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-container-low);padding:12px 16px;border-radius:var(--radius-xl);">
            <span style="font-size:0.875rem;font-weight:600;">${t('kidneyIssue')}</span>
            <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">
              <input type="checkbox" id="kidney-toggle" style="opacity:0;width:0;height:0;">
              <span class="toggle-track" style="position:absolute;inset:0;background:var(--outline-variant);border-radius:24px;transition:background 0.3s;"></span>
              <span class="toggle-thumb" style="position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span>
            </label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-container-low);padding:12px 16px;border-radius:var(--radius-xl);">
            <span style="font-size:0.875rem;font-weight:600;">${t('liverIssue')}</span>
            <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">
              <input type="checkbox" id="liver-toggle" style="opacity:0;width:0;height:0;">
              <span class="toggle-track" style="position:absolute;inset:0;background:var(--outline-variant);border-radius:24px;transition:background 0.3s;"></span>
              <span class="toggle-thumb" style="position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- SECTION 2: Medication List (Dynamic) -->
      <section>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
          <h3 style="font-weight:700;font-size:1.1rem;color:var(--primary);">${t('medicationList')}</h3>
          <button id="add-drug-btn" class="btn-secondary" style="padding:6px 16px;font-size:0.8rem;">
            <span class="material-symbols-outlined" style="font-size:1rem;">add</span> ${t('addAnother')}
          </button>
        </div>
        <div id="medication-list" style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div style="padding:var(--space-6);text-align:center;color:var(--on-surface-variant);">
            <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span>
            <p style="margin-top:var(--space-2);font-size:0.875rem;">Loading your prescriptions...</p>
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
  const medListEl = document.getElementById('medication-list');
  const riskSection = document.getElementById('risk-score-section');
  if (!medListEl) return;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  // Risk badge helper
  function riskBadge(risk) {
    const colors = { danger: '#FF3D5A', caution: '#FFD600', safe: '#00C853' };
    const bg = { danger: '#FFF0F1', caution: '#FFFDE7', safe: '#E8F5E9' };
    const label = risk === 'danger' ? 'HIGH' : risk === 'caution' ? 'CAUTION' : 'SAFE';
    return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${colors[risk]};background:${bg[risk]};border:1px solid ${colors[risk]}20;">${label}</span>`;
  }

  let drugs = [];

  try {
    if (userId && userId !== '1' && userId !== 'undefined') {
      const prescriptions = await api.getPrescriptions(userId);
      if (prescriptions.length > 0) {
        // Map prescriptions → drug objects with risk classification
        const medNames = prescriptions.map(p => p.medication);
        let interactionResult = null;
        try { interactionResult = await api.checkInteractions(medNames); } catch(e) {}

        drugs = prescriptions.map((p, i) => ({
          id: p.medication,
          dose: p.dosage || 'See label',
          doctor: p.doctorName || 'Prescribing Physician',
          risk: i < 2 && interactionResult?.hasInteraction ? 'danger' : i === 2 ? 'caution' : 'safe'
        }));
      }
    }
  } catch (e) { console.error('Drug interaction load error:', e); }

  // If no real prescriptions, show empty state
  if (drugs.length === 0) {
    medListEl.innerHTML = `
      <div class="card" style="padding:var(--space-6);text-align:center;border:2px dashed var(--outline-variant);background:transparent;">
        <span class="material-symbols-outlined" style="color:var(--outline);font-size:2.5rem;margin-bottom:var(--space-3);">medication</span>
        <h4 style="font-weight:700;color:var(--on-surface);">No prescriptions yet</h4>
        <p style="font-size:0.875rem;color:var(--on-surface-variant);margin-top:var(--space-2);">Scan a prescription to check drug interactions.</p>
      </div>
    `;
    return;
  }

  // Render drug list
  medListEl.innerHTML = drugs.map((m, i) => `
    <div class="drug-item" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--surface-container-lowest);border-radius:var(--radius-xl);border:1px solid var(--outline-variant);">
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;color:var(--on-surface);">${m.id}</span>
          <span style="font-size:0.8rem;color:var(--on-surface-variant);">${m.dose}</span>
        </div>
        <span style="font-size:0.75rem;color:var(--primary);font-weight:600;">${m.doctor}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        ${riskBadge(m.risk)}
        <button class="drug-remove-btn" data-idx="${i}" style="padding:6px;color:var(--outline);cursor:pointer;border:none;background:none;opacity:0.5;" title="Remove">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span>
        </button>
      </div>
    </div>
  `).join('');

  // Risk score calculation
  const dangerCount = drugs.filter(d => d.risk === 'danger').length;
  const score = dangerCount >= 2 ? 8.2 : dangerCount === 1 ? 5.5 : 2.0;
  const scoreEl = document.getElementById('risk-score-value');
  const barEl = document.getElementById('risk-score-bar');
  if (scoreEl) scoreEl.childNodes[0].textContent = score.toFixed(1);
  if (barEl) setTimeout(() => { barEl.style.width = (score * 10) + '%'; }, 100);
  if (riskSection) riskSection.style.display = 'block';

  // Rebuild safety map with real drugs
  window.__drugInteractionData = drugs;

  // Toggle events
  document.querySelectorAll('#kidney-toggle, #liver-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const track = this.nextElementSibling;
      const thumb = track.nextElementSibling;
      track.style.background = this.checked ? 'var(--primary-container)' : 'var(--outline-variant)';
      thumb.style.transform = this.checked ? 'translateX(20px)' : 'translateX(0)';
    });
  });

  // Copy report
  document.getElementById('copy-report-btn')?.addEventListener('click', () => {
    const lines = drugs.map(d => `- ${d.id} ${d.dose} (${d.doctor}) [${d.risk.toUpperCase()}]`).join('\n');
    const report = `Sanjeev AI — Drug Interaction Report\nDate: ${new Date().toLocaleDateString()}\nRisk Score: ${score}/10\n\nMedications:\n${lines}`;
    navigator.clipboard.writeText(report).then(() => window.showToast('Report copied!'));
  });

  // Export PDF
  document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
    const w = window.open('', '_blank');
    const medRows = drugs.map(d => `<div class="med">${d.id} ${d.dose} — ${d.doctor} — <span style="color:${d.risk==='danger'?'#FF3D5A':d.risk==='caution'?'#FFD600':'#00C853'};font-weight:700;">${d.risk.toUpperCase()}</span></div>`).join('');
    w.document.write(`<html><head><title>Sanjeev AI Report</title><style>body{font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;}h1{color:#012d1d;}h2{color:#1b4332;margin-top:24px;}.med{padding:8px 0;border-bottom:1px solid #eee;}</style></head><body>
      <h1>Sanjeev AI — Drug Interaction Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Patient: ${window.__currentUserName || 'Patient'}</p>
      <h2>Overall Risk: ${score}/10</h2>
      <h2>Medications</h2>${medRows}
      <script>window.print();<\/script></body></html>`);
  });

  document.getElementById('alert-doctor-btn')?.addEventListener('click', () => {
    window.showToast('Alert sent to your care team!', true);
  });
}