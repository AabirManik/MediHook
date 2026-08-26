// Mood Tracker — Dynamic, Database-Connected
let _moodAbort = null;
let _moodListeners = [];

export function cleanupMood() {
  if (_moodAbort) { _moodAbort.abort(); _moodAbort = null; }
  for (const { el, event, handler, opts } of _moodListeners) {
    el.removeEventListener(event, handler, opts);
  }
  _moodListeners = [];
}

function addListener(el, event, handler, opts) {
  if (!el) return;
  el.addEventListener(event, handler, opts);
  _moodListeners.push({ el, event, handler, opts });
}

export function renderMood(navigate) {
  const t = window.__t;
  const days = t('days');

  const moods = [
    { icon: 'sentiment_very_dissatisfied', label: t('moodLow') },
    { icon: 'sentiment_dissatisfied', label: t('moodUneasy') },
    { icon: 'sentiment_neutral', label: t('moodNeutral') },
    { icon: 'sentiment_satisfied', label: t('moodCalm') },
    { icon: 'sentiment_very_satisfied', label: t('moodHigh') },
  ];

  const emojiItems = moods.map((m, i) => `
    <button class="mood-emoji-btn" data-mood="${i}">
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

    <!-- Notes & Save -->
    <section style="padding: 0 var(--space-4); margin-bottom: var(--space-8); display:flex; flex-direction:column; gap: var(--space-4); align-items:center;">
      <textarea id="mood-notes" class="mood-textarea" placeholder="Type any side effects or notes for today..."></textarea>
      <button id="save-mood-btn" class="btn-primary mood-save-btn">
        <span class="material-symbols-outlined" style="font-size:1.1rem;">save</span> Save Daily Mood
      </button>
      <div id="mood-feedback" class="mood-feedback"></div>
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
        <div class="mood-status-badge" id="mood-status-badge">
          <span class="dot"></span>
          <span class="label-caps" id="mood-status-text">${t('currentHarmonic')}</span>
        </div>
      </div>

      <div id="mood-graph-container" style="position:relative; width:100%; height:220px;">
        <canvas id="mood-graph-canvas" class="mood-graph-canvas"></canvas>
        <div id="mood-graph-empty" class="mood-graph-empty" style="display:none;">
          <span class="material-symbols-outlined" style="font-size:3rem; color:var(--outline);">mood</span>
          <h4>${t('noMoodData') || 'No mood data yet'}</h4>
          <p>${t('noMoodDesc') || 'Log your first mood above to see your trend'}</p>
        </div>
      </div>

      <div class="mood-days" id="mood-days-labels">
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
          <p id="mood-holistic-desc">${t('holisticDesc')}</p>
        </div>
      </div>
      <div class="mood-insight-card">
        <div class="mood-insight-icon mood-insight-icon--sleep">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bedtime</span>
        </div>
        <div>
          <h4>${t('sleepSynergy')}</h4>
          <p id="mood-sleep-desc">${t('sleepDesc')}</p>
        </div>
      </div>
    </section>
  </div>
  `;
}

export async function initMood() {
  if (_moodAbort) _moodAbort.abort();
  _moodAbort = new AbortController();
  const signal = _moodAbort.signal;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  let currentMoodLevel = 3; // Default: Calm
  let allMoods = [];

  // --- Emoji selection ---
  const emojiBtns = document.querySelectorAll('.mood-emoji-btn');
  // Select the 4th button (index 3 = Calm) by default
  if (emojiBtns[3]) emojiBtns[3].classList.add('selected');

  emojiBtns.forEach((btn) => {
    addListener(btn, 'click', () => {
      emojiBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentMoodLevel = parseInt(btn.dataset.mood) + 1;
    }, { signal });
  });

  // --- Save mood ---
  const saveBtn = document.getElementById('save-mood-btn');
  const feedback = document.getElementById('mood-feedback');

  addListener(saveBtn, 'click', async () => {
    const notes = document.getElementById('mood-notes')?.value || '';
    if (!feedback) return;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;">hourglass_top</span> Saving...';

      await api.addMood(userId || '1', {
        moodlevel: currentMoodLevel,
        notes: notes,
        date: new Date().toISOString()
      });

      saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;">check_circle</span> Saved!';
      feedback.textContent = 'Mood saved successfully!';
      feedback.className = 'mood-feedback mood-feedback--success';

      // Re-fetch and re-render graph
      allMoods = await fetchMoods(api, userId);
      drawMoodGraph(allMoods);
      updateInsights(allMoods);

      // Reset save button after delay
      setTimeout(() => {
        saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;">save</span> Save Daily Mood';
        saveBtn.disabled = false;
        feedback.textContent = '';
        feedback.className = 'mood-feedback';
      }, 2500);

    } catch (err) {
      saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;">save</span> Save Daily Mood';
      saveBtn.disabled = false;
      feedback.textContent = 'Error: ' + err.message;
      feedback.className = 'mood-feedback mood-feedback--error';
    }
  }, { signal });

  // --- Fetch moods and draw graph ---
  allMoods = await fetchMoods(api, userId);
  drawMoodGraph(allMoods);
  updateInsights(allMoods);
}

async function fetchMoods(api, userId) {
  try {
    if (!userId || userId === '1' || userId === 'undefined') return [];
    return await api.getMoods(userId);
  } catch (e) {
    console.error('Failed to fetch moods:', e);
    return [];
  }
}

function getWeeklyData(moods) {
  const now = new Date();
  const week = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    // Find moods for this day
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

function drawMoodGraph(moods) {
  const container = document.getElementById('mood-graph-container');
  const canvas = document.getElementById('mood-graph-canvas');
  const emptyState = document.getElementById('mood-graph-empty');
  if (!container || !canvas) return;

  const weekData = getWeeklyData(moods);
  const hasData = weekData.some(d => d.value !== null);

  if (!hasData) {
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = rect.width;
  const h = 220;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Graph dimensions
  const padTop = 25, padBottom = 10, padLeft = 30, padRight = 15;
  const gw = w - padLeft - padRight;
  const gh = h - padTop - padBottom;

  // Y-axis: mood levels 1-5
  const yMin = 1, yMax = 5;
  function yForVal(v) { return padTop + gh - ((v - yMin) / (yMax - yMin)) * gh; }

  // X-axis: 7 days
  const xStep = gw / 6;
  function xForIdx(i) { return padLeft + i * xStep; }

  // --- Draw grid lines ---
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

  // --- Draw Y-axis labels ---
  ctx.fillStyle = '#8B949E';
  ctx.font = '600 10px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let level = 1; level <= 5; level++) {
    ctx.fillText(level.toString(), padLeft - 8, yForVal(level));
  }

  // --- Draw X-axis labels ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  weekData.forEach((d, i) => {
    ctx.fillText(d.label, xForIdx(i), h - padBottom + 6);
  });

  // --- Build points array ---
  const points = weekData.map((d, i) => ({
    x: xForIdx(i),
    y: d.value !== null ? yForVal(d.value) : null,
    value: d.value,
    label: d.label
  }));

  // --- Draw curve fill ---
  const validPoints = points.filter(p => p.y !== null);
  if (validPoints.length >= 2) {
    const tension = 0.3;

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

    // Close path for fill
    ctx.lineTo(validPoints[validPoints.length - 1].x, h - padBottom);
    ctx.lineTo(validPoints[0].x, h - padBottom);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    fillGrad.addColorStop(0, 'rgba(0, 200, 83, 0.15)');
    fillGrad.addColorStop(1, 'rgba(0, 200, 83, 0.01)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // --- Draw curve stroke ---
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

  // --- Draw data points ---
  function moodColor(val) {
    if (val <= 2) return '#FF3D5A';
    if (val === 3) return '#FFD600';
    return '#00C853';
  }

  points.forEach((p) => {
    if (p.y === null) return;

    const color = moodColor(p.value);

    // Glow
    ctx.save();
    ctx.shadowColor = color + '80';
    ctx.shadowBlur = 8;

    // Outer circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Value label above
    ctx.fillStyle = color;
    ctx.font = '700 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(p.value.toString(), p.x, p.y - 12);

    ctx.restore();
  });
}

function updateInsights(moods) {
  if (moods.length === 0) return;

  const avg = moods.reduce((s, m) => s + (m.moodlevel || 3), 0) / moods.length;
  const holisticDesc = document.getElementById('mood-holistic-desc');
  const sleepDesc = document.getElementById('mood-sleep-desc');
  const statusText = document.getElementById('mood-status-text');
  const statusBadge = document.getElementById('mood-status-badge');

  if (avg >= 4) {
    if (holisticDesc) holisticDesc.textContent = 'Your mood has been consistently positive. Keep up the healthy habits!';
    if (statusText) statusText.textContent = 'Current: Harmonic';
    if (statusBadge) statusBadge.style.borderColor = '#00C85340';
  } else if (avg >= 3) {
    if (holisticDesc) holisticDesc.textContent = 'Your energy is stabilizing in a healthy zone. Consider adding a short walk today.';
    if (statusText) statusText.textContent = 'Current: Balanced';
    if (statusBadge) statusBadge.style.borderColor = '#FFD60040';
  } else {
    if (holisticDesc) holisticDesc.textContent = 'Your mood has been lower than usual. Try deep breathing or talking to someone you trust.';
    if (statusText) statusText.textContent = 'Current: Needs Attention';
    if (statusBadge) statusBadge.style.borderColor = '#FF3D5A40';
  }

  // Update sleep insight based on recent notes
  const recentNotes = moods.slice(0, 5).map(m => m.notes).filter(Boolean).join(' ').toLowerCase();
  if (recentNotes.includes('tired') || recentNotes.includes('sleep') || recentNotes.includes('fatigue')) {
    if (sleepDesc) sleepDesc.textContent = 'Your notes mention tiredness. Mood peaks correlate with 8+ hours of rest. Aim for a 10 PM wind-down today.';
  }
}
