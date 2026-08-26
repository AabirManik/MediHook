let _timelineAbort = null;

function showAiLoading() {
  const title = document.getElementById('timeline-ai-title');
  const desc = document.getElementById('timeline-ai-desc');
  const btn = document.getElementById('timeline-ai-btn');
  if (title) title.innerHTML = '<span class="material-symbols-outlined timeline-loading-icon">progress_activity</span> Analyzing your health data...';
  if (desc) desc.innerText = 'Our AI is reviewing your medications, mood patterns, and identifying correlations.';
  if (btn) btn.style.display = 'none';
}

function showAiError() {
  const title = document.getElementById('timeline-ai-title');
  const desc = document.getElementById('timeline-ai-desc');
  if (title) title.innerText = 'Analysis Unavailable';
  if (desc) desc.innerText = 'Could not complete AI analysis. Showing basic metrics based on your data.';
}

function renderTimelineEvents(events, container) {
  if (events.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">timeline</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">Your timeline is empty. Add a prescription or mood log to get started.</p>
      </div>`;
    return;
  }

  let html = '<div class="timeline-line"></div>';
  events.forEach(ev => {
    const dateStr = ev.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    html += `
      <div class="timeline-item">
        <div class="timeline-dot" style="background-color:${ev.color}"></div>
        <div class="timeline-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="timeline-date">${dateStr}</span>
              <h3>${ev.title}</h3>
              <p>${ev.desc}</p>
            </div>
            <span class="material-symbols-outlined" style="color:${ev.color}; font-size: 1.5rem; flex-shrink:0;">${ev.icon}</span>
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function updateMetrics(stress, energy, recovery) {
  setTimeout(() => {
    const ms = document.getElementById('metric-stress');
    const me = document.getElementById('metric-energy');
    const mr = document.getElementById('metric-recovery');
    if (ms) ms.style.height = `${stress}%`;
    if (me) me.style.height = `${energy}%`;
    if (mr) mr.style.height = `${recovery}%`;
  }, 100);
}

function calculateBasicMetrics(moods) {
  if (moods.length === 0) return { stress: 50, energy: 50, recovery: 50 };
  const avg = moods.reduce((s, m) => s + (m.moodlevel || 3), 0) / moods.length;
  const energy = Math.round(avg * 20);
  const stress = 100 - energy;
  const recovery = Math.round((energy + 50) / 2);
  return { stress: Math.min(100, Math.max(0, stress)), energy: Math.min(100, Math.max(0, energy)), recovery: Math.min(100, Math.max(0, recovery)) };
}

function renderReportSection(analysis) {
  const section = document.getElementById('timeline-report-section');
  if (!section || !analysis) return;

  let html = '';

  if (analysis.correlations && analysis.correlations.length > 0) {
    html += '<h4 style="margin-bottom:var(--space-4);">Medication-Mood Correlations</h4>';
    html += '<div class="timeline-correlations">';
    analysis.correlations.forEach(c => {
      const colorMap = { positive: 'var(--tertiary)', negative: 'var(--error)', neutral: 'var(--outline)', unclear: 'var(--on-surface-variant)' };
      const iconMap = { positive: 'trending_up', negative: 'trending_down', neutral: 'remove', unclear: 'help' };
      html += `
        <div class="timeline-correlation-item">
          <div class="timeline-corr-header">
            <span class="material-symbols-outlined" style="color:${colorMap[c.moodChange] || 'var(--outline)'}; font-size:1.25rem;">${iconMap[c.moodChange] || 'help'}</span>
            <strong>${c.drug}</strong>
            <span class="chip" style="background:${colorMap[c.moodChange] || 'var(--outline)'}22; color:${colorMap[c.moodChange] || 'var(--on-surface-variant)'}; font-size:0.7rem;">${c.moodChange}</span>
            <span class="chip" style="background:var(--surface-container); font-size:0.7rem;">${c.confidence} confidence</span>
          </div>
          <p style="color:var(--on-surface-variant); font-size:0.85rem; margin-top:var(--space-2);">${c.observation}</p>
        </div>`;
    });
    html += '</div>';
  }

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    html += '<h4 style="margin-top:var(--space-6); margin-bottom:var(--space-4);">Recommendations</h4>';
    html += '<div class="timeline-recommendations">';
    analysis.recommendations.forEach(r => {
      html += `
        <div class="timeline-rec-item">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.1rem;">lightbulb</span>
          <span>${r}</span>
        </div>`;
    });
    html += '</div>';
  }

  section.innerHTML = html;
}

export function renderTimeline(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-12);">
      <h2 class="page-title">${t('tlTitle')}</h2>
      <p class="page-subtitle">${t('tlSub')}</p>
    </header>

    <div class="timeline-layout">
      <!-- Timeline Track -->
      <div class="timeline-track" id="timeline-track-container">
        <div style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
          <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
          <p style="margin-top: 1rem;">Loading your health journey...</p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside>
        <div style="position: sticky; top: 6rem; display: flex; flex-direction: column; gap: var(--space-6);">
          <!-- AI Insight -->
          <div class="ai-insight-card">
            <div class="ai-insight-deco">
              <span class="material-symbols-outlined">psychology</span>
            </div>
            <div class="ai-insight-inner">
              <div class="ai-insight-badge">
                <span class="material-symbols-outlined">auto_awesome</span>
                <span>${t('tlAiAnalysis')}</span>
              </div>
              <h4 id="timeline-ai-title">Analyzing Correlations...</h4>
              <div class="ai-insight-observation">
                <p id="timeline-ai-desc">Please wait while our AI engine reviews your recent medication and mood logs.</p>
              </div>
              <button class="ai-insight-btn" style="display:none;" id="timeline-ai-btn">${t('tlViewReport')}</button>
              <div class="timeline-report-section" id="timeline-report-section" style="display:none;"></div>
            </div>
          </div>

          <!-- Health Metrics -->
          <div class="dosha-widget">
            <span class="label-caps">${t('tlMetricsTitle')}</span>
            <div class="dosha-bars">
              <div class="dosha-bar">
                <div class="dosha-bar-fill" id="metric-stress" style="height:0%; background:var(--primary); transition: height 1s ease;"></div>
                <span class="dosha-bar-label">${t('tlStress')}</span>
              </div>
              <div class="dosha-bar">
                <div class="dosha-bar-fill" id="metric-energy" style="height:0%; background:var(--tertiary); transition: height 1s ease;"></div>
                <span class="dosha-bar-label">${t('tlEnergy')}</span>
              </div>
              <div class="dosha-bar">
                <div class="dosha-bar-fill" id="metric-recovery" style="height:0%; background:var(--primary-container); transition: height 1s ease;"></div>
                <span class="dosha-bar-label">${t('tlRecovery')}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>`;
}

export async function initTimeline() {
  const trackContainer = document.getElementById('timeline-track-container');
  if (!trackContainer) return;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  if (!userId || userId === '1' || userId === 'undefined') {
    trackContainer.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">timeline</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">No data available. Please sign in to view your timeline.</p>
      </div>`;
    const aiTitle = document.getElementById('timeline-ai-title');
    const aiDesc = document.getElementById('timeline-ai-desc');
    if (aiTitle) aiTitle.innerText = 'No Data';
    if (aiDesc) aiDesc.innerText = 'Sign in to see AI insights.';
    return;
  }

  _timelineAbort = new AbortController();
  const signal = _timelineAbort.signal;

  try {
    const [prescriptions, moods] = await Promise.all([
      api.getPrescriptions(userId),
      api.getMoods(userId)
    ]);

    if (signal.aborted) return;

    let events = [];

    prescriptions.forEach(p => {
      events.push({
        type: 'medication',
        date: new Date(p.date || p.dateScanned || p.createdAt || Date.now()),
        title: `Started ${p.medication}`,
        desc: `Dosage: ${p.dosage || 'N/A'}. ${p.instructions || ''}`,
        icon: 'pill',
        color: 'var(--primary)'
      });
    });

    moods.forEach(m => {
      let icon = 'sentiment_satisfied';
      if (m.moodlevel >= 4) icon = 'sentiment_very_satisfied';
      if (m.moodlevel <= 2) icon = 'sentiment_dissatisfied';
      events.push({
        type: 'mood',
        date: new Date(m.date || m.createdAt || Date.now()),
        title: `Mood Check-in: ${m.moodlevel}/5`,
        desc: m.notes || 'No notes provided.',
        icon,
        color: 'var(--tertiary)'
      });
    });

    events.sort((a, b) => b.date - a.date);
    renderTimelineEvents(events, trackContainer);

    if (signal.aborted) return;

    const basicMetrics = calculateBasicMetrics(moods);
    updateMetrics(basicMetrics.stress, basicMetrics.energy, basicMetrics.recovery);

    if (events.length === 0) {
      const aiTitle = document.getElementById('timeline-ai-title');
      const aiDesc = document.getElementById('timeline-ai-desc');
      if (aiTitle) aiTitle.innerText = 'Ready to Analyze';
      if (aiDesc) aiDesc.innerText = 'Add data to receive AI insights.';
      return;
    }

    showAiLoading();

    const patientContext = {
      kidneyIssue: !!window.__kidneyIssue,
      liverIssue: !!window.__liverIssue
    };

    let analysis = null;
    try {
      analysis = await api.analyzeTimeline(prescriptions, moods, patientContext);
    } catch (e) {
      console.warn('Timeline AI analysis failed, using basic metrics:', e);
      showAiError();
    }

    if (signal.aborted) return;

    if (analysis) {
      const aiTitle = document.getElementById('timeline-ai-title');
      const aiDesc = document.getElementById('timeline-ai-desc');
      const aiBtn = document.getElementById('timeline-ai-btn');
      const reportSection = document.getElementById('timeline-report-section');

      if (aiTitle) aiTitle.innerText = analysis.title || 'Health Analysis';
      if (aiDesc) aiDesc.innerText = analysis.summary || 'Analysis complete.';

      if (analysis.stress !== undefined || analysis.energy !== undefined || analysis.recovery !== undefined) {
        updateMetrics(
          analysis.stress ?? basicMetrics.stress,
          analysis.energy ?? basicMetrics.energy,
          analysis.recovery ?? basicMetrics.recovery
        );
      }

      const hasContent = (analysis.correlations && analysis.correlations.length > 0) ||
                          (analysis.recommendations && analysis.recommendations.length > 0);
      if (aiBtn && hasContent) {
        aiBtn.style.display = 'block';
        aiBtn.addEventListener('click', () => {
          const isHidden = reportSection.style.display === 'none';
          reportSection.style.display = isHidden ? 'block' : 'none';
          aiBtn.textContent = isHidden ? 'Hide Report' : 'View Full Report';
          if (isHidden) renderReportSection(analysis);
        }, { signal });
      }
    }
  } catch (err) {
    console.error('Error loading timeline:', err);
    trackContainer.innerHTML = `<p style="color:var(--error);">Failed to load timeline. ${err.message}</p>`;
    showAiError();
  }
}

export function cleanupTimeline() {
  if (_timelineAbort) {
    _timelineAbort.abort();
    _timelineAbort = null;
  }
}
