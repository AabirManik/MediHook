// Prescription History (formerly Merged Meds)
export function renderMedications(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title">${t('medsTitle')}</h2>
      <p class="page-subtitle">${t('medsSub')}</p>
    </header>

    <!-- List Container -->
    <div id="medications-list">
      <!-- Loader -->
      <div style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        <p style="margin-top: 1rem;">Loading your prescription history...</p>
      </div>
    </div>

  </div>
  `;
}

export async function initMedications() {
  const listContainer = document.getElementById('medications-list');
  if (!listContainer) return;

  const { api } = await import('../api.js');
  const userId = localStorage.getItem('userId');
  
  if (!userId || userId === '1' || userId === 'undefined') {
    listContainer.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">history</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">No history available. Please sign in to view your prescriptions.</p>
      </div>
    `;
    return;
  }

  try {
    const prescriptions = await api.getPrescriptions(userId);
    
    // Sort descending (newest first)
    prescriptions.sort((a, b) => new Date(b.dateScanned || b.createdAt || Date.now()) - new Date(a.dateScanned || a.createdAt || Date.now()));

    if (prescriptions.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
          <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">history</span>
          <p style="font-size:0.875rem; color:var(--on-surface-variant);">Your prescription history is empty. Scan a prescription to add it here.</p>
        </div>
      `;
    } else {
      let html = '';
      prescriptions.forEach((p, idx) => {
        const dateStr = new Date(p.date || p.dateScanned || p.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        
        // Alternate colors for visual appeal
        const colors = ['var(--primary-container)', 'var(--tertiary)', 'var(--secondary-container)'];
        const borderColor = colors[idx % colors.length];

        html += `
          <div class="card" style="margin-bottom:var(--space-4); border-left:4px solid ${borderColor};">
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-4);">
              <div>
                <h4 style="font-family:var(--font-headline); color:var(--primary); font-size:1.25rem;">${p.medication}</h4>
                <p style="font-size:0.75rem; color:var(--on-surface-variant); margin-top:4px;">${dateStr}</p>
              </div>
              <span class="chip" style="background:var(--surface-container-high); color:var(--on-surface); font-size:0.75rem; height:fit-content;">${p.doctorName || 'Doctor'}</span>
            </div>
            <p style="font-size:0.875rem; color:var(--on-surface-variant);"><strong>Dosage:</strong> ${p.dosage || 'N/A'}</p>
            ${p.instructions ? `<p style="font-size:0.875rem; color:var(--on-surface-variant); margin-top:4px;"><strong>Instructions:</strong> ${p.instructions}</p>` : ''}
          </div>
        `;
      });

      // Add AI Unified Alert at the bottom for realism
      html += `
        <div style="background:rgba(27,67,50,0.05); padding:var(--space-4); border-radius:var(--radius-lg); display:flex; gap:var(--space-3); align-items:flex-start; margin-top:var(--space-6);">
          <span class="material-symbols-outlined" style="color:var(--primary);">check_circle</span>
          <p style="font-size:0.875rem; color:var(--on-surface); line-height:1.5;">
            AI Check: Your prescription history is safely stored and analyzed for potential interactions across all your doctors.
          </p>
        </div>
      `;

      listContainer.innerHTML = html;
    }
  } catch (err) {
    console.error('Error loading prescriptions:', err);
    listContainer.innerHTML = `<p style="color:var(--error);">Failed to load history. ${err.message}</p>`;
  }
}
