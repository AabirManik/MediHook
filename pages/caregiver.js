let _caregiverAbort = null;

export function cleanupCaregiver() {
  if (_caregiverAbort) { _caregiverAbort.abort(); _caregiverAbort = null; }
  if (window.__sosSubscription) {
    try { window.__sosSubscription.unsubscribe(); } catch(e) {}
    window.__sosSubscription = null;
  }
}

export function renderCaregiver(navigate) {
  const t = window.__t;
  const role = window.__currentUserRole || 'patient';

  if (role === 'caregiver' || role === 'doctor') {
    return renderCaregiverView(t);
  }
  return renderPatientView(t);
}

function renderPatientView(t) {
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h2 class="page-title" style="font-size:2rem;">Caregiver Hub</h2>
          <p class="page-subtitle">Manage who can see your health data.</p>
        </div>
        <button id="invite-caregiver-btn" class="btn-primary" style="padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-size:0.875rem; white-space:nowrap;">
          <span class="material-symbols-outlined" style="font-size:1.25rem;">person_add</span>
          Invite
        </button>
      </div>
    </header>

    <!-- Pending Invitations -->
    <section id="patient-pending-section" style="margin-bottom: var(--space-8); display:none;">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem; vertical-align:middle;">mail</span>
        Pending Invitations
      </h3>
      <div id="patient-pending-list" style="display:grid; gap:var(--space-3);"></div>
    </section>

    <!-- Active Caregivers -->
    <section style="margin-bottom: var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem; vertical-align:middle;">group</span>
        Connected Caregivers
      </h3>
      <div id="patient-active-caregivers">
        <div style="padding:var(--space-6); text-align:center; color:var(--on-surface-variant);">
          <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
          <p style="margin-top:var(--space-2); font-size:0.875rem;">Loading caregivers...</p>
        </div>
      </div>
    </section>

    <!-- Share Section -->
    <section style="margin-bottom: var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem; vertical-align:middle;">share</span>
        Share Health Data
      </h3>
      <p style="font-size:0.875rem; color:var(--on-surface-variant); margin-bottom:var(--space-4);">Push your latest data to connected caregivers manually.</p>
      <div style="display:grid; gap:var(--space-3);">
        <button class="caregiver-share-btn" id="share-meds-btn" data-type="medications">
          <span class="material-symbols-outlined" style="color:var(--primary);">medication</span>
          <div>
            <h4 style="font-weight:700; font-size:0.9rem;">Share Medications</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Send your current prescription list to all connected caregivers.</p>
          </div>
          <span class="material-symbols-outlined" style="color:var(--outline);">chevron_right</span>
        </button>
        <button class="caregiver-share-btn" id="share-report-btn" data-type="report">
          <span class="material-symbols-outlined" style="color:var(--tertiary);">description</span>
          <div>
            <h4 style="font-weight:700; font-size:0.9rem;">Share Weekly Report</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Send your latest weekly health summary to all connected caregivers.</p>
          </div>
          <span class="material-symbols-outlined" style="color:var(--outline);">chevron_right</span>
        </button>
      </div>
      <div id="share-status" style="margin-top:var(--space-3); display:none;"></div>
    </section>

    <!-- Invite Modal -->
    <div id="caregiver-invite-modal" class="modal-overlay" style="display:none; z-index:2000;">
      <div class="modal-card">
        <h3 style="margin-bottom:var(--space-4); font-weight:700;">Invite Caregiver</h3>
        <p style="font-size:0.8rem; color:var(--on-surface-variant); margin-bottom:var(--space-4);">They must have a Sanjeev AI account. Enter the email they signed up with.</p>
        <form id="caregiver-invite-form">
          <input type="text" id="cg-invite-name" placeholder="Caregiver's Full Name" class="cg-form-input" required />
          <input type="email" id="cg-invite-email" placeholder="Caregiver's Email" class="cg-form-input" required />
          <select id="cg-invite-relation" class="cg-form-input" required>
            <option value="" disabled selected>Relationship</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Spouse">Spouse</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
          <div style="display:flex; gap:var(--space-2); margin-top:var(--space-4);">
            <button type="button" class="btn-secondary" id="close-cg-modal" style="flex:1; justify-content:center;">Cancel</button>
            <button type="submit" class="btn-primary" id="cg-submit-btn" style="flex:1; justify-content:center;">Send Invite</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `;
}

function renderCaregiverView(t) {
  return `
  <div class="page-enter">
    <header style="margin-bottom:var(--space-6);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h2 class="page-title" style="font-size:2rem;">Caregiver Dashboard</h2>
          <p class="page-subtitle">Monitoring your connected patients.</p>
        </div>
      </div>
    </header>

    <!-- SOS Banner -->
    <div id="cg-sos-banner" style="margin-bottom:var(--space-6);display:none;"></div>

    <!-- Summary Cards -->
    <div id="cg-summary-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-6);">
      <div class="caregiver-summary-card"><span class="material-symbols-outlined" style="color:var(--primary);">group</span><span class="caregiver-summary-value" id="cg-count-patients">-</span><span class="caregiver-summary-label">Patients</span></div>
      <div class="caregiver-summary-card"><span class="material-symbols-outlined" style="color:var(--error);">notifications_active</span><span class="caregiver-summary-value" id="cg-count-alerts">-</span><span class="caregiver-summary-label">Alerts</span></div>
      <div class="caregiver-summary-card"><span class="material-symbols-outlined" style="color:var(--tertiary);">description</span><span class="caregiver-summary-value" id="cg-count-reports">-</span><span class="caregiver-summary-label">Reports</span></div>
    </div>

    <!-- Invitation Acceptance Overlay -->
    <div id="caregiver-invite-overlay" class="modal-overlay" style="display:none; z-index:9999;">
      <div class="modal-card" style="text-align:center;">
        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--primary); margin-bottom:var(--space-4);">mail</span>
        <h3 style="margin-bottom:var(--space-2);">Caregiver Invitation</h3>
        <p id="invite-overlay-text" style="color:var(--on-surface-variant); margin-bottom:var(--space-6); font-size:0.875rem;">You have been invited to connect with a patient.</p>
        <div style="display:flex; gap:var(--space-3);">
          <button id="decline-invite-btn" class="btn-secondary" style="flex:1; justify-content:center;">Decline</button>
          <button id="accept-invite-btn" class="btn-primary" style="flex:1; justify-content:center;">Accept Invite</button>
        </div>
      </div>
    </div>

    <!-- Connected Patients -->
    <section style="margin-bottom:var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem;vertical-align:middle;">group</span>
        Connected Patients
      </h3>
      <div id="cg-patients-list">
        <div style="padding:var(--space-6);text-align:center;color:var(--on-surface-variant);">
          <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span>
          <p style="margin-top:var(--space-2);font-size:0.875rem;">Loading patients...</p>
        </div>
      </div>
    </section>

    <!-- Shared Reports -->
    <section style="margin-bottom:var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem;vertical-align:middle;">description</span>
        Shared Reports
      </h3>
      <div id="cg-reports-list">
        <div style="padding:var(--space-4);text-align:center;color:var(--on-surface-variant);">
          <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span>
          <p style="margin-top:var(--space-2);font-size:0.875rem;">Loading reports...</p>
        </div>
      </div>
    </section>

    <!-- Patient Detail Overlay -->
    <div id="cg-patient-overlay" class="modal-overlay" style="display:none;z-index:9998;">
      <div class="modal-card" style="max-width:520px;max-height:88vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);position:sticky;top:0;background:var(--surface);z-index:1;padding-top:var(--space-2);">
          <h3 id="cg-overlay-name" style="font-weight:700;">Patient</h3>
          <button id="cg-overlay-close" class="icon-btn" style="color:var(--on-surface-variant);"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div id="cg-overlay-content">
          <div style="text-align:center;padding:var(--space-4);color:var(--on-surface-variant);">
            <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span>
            <p style="margin-top:var(--space-2);font-size:0.875rem;">Loading patient data...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

export async function initCaregiver() {
  if (_caregiverAbort) _caregiverAbort.abort();
  _caregiverAbort = new AbortController();
  const signal = _caregiverAbort.signal;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');
  const role = window.__currentUserRole || 'patient';

  if (!userId) return;

  if (role === 'caregiver' || role === 'doctor') {
    await initCaregiverView(api, userId, signal);
  } else {
    await initPatientView(api, userId, signal);
  }
}

// ── Patient View Logic ──
async function initPatientView(api, userId, signal) {
  const inviteModal = document.getElementById('caregiver-invite-modal');
  const inviteBtn = document.getElementById('invite-caregiver-btn');
  const closeModal = document.getElementById('close-cg-modal');
  const inviteForm = document.getElementById('caregiver-invite-form');

  inviteBtn?.addEventListener('click', () => { inviteModal.style.display = 'flex'; }, { signal });
  closeModal?.addEventListener('click', () => { inviteModal.style.display = 'none'; }, { signal });
  inviteModal?.addEventListener('click', (e) => {
    if (e.target === inviteModal) inviteModal.style.display = 'none';
  }, { signal });

  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('cg-submit-btn');
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const cgName = document.getElementById('cg-invite-name').value.trim();
      const cgEmail = document.getElementById('cg-invite-email').value.trim();
      const cgRel = document.getElementById('cg-invite-relation').value;
      const token = await api.createCaregiverInvitation(userId, cgEmail, cgName, cgRel);
      const inviteLink = `${window.location.origin}/#caregiver-invite?token=${token}&email=${encodeURIComponent(cgEmail)}`;
      try {
        await navigator.clipboard.writeText(inviteLink);
        window.showToast(`Invite link copied! Send it to ${cgName} via WhatsApp, SMS, or email.`);
      } catch (clipErr) {
        window.showToast(`Invitation created! Share this link with ${cgName}: ${inviteLink}`);
      }
      inviteModal.style.display = 'none';
      inviteForm.reset();
      loadPatientCaregivers(api, userId, signal);
    } catch (err) {
      window.showToast('Failed to send invite: ' + err.message, true);
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  }, { signal });

  loadPatientCaregivers(api, userId, signal);
  setupShareButtons(api, userId, signal);
}

async function loadPatientCaregivers(api, userId, signal) {
  try {
    const [invites, caregivers] = await Promise.all([
      api.getPatientInvitations(userId),
      api.getConnectedCaregivers(userId)
    ]);

    const pending = invites.filter(i => i.status === 'PENDING');
    const pendingSection = document.getElementById('patient-pending-section');
    const pendingList = document.getElementById('patient-pending-list');
    if (pendingSection && pendingList) {
      if (pending.length > 0) {
        pendingSection.style.display = 'block';
        pendingList.innerHTML = pending.map(inv => {
          const inviteLink = `${window.location.origin}/#caregiver-invite?token=${inv.invitation_token}&email=${encodeURIComponent(inv.caregiver_email)}`;
          return `
          <div class="caregiver-card" style="border-left:4px solid var(--tertiary); flex-wrap:wrap; gap:var(--space-2);">
            <div class="caregiver-card-left">
              <div class="caregiver-avatar" style="background:var(--tertiary-container);">
                <span class="material-symbols-outlined" style="color:var(--tertiary);">hourglass_top</span>
              </div>
              <div>
                <h4 style="font-weight:700; font-size:0.9rem;">${inv.caregiver_name}</h4>
                <p style="font-size:0.75rem; color:var(--on-surface-variant);">Pending · Sent to ${inv.caregiver_email}</p>
              </div>
            </div>
            <div style="display:flex; gap:var(--space-1); align-items:center;">
              <button class="caregiver-copy-btn" data-link="${inviteLink}" title="Copy invite link">
                <span class="material-symbols-outlined" style="font-size:0.9rem;">content_copy</span>
                Copy Link
              </button>
              <button class="cg-cancel-btn" data-id="${inv.id}" style="color:var(--error);" title="Cancel invitation">
                <span class="material-symbols-outlined" style="font-size:1.25rem;">close</span>
              </button>
            </div>
          </div>`;
        }).join('');

        pendingList.querySelectorAll('.cg-cancel-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await api.cancelInvitation(btn.dataset.id);
              window.showToast('Invitation cancelled.');
              loadPatientCaregivers(api, userId, signal);
            } catch (err) {
              window.showToast('Error cancelling', true);
            }
          }, { signal });
        });

        pendingList.querySelectorAll('.caregiver-copy-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(btn.dataset.link);
              window.showToast('Invite link copied!');
            } catch (e) {
              window.showToast('Copy failed. Long-press the link to copy.', true);
            }
          }, { signal });
        });
      } else {
        pendingSection.style.display = 'none';
      }
    }

    const activeContainer = document.getElementById('patient-active-caregivers');
    if (activeContainer) {
      if (caregivers.length === 0) {
        activeContainer.innerHTML = `
          <div class="caregiver-empty-state">
            <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">person_off</span>
            <p style="font-size:0.875rem; color:var(--on-surface-variant);">No caregivers connected yet.</p>
            <p style="font-size:0.75rem; color:var(--on-surface-variant); margin-top:var(--space-1);">Invite someone you trust to monitor your health.</p>
          </div>`;
      } else {
        activeContainer.innerHTML = caregivers.map(cg => `
          <div class="caregiver-card" style="border-left:4px solid var(--primary);">
            <div class="caregiver-card-left">
              <div class="caregiver-avatar">
                <span class="material-symbols-outlined" style="color:var(--primary);">person</span>
              </div>
              <div>
                <h4 style="font-weight:700; font-size:0.9rem;">
                  ${cg.profiles?.full_name || 'Unknown'}
                  <span class="caregiver-status-chip">ACTIVE</span>
                </h4>
                <p style="font-size:0.75rem; color:var(--on-surface-variant);">${cg.relationship}</p>
              </div>
            </div>
            <button class="cg-revoke-btn" data-id="${cg.caregiver_id}" data-name="${cg.profiles?.full_name || 'this caregiver'}" style="color:var(--error);" title="Remove caregiver">
              <span class="material-symbols-outlined" style="font-size:1.25rem;">person_remove</span>
            </button>
          </div>
        `).join('');

        activeContainer.querySelectorAll('.cg-revoke-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const name = btn.dataset.name;
            if (confirm(`Remove ${name}? They will immediately lose access to your health data.`)) {
              try {
                await api.revokeCaregiver(userId, btn.dataset.id);
                window.showToast(`${name} removed.`);
                loadPatientCaregivers(api, userId, signal);
              } catch (err) {
                window.showToast('Error removing caregiver', true);
              }
            }
          }, { signal });
        });
      }
    }
  } catch (err) {
    console.error('Failed to load caregivers:', err);
  }
}

function setupShareButtons(api, userId, signal) {
  const shareMedsBtn = document.getElementById('share-meds-btn');
  const shareReportBtn = document.getElementById('share-report-btn');
  const shareStatus = document.getElementById('share-status');

  shareMedsBtn?.addEventListener('click', async () => {
    await shareWithCaregivers(api, userId, 'medications', shareMedsBtn, shareStatus, signal);
  }, { signal });

  shareReportBtn?.addEventListener('click', async () => {
    await shareWithCaregivers(api, userId, 'report', shareReportBtn, shareStatus, signal);
  }, { signal });
}

async function shareWithCaregivers(api, userId, type, btn, statusEl, signal) {
  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.querySelector('.material-symbols-outlined:last-child')?.classList.add('hidden');

  try {
    const caregivers = await api.getConnectedCaregivers(userId);
    if (caregivers.length === 0) {
      window.showToast('No caregivers connected to share with.', true);
      btn.disabled = false;
      btn.innerHTML = origHTML;
      return;
    }

    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span> Sharing...';

    let payload;
    if (type === 'medications') {
      const prescriptions = await api.getPrescriptions(userId).catch(() => []);
      payload = JSON.stringify({
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
    } else {
      const [prescriptions, moods, scoreData] = await Promise.all([
        api.getPrescriptions(userId).catch(() => []),
        api.getMoods(userId).catch(() => []),
        api.getSafetyScore(userId).catch(() => null)
      ]);
      payload = JSON.stringify({
        type: 'weekly_report',
        patientName: window.__currentUserName || 'Patient',
        generatedAt: new Date().toISOString(),
        safetyScore: scoreData?.safety_score ?? 100,
        medications: prescriptions.map(p => ({
          name: p.medication,
          dosage: p.dosage,
          doctor: p.doctorName,
          confidence: p.confidence
        })),
        mood: {
          average: moods.length > 0 ? (moods.slice(0, 7).reduce((s, m) => s + (m.moodlevel || 3), 0) / Math.min(moods.length, 7)).toFixed(1) : 'N/A',
          logCount: moods.length
        }
      });
    }

    let sharedCount = 0;
    for (const cg of caregivers) {
      try {
        await api.shareReport(userId, cg.caregiver_id, payload);
        sharedCount++;
      } catch (e) {
        console.warn('Failed to share with caregiver:', e);
      }
    }

    if (sharedCount > 0) {
      const label = type === 'medications' ? 'Medications' : 'Weekly Report';
      window.showToast(`${label} shared with ${sharedCount} caregiver${sharedCount > 1 ? 's' : ''}!`);
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">check_circle</span> Shared!`;
      btn.style.background = 'var(--tertiary-container)';
      setTimeout(() => { btn.innerHTML = origHTML; btn.style.background = ''; btn.disabled = false; }, 2000);
    } else {
      window.showToast('Failed to share. Try again.', true);
      btn.innerHTML = origHTML;
      btn.disabled = false;
    }
  } catch (err) {
    window.showToast('Error: ' + err.message, true);
    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}

// ── Caregiver View Logic ──
async function initCaregiverView(api, userId, signal) {
  loadCaregiverDashboard(api, userId, signal);

  document.getElementById('cg-overlay-close')?.addEventListener('click', () => {
    document.getElementById('cg-patient-overlay').style.display = 'none';
  }, { signal });

  document.getElementById('cg-patient-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cg-patient-overlay') e.target.style.display = 'none';
  }, { signal });

  if (!window.__sosSubscription) {
    window.__sosSubscription = api.subscribeToSOS((payload) => {
      loadCaregiverDashboard(api, userId, signal);
      if (payload.eventType === 'INSERT' && payload.new?.status === 'ACTIVE') {
        window.showToast("EMERGENCY SOS RECEIVED", false);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch(e) {}
      }
    });
  }
}

async function loadCaregiverDashboard(api, userId, signal) {
  if (signal.aborted) return;

  const sosBanner = document.getElementById('cg-sos-banner');
  const patientsList = document.getElementById('cg-patients-list');
  const reportsList = document.getElementById('cg-reports-list');
  const countPatients = document.getElementById('cg-count-patients');
  const countAlerts = document.getElementById('cg-count-alerts');
  const countReports = document.getElementById('cg-count-reports');

  try {
    const [connectedPatients, pendingInvites, sosEvents, reports] = await Promise.all([
      api.getConnectedPatients(userId),
      api.getCaregiverInvitations(),
      api.getActiveSOSEvents(),
      api.getSharedReports(userId)
    ]);

    if (signal.aborted) return;

    // Pending invitation overlay
    const pending = pendingInvites.filter(i => i.status === 'PENDING');
    if (pending.length > 0) {
      const invite = pending[0];
      const overlay = document.getElementById('caregiver-invite-overlay');
      const overlayText = document.getElementById('invite-overlay-text');
      if (overlay && overlay.style.display === 'none') {
        if (overlayText) overlayText.textContent = `You have been invited by ${invite.profiles?.full_name || 'a patient'} to connect as their ${invite.relationship}.`;
        overlay.style.display = 'flex';

        document.getElementById('decline-invite-btn').onclick = async () => {
          overlay.style.display = 'none';
          try { await api.cancelInvitation(invite.id); } catch(e) {}
          loadCaregiverDashboard(api, userId, signal);
        };
        document.getElementById('accept-invite-btn').onclick = async (e) => {
          e.target.textContent = 'Accepting...';
          try {
            await api.acceptCaregiverInvitation(invite.invitation_token);
            overlay.style.display = 'none';
            window.showToast("Connected to patient!");
            loadCaregiverDashboard(api, userId, signal);
          } catch (err) {
            window.showToast("Failed to accept: " + err.message, true);
            e.target.textContent = 'Accept Invite';
          }
        };
      }
    }

    // SOS banner
    const activeSOS = sosEvents.filter(s => s.status === 'ACTIVE');
    if (activeSOS.length > 0 && sosBanner) {
      sosBanner.style.display = 'block';
      sosBanner.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--error-container);border:1px solid var(--error);border-radius:var(--radius-xl);">
          <span class="material-symbols-outlined" style="color:var(--error);font-size:1.5rem;flex-shrink:0;">emergency</span>
          <div style="flex:1;min-width:0;">
            <strong style="color:var(--error);font-size:0.85rem;">${activeSOS.length} Active SOS</strong>
            <p style="font-size:0.75rem;color:var(--on-surface-variant);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${activeSOS.map(s => s.profiles?.full_name || 'Patient').join(', ')}</p>
          </div>
          <button class="cg-ack-sos-btn" data-id="${activeSOS[0].id}" style="flex-shrink:0;font-size:0.75rem;padding:var(--space-1) var(--space-3);border-radius:var(--radius-lg);background:var(--error);color:white;border:none;cursor:pointer;font-weight:600;">Acknowledge</button>
        </div>`;

      sosBanner.querySelector('.cg-ack-sos-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.textContent = '...';
        try {
          await api.acknowledgeSOS(btn.dataset.id);
          window.showToast("SOS Acknowledged!");
          loadCaregiverDashboard(api, userId, signal);
        } catch (err) {
          window.showToast("Error: " + err.message, true);
          btn.textContent = 'Acknowledge';
        }
      }, { signal });
    } else if (sosBanner) {
      sosBanner.style.display = 'none';
    }

    // Summary cards
    if (countPatients) countPatients.textContent = connectedPatients.length;
    if (countAlerts) countAlerts.textContent = activeSOS.length;
    if (countReports) countReports.textContent = reports.filter(r => !r.read).length;

    // No patients state
    if (connectedPatients.length === 0) {
      patientsList.innerHTML = `
        <div class="caregiver-empty-state" style="border:1px solid var(--outline-variant);border-radius:var(--radius-xl);padding:var(--space-5);">
          <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--outline);margin-bottom:var(--space-2);">person_off</span>
          <h4 style="font-weight:700;">No Patients Connected</h4>
          <p style="font-size:0.875rem;color:var(--on-surface-variant);">When a patient invites you, they will appear here.</p>
        </div>`;
      reportsList.innerHTML = '';
      return;
    }

    // Patient cards
    let patientCardsHtml = '';
    for (const p of connectedPatients) {
      const pid = p.patient_id;
      let pMeds = [], pMoods = [], scoreData = null;
      try {
        [pMeds, pMoods, scoreData] = await Promise.all([
          api.getPatientPrescriptionsForCaregiver(pid).catch(() => []),
          api.getPatientMoodsForCaregiver(pid).catch(() => []),
          api.getSafetyScore(pid).catch(() => null)
        ]);
      } catch(e) {}

      if (signal.aborted) return;

      const ss = scoreData?.safety_score ?? 100;
      const ssc = ss >= 85 ? 'var(--primary)' : ss >= 60 ? 'var(--tertiary)' : 'var(--error)';
      const lastMood = pMoods.length > 0 ? pMoods[0] : null;
      const moodVal = lastMood ? lastMood.moodlevel : null;
      const moodColor = moodVal ? (moodVal >= 4 ? 'var(--tertiary)' : moodVal >= 3 ? 'var(--primary)' : 'var(--error)') : 'var(--outline)';
      const hasAlert = activeSOS.some(a => a.patient_id === pid);

      patientCardsHtml += `
        <div class="caregiver-card caregiver-patient-card" style="border-left:4px solid ${hasAlert ? 'var(--error)' : 'var(--primary)'};cursor:pointer;" data-patient-id="${pid}" data-patient-name="${p.profiles?.full_name || 'Patient'}">
          <div class="caregiver-card-left">
            <div class="caregiver-avatar" style="background:${hasAlert ? 'var(--error-container)' : 'var(--primary-container)'};">
              <span class="material-symbols-outlined" style="color:${hasAlert ? 'var(--error)' : 'var(--primary)'};">${hasAlert ? 'warning' : 'person'}</span>
            </div>
            <div style="min-width:0;">
              <h4 style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.profiles?.full_name || 'Patient'}</h4>
              <p style="font-size:0.75rem;color:var(--on-surface-variant);">${pMeds.length} med${pMeds.length !== 1 ? 's' : ''} · ${p.relationship}</p>
            </div>
          </div>
          <div style="display:flex;gap:var(--space-4);align-items:center;flex-shrink:0;">
            <div style="text-align:center;">
              <span style="font-weight:700;color:${ssc};font-size:0.9rem;">${ss}</span>
              <p style="font-size:0.6rem;color:var(--on-surface-variant);">Safety</p>
            </div>
            <div style="text-align:center;">
              <span style="font-weight:700;color:${moodColor};font-size:0.9rem;">${moodVal ? moodVal + '/5' : '---'}</span>
              <p style="font-size:0.6rem;color:var(--on-surface-variant);">Mood</p>
            </div>
            <span class="material-symbols-outlined" style="color:var(--outline);font-size:1.25rem;">chevron_right</span>
          </div>
          ${hasAlert ? '<span class="doctor-alert-dot"></span>' : ''}
        </div>`;
    }
    patientsList.innerHTML = `<div style="display:grid;gap:var(--space-3);">${patientCardsHtml}</div>`;

    patientsList.querySelectorAll('.caregiver-patient-card').forEach(card => {
      card.addEventListener('click', () => {
        openPatientDetail(api, card.dataset.patientId, card.dataset.patientName, signal);
      }, { signal });
    });

    // Shared reports
    if (reportsList && !signal.aborted) {
      if (reports.length === 0) {
        reportsList.innerHTML = `
          <div class="caregiver-empty-state" style="border:2px dashed var(--outline-variant);background:transparent;border-radius:var(--radius-xl);padding:var(--space-5);">
            <p style="font-size:0.875rem;color:var(--on-surface-variant);">No shared reports yet.</p>
          </div>`;
      } else {
        let html = '';
        reports.forEach(r => {
          let report = {};
          try { report = JSON.parse(r.report_data); } catch(e) {}
          const patientName = r.patient?.full_name || 'Unknown Patient';
          const dateStr = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const isUnread = !r.read;

          html += `
            <div class="caregiver-card cg-report-card" data-report-id="${r.id}" style="border-left:4px solid ${isUnread ? 'var(--error)' : 'var(--outline-variant)'};cursor:pointer;">
              <div style="width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">
                  <div style="display:flex;align-items:center;gap:var(--space-2);">
                    <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.25rem;">person</span>
                    <strong style="font-size:0.9rem;">${patientName}</strong>
                    ${isUnread ? '<span class="caregiver-new-badge">NEW</span>' : ''}
                  </div>
                  <span style="font-size:0.75rem;color:var(--on-surface-variant);">${dateStr}</span>
                </div>
                <div style="display:flex;gap:var(--space-4);">
                  ${report.safetyScore != null ? `<div style="text-align:center;"><span style="font-weight:700;color:${(report.safetyScore || 100) >= 85 ? 'var(--primary)' : (report.safetyScore || 100) >= 60 ? 'var(--tertiary)' : 'var(--error)'};">${report.safetyScore}</span><br><span style="font-size:0.65rem;color:var(--on-surface-variant);">Safety</span></div>` : ''}
                  ${report.mood?.average ? `<div style="text-align:center;"><span style="font-weight:700;">${report.mood.average}</span><br><span style="font-size:0.65rem;color:var(--on-surface-variant);">Mood</span></div>` : ''}
                  ${report.medications ? `<div style="text-align:center;"><span style="font-weight:700;">${report.medications.length}</span><br><span style="font-size:0.65rem;color:var(--on-surface-variant);">Meds</span></div>` : ''}
                </div>
              </div>
            </div>`;
        });
        reportsList.innerHTML = `<div style="display:grid;gap:var(--space-3);">${html}</div>`;

        reportsList.querySelectorAll('.cg-report-card').forEach(card => {
          card.addEventListener('click', () => {
            card.classList.remove('doctor-report-unread');
            const badge = card.querySelector('.caregiver-new-badge');
            if (badge) badge.remove();
            card.style.borderColor = 'var(--outline-variant)';
            api.markReportRead(card.dataset.reportId).catch(() => {});
          }, { signal });
        });
      }
    }

  } catch (err) {
    console.error('Caregiver dashboard error:', err);
    if (patientsList) patientsList.innerHTML = `<div style="color:var(--error);text-align:center;padding:var(--space-6);">Error: ${err.message}</div>`;
  }
}

// ── Patient Detail Overlay ──
async function openPatientDetail(api, patientId, patientName, signal) {
  const overlay = document.getElementById('cg-patient-overlay');
  const nameEl = document.getElementById('cg-overlay-name');
  const content = document.getElementById('cg-overlay-content');
  if (!overlay || !content) return;

  if (nameEl) nameEl.textContent = patientName;
  content.innerHTML = '<div style="text-align:center;padding:var(--space-4);color:var(--on-surface-variant);"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span><p style="margin-top:var(--space-2);font-size:0.875rem;">Loading patient data...</p></div>';
  overlay.style.display = 'flex';

  try {
    const [prescriptions, moods, scoreData] = await Promise.all([
      api.getPatientPrescriptionsForCaregiver(patientId).catch(() => []),
      api.getPatientMoodsForCaregiver(patientId).catch(() => []),
      api.getSafetyScore(patientId).catch(() => null)
    ]);

    if (signal.aborted) return;

    const safetyScore = scoreData?.safety_score ?? 100;
    const recentMoods = moods.filter(m => {
      const d = new Date(m.date || m.recorded_at || Date.now());
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    const avgMood = recentMoods.length > 0
      ? (recentMoods.reduce((s, m) => s + (m.moodlevel || 3), 0) / recentMoods.length).toFixed(1)
      : 'N/A';
    const moodTrend = getMoodTrend(moods);
    const moodDays = buildMoodChart(moods);
    const safetyColor = safetyScore >= 85 ? 'var(--primary)' : safetyScore >= 60 ? 'var(--tertiary)' : 'var(--error)';

    let html = '';

    // ── Prescriptions ──
    html += '<div style="margin-bottom:var(--space-5);">';
    html += '<h4 style="font-weight:700;font-size:0.9rem;margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);"><span class="material-symbols-outlined" style="color:var(--primary);font-size:1.1rem;">medication</span> Medications (' + prescriptions.length + ')</h4>';
    if (prescriptions.length > 0) {
      prescriptions.forEach(p => {
        const conf = p.confidence || 0;
        const cc = conf >= 90 ? '#2E7D32' : conf >= 60 ? '#E65100' : '#C62828';
        html += `
          <div class="caregiver-card" style="border-left:3px solid ${cc};margin-bottom:var(--space-2);">
            <div style="width:100%;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <h4 style="font-weight:700;font-size:0.85rem;">${p.medication}</h4>
                <span style="font-size:0.7rem;font-weight:700;color:${cc};">${conf}%</span>
              </div>
              ${p.dosage ? '<p style="font-size:0.75rem;color:var(--on-surface-variant);">Dosage: ' + p.dosage + '</p>' : ''}
              ${p.instructions ? '<p style="font-size:0.75rem;color:var(--on-surface-variant);">Instructions: ' + p.instructions + '</p>' : ''}
              ${p.doctorName ? '<p style="font-size:0.7rem;color:var(--outline);margin-top:var(--space-1);">Dr. ' + p.doctorName + '</p>' : ''}
            </div>
          </div>`;
      });
    } else {
      html += '<p style="font-size:0.85rem;color:var(--on-surface-variant);">No prescriptions on record.</p>';
    }
    html += '</div>';

    // ── Mood Graph ──
    html += `
      <div style="margin-bottom:var(--space-5);">
        <h4 style="font-weight:700;font-size:0.9rem;margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);"><span class="material-symbols-outlined" style="color:var(--tertiary);font-size:1.1rem;">mood</span> Mood Trend (7 days)</h4>
        <div id="cg-detail-mood-graph" style="position:relative;width:100%;height:200px;">
          <canvas id="cg-detail-mood-canvas"></canvas>
        </div>
        <div style="display:flex;justify-content:space-around;margin-top:var(--space-2);">
          ${moodDays.map(d => '<span style="font-size:0.65rem;color:var(--on-surface-variant);">' + d.label + '</span>').join('')}
        </div>
      </div>`;

    // ── Mood Entries ──
    html += '<div style="margin-bottom:var(--space-5);">';
    html += '<h4 style="font-weight:700;font-size:0.9rem;margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);"><span class="material-symbols-outlined" style="color:var(--tertiary);font-size:1.1rem;">history</span> Mood Entries</h4>';
    if (moods.length > 0) {
      moods.slice(0, 14).forEach(m => {
        const moodEmoji = m.moodlevel >= 4 ? '😊' : m.moodlevel >= 3 ? '😐' : '😟';
        const dateStr = new Date(m.recorded_at || m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        html += `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--outline-variant);font-size:0.8rem;">
            <span>${moodEmoji} Mood ${m.moodlevel}/5</span>
            <span style="color:var(--on-surface-variant);">${dateStr}</span>
          </div>`;
      });
    } else {
      html += '<p style="font-size:0.85rem;color:var(--on-surface-variant);">No mood entries yet.</p>';
    }
    html += '</div>';

    // ── Weekly Report (live) ──
    html += `
      <div class="cg-report-paper" style="margin-bottom:var(--space-2);">
        <div class="cg-report-bar"></div>
        <div class="cg-report-body">
          <div class="cg-report-section">
            <h4 class="cg-report-section-title"><span class="material-symbols-outlined" style="color:${safetyColor};">shield_with_heart</span> Safety Score</h4>
            <div class="cg-report-safety">
              <span class="cg-report-safety-value" style="color:${safetyColor};">${safetyScore}</span>
              <span style="font-size:0.8rem;color:var(--on-surface-variant);">out of 100</span>
            </div>
          </div>
          <div class="cg-report-section">
            <h4 class="cg-report-section-title"><span class="material-symbols-outlined" style="color:var(--primary);">medication</span> Active Medications (${prescriptions.length})</h4>
            ${prescriptions.length > 0 ? prescriptions.map(p => {
              const conf = p.confidence || 0;
              const cc = conf >= 90 ? '#2E7D32' : conf >= 60 ? '#E65100' : '#C62828';
              return '<div class="cg-report-med-row"><div><strong>' + p.medication + '</strong> <span style="color:var(--on-surface-variant);font-size:0.75rem;">' + (p.dosage || '') + '</span></div><span style="font-weight:700;font-size:0.75rem;color:' + cc + ';">' + conf + '%</span></div>';
            }).join('') : '<p style="font-size:0.85rem;color:var(--on-surface-variant);">None</p>'}
          </div>
          <div class="cg-report-section">
            <h4 class="cg-report-section-title"><span class="material-symbols-outlined" style="color:var(--tertiary);">mood</span> Mood & Wellbeing</h4>
            <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-3);">
              <div style="text-align:center;"><span style="font-weight:700;font-size:1.25rem;">${avgMood}</span><p style="font-size:0.65rem;color:var(--on-surface-variant);">Avg Mood (7d)</p></div>
              <div style="text-align:center;"><span class="material-symbols-outlined" style="color:${moodTrend.color};font-size:1.25rem;">${moodTrend.icon}</span><p style="font-size:0.65rem;color:var(--on-surface-variant);">${moodTrend.text}</p></div>
              <div style="text-align:center;"><span style="font-weight:700;font-size:1.25rem;">${recentMoods.length}</span><p style="font-size:0.65rem;color:var(--on-surface-variant);">Entries</p></div>
            </div>
            <div class="cg-report-mood-bars">
              ${moodDays.map(d => {
                const h = d.avg > 0 ? (d.avg / 5) * 60 : 3;
                const c = d.avg >= 4 ? 'var(--tertiary)' : d.avg >= 3 ? 'var(--primary)' : d.avg > 0 ? 'var(--error)' : 'var(--outline-variant)';
                return '<div class="cg-report-mood-bar"><div class="cg-report-mood-bar-track"><div class="cg-report-mood-bar-fill" style="height:' + h + 'px;background:' + c + ';"></div></div><span class="cg-report-mood-bar-label">' + d.label + '</span></div>';
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;

    content.innerHTML = html;

    // Draw mood graph on canvas after modal layout is computed
    setTimeout(() => {
      drawMoodGraph(moods, 'cg-detail-mood-canvas', 'cg-detail-mood-graph');
    }, 300);

  } catch (err) {
    content.innerHTML = `<p style="color:var(--error);text-align:center;padding:var(--space-4);">Failed to load: ${err.message}</p>`;
  }
}

// ── Helper: Weekly data aggregation ──
function getWeeklyData(moods) {
  const now = new Date();
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const dayMoods = moods.filter(m => {
      const recorded = new Date(m.recorded_at || m.date);
      return recorded >= dayStart && recorded < dayEnd;
    });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabel = dayNames[d.getDay()];
    if (dayMoods.length > 0) {
      const avg = dayMoods.reduce((sum, m) => sum + (m.moodlevel || 3), 0) / dayMoods.length;
      week.push({ label: dayLabel, value: Math.round(avg), count: dayMoods.length });
    } else {
      week.push({ label: dayLabel, value: null, count: 0 });
    }
  }
  return week;
}

// ── Helper: Build mood chart data for bar chart ──
function buildMoodChart(moods) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMoods = moods.filter(m => {
      const mDate = (m.date || m.recorded_at || '').split('T')[0];
      return mDate === dateStr;
    });
    const avg = dayMoods.length > 0
      ? dayMoods.reduce((s, m) => s + (m.moodlevel || 3), 0) / dayMoods.length
      : 0;
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    days.push({ label, avg: Math.round(avg * 10) / 10, count: dayMoods.length });
  }
  return days;
}

// ── Helper: Mood trend calculation ──
function getMoodTrend(moods) {
  if (moods.length < 2) return { icon: 'remove', text: 'Insufficient data', color: 'var(--outline)' };
  const recent = moods.slice(0, 3);
  const older = moods.slice(3, 6);
  if (older.length === 0) return { icon: 'remove', text: 'Building baseline', color: 'var(--outline)' };
  const recentAvg = recent.reduce((s, m) => s + (m.moodlevel || 3), 0) / recent.length;
  const olderAvg = older.reduce((s, m) => s + (m.moodlevel || 3), 0) / older.length;
  const diff = recentAvg - olderAvg;
  if (diff > 0.3) return { icon: 'trending_up', text: `Improving (+${diff.toFixed(1)})`, color: 'var(--tertiary)' };
  if (diff < -0.3) return { icon: 'trending_down', text: `Declining (${diff.toFixed(1)})`, color: 'var(--error)' };
  return { icon: 'trending_flat', text: 'Stable', color: 'var(--primary)' };
}

// ── Helper: Week range string ──
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, fmt)} - ${end.toLocaleDateString(undefined, fmt)}, ${end.getFullYear()}`;
}

// ── Canvas mood graph drawing ──
function drawMoodGraph(moods, canvasId, containerId) {
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const weekData = getWeeklyData(moods);
  const hasData = weekData.some(d => d.value !== null);

  if (!hasData) {
    canvas.style.display = 'none';
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--on-surface-variant);"><span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--outline);">mood</span><p style="font-size:0.8rem;margin-top:var(--space-1);">No mood data this week</p></div>';
    return;
  }

  canvas.style.display = 'block';
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = rect.width || 400;
  const h = 200;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const padTop = 25, padBottom = 10, padLeft = 30, padRight = 15;
  const gw = w - padLeft - padRight;
  const gh = h - padTop - padBottom;

  const yMin = 1, yMax = 5;
  function yForVal(v) { return padTop + gh - ((v - yMin) / (yMax - yMin)) * gh; }
  const xStep = gw / 6;
  function xForIdx(i) { return padLeft + i * xStep; }

  // Grid lines
  ctx.strokeStyle = '#C1C8C220';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let level = 1; level <= 5; level++) {
    const y = yForVal(level);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Y-axis labels
  ctx.fillStyle = '#8B949E';
  ctx.font = '600 10px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let level = 1; level <= 5; level++) {
    ctx.fillText(level.toString(), padLeft - 8, yForVal(level));
  }

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  weekData.forEach((d, i) => {
    ctx.fillText(d.label, xForIdx(i), h - padBottom + 6);
  });

  // Points
  const points = weekData.map((d, i) => ({
    x: xForIdx(i),
    y: d.value !== null ? yForVal(d.value) : null,
    value: d.value,
    label: d.label
  }));

  const validPoints = points.filter(p => p.y !== null);

  if (validPoints.length >= 2) {
    const tension = 0.3;

    // Fill
    ctx.beginPath();
    ctx.moveTo(validPoints[0].x, validPoints[0].y);
    for (let i = 0; i < validPoints.length - 1; i++) {
      const p0 = validPoints[Math.max(0, i - 1)];
      const p1 = validPoints[i];
      const p2 = validPoints[i + 1];
      const p3 = validPoints[Math.min(validPoints.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.lineTo(validPoints[validPoints.length - 1].x, h - padBottom);
    ctx.lineTo(validPoints[0].x, h - padBottom);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    fillGrad.addColorStop(0, 'rgba(0, 200, 83, 0.15)');
    fillGrad.addColorStop(1, 'rgba(0, 200, 83, 0.01)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    ctx.moveTo(validPoints[0].x, validPoints[0].y);
    for (let i = 0; i < validPoints.length - 1; i++) {
      const p0 = validPoints[Math.max(0, i - 1)];
      const p1 = validPoints[i];
      const p2 = validPoints[i + 1];
      const p3 = validPoints[Math.min(validPoints.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    const strokeGrad = ctx.createLinearGradient(validPoints[0].x, 0, validPoints[validPoints.length - 1].x, 0);
    strokeGrad.addColorStop(0, '#735C00');
    strokeGrad.addColorStop(1, '#1B4332');
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Data points
  function moodColor(val) {
    if (val <= 2) return '#FF3D5A';
    if (val === 3) return '#FFD600';
    return '#00C853';
  }

  points.forEach((p) => {
    if (p.y === null) return;
    const color = moodColor(p.value);
    ctx.save();
    ctx.shadowColor = color + '80';
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '700 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(p.value.toString(), p.x, p.y - 12);
    ctx.restore();
  });
}
