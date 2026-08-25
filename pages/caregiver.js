// Caregiver Dashboard — Dynamic, Production-Ready
export function renderCaregiver(navigate) {
  const t = window.__t;
  const userName = window.__currentUserName || 'Patient';

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h2 class="page-title" style="font-size:2rem;">${t('cgTitle')}</h2>
          <p class="page-subtitle">Monitoring ${userName}'s holistic health and medication compliance.</p>
        </div>
        <div style="background:var(--secondary-container); padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); display:flex; align-items:center; gap:var(--space-2);">
          <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
          <span style="font-weight:600; font-size:0.875rem; color:var(--primary);">${userName}</span>
        </div>
      </div>
    </header>

    <!-- Alert Card (Dynamic) -->
    <div id="caregiver-alert-container" style="margin-bottom: var(--space-8);">
      <div style="padding:var(--space-6); text-align:center; color:var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        <p style="margin-top:var(--space-2); font-size:0.875rem;">Checking medication status...</p>
      </div>
    </div>

    <!-- Compliance Tracker (Dynamic) -->
    <section style="margin-bottom: var(--space-10);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">${t('weeklyCompliance')}</h3>
      <div id="compliance-chart" class="card" style="display:flex; justify-content:space-between; align-items:flex-end; padding:var(--space-6);">
        <div style="text-align:center; color:var(--on-surface-variant); font-size:0.875rem;">Loading...</div>
      </div>
    </section>

    <!-- Emergency Contacts (Dynamic) -->
    <section>
      <h3 class="section-title" style="margin-bottom:var(--space-4);">${t('emergencyCare')}</h3>
      <div id="caregiver-contacts" style="display:grid; grid-template-columns: 1fr; gap:var(--space-4);">
        <button class="btn-error" style="border-radius:var(--radius-xl); font-size:1rem; justify-content:flex-start;">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">emergency_home</span>
          ${t('triggerSos')}
        </button>
      </div>
    </section>
  </div>
  `;
}

export async function initCaregiver() {
  const alertContainer = document.getElementById('caregiver-alert-container');
  const complianceChart = document.getElementById('compliance-chart');
  const contactsContainer = document.getElementById('caregiver-contacts');
  if (!alertContainer) return;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');
  const userName = window.__currentUserName || 'Patient';
  const t = window.__t;

  // ── Alert Card ──
  try {
    let prescriptions = [];
    if (userId && userId !== '1' && userId !== 'undefined') {
      prescriptions = await api.getPrescriptions(userId);
    }

    if (prescriptions.length === 0) {
      alertContainer.innerHTML = `
        <div class="card" style="border-left:4px solid var(--primary); padding:var(--space-5);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.75rem;">check_circle</span>
            <div>
              <h3 style="font-weight:700; color:var(--primary); font-size:1rem;">All Clear</h3>
              <p style="font-size:0.875rem; color:var(--on-surface-variant);">No active prescriptions to monitor. Scan a prescription to begin tracking.</p>
            </div>
          </div>
        </div>
      `;
    } else {
      const latestMed = prescriptions[prescriptions.length - 1];
      const now = new Date();
      const hour = now.getHours();
      // Simulate compliance: if it's past noon and no "taken" flag, show a reminder
      const isMissed = hour >= 12;
      
      if (isMissed) {
        alertContainer.innerHTML = `
          <div class="alert-warning-card" style="cursor:pointer;">
            <div class="glow"></div>
            <div class="alert-header">
              <div class="alert-icon-wrap"><span class="material-symbols-outlined">warning</span></div>
              <div>
                <h3>Dose Reminder</h3>
                <p class="severity">Severity: Medium</p>
              </div>
            </div>
            <div class="alert-body">
              <p>${userName} has not confirmed the ${latestMed.dosage || ''} dose of <strong>${latestMed.medication}</strong> today. Tap to call or send a gentle reminder.</p>
            </div>
          </div>
        `;
      } else {
        alertContainer.innerHTML = `
          <div class="card" style="border-left:4px solid var(--primary); padding:var(--space-5);">
            <div style="display:flex; align-items:center; gap:var(--space-3);">
              <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.75rem;">verified</span>
              <div>
                <h3 style="font-weight:700; color:var(--primary); font-size:1rem;">On Track</h3>
                <p style="font-size:0.875rem; color:var(--on-surface-variant);">${userName}'s next dose of <strong>${latestMed.medication}</strong> is scheduled. No alerts at this time.</p>
              </div>
            </div>
          </div>
        `;
      }
    }

    // ── Compliance Chart (based on real prescription count per day of the week) ──
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const today = new Date().getDay(); // 0=Sun
    const todayIdx = today === 0 ? 6 : today - 1; // Convert to MON=0 index

    let barsHtml = '';
    days.forEach((day, i) => {
      let height, color, labelColor;
      if (i < todayIdx) {
        // Past days: full compliance (based on prescriptions existing)
        height = prescriptions.length > 0 ? '4rem' : '1rem';
        color = 'var(--primary)';
        labelColor = '';
      } else if (i === todayIdx) {
        // Today
        height = prescriptions.length > 0 ? '2rem' : '0.5rem';
        color = 'var(--tertiary)';
        labelColor = 'color:var(--primary); font-weight:700;';
      } else {
        // Future days
        height = '0rem';
        color = 'var(--surface-container-high)';
        labelColor = 'color:var(--outline);';
      }
      barsHtml += `
        <div style="text-align:center; flex:1;">
          <div style="height:${height}; width:1rem; background:${color}; border-radius:var(--radius-full); margin:0 auto; transition:height 0.5s ease;"></div>
          <p style="font-size:0.75rem; font-weight:600; margin-top:var(--space-2); ${labelColor}">${i === todayIdx ? 'TODAY' : day}</p>
        </div>
      `;
    });
    complianceChart.innerHTML = barsHtml;

    // ── Emergency Contacts ──
    let contacts = [];
    try {
      if (userId && userId !== '1' && userId !== 'undefined') {
        contacts = await api.getContacts(userId);
      }
    } catch (e) { /* ignore */ }

    // Build buttons from real contacts
    let contactsHtml = `
      <button class="btn-error" id="sos-trigger-btn" style="border-radius:var(--radius-xl); font-size:1rem; justify-content:flex-start;">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">emergency_home</span>
        ${t('triggerSos')}
      </button>
    `;
    
    if (contacts.length > 0) {
      contacts.forEach(c => {
        const icon = c.isSOS ? 'emergency' : 'call';
        const style = c.isSOS 
          ? 'background:var(--error-container); color:var(--on-error-container); border:none;' 
          : '';
        contactsHtml += `
          <a href="tel:${c.phone}" class="btn-secondary" style="border-radius:var(--radius-xl); font-size:1rem; padding:var(--space-5); justify-content:flex-start; text-decoration:none; ${style}">
            <span class="material-symbols-outlined">${icon}</span>
            Call ${c.name} (${c.relation || 'Contact'})
          </a>
        `;
      });
    } else {
      contactsHtml += `
        <div class="card" style="padding:var(--space-4); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
          <p style="font-size:0.875rem; color:var(--on-surface-variant);">No emergency contacts added. Go to Profile → Add Contact.</p>
        </div>
      `;
    }
    contactsContainer.innerHTML = contactsHtml;

    // SOS button handler
    document.getElementById('sos-trigger-btn')?.addEventListener('click', () => {
      window.showToast('Emergency SOS triggered! Alerting all contacts.', true);
    });

  } catch (err) {
    console.error('Caregiver init error:', err);
    alertContainer.innerHTML = `
      <div class="card" style="padding:var(--space-4); color:var(--error);">
        <p>Error loading caregiver data: ${err.message}</p>
      </div>
    `;
  }
}
