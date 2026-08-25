// Weekly Health Report
export function renderReport(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title">${t('repTitle')}</h2>
        <button class="icon-btn" style="background:var(--surface-container);"><span class="material-symbols-outlined">download</span></button>
      </div>
      <p class="page-subtitle">${t('repSub')}</p>
    </header>

    <!-- Report Preview Paper -->
    <div style="background:white; border-radius:var(--radius-xl); padding:var(--space-8); box-shadow:var(--shadow-ambient); margin-bottom:var(--space-8); position:relative; overflow:hidden;">
      <div style="position:absolute; top:0; left:0; right:0; height:8px; background:var(--primary);"></div>
      
      <div style="text-align:center; margin-bottom:var(--space-6); padding-bottom:var(--space-4); border-bottom:1px solid var(--surface-container-high);">
        <h3 style="font-family:var(--font-headline); color:var(--primary); font-size:1.5rem; margin-bottom:var(--space-1);">${t('repSummary')}</h3>
        <p style="font-size:0.75rem; color:var(--outline); text-transform:uppercase; letter-spacing:0.1em;">${t('repWeek')}</p>
      </div>

      <div style="margin-bottom:var(--space-6);">
        <h4 style="font-size:0.875rem; color:var(--on-surface-variant); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:var(--space-3);">${t('medChanges')}</h4>
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:var(--space-2);">
          <li style="display:flex; gap:var(--space-2); font-size:0.875rem;"><span class="material-symbols-outlined" style="font-size:1.125rem; color:var(--tertiary);">add_circle</span> ${t('repAdd')}</li>
          <li style="display:flex; gap:var(--space-2); font-size:0.875rem;"><span class="material-symbols-outlined" style="font-size:1.125rem; color:var(--primary);">check_circle</span> ${t('repComp')}</li>
        </ul>
      </div>

      <div style="margin-bottom:var(--space-6);">
        <h4 style="font-size:0.875rem; color:var(--on-surface-variant); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:var(--space-3);">${t('moodSym')}</h4>
        <p style="font-size:0.875rem; line-height:1.6; color:var(--on-surface);">${t('moodSymDesc')}</p>
      </div>
    </div>

    <!-- Share Action -->
    <button class="btn-primary" style="width:100%; justify-content:center; padding:var(--space-4); font-size:1rem; border-radius:var(--radius-xl);">
      <span class="material-symbols-outlined">share</span>
      ${t('shareWithDr')}
    </button>
  </div>
  `;
}
