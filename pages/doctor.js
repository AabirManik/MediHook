let _doctorAbort = null;
let _doctorActiveTab = 'dashboard';
let _doctorSubscription = null;

export function cleanupDoctor() {
  if (_doctorAbort) { _doctorAbort.abort(); _doctorAbort = null; }
  if (_doctorSubscription) {
    try { _doctorSubscription.unsubscribe(); } catch(e) {}
    _doctorSubscription = null;
  }
}

export function renderDoctor(navigate) {
  const userName = window.__currentUserName || 'Doctor';
  return `
  <div class="page-enter">
    <header style="margin-bottom:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h2 class="page-title" style="font-size:2rem;">Doctor Dashboard</h2>
          <p class="page-subtitle">Welcome, Dr. ${userName}</p>
        </div>
        <span class="material-symbols-outlined" style="color:var(--primary);font-size:2.5rem;">medical_services</span>
      </div>
    </header>
    <div class="doctor-tab-bar" id="doctor-tab-bar">
      <button class="doctor-tab active" data-tab="dashboard"><span class="material-symbols-outlined">dashboard</span>Dashboard</button>
      <button class="doctor-tab" data-tab="alerts"><span class="material-symbols-outlined">notifications_active</span>Alerts<span class="doctor-tab-badge" id="doctor-alert-badge" style="display:none;">0</span></button>
      <button class="doctor-tab" data-tab="patients"><span class="material-symbols-outlined">group</span>Patients</button>
      <button class="doctor-tab" data-tab="profile"><span class="material-symbols-outlined">person</span>Profile</button>
    </div>
    <div id="doctor-tab-content" style="margin-top:var(--space-6);">
      <div style="text-align:center;padding:var(--space-8);color:var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:2rem;">sync</span>
        <p style="margin-top:var(--space-2);font-size:0.875rem;">Loading dashboard...</p>
      </div>
    </div>
    <div id="doctor-patient-overlay" class="modal-overlay" style="display:none;z-index:9998;">
      <div class="modal-card" style="max-width:480px;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
          <h3 id="doctor-detail-name" style="font-weight:700;">Patient</h3>
          <button id="doctor-close-detail" class="icon-btn" style="color:var(--on-surface-variant);"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div id="doctor-detail-content"><div style="text-align:center;padding:var(--space-4);"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span></div></div>
      </div>
    </div>
  </div>`;
}

export async function initDoctor() {
  if (_doctorAbort) _doctorAbort.abort();
  _doctorAbort = new AbortController();
  const signal = _doctorAbort.signal;
  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');
  if (!userId) return;
  _doctorActiveTab = 'dashboard';

  document.getElementById('doctor-tab-bar')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.doctor-tab');
    if (!tab) return;
    _doctorActiveTab = tab.dataset.tab;
    document.querySelectorAll('.doctor-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderTabContent(api, userId, signal);
  }, { signal });

  document.getElementById('doctor-close-detail')?.addEventListener('click', () => {
    document.getElementById('doctor-patient-overlay').style.display = 'none';
  }, { signal });

  await renderTabContent(api, userId, signal);

  if (!_doctorSubscription) {
    _doctorSubscription = api.subscribeToSOS((payload) => {
      if (payload.eventType === 'INSERT' && payload.new?.status === 'ACTIVE') {
        window.showToast('ALERT: A patient has reported a problem!', false);
        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{}); } catch(e) {}
        if (_doctorActiveTab === 'alerts' || _doctorActiveTab === 'dashboard') renderTabContent(api, userId, signal);
        updateAlertBadge(api);
      }
    });
  }
  updateAlertBadge(api);
}

async function renderTabContent(api, userId, signal) {
  const content = document.getElementById('doctor-tab-content');
  if (!content || signal.aborted) return;
  switch (_doctorActiveTab) {
    case 'dashboard': await renderDashboard(api, userId, content, signal); break;
    case 'alerts': await renderAlerts(api, userId, content, signal); break;
    case 'patients': await renderPatients(api, userId, content, signal); break;
    case 'profile': renderProfileTab(userId, content); break;
  }
}

async function updateAlertBadge(api) {
  try {
    const alerts = await api.getDoctorAlerts();
    const active = alerts.filter(a => a.status === 'ACTIVE');
    const badge = document.getElementById('doctor-alert-badge');
    if (badge) { badge.textContent = active.length; badge.style.display = active.length > 0 ? 'inline-flex' : 'none'; }
  } catch(e) {}
}

async function renderDashboard(api, userId, content, signal) {
  if (signal.aborted) return;
  try {
    const [patients, alerts, reports] = await Promise.all([
      api.getConnectedPatients(userId), api.getDoctorAlerts(), api.getSharedReports(userId)
    ]);
    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
    const unreadReports = reports.filter(r => !r.read);

    let patientCards = '';
    for (const p of patients) {
      const pid = p.patient_id;
      let pMeds = [], pMoods = [];
      try { [pMeds, pMoods] = await Promise.all([api.getPatientPrescriptionsForCaregiver(pid).catch(()=>[]), api.getPatientMoodsForCaregiver(pid).catch(()=>[])]); } catch(e) {}
      const lastMood = pMoods.length > 0 ? pMoods[0] : null;
      const moodVal = lastMood ? lastMood.moodlevel : null;
      const moodColor = moodVal ? (moodVal >= 4 ? 'var(--tertiary)' : moodVal >= 3 ? 'var(--primary)' : 'var(--error)') : 'var(--outline)';
      const hasAlert = activeAlerts.some(a => a.patient_id === pid);
      patientCards += `
        <div class="doctor-patient-card" data-patient-id="${pid}" data-patient-name="${p.profiles?.full_name || 'Patient'}">
          <div style="display:flex;align-items:center;gap:var(--space-3);flex:1;min-width:0;">
            <div class="doctor-patient-avatar" style="background:${hasAlert ? 'var(--error-container)' : 'var(--primary-container)'};">
              <span class="material-symbols-outlined" style="color:${hasAlert ? 'var(--error)' : 'var(--primary)'};">${hasAlert ? 'warning' : 'person'}</span>
            </div>
            <div style="min-width:0;">
              <h4 style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.profiles?.full_name || 'Patient'}</h4>
              <p style="font-size:0.75rem;color:var(--on-surface-variant);">${pMeds.length} med${pMeds.length !== 1 ? 's' : ''} &middot; ${p.relationship}</p>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-weight:700;font-size:0.9rem;color:${moodColor};">${moodVal ? moodVal + '/5' : '---'}</div>
            <p style="font-size:0.65rem;color:var(--on-surface-variant);">Mood</p>
          </div>
          ${hasAlert ? '<span class="doctor-alert-dot"></span>' : ''}
        </div>`;
    }

    content.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-6);">
        <div class="doctor-summary-card"><span class="material-symbols-outlined" style="color:var(--primary);">group</span><span class="doctor-summary-value">${patients.length}</span><span class="doctor-summary-label">Patients</span></div>
        <div class="doctor-summary-card" style="border-color:${activeAlerts.length > 0 ? 'var(--error)' : 'var(--outline-variant)'};"><span class="material-symbols-outlined" style="color:${activeAlerts.length > 0 ? 'var(--error)' : 'var(--outline)'};">notifications_active</span><span class="doctor-summary-value" style="color:${activeAlerts.length > 0 ? 'var(--error)' : 'inherit'};">${activeAlerts.length}</span><span class="doctor-summary-label">Alerts</span></div>
        <div class="doctor-summary-card"><span class="material-symbols-outlined" style="color:var(--tertiary);">description</span><span class="doctor-summary-value">${unreadReports.length}</span><span class="doctor-summary-label">Reports</span></div>
      </div>
      ${activeAlerts.length > 0 ? `<div class="doctor-sos-banner" style="margin-bottom:var(--space-6);"><span class="material-symbols-outlined" style="color:var(--error);font-size:1.5rem;">emergency</span><div style="flex:1;"><strong style="color:var(--error);">${activeAlerts.length} Active Alert${activeAlerts.length > 1 ? 's' : ''}</strong><p style="font-size:0.75rem;color:var(--on-surface-variant);">A patient has reported a problem. Tap Alerts to review.</p></div><button class="btn-secondary" onclick="document.querySelector('[data-tab=alerts]').click()" style="font-size:0.75rem;padding:var(--space-2) var(--space-3);">View</button></div>` : ''}
      <h3 class="section-title" style="margin-bottom:var(--space-4);">Your Patients</h3>
      ${patients.length === 0 ? '<div class="doctor-empty-state"><span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);">group_off</span><h4 style="font-weight:700;">No Patients Connected</h4><p style="font-size:0.875rem;color:var(--on-surface-variant);">When patients connect with you, they will appear here.</p></div>' : '<div style="display:grid;gap:var(--space-3);">' + patientCards + '</div>'}`;

    content.querySelectorAll('.doctor-patient-card').forEach(card => {
      card.addEventListener('click', () => openDoctorPatientDetail(api, card.dataset.patientId, card.dataset.patientName, signal), { signal });
    });
  } catch (err) {
    content.innerHTML = '<div style="color:var(--error);text-align:center;padding:var(--space-6);">Error: ' + err.message + '</div>';
  }
}

async function renderAlerts(api, userId, content, signal) {
  if (signal.aborted) return;
  try {
    const alerts = await api.getDoctorAlerts();
    if (alerts.length === 0) {
      content.innerHTML = '<div class="doctor-empty-state"><span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);">notifications_off</span><h4 style="font-weight:700;">No Alerts</h4><p style="font-size:0.875rem;color:var(--on-surface-variant);">When patients report problems, alerts will appear here.</p></div>';
      return;
    }
    let html = '';
    alerts.forEach(a => {
      const sc = a.status === 'ACTIVE' ? 'var(--error)' : a.status === 'ACKNOWLEDGED' ? 'var(--tertiary)' : 'var(--primary)';
      const sb = a.status === 'ACTIVE' ? 'var(--error-container)' : a.status === 'ACKNOWLEDGED' ? 'var(--tertiary-container)' : 'var(--primary-container)';
      const ds = new Date(a.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const pName = a.patient?.full_name || 'Patient';
      const initials = pName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const msg = (a.message || 'No details.').substring(0, 150) + ((a.message || '').length > 150 ? '...' : '');
      html += `
        <div class="doctor-alert-card" style="border-left:4px solid ${sc};padding:var(--space-4);background:var(--surface-container);border-radius:var(--radius-xl);">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
            <div style="width:2.25rem;height:2.25rem;border-radius:50%;background:${sb};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="font-weight:700;font-size:0.8rem;color:${sc};">${initials}</span>
            </div>
            <div style="flex:1;min-width:0;">
              <h4 style="font-weight:700;font-size:0.9rem;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pName}</h4>
              <p style="font-size:0.7rem;color:var(--on-surface-variant);margin:0;">${ds}</p>
            </div>
            <span class="doctor-status-chip" style="background:${sb};color:${sc};flex-shrink:0;">${a.status}</span>
          </div>
          <p style="font-size:0.8rem;color:var(--on-surface-variant);margin:0 0 var(--space-3) 0;line-height:1.4;">${msg}</p>
          <div style="display:flex;gap:var(--space-2);">
            ${a.status === 'ACTIVE' ? `<button class="btn-secondary doctor-ack-btn" data-id="${a.id}" style="font-size:0.75rem;padding:var(--space-1) var(--space-3);border-radius:var(--radius-lg);">Acknowledge</button>` : ''}
            <button class="doctor-view-patient-btn" data-patient-id="${a.patient_id}" data-patient-name="${pName}" style="font-size:0.75rem;padding:var(--space-1) var(--space-3);color:var(--primary);background:none;border:1px solid var(--primary);border-radius:var(--radius-lg);cursor:pointer;">View Patient</button>
          </div>
        </div>`;
    });
    content.innerHTML = '<div style="margin-bottom:var(--space-4);color:var(--on-surface-variant);font-size:0.875rem;">' + alerts.length + ' alert' + (alerts.length !== 1 ? 's' : '') + ' total</div><div style="display:grid;gap:var(--space-3);">' + html + '</div>';
    content.querySelectorAll('.doctor-ack-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        btn.textContent = '...';
        try {
          await api.acknowledgeSOS(btn.dataset.id);
          window.showToast('Alert acknowledged');
          renderAlerts(api, userId, content, signal);
          updateAlertBadge(api);
        } catch(err) {
          window.showToast('Error: ' + err.message, true);
          btn.textContent = 'Acknowledge';
        }
      }, { signal });
    });
    content.querySelectorAll('.doctor-view-patient-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDoctorPatientDetail(api, btn.dataset.patientId, btn.dataset.patientName, signal);
      }, { signal });
    });
  } catch (err) {
    content.innerHTML = '<div style="color:var(--error);text-align:center;padding:var(--space-6);">Error: ' + err.message + '</div>';
  }
}

async function renderPatients(api, userId, content, signal) {
  if (signal.aborted) return;
  try {
    const patients = await api.getConnectedPatients(userId);
    if (patients.length === 0) { content.innerHTML = '<div class="doctor-empty-state"><span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);">group_off</span><h4 style="font-weight:700;">No Patients Connected</h4><p style="font-size:0.875rem;color:var(--on-surface-variant);">When patients invite you, they will appear here.</p></div>'; return; }
    let html = '';
    for (const p of patients) {
      const pid = p.patient_id;
      let pMeds = [], pMoods = [], scoreData = null;
      try { [pMeds, pMoods, scoreData] = await Promise.all([api.getPatientPrescriptionsForCaregiver(pid).catch(()=>[]), api.getPatientMoodsForCaregiver(pid).catch(()=>[]), api.getSafetyScore(pid).catch(()=>null)]); } catch(e) {}
      const ss = scoreData?.safety_score ?? 100;
      const ssc = ss >= 85 ? 'var(--primary)' : ss >= 60 ? 'var(--tertiary)' : 'var(--error)';
      const am = pMoods.length > 0 ? (pMoods.slice(0, 7).reduce((s, m) => s + (m.moodlevel || 3), 0) / Math.min(pMoods.length, 7)).toFixed(1) : '---';
      html += '<div class="doctor-patient-card" data-patient-id="' + pid + '" data-patient-name="' + (p.profiles?.full_name || 'Patient') + '"><div style="display:flex;align-items:center;gap:var(--space-3);flex:1;min-width:0;"><div class="doctor-patient-avatar"><span class="material-symbols-outlined" style="color:var(--primary);">person</span></div><div style="min-width:0;"><h4 style="font-weight:700;font-size:0.9rem;">' + (p.profiles?.full_name || 'Patient') + '</h4><p style="font-size:0.75rem;color:var(--on-surface-variant);">' + p.relationship + ' &middot; ' + pMeds.length + ' med' + (pMeds.length !== 1 ? 's' : '') + '</p></div></div><div style="display:flex;gap:var(--space-4);align-items:center;flex-shrink:0;"><div style="text-align:center;"><span style="font-weight:700;color:' + ssc + ';font-size:0.9rem;">' + ss + '</span><p style="font-size:0.6rem;color:var(--on-surface-variant);">Safety</p></div><div style="text-align:center;"><span style="font-weight:700;font-size:0.9rem;">' + am + '</span><p style="font-size:0.6rem;color:var(--on-surface-variant);">Mood</p></div><span class="material-symbols-outlined" style="color:var(--outline);font-size:1.25rem;">chevron_right</span></div></div>';
    }
    content.innerHTML = '<div style="margin-bottom:var(--space-4);color:var(--on-surface-variant);font-size:0.875rem;">' + patients.length + ' connected patient' + (patients.length !== 1 ? 's' : '') + '</div><div style="display:grid;gap:var(--space-3);">' + html + '</div>';
    content.querySelectorAll('.doctor-patient-card').forEach(card => {
      card.addEventListener('click', () => openDoctorPatientDetail(api, card.dataset.patientId, card.dataset.patientName, signal), { signal });
    });
  } catch (err) { content.innerHTML = '<div style="color:var(--error);text-align:center;padding:var(--space-6);">Error: ' + err.message + '</div>'; }
}

function renderProfileTab(userId, content) {
  const userName = window.__currentUserName || 'Doctor';
  const healthId = window.__currentHealthId || 'SANJ-XXXX';
  content.innerHTML = `
    <div class="doctor-profile-section">
      <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-6);">
        <div class="brand-avatar" style="width:4rem;height:4rem;"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=${userName}&backgroundColor=e6f0eb" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" /></div>
        <div><h3 style="font-weight:700;font-size:1.25rem;">Dr. ${userName}</h3><p style="font-size:0.875rem;color:var(--primary);font-weight:600;">Medical Professional</p><p style="font-size:0.75rem;color:var(--on-surface-variant);">ID: ${healthId}</p></div>
      </div>
      <button id="doctor-logout-btn" class="btn-error" style="width:100%;justify-content:center;padding:var(--space-4);border-radius:var(--radius-xl);font-size:1rem;"><span class="material-symbols-outlined">logout</span> Logout</button>
    </div>`;
  document.getElementById('doctor-logout-btn')?.addEventListener('click', async () => {
    try {
      const { auth } = await import('../auth.js');
      await auth.signOut();
      window.__currentUserRole = 'patient'; window.__currentUserName = ''; window.__currentHealthId = ''; window.__currentUserId = null; window.__isLoggedIn = false;
      window.showToast('Logged out safely');
    } catch (e) { window.showToast('Logout error', true); }
  });
}

async function openDoctorPatientDetail(api, patientId, patientName, signal) {
  const overlay = document.getElementById('doctor-patient-overlay');
  const nameEl = document.getElementById('doctor-detail-name');
  const content = document.getElementById('doctor-detail-content');
  if (!overlay || !content) return;
  nameEl.textContent = patientName;
  content.innerHTML = '<div style="text-align:center;padding:var(--space-4);"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span></div>';
  overlay.style.display = 'flex';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; }, { signal });

  try {
    const [prescriptions, moods, noteData] = await Promise.all([
      api.getPatientPrescriptionsForCaregiver(patientId),
      api.getPatientMoodsForCaregiver(patientId).catch(()=>[]),
      api.getDoctorNotes(patientId).catch(()=>null)
    ]);
    let html = '';

    if (prescriptions.length > 0) {
      html += '<h4 style="font-weight:700;font-size:0.85rem;margin-bottom:var(--space-2);">Medications</h4>';
      prescriptions.forEach(p => {
        const conf = p.confidence || 0;
        const cc = conf >= 90 ? '#2E7D32' : conf >= 60 ? '#E65100' : '#C62828';
        html += '<div class="caregiver-card" style="border-left:3px solid ' + cc + ';margin-bottom:var(--space-2);"><div style="width:100%;"><div style="display:flex;justify-content:space-between;align-items:center;"><h4 style="font-weight:700;font-size:0.85rem;">' + p.medication + '</h4><span style="font-size:0.7rem;font-weight:700;color:' + cc + ';">' + conf + '%</span></div>' + (p.dosage ? '<p style="font-size:0.75rem;color:var(--on-surface-variant);">Dosage: ' + p.dosage + '</p>' : '') + (p.instructions ? '<p style="font-size:0.75rem;color:var(--on-surface-variant);">Instructions: ' + p.instructions + '</p>' : '') + '</div></div>';
      });
    } else {
      html += '<p style="font-size:0.85rem;color:var(--on-surface-variant);margin-bottom:var(--space-3);">No prescriptions on record.</p>';
    }

    if (moods.length > 0) {
      html += '<h4 style="font-weight:700;font-size:0.85rem;margin-top:var(--space-4);margin-bottom:var(--space-2);">Recent Mood</h4>';
      moods.slice(0, 5).forEach(m => {
        const moodEmoji = m.moodlevel >= 4 ? '😊' : m.moodlevel >= 3 ? '😐' : '😟';
        const dateStr = new Date(m.recorded_at || m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--outline-variant);font-size:0.8rem;"><span>' + moodEmoji + ' Mood ' + m.moodlevel + '/5</span><span style="color:var(--on-surface-variant);">' + dateStr + '</span></div>';
      });
    }

    html += '<h4 style="font-weight:700;font-size:0.85rem;margin-top:var(--space-4);margin-bottom:var(--space-2);">Your Clinical Note</h4>';
    html += '<textarea id="doctor-note-textarea" class="cg-form-input" rows="4" placeholder="Write a note for this patient..." style="font-size:0.85rem;">' + (noteData?.note_text || '') + '</textarea>';
    html += '<button id="doctor-save-note-btn" class="btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-2);padding:var(--space-3);">Save Note</button>';

    content.innerHTML = html;

    document.getElementById('doctor-save-note-btn')?.addEventListener('click', async () => {
      const text = document.getElementById('doctor-note-textarea')?.value?.trim();
      if (!text) { window.showToast('Please enter a note', true); return; }
      try {
        await api.saveDoctorNote(patientId, text);
        window.showToast('Note saved!');
      } catch (err) { window.showToast('Error saving note: ' + err.message, true); }
    }, { signal });

  } catch (err) {
    content.innerHTML = '<p style="color:var(--error);text-align:center;padding:var(--space-4);">Failed to load: ' + err.message + '</p>';
  }
}
