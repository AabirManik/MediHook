import { auth } from '../auth.js';
export function renderProfile(navigate) {
  const t = window.__t || ((key) => key);
  const isLoggedIn = window.__isLoggedIn || false;
  const userName = window.__currentUserName || 'Guest';
  const role = window.__currentUserRole || 'patient';
  const contacts = window.__currentContacts || [];

  // 1. Logged Out State (Auth Screen)
  if (!isLoggedIn) {
    return renderAuthScreen(t);
  }

  // 2. Logged In State (Profile Hub)
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; align-items:center; gap:var(--space-4);">
          <div class="brand-avatar" style="width:4rem; height:4rem; box-shadow:var(--shadow-elevated);">
            <img id="profile-avatar-img" src="https://api.dicebear.com/7.x/notionists/svg?seed=${userName}&backgroundColor=e6f0eb" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
          </div>
          <div>
            <h2 id="profile-display-name" class="page-title" style="margin-bottom:var(--space-1); font-size:1.75rem;">${userName}</h2>
            <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--primary); font-size:0.875rem; font-weight:600; text-transform:capitalize;">
              <span class="material-symbols-outlined" style="font-size:1.25rem;">verified_user</span>
              ${role} • ${t('healthId')}: ${window.__currentHealthId || 'SANJ-XXXX'}
            </div>
          </div>
        </div>
        <button id="edit-profile-header-btn" class="btn-secondary" style="padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-size:0.875rem;">
          <span class="material-symbols-outlined" style="font-size:1.25rem;">edit</span>
          Edit Name
        </button>
      </div>
      <!-- Inline name edit form -->
      <div id="name-edit-form" style="display:none; margin-top:var(--space-4);">
        <div class="card" style="padding:var(--space-4); border:2px solid var(--primary); display:flex; gap:var(--space-3); align-items:center;">
          <input type="text" id="input-profile-name" class="form-input" placeholder="Enter your name" value="${userName}" style="flex:1; font-size:1rem;" />
          <button id="save-profile-name-btn" class="btn-primary" style="padding:var(--space-3) var(--space-5); white-space:nowrap;">
            <span class="material-symbols-outlined">save</span> Save
          </button>
          <button id="cancel-profile-name-btn" class="btn-secondary" style="padding:var(--space-3);">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </header>

    ${renderRoleSpecificInfo(role, t, contacts)}

    <!-- Global Settings -->
    <section style="margin-bottom:var(--space-10);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">${t('settingsPrefs')}</h3>
      <div class="card" style="padding:0; overflow:hidden;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); border-bottom:1px solid var(--surface-container-high);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--on-surface-variant);">dark_mode</span>
            <span style="font-weight:600; font-size:0.875rem;">${t('darkMode')}</span>
          </div>
          <label style="position:relative; display:inline-block; width:3rem; height:1.5rem; background:var(--surface-container-high); border-radius:var(--radius-full); cursor:pointer;">
            <input type="checkbox" style="opacity:0; width:0; height:0;" />
            <span style="position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem; background:var(--outline); border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); border-bottom:1px solid var(--surface-container-high);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--primary);">notifications_active</span>
            <span style="font-weight:600; font-size:0.875rem;">${t('notifications')}</span>
          </div>
          <label style="position:relative; display:inline-block; width:3rem; height:1.5rem; background:var(--primary); border-radius:var(--radius-full); cursor:pointer;">
            <span style="position:absolute; top:2px; left:22px; width:1.25rem; height:1.25rem; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4);">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span class="material-symbols-outlined" style="color:var(--on-surface-variant);">shield_lock</span>
            <span style="font-weight:600; font-size:0.875rem;">${t('dataPrivacy')}</span>
          </div>
          <span class="material-symbols-outlined" style="color:var(--outline);">chevron_right</span>
        </div>

      </div>
    </section>

    <!-- Logout -->
    <button id="profile-logout-btn" class="btn-error" style="width:100%; justify-content:center; padding:var(--space-4); border-radius:var(--radius-xl); font-size:1rem;">
      <span class="material-symbols-outlined">logout</span>
      ${t('logout')}
    </button>

    <!-- Add Contact Modal (Hidden by default) -->
    <div id="contact-modal" class="modal-overlay" style="display:none;">
      <div class="modal-card">
        <h3 style="margin-bottom:var(--space-4);">Add Emergency Contact</h3>
        <form id="contact-form">
          <input type="text" id="contact-name" placeholder="Full Name" class="form-input" required />
          <input type="text" id="contact-relation" placeholder="Relation (e.g. Doctor, Sister)" class="form-input" />
          <input type="tel" id="contact-phone" placeholder="Phone Number" class="form-input" required />
          <label style="display:flex; align-items:center; gap:var(--space-2); margin:var(--space-4) 0; cursor:pointer;">
            <input type="checkbox" id="contact-sos" />
            <span style="font-size:0.875rem; font-weight:600;">Set as SOS Primary</span>
          </label>
          <div style="display:flex; gap:var(--space-2);">
            <button type="button" class="btn-secondary" id="close-modal" style="flex:1; justify-content:center;">Cancel</button>
            <button type="submit" class="btn-primary" style="flex:1; justify-content:center;">Save Contact</button>
          </div>
        </form>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(5px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-4);
      }
      .modal-card {
        background: var(--surface);
        padding: var(--space-6);
        border-radius: var(--radius-2xl);
        width: 100%;
        max-width: 360px;
        box-shadow: var(--shadow-elevated);
      }
      .form-input {
        width: 100%;
        padding: var(--space-3);
        margin-bottom: var(--space-3);
        border: 1px solid var(--outline-variant);
        border-radius: var(--radius-lg);
        background: var(--surface-container-low);
        color: var(--on-surface);
        font-family: inherit;
      }
      .form-input:focus {
        border-color: var(--primary);
        outline: none;
      }
    </style>
  </div>
  `;
}

function renderRoleSpecificInfo(role, t, contacts) {
  if (role === 'doctor') {
    return `
    <section style="margin-bottom:var(--space-8);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">Professional Info</h3>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:var(--space-3);">
        <div class="card" style="text-align:center; padding:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--tertiary); margin-bottom:var(--space-2);">badge</span>
          <p style="font-size:0.75rem; color:var(--on-surface-variant); text-transform:uppercase;">License No.</p>
          <p style="font-weight:700;">MED-9214</p>
        </div>
        <div class="card" style="text-align:center; padding:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--primary); margin-bottom:var(--space-2);">psychiatry</span>
          <p style="font-size:0.75rem; color:var(--on-surface-variant); text-transform:uppercase;">Specialization</p>
          <p style="font-weight:700;">Cardiology</p>
        </div>
      </div>
    </section>
    `;
  }
  
  if (role === 'patient') {
    const savedAge = localStorage.getItem('profile_age') || '--';
    const savedBlood = localStorage.getItem('profile_blood') || '--';
    const savedWeight = localStorage.getItem('profile_weight') || '--';

    return `
    <!-- Personal Info -->
    <section style="margin-bottom:var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
        <h3 class="section-title">${t('personalInfo')}</h3>
        <button id="edit-personal-info-btn" class="btn-text" style="color:var(--primary); font-weight:700; font-size:0.875rem;">
          <span class="material-symbols-outlined" style="font-size:1.125rem;">edit</span> Edit
        </button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:var(--space-3);">
        <div class="card" style="text-align:center; padding:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--tertiary); margin-bottom:var(--space-2);">cake</span>
          <p style="font-size:0.75rem; color:var(--on-surface-variant); text-transform:uppercase;">${t('age')}</p>
          <p id="display-age" style="font-weight:700;">${savedAge}</p>
        </div>
        <div class="card" style="text-align:center; padding:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--error); margin-bottom:var(--space-2);">bloodtype</span>
          <p style="font-size:0.75rem; color:var(--on-surface-variant); text-transform:uppercase;">${t('bloodType')}</p>
          <p id="display-blood" style="font-weight:700;">${savedBlood}</p>
        </div>
        <div class="card" style="text-align:center; padding:var(--space-4);">
          <span class="material-symbols-outlined" style="color:var(--primary); margin-bottom:var(--space-2);">scale</span>
          <p style="font-size:0.75rem; color:var(--on-surface-variant); text-transform:uppercase;">${t('weightTitle')}</p>
          <p id="display-weight" style="font-weight:700;">${savedWeight}</p>
        </div>
      </div>

      <!-- Edit Modal (hidden) -->
      <div id="personal-info-modal" style="display:none; margin-top:var(--space-4);">
        <div class="card" style="padding:var(--space-4); border:2px solid var(--primary);">
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:var(--space-3);">
            <div>
              <label style="font-size:0.75rem; font-weight:600; color:var(--on-surface-variant);">Age</label>
              <input type="number" id="input-age" class="form-input" placeholder="e.g. 25" value="${savedAge !== '--' ? savedAge : ''}" style="text-align:center;" />
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:600; color:var(--on-surface-variant);">Blood Type</label>
              <select id="input-blood" class="form-input" style="text-align:center;">
                <option value="">Select</option>
                <option value="A+" ${savedBlood === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${savedBlood === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${savedBlood === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${savedBlood === 'B-' ? 'selected' : ''}>B-</option>
                <option value="O+" ${savedBlood === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${savedBlood === 'O-' ? 'selected' : ''}>O-</option>
                <option value="AB+" ${savedBlood === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${savedBlood === 'AB-' ? 'selected' : ''}>AB-</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:600; color:var(--on-surface-variant);">Weight (kg)</label>
              <input type="number" id="input-weight" class="form-input" placeholder="e.g. 65" value="${savedWeight !== '--' ? savedWeight : ''}" style="text-align:center;" />
            </div>
          </div>
          <button id="save-personal-info-btn" class="btn-primary" style="width:100%; justify-content:center; margin-top:var(--space-3); padding:var(--space-3);">
            <span class="material-symbols-outlined">save</span> Save
          </button>
        </div>
      </div>
    </section>

    <!-- Emergency Contacts Section -->
    <section style="margin-bottom:var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
        <h3 class="section-title">Emergency & SOS</h3>
        <button class="btn-text" id="add-contact-btn" style="color:var(--primary); font-weight:700; font-size:0.875rem;">
          <span class="material-symbols-outlined" style="font-size:1.125rem;">add_circle</span> Add Contact
        </button>
      </div>
      <div id="contacts-list" style="display:grid; gap:var(--space-3);">
        ${contacts.length === 0 ? `
          <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
            <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">contact_emergency</span>
            <p style="font-size:0.875rem; color:var(--on-surface-variant);">No emergency contacts added yet.</p>
          </div>
        ` : contacts.map(c => `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${c.isSOS ? 'var(--error)' : 'var(--primary)'};">
            <div style="display:flex; align-items:center; gap:var(--space-3);">
              <div class="brand-avatar" style="width:2.5rem; height:2.5rem; background:var(--surface-container-high);">
                <span class="material-symbols-outlined" style="color:var(--primary);">${c.relation.toLowerCase().includes('doc') ? 'medical_services' : 'person'}</span>
              </div>
              <div>
                <h4 style="font-weight:700;">${c.name} ${c.isSOS ? '<span class="chip" style="background:var(--error-container); color:var(--on-error-container); font-size:0.6rem; margin-left:4px;">SOS</span>' : ''}</h4>
                <p style="font-size:0.75rem; color:var(--on-surface-variant);">${c.relation} • ${c.phone}</p>
              </div>
            </div>
            <a href="tel:${c.phone}" class="icon-btn" style="color:var(--primary);">
              <span class="material-symbols-outlined">call</span>
            </a>
          </div>
        `).join('')}
      </div>
    </section>
    `;
  }

  return ''; // Placeholder for other roles
}

function renderAuthScreen(t) {
  return `
    <div class="login-page">
      <div class="login-glass-card">
        <button class="icon-btn" style="position:absolute; top:var(--space-4); right:var(--space-4); color:white;" onclick="window.history.back()">
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="text-align:center; margin-bottom:var(--space-8);">
          <div class="brand-avatar" style="margin:0 auto var(--space-4); width:4rem; height:4rem;">
            <span class="material-symbols-outlined brand-icon" style="font-size:2rem; font-variation-settings: 'FILL' 1; color: var(--primary-fixed);">spa</span>
          </div>
          <h1 id="auth-title" style="font-family:var(--font-headline); font-size:2rem; color:white; margin-bottom:var(--space-2);">Sanjeev AI</h1>
          <p style="color:var(--surface-container-high); font-size:1rem;">Welcome to the future of mindful healing.</p>
        </div>

        <form id="profile-auth-form">
          <div id="name-field-container" style="display:none; margin-bottom:var(--space-6);">
            <label style="display:block; color:white; font-size:0.875rem; font-weight:600; margin-bottom:var(--space-2);">Full Name</label>
            <div class="login-select-wrapper">
              <span class="material-symbols-outlined login-select-icon">badge</span>
              <input type="text" id="name-input" class="login-input" placeholder="Your name" />
            </div>
          </div>

          <div style="margin-bottom:var(--space-6);">
            <label style="display:block; color:white; font-size:0.875rem; font-weight:600; margin-bottom:var(--space-2);">Select Your Role</label>
            <div class="login-select-wrapper">
              <span class="material-symbols-outlined login-select-icon">person</span>
              <select id="role-select" class="login-input">
                <option value="patient">Patient</option>
                <option value="caregiver">Caregiver</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:var(--space-6);">
            <label style="display:block; color:white; font-size:0.875rem; font-weight:600; margin-bottom:var(--space-2);">Email Address</label>
            <div class="login-select-wrapper">
              <span class="material-symbols-outlined login-select-icon">mail</span>
              <input type="email" id="email-input" class="login-input" placeholder="Enter your email" required />
            </div>
          </div>

          <div style="margin-bottom:var(--space-8);">
            <label style="display:block; color:white; font-size:0.875rem; font-weight:600; margin-bottom:var(--space-2);">Password</label>
            <div class="login-select-wrapper">
              <span class="material-symbols-outlined login-select-icon">lock</span>
              <input type="password" id="password-input" class="login-input" placeholder="Enter password" required />
            </div>
          </div>

          <button id="auth-submit" type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:18px; font-size:1.125rem; background:white; color:var(--primary); font-weight:700; border-radius:var(--radius-xl);">
            <span class="btn-text">Enter Hub</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>
        
        <div style="margin: var(--space-4) 0; display:flex; align-items:center; color:white; font-size:0.875rem;">
          <div style="flex:1; height:1px; background:rgba(255,255,255,0.2);"></div>
          <span style="padding:0 var(--space-2);">or</span>
          <div style="flex:1; height:1px; background:rgba(255,255,255,0.2);"></div>
        </div>

        <button type="button" id="supabase-google-btn" class="btn-secondary" style="width:100%; justify-content:center; padding:14px; font-size:1rem; border-radius:var(--radius-xl); margin-bottom:var(--space-6);">
          <img src="https://developers.google.com/identity/images/g-logo.png" style="width:20px; height:20px; margin-right:8px;" />
          Continue with Google
        </button>
        
        <div style="text-align:center; margin-top:var(--space-6);">
          <a href="#" id="auth-mode-btn" data-mode="login" style="color:white; font-size:0.875rem; text-decoration:none;">
            New here? <b style="color:var(--primary-fixed)">Sign up for free</b>
          </a>
        </div>
      </div>
    </div>

    <style>
      .login-page {
        min-height: 100vh;
        background: linear-gradient(135deg, var(--primary) 0%, #011E13 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-4);
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 1000;
        overflow-y: auto;
      }
      .login-glass-card {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-2xl);
        padding: var(--space-8);
        width: 100%;
        max-width: 400px;
        box-shadow: 0 24px 48px rgba(0,0,0,0.4);
      }
      .login-input {
        width: 100%;
        background: rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.1);
        color: white;
        padding: 14px 14px 14px 44px;
        border-radius: var(--radius-lg);
        font-family: var(--font-body);
        font-size: 1rem;
        outline: none;
        transition: all 0.2s ease;
        appearance: none;
      }
      .login-input:focus {
        border-color: var(--primary-fixed);
        background: rgba(0,0,0,0.4);
      }
      .login-input::placeholder {
        color: rgba(255,255,255,0.5);
      }
      .login-select-wrapper {
        position: relative;
      }
      .login-select-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255,255,255,0.6);
        pointer-events: none;
      }
      .login-input option {
        background: var(--surface);
        color: var(--on-surface);
      }
    </style>
  `;
}

// ── Profile Init (called after render) ──
export function initProfile(navigate) {
  // ── Name Edit ──
  const editNameBtn = document.getElementById('edit-profile-header-btn');
  const nameEditForm = document.getElementById('name-edit-form');
  const cancelNameBtn = document.getElementById('cancel-profile-name-btn');
  const saveNameBtn = document.getElementById('save-profile-name-btn');

  if (editNameBtn && nameEditForm) {
    editNameBtn.addEventListener('click', () => {
      const isHidden = nameEditForm.style.display === 'none' || !nameEditForm.style.display;
      nameEditForm.style.display = isHidden ? 'block' : 'none';
      if (isHidden) document.getElementById('input-profile-name')?.focus();
    });
  }
  cancelNameBtn?.addEventListener('click', () => {
    if (nameEditForm) nameEditForm.style.display = 'none';
  });
  saveNameBtn?.addEventListener('click', () => {
    const newName = document.getElementById('input-profile-name')?.value?.trim();
    if (!newName) return window.showToast('Please enter a name');
    localStorage.setItem('profile_name', newName);
    window.__currentUserName = newName;
    const displayEl = document.getElementById('profile-display-name');
    if (displayEl) displayEl.textContent = newName;
    const avatarEl = document.getElementById('profile-avatar-img');
    if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(newName)}&backgroundColor=e6f0eb`;
    if (nameEditForm) nameEditForm.style.display = 'none';
    window.showToast('Name updated!');
  });

  // ── Personal Info Edit ──
  const editInfoBtn = document.getElementById('edit-personal-info-btn');
  const infoModal = document.getElementById('personal-info-modal');
  editInfoBtn?.addEventListener('click', () => {
    if (infoModal) infoModal.style.display = infoModal.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('save-personal-info-btn')?.addEventListener('click', () => {
    const age = document.getElementById('input-age')?.value;
    const blood = document.getElementById('input-blood')?.value;
    const weight = document.getElementById('input-weight')?.value;
    if (age) { localStorage.setItem('profile_age', age); const el = document.getElementById('display-age'); if (el) el.textContent = age; }
    if (blood) { localStorage.setItem('profile_blood', blood); const el = document.getElementById('display-blood'); if (el) el.textContent = blood; }
    if (weight) { localStorage.setItem('profile_weight', weight + ' kg'); const el = document.getElementById('display-weight'); if (el) el.textContent = weight + ' kg'; }
    if (infoModal) infoModal.style.display = 'none';
    window.showToast('Personal info saved!');
  });

  // ── Logout ──
  document.getElementById('profile-logout-btn')?.addEventListener('click', async () => {
    try {
      await auth.signOut();
      window.showToast('Logged out safely');
    } catch (e) {
      window.showToast('Logout error', true);
    }
  });
}
