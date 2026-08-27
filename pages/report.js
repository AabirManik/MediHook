export function renderReport(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title">${t('repTitle')}</h2>
      <p class="page-subtitle">${t('repSub')}</p>
    </header>

    <div id="report-content">
      <div style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        <p style="margin-top: 1rem;">Generating your weekly report...</p>
      </div>
    </div>
  </div>`;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, fmt)} – ${end.toLocaleDateString(undefined, fmt)}, ${end.getFullYear()}`;
}

function buildMoodChart(moods) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMoods = moods.filter(m => {
      const mDate = (m.date || m.recorded_at || '').split('T')[0];
      return mDate === dateStr;
    });
    const avg = dayMoods.length > 0
      ? dayMoods.reduce((s, m) => s + (m.moodlevel || 3), 0) / dayMoods.length
      : 0;
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    days.push({ label, avg: Math.round(avg * 10) / 10, count: dayMoods.length });
  }
  return days;
}

function getMoodTrend(moods) {
  if (moods.length < 2) return { icon: 'remove', text: 'Insufficient data', color: 'var(--outline)' };
  const recent = moods.slice(0, 3);
  const older = moods.slice(3, 6);
  if (older.length === 0) return { icon: 'remove', text: 'Building baseline', color: 'var(--outline)' };
  const recentAvg = recent.reduce((s, m) => s + (m.moodlevel || 3), 0) / recent.length;
  const olderAvg = older.reduce((s, m) => s + (m.moodlevel || 3), 0) / older.length;
  const diff = recentAvg - olderAvg;
  if (diff > 0.3) return { icon: 'trending_up', text: `Improving (+${diff.toFixed(1)})`, color: 'var(--tertiary)' };
  if (diff < -0.3) return { icon: 'trending_down', text: `Declining (${diff.toFixed(1)})`, color: 'var(--error)' };
  return { icon: 'trending_flat', text: 'Stable', color: 'var(--primary)' };
}

export async function initReport() {
  const container = document.getElementById('report-content');
  if (!container) return;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');

  if (!userId || userId === '1' || userId === 'undefined') {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-6); text-align:center; border:2px dashed var(--outline-variant); background:transparent;">
        <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--outline); margin-bottom:var(--space-2);">description</span>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">Please sign in to view your weekly report.</p>
      </div>`;
    return;
  }

  try {
    const [prescriptions, moods, scoreData, connectedDoctors] = await Promise.all([
      api.getPrescriptions(userId).catch(() => []),
      api.getMoods(userId).catch(() => []),
      api.getSafetyScore(userId).catch(() => null),
      api.getConnectedCaregivers(userId).catch(() => [])
    ]);

    const safetyScore = scoreData?.safety_score ?? 100;
    const doctors = connectedDoctors.filter(c => c.status === 'ACTIVE');

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const recentMoods = moods.filter(m => {
      const d = new Date(m.date || m.recorded_at || Date.now());
      return d >= weekAgo;
    });
    const moodDays = buildMoodChart(moods);
    const moodTrend = getMoodTrend(moods);
    const avgMood = recentMoods.length > 0
      ? (recentMoods.reduce((s, m) => s + (m.moodlevel || 3), 0) / recentMoods.length).toFixed(1)
      : 'N/A';

    const newMedsThisWeek = prescriptions.filter(p => {
      const d = new Date(p.date || p.created_at || Date.now());
      return d >= weekAgo;
    });

    let moodBarsHtml = '';
    moodDays.forEach(day => {
      const height = day.avg > 0 ? (day.avg / 5) * 100 : 5;
      const color = day.avg >= 4 ? 'var(--tertiary)' : day.avg >= 3 ? 'var(--primary)' : day.avg > 0 ? 'var(--error)' : 'var(--outline-variant)';
      moodBarsHtml += `
        <div class="report-mood-day">
          <div class="report-mood-bar-track">
            <div class="report-mood-bar-fill" style="height:${height}%; background:${color};"></div>
          </div>
          <span class="report-mood-day-label">${day.label}</span>
          ${day.avg > 0 ? `<span class="report-mood-day-value">${day.avg}</span>` : ''}
        </div>`;
    });

    let medsHtml = '';
    prescriptions.forEach(p => {
      const conf = p.confidence || 0;
      let confColor = conf >= 90 ? '#2E7D32' : conf >= 60 ? '#E65100' : '#C62828';
      medsHtml += `
        <div class="report-med-row">
          <div class="report-med-info">
            <span class="report-med-name">${p.medication}</span>
            <span class="report-med-dosage">${p.dosage || 'N/A'}</span>
          </div>
          <div class="report-med-meta">
            <span class="report-med-confidence" style="color:${confColor};">${conf}%</span>
            ${p.doctorName ? `<span class="report-med-doctor">${p.doctorName}</span>` : ''}
          </div>
        </div>`;
    });

    let newMedsHtml = '';
    if (newMedsThisWeek.length > 0) {
      newMedsHtml = `
        <div class="report-new-meds">
          <span class="material-symbols-outlined" style="color:var(--tertiary); font-size:1.1rem;">add_circle</span>
          <span><strong>${newMedsThisWeek.length}</strong> new medication${newMedsThisWeek.length > 1 ? 's' : ''} added this week</span>
        </div>`;
    }

    const safetyColor = safetyScore >= 85 ? 'var(--primary)' : safetyScore >= 60 ? 'var(--tertiary)' : 'var(--error)';

    let shareBtnHtml = '';
    if (doctors.length > 0) {
      const recipientLabel = doctors.length > 1 ? doctors.length + ' Caregivers' : (doctors[0].profiles?.full_name || 'Caregiver');
      shareBtnHtml = `
        <button class="btn-primary report-share-btn" id="report-share-btn" style="width:100%; justify-content:center; padding:var(--space-4); font-size:1rem; border-radius:var(--radius-xl);">
          <span class="material-symbols-outlined">share</span>
          Share with ${recipientLabel}
        </button>`;
    } else {
      shareBtnHtml = `
        <div class="report-no-doctor">
          <span class="material-symbols-outlined">info</span>
          <span>Connect with a caregiver to share your report from the Caregiver Hub.</span>
        </div>`;
    }

    container.innerHTML = `
      <div class="report-paper">
        <div class="report-paper-bar"></div>

        <div class="report-paper-header">
          <h3>Sanjeev AI Clinical Summary</h3>
          <p>Week of ${getWeekRange()}</p>
        </div>

        <!-- Safety Score -->
        <div class="report-section">
          <h4 class="report-section-title">
            <span class="material-symbols-outlined" style="color:${safetyColor};">shield_with_heart</span>
            Medication Safety Score
          </h4>
          <div class="report-safety">
            <span class="report-safety-value" style="color:${safetyColor};">${safetyScore}</span>
            <span class="report-safety-label">out of 100</span>
          </div>
        </div>

        <!-- Active Medications -->
        <div class="report-section">
          <h4 class="report-section-title">
            <span class="material-symbols-outlined" style="color:var(--primary);">medication</span>
            Active Medications (${prescriptions.length})
          </h4>
          ${newMedsHtml}
          ${prescriptions.length > 0 ? medsHtml : '<p style="font-size:0.875rem; color:var(--on-surface-variant);">No active medications on record.</p>'}
        </div>

        <!-- Mood Trend -->
        <div class="report-section">
          <h4 class="report-section-title">
            <span class="material-symbols-outlined" style="color:var(--tertiary);">mood</span>
            Mood & Wellbeing
          </h4>
          <div class="report-mood-summary">
            <div class="report-mood-stat">
              <span class="report-mood-avg">${avgMood}</span>
              <span class="report-mood-avg-label">Avg Mood (7d)</span>
            </div>
            <div class="report-mood-stat">
              <span class="material-symbols-outlined" style="color:${moodTrend.color}; font-size:1.5rem;">${moodTrend.icon}</span>
              <span class="report-mood-avg-label">${moodTrend.text}</span>
            </div>
            <div class="report-mood-stat">
              <span class="report-mood-avg">${recentMoods.length}</span>
              <span class="report-mood-avg-label">Log Entries</span>
            </div>
          </div>
          <div class="report-mood-chart">
            ${moodBarsHtml}
          </div>
        </div>
      </div>

      ${shareBtnHtml}
    `;

    const shareBtn = document.getElementById('report-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          shareBtn.disabled = true;
          shareBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">sync</span> Sharing...';

          const reportPayload = {
            patientName: window.__currentUserName || 'Patient',
            generatedAt: new Date().toISOString(),
            weekRange: getWeekRange(),
            safetyScore,
            medications: prescriptions.map(p => ({
              name: p.medication,
              dosage: p.dosage,
              instructions: p.instructions,
              doctor: p.doctorName,
              confidence: p.confidence
            })),
            mood: {
              average: parseFloat(avgMood) || 0,
              trend: moodTrend.text,
              logCount: recentMoods.length,
              entries: recentMoods.map(m => ({
                level: m.moodlevel,
                notes: m.notes,
                date: m.date || m.recorded_at
              }))
            },
            newMedicationsThisWeek: newMedsThisWeek.map(p => p.medication)
          };

          const reportJson = JSON.stringify(reportPayload);
          let sharedCount = 0;

          for (const doc of doctors) {
            try {
              await api.shareReport(userId, doc.caregiver_id, reportJson);
              sharedCount++;
            } catch (e) {
              console.warn('Failed to share with doctor:', e);
            }
          }

          if (sharedCount > 0) {
            const names = doctors.slice(0, sharedCount).map(d => d.profiles?.full_name || 'Caregiver').join(', ');
            window.showToast(`Report shared with ${names}!`, false);
            shareBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">check_circle</span> Report Shared!';
            shareBtn.style.background = 'var(--tertiary)';
          } else {
            window.showToast('Failed to share report. Try again.', true);
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<span class="material-symbols-outlined">share</span> Share with Caregivers';
          }
        } catch (err) {
          console.error('Share error:', err);
          window.showToast('Error sharing report: ' + err.message, true);
          shareBtn.disabled = false;
          shareBtn.innerHTML = '<span class="material-symbols-outlined">share</span> Share with Caregivers';
        }
      });
    }

  } catch (err) {
    console.error('Report generation error:', err);
    container.innerHTML = `<p style="color:var(--error);">Failed to generate report. ${err.message}</p>`;
  }
}
