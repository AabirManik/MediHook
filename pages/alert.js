// Alert Page â€” Dynamic Health Status Dashboard
let _alertAbort = null;

export function cleanupAlert() {
  if (_alertAbort) { _alertAbort.abort(); _alertAbort = null; }
}

export function renderAlert(navigate) {
  const t = window.__t;
  return `
  <div class="page-enter" id="alert-page" style="max-width:40rem; margin:0 auto;">
    <header style="margin-bottom:var(--space-6);">
      <h2 class="page-title" style="font-size:1.875rem;">${t('alertTitle')}</h2>
      <p style="color:var(--on-surface-variant); font-weight:500;">${t('alertSub')}</p>
    </header>

    <div id="alert-content">
      <div class="alert-loading">
        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite; font-size:2rem; color:var(--primary);">progress_activity</span>
        <p>Analyzing your health status...</p>
      </div>
    </div>
  </div>
  `;
}

export async function initAlert() {
  if (_alertAbort) _alertAbort.abort();
  _alertAbort = new AbortController();
  const signal = _alertAbort.signal;

  const { api } = await import('../api.js');
  const userId = window.__currentUserId || localStorage.getItem('userId');
  const contentEl = document.getElementById('alert-content');
  if (!contentEl) return;

  try {
    const isDoctor = window.__currentUserRole === 'caregiver' || window.__currentUserRole === 'pharmacist' || window.__currentUserRole === 'doctor';

    if (isDoctor) {
      await renderDoctorView(contentEl, api, userId, signal);
    } else {
      await renderPatientView(contentEl, api, userId, signal);
    }
  } catch (err) {
    console.error('Alert init error:', err);
    contentEl.innerHTML = `
      <div class="alert-error-state">
        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--error);">error</span>
        <h4>Could not load health status</h4>
        <p>${err.message}</p>
      </div>
    `;
  }
}

async function renderPatientView(contentEl, api, userId, signal) {
  let prescriptions = [], interactionResult = null, moods = [], contacts = [];

  const fetches = [];
  if (userId && userId !== '1' && userId !== 'undefined') {
    fetches.push(
      api.getPrescriptions(userId).catch(() => []),
      api.getMoods(userId).catch(() => []),
      api.getContacts(userId).catch(() => [])
    );
  }

  let results = [[], [], []];
  if (fetches.length > 0) results = await Promise.all(fetches);
  [prescriptions, moods, contacts] = results;

  if (prescriptions.length >= 2) {
    try {
      const medNames = prescriptions.map(p => p.medication);
      interactionResult = await api.checkInteractions(medNames);
    } catch (e) {}
  }

  const health = analyzeHealth(prescriptions, interactionResult, moods, contacts);
  contentEl.innerHTML = renderPatientDashboard(health);
  bindPatientActions(contentEl, userId, health, signal);
}

async function renderDoctorView(contentEl, api, userId, signal) {
  let patients = [];
  try {
    patients = await api.getConnectedPatients(userId);
  } catch (e) {}

  if (!patients || patients.length === 0) {
    contentEl.innerHTML = `
      <div class="alert-empty-state">
        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--outline);">group</span>
        <h4>No connected patients</h4>
        <p>When patients connect with you, their health alerts will appear here.</p>
      </div>
    `;
    return;
  }

  const cards = [];
  for (const patient of patients) {
    const patientId = patient.patient_id || patient.id;
    let pMeds = [], pMoods = [], pInteractions = null;
    try {
      [pMeds, pMoods] = await Promise.all([
        api.getPrescriptions(patientId).catch(() => []),
        api.getMoods(patientId).catch(() => [])
      ]);
      if (pMeds.length >= 2) {
        pInteractions = await api.checkInteractions(pMeds.map(m => m.medication)).catch(() => null);
      }
    } catch (e) {}

    const health = analyzeHealth(pMeds, pInteractions, pMoods, []);
    const statusColors = { good: '#00C853', warning: '#FFD600', critical: '#FF3D5A' };
    const statusIcons = { good: 'check_circle', warning: 'warning', critical: 'error' };
    const statusLabels = { good: 'Good Shape', warning: 'Needs Attention', critical: 'Critical' };
    const lastMood = pMoods.length > 0 ? pMoods[0] : null;
    const lastMoodTime = lastMood ? timeAgo(new Date(lastMood.recorded_at || lastMood.date)) : 'No data';

    cards.push(`
      <div class="alert-patient-card" data-patient-id="${patientId}">
        <div class="alert-patient-status" style="background:${statusColors[health.status]}15; border-color:${statusColors[health.status]}40;">
          <span class="material-symbols-outlined" style="color:${statusColors[health.status]};">${statusIcons[health.status]}</span>
          <div>
            <h4>${patient.name || patient.full_name || 'Patient'}</h4>
            <p class="alert-patient-status-label">${statusLabels[health.status]}</p>
          </div>
        </div>
        <div class="alert-patient-metrics">
          <span>${pMeds.length} meds</span>
          <span>Â·</span>
          <span>${health.alerts.length} alert${health.alerts.length !== 1 ? 's' : ''}</span>
          <span>Â·</span>
          <span>Mood ${lastMood ? lastMood.moodlevel + '/5' : 'â€”'}</span>
        </div>
        <p class="alert-patient-time">Last check: ${lastMoodTime}</p>
      </div>
    `);
  }

  contentEl.innerHTML = `
    <div style="margin-bottom:var(--space-4); color:var(--on-surface-variant); font-size:0.875rem;">
      Monitoring ${patients.length} connected patient${patients.length !== 1 ? 's' : ''}
    </div>
    <div style="display:flex; flex-direction:column; gap:var(--space-3);">
      ${cards.join('')}
    </div>
  `;
}

function analyzeHealth(prescriptions, interactionResult, moods, contacts) {
  const alerts = [];
  let status = 'good';

  // 1. Drug Interactions
  if (interactionResult?.pairs?.length > 0) {
    const highSev = interactionResult.pairs.filter(p => p.severity === 'High');
    const modSev = interactionResult.pairs.filter(p => p.severity === 'Moderate');
    if (highSev.length > 0) {
      status = 'critical';
      alerts.push({ type: 'interaction', severity: 'critical', pairs: highSev });
    } else if (modSev.length > 0) {
      if (status !== 'critical') status = 'warning';
      alerts.push({ type: 'interaction', severity: 'warning', pairs: modSev });
    }
  }

  // 2. Polypharmacy
  if (prescriptions.length >= 5) {
    if (status !== 'critical') status = 'warning';
    alerts.push({ type: 'polypharmacy', severity: 'warning', count: prescriptions.length });
  }

  // 3. Mood Declining (3 consecutive drops)
  const recentMoods = moods.slice(0, 3).map(m => m.moodlevel);
  if (recentMoods.length >= 3 && recentMoods[0] < recentMoods[1] && recentMoods[1] < recentMoods[2]) {
    if (status !== 'critical') status = 'warning';
    alerts.push({ type: 'mood-decline', severity: 'warning', levels: recentMoods });
  }

  // 4. Very Low Mood (<=2 in last 24h)
  const dayAgo = new Date(Date.now() - 86400000);
  const recentLow = moods.filter(m => new Date(m.recorded_at || m.date) > dayAgo && m.moodlevel <= 2);
  if (recentLow.length > 0) {
    if (status !== 'critical') status = 'warning';
    alerts.push({ type: 'mood-low', severity: 'warning', count: recentLow.length });
  }

  // 5. No Emergency Contacts
  const sosContacts = contacts.filter(c => c.isSOS);
  if (sosContacts.length === 0 && prescriptions.length > 0) {
    alerts.push({ type: 'no-contacts', severity: 'info' });
  }

  // Compute mood average
  const moodAvg = moods.length > 0
    ? (moods.slice(0, 7).reduce((s, m) => s + (m.moodlevel || 3), 0) / Math.min(moods.length, 7)).toFixed(1)
    : 'â€”';

  return { status, alerts, prescriptions, moods, contacts, interactionResult, moodAvg };
}

function renderPatientDashboard(health) {
  const { status, alerts, prescriptions, moodAvg, contacts, interactionResult } = health;

  const statusConfig = {
    good: {
      icon: 'verified',
      color: '#00C853',
      bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      title: "You're in Good Shape",
      desc: 'No dangerous interactions detected. Your health profile looks stable.'
    },
    warning: {
      icon: 'warning',
      color: '#F57C00',
      bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
      title: 'Needs Attention',
      desc: 'Some concerns detected in your health profile. Review the alerts below.'
    },
    critical: {
      icon: 'error',
      color: '#C62828',
      bg: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
      title: 'Critical Alert',
      desc: 'Urgent issues detected. Take immediate action and consult your doctor.'
    }
  };

  const cfg = statusConfig[status];
  const sosContacts = contacts.filter(c => c.isSOS);

  // Override descriptions based on specific alerts
  let smartDesc = cfg.desc;
  if (status === 'good') {
    const parts = [];
    if (prescriptions.length > 0) parts.push(`${prescriptions.length} medication${prescriptions.length > 1 ? 's' : ''} tracked`);
    if (moodAvg !== 'â€”') parts.push(`Mood averaging ${moodAvg}/5`);
    if (sosContacts.length > 0) parts.push('Emergency contacts configured');
    if (parts.length > 0) smartDesc = parts.join('. ') + '.';
  }

  return `
    <!-- Status Banner -->
    <div class="alert-status-banner" style="background:${cfg.bg}; border:1px solid ${cfg.color}30;">
      <div class="alert-status-icon" style="background:${cfg.color}20;">
        <span class="material-symbols-outlined" style="color:${cfg.color}; font-size:2.5rem; font-variation-settings:'FILL' 1;">${cfg.icon}</span>
      </div>
      <div>
        <h3 style="font-weight:800; font-size:1.25rem; color:${cfg.color};">${cfg.title}</h3>
        <p style="color:var(--on-surface-variant); font-size:0.9rem; margin-top:4px;">${smartDesc}</p>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="alert-metrics-grid">
      <div class="alert-metric-card">
        <span class="material-symbols-outlined" style="color:var(--primary);">medication</span>
        <span class="alert-metric-value">${prescriptions.length}</span>
        <span class="alert-metric-label">Active Meds</span>
      </div>
      <div class="alert-metric-card">
        <span class="material-symbols-outlined" style="color:${alerts.length > 0 ? '#F57C00' : '#00C853'};">${alerts.length > 0 ? 'warning' : 'check_circle'}</span>
        <span class="alert-metric-value">${alerts.length}</span>
        <span class="alert-metric-label">Alerts</span>
      </div>
      <div class="alert-metric-card">
        <span class="material-symbols-outlined" style="color:var(--tertiary);">mood</span>
        <span class="alert-metric-value">${moodAvg}</span>
        <span class="alert-metric-label">Mood Avg</span>
      </div>
      <div class="alert-metric-card">
        <span class="material-symbols-outlined" style="color:${sosContacts.length > 0 ? '#00C853' : '#FF3D5A'};">${sosContacts.length > 0 ? 'emergency' : 'person_off'}</span>
        <span class="alert-metric-value">${sosContacts.length > 0 ? 'âœ“' : 'âœ—'}</span>
        <span class="alert-metric-label">SOS Setup</span>
      </div>
    </div>

    <!-- Active Alerts -->
    ${alerts.length > 0 ? `
      <div style="margin-bottom:var(--space-6);">
        <h3 style="font-weight:700; font-size:1rem; margin-bottom:var(--space-3); color:var(--on-surface);">Active Alerts</h3>
        <div style="display:flex; flex-direction:column; gap:var(--space-3);">
          ${alerts.map(a => renderAlertCard(a)).join('')}
        </div>
      </div>
    ` : `
      <div class="alert-all-clear">
        <span class="material-symbols-outlined" style="font-size:2rem; color:#00C853;">check_circle</span>
        <div>
          <h4>All Clear</h4>
          <p>No active alerts. Keep up the good work!</p>
        </div>
      </div>
    `}

    <!-- Actions -->
    <div class="alert-actions-section">
      <button id="alert-notify-btn" class="btn-primary" style="flex:1; justify-content:center; padding:14px; font-weight:700; border-radius:var(--radius-xl);">
        <span class="material-symbols-outlined">send</span> Notify Doctor
      </button>
      <button id="alert-sos-btn" class="btn-error" style="flex:1; justify-content:center; padding:14px; font-weight:700; border-radius:var(--radius-xl);">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">emergency_home</span> Emergency SOS
      </button>
    </div>

    <!-- Clinical Summary -->
    <div class="alert-doc-card">
      <div class="alert-doc-icon">
        <span class="material-symbols-outlined">picture_as_pdf</span>
      </div>
      <h4>Clinical Summary</h4>
      <p>Download a formal health report to share with your healthcare provider.</p>
      <button id="alert-report-btn" class="btn-tertiary-warm" style="background:var(--tertiary); color:var(--on-tertiary);">
        Generate Safety Report
      </button>
    </div>
  `;
}

function renderAlertCard(alert) {
  const configs = {
    interaction: {
      icon: 'swap_horiz',
      color: alert.severity === 'critical' ? '#C62828' : '#F57C00',
      bg: alert.severity === 'critical' ? '#FFEBEE' : '#FFF8E1'
    },
    polypharmacy: { icon: 'medication', color: '#F57C00', bg: '#FFF8E1' },
    'mood-decline': { icon: 'trending_down', color: '#F57C00', bg: '#FFF8E1' },
    'mood-low': { icon: 'sentiment_dissatisfied', color: '#F57C00', bg: '#FFF8E1' },
    'no-contacts': { icon: 'person_off', color: '#757575', bg: '#F5F5F5' }
  };

  const cfg = configs[alert.type] || configs.interaction;

  let body = '';
  if (alert.type === 'interaction') {
    body = alert.pairs.map(p => `
      <div class="alert-issue-pair">
        <strong>${p.drugA}</strong> <span style="color:${cfg.color};">â†”</span> <strong>${p.drugB}</strong>
        <span class="alert-severity-badge" style="background:${cfg.color}20; color:${cfg.color};">${p.severity}</span>
        <p>${p.message || 'This combination may require medical review.'}</p>
      </div>
    `).join('');
  } else if (alert.type === 'polypharmacy') {
    body = `<p>You are taking <strong>${alert.count} medications</strong>. Polypharmacy increases the risk of adverse interactions. Consider a medication review with your doctor.</p>`;
  } else if (alert.type === 'mood-decline') {
    body = `<p>Your mood has declined for 3 consecutive entries: <strong>${alert.levels.join(' â†’ ')}</strong>/5. This may indicate a side effect or worsening condition.</p>`;
  } else if (alert.type === 'mood-low') {
    body = `<p>Your mood dropped to <strong>2/5 or lower</strong> recently. If this persists, consult your healthcare provider.</p>`;
  } else if (alert.type === 'no-contacts') {
    body = `<p>No emergency contacts configured. Add contacts in the Caregiver Hub to enable SOS alerts.</p>`;
  }

  return `
    <div class="alert-issue-card" style="border-left:4px solid ${cfg.color}; background:${cfg.bg};">
      <div class="alert-issue-header">
        <span class="material-symbols-outlined" style="color:${cfg.color};">${cfg.icon}</span>
        <h4 style="color:${cfg.color};">${alert.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
      </div>
      <div class="alert-issue-body">${body}</div>
    </div>
  `;
}

function bindPatientActions(contentEl, userId, health, signal) {
  // Notify Doctor
  const notifyBtn = contentEl.querySelector('#alert-notify-btn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', async () => {
      const { api } = await import('../api.js');
      try {
        notifyBtn.disabled = true;
        notifyBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">progress_activity</span> Sending...';
        const caregivers = await api.getConnectedCaregivers(userId);
        if (caregivers.length === 0) {
          window.showToast('Connect with a doctor/caregiver first via the Caregiver Hub.', true);
          notifyBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Notify Doctor';
          notifyBtn.disabled = false;
          return;
        }
        const summary = generateClinicalSummary(health);
        let sentCount = 0;
        for (const cg of caregivers) {
          try {
            await api.shareReport(userId, cg.caregiver_id, summary);
            sentCount++;
          } catch (e) { console.warn('Failed to notify', cg.caregiver_id, e); }
        }
        if (sentCount > 0) {
          notifyBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Sent!';
          window.showToast('Report sent to ' + sentCount + ' connected doctor' + (sentCount > 1 ? 's' : '') + '!', false);
        } else {
          window.showToast('Failed to send report.', true);
          notifyBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Notify Doctor';
        }
        setTimeout(() => {
          notifyBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Notify Doctor';
          notifyBtn.disabled = false;
        }, 3000);
      } catch (e) {
        notifyBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Notify Doctor';
        notifyBtn.disabled = false;
        window.showToast('Failed to send: ' + e.message, true);
      }
    }, { signal });
  }

  // Emergency SOS
  const sosBtn = contentEl.querySelector('#alert-sos-btn');
  if (sosBtn) {
    sosBtn.addEventListener('click', async () => {
      if (!confirm('TRIGGER EMERGENCY SOS? This will immediately alert all connected caregivers.')) return;
      const { api } = await import('../api.js');
      try {
        sosBtn.disabled = true;
        sosBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;">progress_activity</span> Triggering...';
        await api.triggerSOS(userId, 'EMERGENCY SOS triggered from Alert page.');
        sosBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">check_circle</span> SOS Sent!';
        window.showToast('Emergency SOS triggered!', true);
      } catch (e) {
        sosBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">emergency_home</span> Emergency SOS';
        sosBtn.disabled = false;
        window.showToast('SOS failed: ' + e.message, true);
      }
    }, { signal });
  }

  // Generate Report
  const reportBtn = contentEl.querySelector('#alert-report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      const report = generatePrintableReport(health);
      const w = window.open('', '_blank');
      w.document.write(report);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }, { signal });
  }
}

function generateClinicalSummary(health) {
  const { prescriptions, interactionResult, moods, status, alerts } = health;
  const lines = [];
  lines.push('=== CLINICAL SUMMARY ===');
  lines.push(`Date: ${new Date().toLocaleString()}`);
  lines.push(`Patient: ${window.__currentUserName || 'Patient'}`);
  lines.push(`Overall Status: ${status.toUpperCase()}`);
  lines.push('');
  lines.push('--- Medications ---');
  prescriptions.forEach(p => {
    lines.push(`- ${p.medication} ${p.dosage || ''} (${p.doctorName || 'Unknown doctor'})`);
  });
  if (interactionResult?.pairs?.length > 0) {
    lines.push('');
    lines.push('--- Drug Interactions ---');
    interactionResult.pairs.forEach(p => {
      lines.push(`- ${p.drugA} â†” ${p.drugB} [${p.severity}]: ${p.message || 'See details'}`);
    });
  }
  if (moods.length > 0) {
    lines.push('');
    lines.push('--- Recent Moods ---');
    moods.slice(0, 7).forEach(m => {
      lines.push(`- ${new Date(m.recorded_at || m.date).toLocaleDateString()}: ${m.moodlevel}/5 ${m.notes ? '(' + m.notes + ')' : ''}`);
    });
  }
  if (alerts.length > 0) {
    lines.push('');
    lines.push('--- Active Alerts ---');
    alerts.forEach(a => {
      lines.push(`- [${a.severity?.toUpperCase() || 'INFO'}] ${a.type.replace(/-/g, ' ')}`);
    });
  }
  return lines.join('\n');
}

function generatePrintableReport(health) {
  const { prescriptions, interactionResult, moods, status, alerts, moodAvg } = health;
  const statusLabels = { good: 'Good Shape', warning: 'Needs Attention', critical: 'Critical' };
  const statusColors = { good: '#00C853', warning: '#F57C00', critical: '#C62828' };

  const interactionRows = interactionResult?.pairs?.map(p => `
    <tr>
      <td>${p.drugA}</td>
      <td>${p.drugB}</td>
      <td style="color:${p.severity === 'High' ? '#C62828' : '#F57C00'}; font-weight:700;">${p.severity}</td>
      <td>${p.message || 'â€”'}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center; color:#888;">No interactions detected</td></tr>';

  const moodRows = moods.slice(0, 14).map(m => `
    <tr>
      <td>${new Date(m.recorded_at || m.date).toLocaleDateString()}</td>
      <td style="font-weight:700;">${m.moodlevel}/5</td>
      <td>${m.notes || 'â€”'}</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="text-align:center; color:#888;">No mood data</td></tr>';

  return `<!DOCTYPE html>
<html><head><title>Sanjeev AI â€” Clinical Report</title>
<style>
  body { font-family:Inter,sans-serif; padding:40px; max-width:700px; margin:0 auto; color:#1a1a1a; }
  h1 { color:#012d1d; font-size:1.5rem; border-bottom:2px solid #012d1d; padding-bottom:8px; }
  h2 { color:#1b4332; font-size:1.1rem; margin-top:24px; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th, td { padding:8px 12px; border-bottom:1px solid #eee; text-align:left; font-size:0.85rem; }
  th { background:#f5f5f5; font-weight:700; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-weight:700; font-size:0.8rem; }
  .footer { margin-top:32px; font-size:0.75rem; color:#888; border-top:1px solid #eee; padding-top:12px; }
</style></head><body>
  <h1>Sanjeev AI â€” Clinical Report</h1>
  <p><strong>Patient:</strong> ${window.__currentUserName || 'Patient'}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Overall Status:</strong> <span class="status-badge" style="background:${statusColors[status]}20; color:${statusColors[status]};">${statusLabels[status]}</span></p>

  <h2>Medications (${prescriptions.length})</h2>
  <table>
    <tr><th>Name</th><th>Dosage</th><th>Doctor</th><th>Instructions</th></tr>
    ${prescriptions.map(p => `<tr><td>${p.medication}</td><td>${p.dosage || 'â€”'}</td><td>${p.doctorName || 'â€”'}</td><td>${p.instructions || 'â€”'}</td></tr>`).join('')}
  </table>

  <h2>Drug Interactions</h2>
  <table>
    <tr><th>Drug A</th><th>Drug B</th><th>Severity</th><th>Details</th></tr>
    ${interactionRows}
  </table>

  <h2>Mood Trend (Avg: ${moodAvg}/5)</h2>
  <table>
    <tr><th>Date</th><th>Level</th><th>Notes</th></tr>
    ${moodRows}
  </table>

  <h2>Active Alerts (${alerts.length})</h2>
  <table>
    <tr><th>Type</th><th>Severity</th></tr>
    ${alerts.map(a => `<tr><td>${a.type.replace(/-/g, ' ')}</td><td style="font-weight:700;">${a.severity?.toUpperCase() || 'INFO'}</td></tr>`).join('') || '<tr><td colspan="2" style="text-align:center; color:#888;">No active alerts</td></tr>'}
  </table>

  <div class="footer">
    Generated by Sanjeev AI â€” Holistic Health & Medication Safety Platform<br>
    This report is for informational purposes. Always consult a healthcare professional.
  </div>
</body></html>`;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}
