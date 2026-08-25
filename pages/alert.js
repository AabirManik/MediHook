// Alert Screen
export function renderAlert(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter" style="max-width: 36rem; margin: 0 auto;">
    <!-- Header -->
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title" style="font-size:1.875rem;">${t('alertTitle')}</h2>
      <p style="color:var(--on-surface-variant); font-weight:500;">${t('alertSub')}</p>
    </header>

    <!-- Primary Warning Card -->
    <div class="alert-warning-card">
      <div class="glow"></div>
      <div class="alert-header">
        <div class="alert-icon-wrap">
          <span class="material-symbols-outlined">warning</span>
        </div>
        <div>
          <h3>${t('dangerTitle')}</h3>
          <p class="severity">${t('sevCritical')}</p>
        </div>
      </div>
      <div class="alert-body">
        <p>${t('dangerDesc')}</p>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="alert-details-grid">
      <div class="alert-detail-card">
        <span class="material-symbols-outlined">cardiology</span>
        <h4>${t('cardiacImpact')}</h4>
        <p>${t('cardiacDesc')}</p>
      </div>
      <div class="alert-detail-card">
        <span class="material-symbols-outlined">history</span>
        <h4>${t('detectTime')}</h4>
        <p>${t('detectDesc')}</p>
      </div>
    </div>

    <!-- Immediate Actions -->
    <div class="alert-actions">
      <button class="btn-primary" style="width:100%; padding: var(--space-5); font-size:1.125rem; font-weight:700; border-radius: var(--radius-xl); justify-content:center;">
        <span class="material-symbols-outlined">call</span>
        ${t('notifyDoctor')}
      </button>
      <button class="btn-error">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">emergency_home</span>
        ${t('emergencySos')}
      </button>
    </div>

    <!-- Documentation -->
    <div class="alert-doc-card">
      <div class="alert-doc-icon">
        <span class="material-symbols-outlined">picture_as_pdf</span>
      </div>
      <h4>${t('clinicalDoc')}</h4>
      <p>${t('docDesc')}</p>
      <button class="btn-tertiary-warm" style="background: var(--tertiary); color: var(--on-tertiary);">
        ${t('genSafetyReport')}
      </button>
    </div>
  </div>
  `;
}
