// Caregiver Dashboard — Dynamic, Production-Ready
export function renderCaregiver(navigate) {
  const t = window.__t;
  const userName = window.__currentUserName || 'Caregiver';

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
        <p style="color:var(--on-surface-variant); margin-bottom:var(--space-6); font-size:0.875rem;">You have been invited to connect with a patient. By accepting, you agree to receive their SOS alerts and health updates.</p>
        <div style="display:flex; gap:var(--space-3);">
          <button id="decline-invite-btn" class="btn-secondary" style="flex:1; justify-content:center;">Decline</button>
          <button id="accept-invite-btn" class="btn-primary" style="flex:1; justify-content:center;">Accept Invite</button>
        </div>
      </div>
    </div>

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
  const userName = window.__currentUserName || 'Caregiver';
  const t = window.__t;

  // ── Invitation Acceptance Logic ──
  const pendingToken = window.__pendingInviteToken || localStorage.getItem('pending_invite_token');
  if (pendingToken) {
    const inviteOverlay = document.getElementById('caregiver-invite-overlay');
    if (inviteOverlay) {
      inviteOverlay.style.display = 'flex';
      
      document.getElementById('decline-invite-btn')?.addEventListener('click', () => {
         localStorage.removeItem('pending_invite_token');
         window.__pendingInviteToken = null;
         inviteOverlay.style.display = 'none';
         window.showToast("Invitation declined.");
      });
      
      document.getElementById('accept-invite-btn')?.addEventListener('click', async (e) => {
         e.target.textContent = 'Accepting...';
         try {
           await api.acceptCaregiverInvitation(pendingToken);
           localStorage.removeItem('pending_invite_token');
           window.__pendingInviteToken = null;
           inviteOverlay.style.display = 'none';
           window.showToast("Successfully connected to patient!");
           // Reload dashboard data
           loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);
         } catch (err) {
           window.showToast("Failed to accept: " + err.message, true);
           e.target.textContent = 'Accept Invite';
         }
      });
    }
  }

  // Initial load
  loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);

  // Subscribe to realtime SOS updates
  if (!window.__sosSubscription) {
    window.__sosSubscription = api.subscribeToSOS((payload) => {
      console.log('Realtime SOS event received:', payload);
      // Reload dashboard data instantly when an SOS is triggered, acknowledged, or resolved
      loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);
      
      if (payload.eventType === 'INSERT' && payload.new.status === 'ACTIVE') {
        window.showToast("🚨 EMERGENCY SOS RECEIVED 🚨", false);
        // Play an alert sound (optional if browser allows)
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio autoplay blocked'));
        } catch(e) {}
      }
    });
  }
}

async function loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer) {
  if (!userId) return;
  
  try {
    // 0. Fetch pending invites for this caregiver (using their email via RLS)
    const pendingInvites = await api.getCaregiverInvitations();
    
    // If there are pending invites and the modal isn't already showing, show the first one
    if (pendingInvites.length > 0) {
      const inviteOverlay = document.getElementById('caregiver-invite-overlay');
      if (inviteOverlay && inviteOverlay.style.display === 'none') {
        const invite = pendingInvites[0]; // Just show the first one
        inviteOverlay.style.display = 'flex';
        inviteOverlay.querySelector('p').textContent = `You have been invited by ${invite.profiles?.full_name || 'a patient'} to connect as their ${invite.relationship}.`;
        
        document.getElementById('decline-invite-btn').onclick = async () => {
           inviteOverlay.style.display = 'none';
           try { await api.cancelInvitation(invite.id); } catch(e){}
           loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);
        };
        
        document.getElementById('accept-invite-btn').onclick = async (e) => {
           e.target.textContent = 'Accepting...';
           try {
             await api.acceptCaregiverInvitation(invite.invitation_token);
             inviteOverlay.style.display = 'none';
             window.showToast("Successfully connected to patient!");
             loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);
           } catch (err) {
             window.showToast("Failed to accept: " + err.message, true);
           } finally {
             e.target.textContent = 'Accept Invite';
           }
        };
      }
    }

    // 1. Fetch connected patients
    const connectedPatients = await api.getConnectedPatients(userId);
    
    if (connectedPatients.length === 0) {
      alertContainer.innerHTML = `
        <div class="card" style="border-left:4px solid var(--outline); padding:var(--space-5);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--outline); font-size:1.75rem;">person_off</span>
            <div>
              <h3 style="font-weight:700; color:var(--on-surface); font-size:1rem;">No Patients Connected</h3>
              <p style="font-size:0.875rem; color:var(--on-surface-variant);">You have not accepted any caregiver invitations yet. When a patient invites you, the connection will appear here.</p>
            </div>
          </div>
        </div>
      `;
      complianceChart.innerHTML = '<div style="text-align:center; flex:1; font-size:0.875rem; color:var(--outline);">No data available</div>';
      contactsContainer.innerHTML = '<div class="card" style="padding:var(--space-4); text-align:center; border:2px dashed var(--outline-variant); background:transparent;"><p style="font-size:0.875rem; color:var(--on-surface-variant);">No active connections to trigger SOS for.</p></div>';
      return;
    }
    
    // 2. Fetch active SOS events
    const sosEvents = await api.getActiveSOSEvents();
    const activeSOS = sosEvents.filter(sos => sos.status === 'ACTIVE');
    
    if (activeSOS.length > 0) {
      // Display SOS Alert
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
        </div>
      `;
      
      document.querySelector('.ack-sos-btn')?.addEventListener('click', async (e) => {
        try {
          e.target.textContent = 'Acknowledging...';
          await api.acknowledgeSOS(e.target.dataset.id);
          window.showToast("SOS Acknowledged!");
          loadCaregiverDashboardData(api, userId, alertContainer, complianceChart, contactsContainer);
        } catch (err) {
          window.showToast("Error acknowledging: " + err.message, true);
          e.target.textContent = 'ACKNOWLEDGE ALERT';
        }
      });
    } else {
      // Normal clear state
      const patientNames = connectedPatients.map(p => p.profiles?.full_name).join(', ');
      alertContainer.innerHTML = `
        <div class="card" style="border-left:4px solid var(--primary); padding:var(--space-5);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.75rem;">verified</span>
            <div>
              <h3 style="font-weight:700; color:var(--primary); font-size:1rem;">All Clear</h3>
              <p style="font-size:0.875rem; color:var(--on-surface-variant);">Monitoring active for: ${patientNames}. No emergency alerts at this time.</p>
            </div>
          </div>
        </div>
      `;
    }

    // ── Connected Patients List ──
    contactsContainer.innerHTML = connectedPatients.map(p => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--primary);">
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <div class="brand-avatar" style="width:2.5rem; height:2.5rem; background:var(--surface-container-high);">
            <span class="material-symbols-outlined" style="color:var(--primary);">person</span>
          </div>
          <div>
            <h4 style="font-weight:700;">${p.profiles?.full_name || 'Patient'}</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Relationship: ${p.relationship}</p>
          </div>
        </div>
        <div style="display:flex; gap:var(--space-2);">
          <button class="icon-btn" style="color:var(--primary);" title="Call Patient">
            <span class="material-symbols-outlined">call</span>
          </button>
        </div>
      </div>
    `).join('');

    // Static Chart Placeholder
    complianceChart.innerHTML = '<div style="text-align:center; flex:1; font-size:0.875rem; color:var(--outline);">Compliance tracking active</div>';

  } catch (err) {
    console.error('Caregiver init error:', err);
    alertContainer.innerHTML = `
      <div class="card" style="padding:var(--space-4); color:var(--error);">
        <p>Error loading caregiver data: ${err.message}</p>
      </div>
    `;
  }
}
