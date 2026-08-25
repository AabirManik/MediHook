export function renderLogin(navigate) {
  const t = window.__t;
  
  // We can add translation keys later, for now we can hardcode or use simple strings
  return `
  <div class="login-page">
    <div class="login-glass-card">
      <div style="text-align:center; margin-bottom:var(--space-8);">
        <div class="brand-avatar" style="margin:0 auto var(--space-4); width:4rem; height:4rem;">
          <span class="material-symbols-outlined brand-icon" style="font-size:2rem; font-variation-settings: 'FILL' 1; color: var(--primary-fixed);">spa</span>
        </div>
        <h1 style="font-family:var(--font-headline); font-size:2rem; color:white; margin-bottom:var(--space-2);">Sanjeev AI</h1>
        <p style="color:var(--surface-container-high); font-size:1rem;">Welcome to the future of mindful healing.</p>
      </div>

      <form id="login-form">
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

        <div style="margin-bottom:var(--space-8);">
          <label style="display:block; color:white; font-size:0.875rem; font-weight:600; margin-bottom:var(--space-2);">Access Passkey</label>
          <div class="login-select-wrapper">
            <span class="material-symbols-outlined login-select-icon">lock</span>
            <input type="password" id="passkey-input" class="login-input" placeholder="Enter passkey" value="demo123" />
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:18px; font-size:1.125rem; background:white; color:var(--primary); font-weight:700; border-radius:var(--radius-xl);">
          Enter Hub
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </form>
      
      <div style="text-align:center; margin-top:var(--space-6);">
        <p style="font-size:0.75rem; color:var(--surface-container-high);">HIPAA-Ready Secure Login</p>
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
    }
    .login-glass-card {
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
