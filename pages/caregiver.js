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
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h2 class="page-title" style="font-size:2rem;">Caregiver Hub</h2>
          <p class="page-subtitle">Monitoring your connected patients.</p>
        </div>
      </div>
    </header>

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

    <!-- Alert Card -->
    <div id="caregiver-alert-container" style="margin-bottom: var(--space-8);">
      <div style="padding:var(--space-6); text-align:center; color:var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        <p style="margin-top:var(--space-2); font-size:0.875rem;">Checking medication status...</p>
      </div>
    </div>

    <!-- Connected Patients -->
    <section style="margin-bottom: var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem; vertical-align:middle;">group</span>
        Connected Patients
      </h3>
      <div id="caregiver-patients-list" style="display:grid; gap:var(--space-3);"></div>
    </section>

    <!-- Patient Detail View (hidden by default) -->
    <div id="patient-detail-overlay" class="modal-overlay" style="display:none; z-index:9998;">
      <div class="modal-card" style="max-width:420px; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
          <h3 id="detail-patient-name" style="font-weight:700;">Patient</h3>
          <button id="close-detail-btn" class="icon-btn" style="color:var(--on-surface-variant);">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div id="patient-detail-content">
          <div style="text-align:center; padding:var(--space-4); color:var(--on-surface-variant);">
            <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
            <p style="margin-top:var(--space-2); font-size:0.875rem;">Loading patient data...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Reports -->
    <section style="margin-top: var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:1.25rem; vertical-align:middle;">description</span>
        Shared Reports
      </h3>
      <div id="caregiver-shared-reports">
        <div style="padding:var(--space-4); text-align:center; color:var(--on-surface-variant);">
          <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
          <p style="margin-top:var(--space-2); font-size:0.875rem;">Loading shared reports...</p>
        </div>
      </div>
    </section>
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

    // Pending
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

    // Active
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
  const alertContainer = document.getElementById('caregiver-alert-container');
  const patientsList = document.getElementById('caregiver-patients-list');

  loadCaregiverDashboard(api, userId, signal);

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
  const alertContainer = document.getElementById('caregiver-alert-container');
  const patientsList = document.getElementById('caregiver-patients-list');
  if (!alertContainer || !patientsList) return;

  try {
    // Pending invites
    const pendingInvites = await api.getCaregiverInvitations();
    if (pendingInvites.length > 0) {
      const invite = pendingInvites[0];
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

    const connectedPatients = await api.getConnectedPatients(userId);

    if (connectedPatients.length === 0) {
      alertContainer.innerHTML = `
        <div class="caregiver-empty-state" style="border:1px solid var(--outline-variant); border-radius:var(--radius-xl); padding:var(--space-5);">
          <span class="material-symbols-outlined" style="font-size:2rem; color:var(--outline); margin-bottom:var(--space-2);">person_off</span>
          <h3 style="font-weight:700; font-size:1rem;">No Patients Connected</h3>
          <p style="font-size:0.875rem; color:var(--on-surface-variant);">When a patient invites you, the connection will appear here.</p>
        </div>`;
      patientsList.innerHTML = '';
      return;
    }

    // SOS check
    const sosEvents = await api.getActiveSOSEvents();
    const activeSOS = sosEvents.filter(s => s.status === 'ACTIVE');

    if (activeSOS.length > 0) {
      const sos = activeSOS[0];
      alertContainer.innerHTML = `
        <div class="alert-warning-card" style="border-color:var(--error); animation: pulse 2s infinite;">
          <div class="glow" style="background:radial-gradient(circle at 10% 10%, rgba(255,0,0,0.2) 0%, transparent 100%);"></div>
          <div class="alert-header">
            <div class="alert-icon-wrap" style="background:var(--error);"><span class="material-symbols-outlined" style="color:white;">emergency</span></div>
            <div>
              <h3 style="color:var(--error);">EMERGENCY SOS</h3>
              <p class="severity" style="color:var(--error);">Triggered by ${sos.profiles?.full_name}</p>
            </div>
          </div>
          <div class="alert-body">
            <p>${sos.message}</p>
            <button class="btn-error ack-sos-btn" data-id="${sos.id}" style="width:100%; margin-top:var(--space-4); justify-content:center;">ACKNOWLEDGE ALERT</button>
          </div>
        </div>`;

      if (!alertContainer._ackHandlerAttached) {
        alertContainer.addEventListener('click', async (e) => {
          const ackBtn = e.target.closest('.ack-sos-btn');
          if (!ackBtn) return;
          try {
            ackBtn.textContent = 'Acknowledging...';
            await api.acknowledgeSOS(ackBtn.dataset.id);
            window.showToast("SOS Acknowledged!");
            loadCaregiverDashboard(api, userId, signal);
          } catch (err) {
            window.showToast("Error: " + err.message, true);
            ackBtn.textContent = 'ACKNOWLEDGE ALERT';
          }
        });
        alertContainer._ackHandlerAttached = true;
      }
    } else {
      const names = connectedPatients.map(p => p.profiles?.full_name).join(', ');
      alertContainer.innerHTML = `
        <div class="caregiver-alert-clear">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.75rem;">verified</span>
          <div>
            <h3 style="font-weight:700; color:var(--primary); font-size:1rem;">All Clear</h3>
            <p style="font-size:0.875rem; color:var(--on-surface-variant);">Monitoring: ${names}. No alerts.</p>
          </div>
        </div>`;
    }

    // Patients list
    patientsList.innerHTML = connectedPatients.map(p => `
      <div class="caregiver-card caregiver-patient-card" style="border-left:4px solid var(--primary); cursor:pointer;" data-patient-id="${p.patient_id}" data-patient-name="${p.profiles?.full_name || 'Patient'}">
        <div class="caregiver-card-left">
          <div class="caregiver-avatar">
            <span class="material-symbols-outlined" style="color:var(--primary);">person</span>
          </div>
          <div>
            <h4 style="font-weight:700; font-size:0.9rem;">${p.profiles?.full_name || 'Patient'}</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">${p.relationship}</p>
          </div>
        </div>
        <span class="material-symbols-outlined" style="color:var(--outline);">chevron_right</span>
      </div>
    `).join('');

    patientsList.querySelectorAll('.caregiver-patient-card').forEach(card => {
      card.addEventListener('click', () => {
        openPatientDetail(api, card.dataset.patientId, card.dataset.patientName, signal);
      }, { signal });
    });

    // Shared reports
    const reportsContainer = document.getElementById('caregiver-shared-reports');
    if (reportsContainer && !signal.aborted) {
      try {
        const reports = await api.getSharedReports(userId);
        if (reports.length === 0) {
          reportsContainer.innerHTML = `
            <div class="caregiver-empty-state" style="border:2px dashed var(--outline-variant); background:transparent; border-radius:var(--radius-xl); padding:var(--space-5);">
              <p style="font-size:0.875rem; color:var(--on-surface-variant);">No shared reports yet.</p>
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
              <div class="caregiver-card doctor-report-card ${isUnread ? 'doctor-report-unread' : ''}" data-report-id="${r.id}" style="border-left:4px solid ${isUnread ? 'var(--error)' : 'var(--outline-variant)'};">
                <div style="width:100%;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
                    <div style="display:flex; align-items:center; gap:var(--space-2);">
                      <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.25rem;">person</span>
                      <strong style="font-size:0.9rem;">${patientName}</strong>
                      ${isUnread ? '<span class="caregiver-new-badge">NEW</span>' : ''}
                    </div>
                    <span style="font-size:0.75rem; color:var(--on-surface-variant);">${dateStr}</span>
                  </div>
                  <div style="display:flex; gap:var(--space-4);">
                    ${report.safetyScore != null ? `<div style="text-align:center;"><span style="font-weight:700; color:${(report.safetyScore || 100) >= 85 ? 'var(--primary)' : (report.safetyScore || 100) >= 60 ? 'var(--tertiary)' : 'var(--error)'};">${report.safetyScore}</span><br><span style="font-size:0.65rem; color:var(--on-surface-variant);">Safety</span></div>` : ''}
                    ${report.mood?.average ? `<div style="text-align:center;"><span style="font-weight:700;">${report.mood.average}</span><br><span style="font-size:0.65rem; color:var(--on-surface-variant);">Mood</span></div>` : ''}
                    ${report.medications ? `<div style="text-align:center;"><span style="font-weight:700;">${report.medications.length}</span><br><span style="font-size:0.65rem; color:var(--on-surface-variant);">Meds</span></div>` : ''}
                  </div>
                </div>
              </div>`;
          });
          reportsContainer.innerHTML = html;

          reportsContainer.querySelectorAll('.doctor-report-card').forEach(card => {
            card.addEventListener('click', () => {
              card.classList.remove('doctor-report-unread');
              const badge = card.querySelector('.caregiver-new-badge');
              if (badge) badge.remove();
              card.style.borderColor = 'var(--outline-variant)';
              api.markReportRead(card.dataset.reportId).catch(() => {});
            }, { signal });
          });
        }
      } catch (e) {
        reportsContainer.innerHTML = '<p style="font-size:0.875rem; color:var(--on-surface-variant);">Could not load shared reports.</p>';
      }
    }

  } catch (err) {
    console.error('Caregiver dashboard error:', err);
    alertContainer.innerHTML = `<div class="caregiver-empty-state" style="color:var(--error);"><p>Error loading data: ${err.message}</p></div>`;
  }
}

async function openPatientDetail(api, patientId, patientName, signal) {
  const overlay = document.getElementById('patient-detail-overlay');
  const nameEl = document.getElementById('detail-patient-name');
  const content = document.getElementById('patient-detail-content');
  if (!overlay || !content) return;

  nameEl.textContent = patientName;
  content.innerHTML = '<div style="text-align:center; padding:var(--space-4); color:var(--on-surface-variant);"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span><p style="margin-top:var(--space-2); font-size:0.875rem;">Loading prescriptions...</p></div>';
  overlay.style.display = 'flex';

  document.getElementById('close-detail-btn').onclick = () => { overlay.style.display = 'none'; };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; }, { signal });

  try {
    const prescriptions = await api.getPatientPrescriptionsForCaregiver(patientId);
    if (prescriptions.length === 0) {
      content.innerHTML = '<p style="font-size:0.875rem; color:var(--on-surface-variant); text-align:center; padding:var(--space-4);">No prescriptions on record.</p>';
      return;
    }
    let html = '<div style="display:grid; gap:var(--space-3);">';
    prescriptions.forEach(p => {
      const conf = p.confidence || 0;
      let confColor = conf >= 90 ? '#2E7D32' : conf >= 60 ? '#E65100' : '#C62828';
      html += `
        <div class="caregiver-card" style="border-left:3px solid ${confColor};">
          <div style="width:100%;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-1);">
              <h4 style="font-weight:700; font-size:0.9rem;">${p.medication}</h4>
              <span style="font-size:0.7rem; font-weight:700; color:${confColor};">${conf}%</span>
            </div>
            ${p.dosage ? `<p style="font-size:0.8rem; color:var(--on-surface-variant);">Dosage: ${p.dosage}</p>` : ''}
            ${p.instructions ? `<p style="font-size:0.8rem; color:var(--on-surface-variant);">Instructions: ${p.instructions}</p>` : ''}
            ${p.doctorName ? `<p style="font-size:0.75rem; color:var(--outline); margin-top:var(--space-1);">Dr. ${p.doctorName}</p>` : ''}
          </div>
        </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<p style="color:var(--error); text-align:center; padding:var(--space-4);">Failed to load: ${err.message}</p>`;
  }
}
