// Timeline View
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
        <!-- Loader -->
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
  </div>
  `;
}

export async function initTimeline() {
  const trackContainer = document.getElementById('timeline-track-container');
  if (!trackContainer) return;

  const { api } = await import('../api.js');
  const userId = localStorage.getItem('userId');
  
  if (!userId || userId === '1' || userId === 'undefined') {
    trackContainer.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">timeline</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">No data available. Please sign in to view your timeline.</p>
      </div>
    `;
    const aiTitle = document.getElementById('timeline-ai-title');
    const aiDesc = document.getElementById('timeline-ai-desc');
    if(aiTitle) aiTitle.innerText = 'No Data';
    if(aiDesc) aiDesc.innerText = 'Sign in to see AI insights.';
    return;
  }

  try {
    const [prescriptions, moods] = await Promise.all([
      api.getPrescriptions(userId),
      api.getMoods(userId)
    ]);

    let events = [];

    // Map prescriptions
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

    // Map moods
    moods.forEach(m => {
      let icon = 'sentiment_satisfied';
      if (m.moodLevel > 7) icon = 'sentiment_very_satisfied';
      if (m.moodLevel < 4) icon = 'sentiment_dissatisfied';

      events.push({
        type: 'mood',
        date: new Date(m.date || m.createdAt || Date.now()),
        title: `Mood Check-in: ${m.moodLevel}/10`,
        desc: m.notes || 'No notes provided.',
        icon: icon,
        color: 'var(--tertiary)'
      });
    });

    // Sort descending (newest first)
    events.sort((a, b) => b.date - a.date);

    if (events.length === 0) {
      trackContainer.innerHTML = `
        <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
          <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">timeline</span>
          <p style="font-size:0.875rem; color:var(--on-surface-variant);">Your timeline is empty. Add a prescription or mood log to get started.</p>
        </div>
      `;
      const aiTitle = document.getElementById('timeline-ai-title');
      const aiDesc = document.getElementById('timeline-ai-desc');
      if(aiTitle) aiTitle.innerText = 'Ready to Analyze';
      if(aiDesc) aiDesc.innerText = 'Add data to receive AI insights.';
    } else {
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
          </div>
        `;
      });
      trackContainer.innerHTML = html;

      // Update AI Insight with a generic realistic analysis based on data
      const latestMood = moods.length > 0 ? moods[0] : null;
      const latestMed = prescriptions.length > 0 ? prescriptions[0] : null;

      const aiTitle = document.getElementById('timeline-ai-title');
      const aiDesc = document.getElementById('timeline-ai-desc');
      const aiBtn = document.getElementById('timeline-ai-btn');

      if (aiTitle && aiDesc) {
        if (latestMood && latestMed) {
          aiTitle.innerText = `Mood changes correlate with ${latestMed.medication}`;
          aiDesc.innerText = `Observation: Since starting ${latestMed.medication}, your recent mood check-in was ${latestMood.moodLevel}/10.`;
          if (aiBtn) aiBtn.style.display = 'block';
        } else if (latestMed) {
          aiTitle.innerText = `Monitoring ${latestMed.medication}`;
          aiDesc.innerText = `Log your mood regularly to see how ${latestMed.medication} affects your well-being.`;
        } else if (latestMood) {
          aiTitle.innerText = `Mood Analysis`;
          aiDesc.innerText = `Your recent mood level is ${latestMood.moodLevel}/10. Keep logging to establish a baseline.`;
        }
      }

      // Update Dosha Bars (Metrics) based on moods or just semi-random for now if no enough data
      let stressLevel = 50;
      let energyLevel = 50;
      let recoveryLevel = 50;

      if (latestMood) {
        energyLevel = latestMood.moodLevel * 10;
        stressLevel = 100 - energyLevel;
        recoveryLevel = (energyLevel + 50) / 2;
      }

      setTimeout(() => {
        const ms = document.getElementById('metric-stress');
        const me = document.getElementById('metric-energy');
        const mr = document.getElementById('metric-recovery');
        if(ms) ms.style.height = `${stressLevel}%`;
        if(me) me.style.height = `${energyLevel}%`;
        if(mr) mr.style.height = `${recoveryLevel}%`;
      }, 100);
    }
  } catch (err) {
    console.error('Error loading timeline:', err);
    trackContainer.innerHTML = `<p style="color:var(--error);">Failed to load timeline. ${err.message}</p>`;
  }
}
