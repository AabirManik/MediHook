// Mood Tracker
export function renderMood(navigate) {
  const t = window.__t;
  const days = t('days');

  const moods = [
    { icon: 'sentiment_very_dissatisfied', label: t('moodLow') },
    { icon: 'sentiment_dissatisfied', label: t('moodUneasy') },
    { icon: 'sentiment_neutral', label: t('moodNeutral') },
    { icon: 'sentiment_satisfied', label: t('moodCalm'), selected: true },
    { icon: 'sentiment_very_satisfied', label: t('moodHigh') },
  ];

  const emojiItems = moods.map((m, i) => `
    <button class="mood-emoji-btn${m.selected ? ' selected' : ''}" data-mood="${i}">
      <div class="mood-emoji-circle">
        <span class="material-symbols-outlined">${m.icon}</span>
      </div>
      <span class="mood-emoji-label">${m.label}</span>
    </button>
  `).join('');

  return `
  <div class="page-enter">
    <!-- Hero -->
    <section class="mood-hero">
      <h2 class="page-title" style="font-size:2.75rem;">${t('feelToday')}</h2>
      <div class="mood-emoji-row">${emojiItems}</div>
    </section>

    <!-- Anonymous Mood Mode -->
    <section style="margin-bottom:var(--space-10); display:flex; justify-content:center;">
      <div style="background:var(--surface-container); border-radius:var(--radius-full); padding:var(--space-2) var(--space-4); display:inline-flex; align-items:center; gap:var(--space-3);">
        <span class="material-symbols-outlined" style="color:var(--on-surface-variant); font-size:1.25rem;">incognito</span>
        <span style="font-size:0.875rem; color:var(--on-surface-variant); font-weight:600;">${t('anonMode')}</span>
        <label style="position:relative; display:inline-block; width:2.5rem; height:1.25rem; background:var(--outline-variant); border-radius:var(--radius-full); cursor:pointer;">
          <span style="position:absolute; top:2px; left:2px; width:1rem; height:1rem; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
        </label>
      </div>
    </section>

    <!-- Notes & Save -->
    <section style="padding: 0 var(--space-4); margin-bottom: var(--space-8); display:flex; flex-direction:column; gap: var(--space-4); align-items:center;">
      <textarea id="mood-notes" placeholder="Type any side effects or notes for today..." style="width:100%; max-width:400px; height:80px; padding:12px; border-radius:8px; border:1px solid var(--outline-variant); resize:none; font-family:inherit;"></textarea>
      <button id="save-mood-btn" class="btn-primary" style="width:100%; max-width:400px; justify-content:center; padding:12px;">Save Daily Mood</button>
      <div id="mood-feedback" style="text-align:center; color:var(--primary); font-weight:600; font-size:0.875rem;"></div>
    </section>

    <!-- Graph -->
    <section class="mood-graph-section">
      <svg class="deco-petal deco-petal--top" width="200" height="200" viewBox="0 0 100 100">
        <path d="M50 0C50 0 85 40 85 65C85 84.3 69.3 100 50 100C30.7 100 15 84.3 15 65C15 40 50 0 50 0Z" fill="currentColor" style="color: var(--primary);"/>
      </svg>
      <svg class="deco-petal deco-petal--bottom" width="200" height="200" viewBox="0 0 100 100">
        <path d="M50 0C50 0 85 40 85 65C85 84.3 69.3 100 50 100C30.7 100 15 84.3 15 65C15 40 50 0 50 0Z" fill="currentColor" style="color: var(--primary);"/>
      </svg>

      <div class="mood-graph-header">
        <div>
          <h3 class="section-title">${t('weeklyTrend')}</h3>
          <p style="color:var(--on-surface-variant); font-size:0.875rem;">${t('trendDesc')}</p>
        </div>
        <div class="mood-status-badge">
          <span class="dot"></span>
          <span class="label-caps">${t('currentHarmonic')}</span>
        </div>
      </div>

      <svg class="mood-graph-svg" viewBox="0 0 400 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#735C00" />
            <stop offset="100%" stop-color="#1B4332" />
          </linearGradient>
          <linearGradient id="gradient-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#C1ECD4" />
            <stop offset="100%" stop-color="#FCFAEE" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="120" x2="400" y2="120" stroke="#C1C8C2" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
        <line x1="0" y1="80" x2="400" y2="80" stroke="#C1C8C2" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
        <line x1="0" y1="40" x2="400" y2="40" stroke="#C1C8C2" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
        <path d="M0,110 C40,110 60,40 100,40 C140,40 160,130 200,130 C240,130 260,70 300,70 C340,70 360,90 400,90 V150 H0 Z" fill="url(#gradient-fill)" opacity="0.2"/>
        <path d="M0,110 C40,110 60,40 100,40 C140,40 160,130 200,130 C240,130 260,70 300,70 C340,70 360,90 400,90" fill="none" stroke="url(#gradient-line)" stroke-width="4" stroke-linecap="round"/>
        <circle cx="100" cy="40" r="4" fill="#735C00"/>
        <circle cx="200" cy="130" r="4" fill="#735C00"/>
        <circle cx="300" cy="70" r="4" fill="#1B4332"/>
      </svg>

      <div class="mood-days">
        ${days.map(d => `<span>${d}</span>`).join('')}
      </div>
    </section>

    <!-- Insights -->
    <section class="mood-insights-grid">
      <div class="mood-insight-card">
        <div class="mood-insight-icon mood-insight-icon--eco">
          <span class="material-symbols-outlined">eco</span>
        </div>
        <div>
          <h4>${t('holisticInsight')}</h4>
          <p>${t('holisticDesc')}</p>
        </div>
      </div>
      <div class="mood-insight-card">
        <div class="mood-insight-icon mood-insight-icon--sleep">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bedtime</span>
        </div>
        <div>
          <h4>${t('sleepSynergy')}</h4>
          <p>${t('sleepDesc')}</p>
        </div>
      </div>
    </section>
  </div>
  `;
}
