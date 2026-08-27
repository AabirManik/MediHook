export function renderMedications(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h2 class="page-title">${t('medsTitle')}</h2>
          <p class="page-subtitle">${t('medsSub')}</p>
        </div>
        <button id="share-meds-top-btn" class="btn-primary" style="padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-size:0.875rem; white-space:nowrap; display:none;">
          <span class="material-symbols-outlined" style="font-size:1.25rem;">share</span>
          Share
        </button>
      </div>
    </header>

    <div id="medications-list">
      <div style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        <p style="margin-top: 1rem;">Loading your prescription history...</p>
      </div>
    </div>
  </div>`;
}

export async function initMedications() {
  const listContainer = document.getElementById('medications-list');
  if (!listContainer) return;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  if (!userId || userId === '1' || userId === 'undefined') {
    listContainer.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">history</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">No history available. Please sign in to view your prescriptions.</p>
      </div>`;
    return;
  }

  try {
    const prescriptions = await api.getPrescriptions(userId);
    prescriptions.sort((a, b) => new Date(b.date || b.created_at || Date.now()) - new Date(a.date || a.created_at || Date.now()));

    if (prescriptions.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
          <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">history</span>
          <p style="font-size:0.875rem; color:var(--on-surface-variant);">Your prescription history is empty. Scan a prescription to add it here.</p>
        </div>`;
      return;
    }

    let html = '';
    prescriptions.forEach((p, idx) => {
      const dateStr = new Date(p.date || p.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const insights = p.insights ? (() => { try { return JSON.parse(p.insights); } catch(e) { return null; } })() : null;
      const perMedConf = p.confidence || 0;
      const overallConf = insights?.overallConfidence || perMedConf;
      const warnings = insights?.warnings || [];
      const frequency = insights?.frequency || '';
      const duration = insights?.duration || '';

      let confColor, confBg;
      if (perMedConf >= 90) { confColor = '#2E7D32'; confBg = '#E8F5E9'; }
      else if (perMedConf >= 60) { confColor = '#E65100'; confBg = '#FFF3E0'; }
      else { confColor = '#C62828'; confBg = '#FFEBEE'; }

      let overallConfColor, overallConfBg;
      if (overallConf >= 90) { overallConfColor = '#2E7D32'; overallConfBg = '#E8F5E9'; }
      else if (overallConf >= 60) { overallConfColor = '#E65100'; overallConfBg = '#FFF3E0'; }
      else { overallConfColor = '#C62828'; overallConfBg = '#FFEBEE'; }

      const hasInsights = insights && (overallConf || warnings.length > 0 || frequency || duration);
      const cardId = `med-insight-${idx}`;

      html += `
        <div class="med-history-card">
          <div class="med-history-header">
            <div class="med-history-info">
              <div style="display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap;">
                <h4 class="med-history-name">${p.medication}</h4>
                <span class="med-history-confidence" style="background:${confBg}; color:${confColor};">${perMedConf}%</span>
              </div>
              <span class="med-history-date">${dateStr}</span>
            </div>
            <span class="med-history-doctor">${p.doctorName || 'Doctor'}</span>
          </div>

          <div class="med-history-body">
            <div class="med-history-detail">
              <span class="material-symbols-outlined">medication</span>
              <span><strong>Dosage:</strong> ${p.dosage || 'N/A'}</span>
            </div>
            ${p.instructions ? `
              <div class="med-history-detail">
                <span class="material-symbols-outlined">info</span>
                <span><strong>Instructions:</strong> ${p.instructions}</span>
              </div>
            ` : ''}
            ${frequency ? `
              <div class="med-history-detail">
                <span class="material-symbols-outlined">schedule</span>
                <span><strong>Frequency:</strong> ${frequency}</span>
              </div>
            ` : ''}
            ${duration ? `
              <div class="med-history-detail">
                <span class="material-symbols-outlined">calendar_today</span>
                <span><strong>Duration:</strong> ${duration}</span>
              </div>
            ` : ''}
          </div>

          ${hasInsights ? `
            <button class="med-insight-toggle" onclick="const el=document.getElementById('${cardId}'); el.style.display = el.style.display === 'none' ? 'block' : 'none';">
              <span class="material-symbols-outlined">psychology</span>
              Scan Insights
              <span class="material-symbols-outlined" style="margin-left:auto;">expand_more</span>
            </button>
            <div class="med-insight-section" id="${cardId}" style="display:none;">
              <div class="med-insight-row">
                <span class="material-symbols-outlined" style="color:${overallConfColor};">verified</span>
                <span>Overall Scan Confidence:</span>
                <span class="med-insight-badge" style="background:${overallConfBg}; color:${overallConfColor};">${overallConf}%</span>
              </div>
              ${warnings.length > 0 ? `
                <div class="med-warnings">
                  ${warnings.map(w => `
                    <div class="med-warning-item">
                      <span class="material-symbols-outlined" style="font-size:1rem; color:var(--error);">warning</span>
                      <span>${w}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="font-size:0.8rem; color:var(--on-surface-variant); margin-top:var(--space-2);">No warnings detected during scan.</p>'}
            </div>
          ` : ''}
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Setup share button
    const shareBtn = document.getElementById('share-meds-top-btn');
    if (shareBtn) {
      const caregivers = await api.getConnectedCaregivers(userId).catch(() => []);
      if (caregivers.length > 0) {
        shareBtn.style.display = 'flex';
        shareBtn.addEventListener('click', async () => {
          const origHTML = shareBtn.innerHTML;
          shareBtn.disabled = true;
          shareBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span> Sharing...';
          try {
            const reportPayload = JSON.stringify({
              type: 'medications',
              patientName: window.__currentUserName || 'Patient',
              generatedAt: new Date().toISOString(),
              medications: prescriptions.map(p => ({
                name: p.medication,
                dosage: p.dosage,
                instructions: p.instructions,
                doctor: p.doctorName,
                confidence: p.confidence
              }))
            });
            let sharedCount = 0;
            for (const cg of caregivers) {
              try {
                await api.shareReport(userId, cg.caregiver_id, reportPayload);
                sharedCount++;
              } catch (e) { console.warn('Share failed:', e); }
            }
            if (sharedCount > 0) {
              window.showToast(`Medications shared with ${sharedCount} caregiver${sharedCount > 1 ? 's' : ''}!`);
              shareBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">check_circle</span> Shared!';
              shareBtn.style.background = 'var(--tertiary)';
              setTimeout(() => { shareBtn.innerHTML = origHTML; shareBtn.style.background = ''; shareBtn.disabled = false; }, 2000);
            } else {
              window.showToast('Failed to share. Try again.', true);
              shareBtn.innerHTML = origHTML;
              shareBtn.disabled = false;
            }
          } catch (err) {
            window.showToast('Error: ' + err.message, true);
            shareBtn.innerHTML = origHTML;
            shareBtn.disabled = false;
          }
        });
      }
    }
  } catch (err) {
    console.error('Error loading prescriptions:', err);
    listContainer.innerHTML = `<p style="color:var(--error);">Failed to load history. ${err.message}</p>`;
  }
}
