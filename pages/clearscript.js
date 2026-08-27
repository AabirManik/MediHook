// ClearScript Validation — Redesigned UI
import { api } from '../api.js';
import { auth } from '../auth.js';

let _clearScriptScanTimeout = null;
let _clearScriptBindTimeout = null;

export function cleanupClearScript() {
  if (_clearScriptScanTimeout) { clearTimeout(_clearScriptScanTimeout); _clearScriptScanTimeout = null; }
  if (_clearScriptBindTimeout) { clearTimeout(_clearScriptBindTimeout); _clearScriptBindTimeout = null; }
  if (window.stopLiveCamera) window.stopLiveCamera();
}

function renderLoading() {
  return `
    <div class="scan-loading">
      <div class="scan-loading-icon">
        <span class="material-symbols-outlined" style="font-size:2rem; color:var(--primary);">document_scanner</span>
      </div>
      <div class="scan-loading-steps">
        <div class="scan-loading-step active" id="step-upload">
          <span class="material-symbols-outlined">cloud_upload</span>
          Uploading image...
        </div>
        <div class="scan-loading-step" id="step-ai">
          <span class="material-symbols-outlined">psychology</span>
          AI is reading prescription...
        </div>
        <div class="scan-loading-step" id="step-extract">
          <span class="material-symbols-outlined">data_object</span>
          Extracting medication data...
        </div>
      </div>
    </div>
  `;
}

function renderError(message, onRetry) {
  return `
    <div class="scan-error">
      <div class="scan-error-icon">
        <span class="material-symbols-outlined" style="font-size:2rem; color:var(--error);">error</span>
      </div>
      <div>
        <h3 style="font-weight:700; margin-bottom:4px;">Scan Failed</h3>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">${message}</p>
      </div>
      <button class="btn-primary" onclick="window.navigate('scanner')" style="justify-content:center; padding:12px 24px;">
        <span class="material-symbols-outlined">refresh</span>
        Try Again
      </button>
    </div>
  `;
}

function renderResults(data) {
  const meds = data.medications || [];
  const confidence = data.overallConfidence || 0;
  const doctorName = data.doctorName || 'Unknown';
  const rawText = data.rawText || '';
  const warnings = data.warnings || [];

  // Confidence color coding
  let confColor, confBg, statusText;
  if (confidence >= 90) {
    confColor = '#2E7D32'; confBg = '#E8F5E9';
    statusText = 'Auto-Accepted';
  } else if (confidence >= 60) {
    confColor = '#E65100'; confBg = '#FFF3E0';
    statusText = 'Review Recommended';
  } else {
    confColor = '#C62828'; confBg = '#FFEBEE';
    statusText = 'Manual Verification Needed';
  }

  // Build medication cards
  const medCards = meds.map((med, i) => {
    const medConf = med.confidence || 0;
    let medConfColor, medConfBg;
    if (medConf >= 90) { medConfColor = '#2E7D32'; medConfBg = '#E8F5E9'; }
    else if (medConf >= 60) { medConfColor = '#E65100'; medConfBg = '#FFF3E0'; }
    else { medConfColor = '#C62828'; medConfBg = '#FFEBEE'; }

    const details = [];
    if (med.dosage) details.push({ icon: 'medication', text: med.dosage });
    if (med.frequency && med.frequency !== 'Not specified') details.push({ icon: 'schedule', text: med.frequency });
    if (med.duration && med.duration !== 'Not specified') details.push({ icon: 'calendar_today', text: med.duration });
    if (med.instructions && med.instructions !== 'None') details.push({ icon: 'info', text: med.instructions });

    return `
      <div class="scan-med-card">
        <div class="scan-med-header">
          <span class="scan-med-name">${med.name || 'Unknown'}</span>
          <span class="scan-med-confidence" style="background:${medConfBg}; color:${medConfColor};">${medConf}%</span>
        </div>
        ${details.length > 0 ? `
          <div class="scan-med-details">
            ${details.map(d => `
              <span class="scan-med-detail">
                <span class="material-symbols-outlined">${d.icon}</span>
                ${d.text}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Build warnings HTML
  const warningsHtml = warnings.length > 0 ? `
    <div class="scan-warnings">
      ${warnings.map(w => `
        <div class="scan-warning-item">
          <span class="material-symbols-outlined" style="font-size:1rem;">warning</span>
          ${w}
        </div>
      `).join('')}
    </div>
  ` : '';

  // Action buttons based on confidence
  let actionsHtml = '';
  if (confidence >= 60) {
    actionsHtml = `
      <div class="scan-actions">
        <button id="btn-confirm-scan" class="btn-primary" style="width:100%; justify-content:center; padding:16px; font-size:1rem;">
          <span class="material-symbols-outlined">check_circle</span>
          Confirm & Save All
        </button>
        <div class="scan-actions-row">
          <button id="btn-edit-scan" class="btn-secondary">
            <span class="material-symbols-outlined">edit</span>
            Edit
          </button>
          <button id="btn-risk-scan" class="btn-secondary">
            <span class="material-symbols-outlined">analytics</span>
            Risk Analysis
          </button>
        </div>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="scan-actions">
        <div style="background:#FFF3E0; border:1px solid #FFE0B2; border-radius:var(--radius-xl); padding:var(--space-4); margin-bottom:var(--space-3);">
          <p style="font-size:0.875rem; color:#E65100; font-weight:600; margin-bottom:8px;">Low confidence detected. Please verify the information below and correct if needed.</p>
        </div>
        <button id="btn-confirm-scan" class="btn-primary" style="width:100%; justify-content:center; padding:16px; font-size:1rem;">
          <span class="material-symbols-outlined">check_circle</span>
          Save Anyway
        </button>
        <button id="btn-retry-scan" class="btn-secondary" style="width:100%; justify-content:center; padding:14px;" onclick="window.navigate('scanner')">
          <span class="material-symbols-outlined">refresh</span>
          Re-Scan Prescription
        </button>
      </div>
    `;
  }

  return `
    <!-- Confidence Header -->
    <div class="scan-result-header" style="background:${confBg};">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="material-symbols-outlined" style="color:${confColor};">check_circle</span>
          <span style="font-weight:700; font-size:1.1rem; color:${confColor};">${statusText}</span>
        </div>
        <span class="status-label">${meds.length} medication${meds.length !== 1 ? 's' : ''} detected</span>
      </div>
      <span class="confidence-badge" style="background:${confColor}; color:white;">
        ${confidence}%
      </span>
    </div>

    ${warningsHtml}

    <!-- Raw Text (Collapsible) -->
    ${rawText ? `
      <button class="scan-raw-toggle" id="raw-text-toggle">
        <span class="material-symbols-outlined">text_fields</span>
        View Raw Extracted Text
        <span class="material-symbols-outlined" style="margin-left:auto;">expand_more</span>
      </button>
      <div class="scan-raw-content" id="raw-text-content">
        <div class="scan-raw-text">${rawText}</div>
      </div>
    ` : ''}

    <!-- Medication Cards -->
    ${medCards}

    <!-- Doctor -->
    ${doctorName !== 'Unknown' ? `
      <div class="scan-doctor-row">
        <span class="material-symbols-outlined">person</span>
        Prescribed by: <strong>${doctorName}</strong>
      </div>
    ` : ''}

    <!-- Actions -->
    ${actionsHtml}
  `;
}

export function renderClearScript(navigate) {
  const t = window.__t;

  // Start scanning immediately when page loads
  _clearScriptScanTimeout = setTimeout(async () => {
    const container = document.getElementById('clearscript-results');
    if (!container) return;
    
    const rawText = sessionStorage.getItem('scanText');
    const image = sessionStorage.getItem('scanImage');

    // Guard: if no data, redirect back to scanner
    if (!rawText && !image) {
      container.innerHTML = renderError('No prescription captured. Please go back and capture an image or enter text.');
      return;
    }

    // Show loading state
    container.innerHTML = renderLoading();

    // Animate loading steps
    setTimeout(() => {
      const step1 = document.getElementById('step-upload');
      const step2 = document.getElementById('step-ai');
      if (step1) { step1.classList.remove('active'); step1.classList.add('done'); step1.querySelector('.material-symbols-outlined').textContent = 'check_circle'; }
      if (step2) { step2.classList.add('active'); }
    }, 800);

    setTimeout(() => {
      const step2 = document.getElementById('step-ai');
      const step3 = document.getElementById('step-extract');
      if (step2) { step2.classList.remove('active'); step2.classList.add('done'); step2.querySelector('.material-symbols-outlined').textContent = 'check_circle'; }
      if (step3) { step3.classList.add('active'); }
    }, 2000);

    try {
      const data = await api.scanPrescription(rawText, image);
      
      // Clear loading animation
      if (_clearScriptScanTimeout) { clearTimeout(_clearScriptScanTimeout); _clearScriptScanTimeout = null; }
      
      // Store scan data
      sessionStorage.setItem('lastScan', JSON.stringify(data));
      
      // Render results
      container.innerHTML = renderResults(data);

      // Bind raw text toggle
      const rawToggle = document.getElementById('raw-text-toggle');
      const rawContent = document.getElementById('raw-text-content');
      if (rawToggle && rawContent) {
        rawToggle.addEventListener('click', () => {
          rawToggle.classList.toggle('open');
          rawContent.classList.toggle('open');
        });
      }

      // Bind action buttons
      _clearScriptBindTimeout = setTimeout(() => {
        bindActionButtons(data, image, navigate);
      }, 100);

    } catch (err) {
      console.error('Scan error:', err);
      if (_clearScriptScanTimeout) { clearTimeout(_clearScriptScanTimeout); _clearScriptScanTimeout = null; }
      container.innerHTML = renderError(err.message || 'Unknown error occurred');
    }
  }, 50);

  return `
  <div class="page-enter">
    <header style="margin-bottom:var(--space-6);">
      <h2 class="page-title">${t('clearscriptTitle')}</h2>
      <p class="page-subtitle">${t('clearscriptSub')}</p>
    </header>

    <div class="clearscript-container">
      <div id="clearscript-results" class="card-white" style="margin-bottom:var(--space-6); min-height: 200px; padding: var(--space-4);">
        <!-- Dynamic content injected here -->
      </div>
    </div>
  </div>
  `;
}

function bindActionButtons(data, image, navigate) {
  const btnConfirm = document.getElementById('btn-confirm-scan');
  const btnEdit = document.getElementById('btn-edit-scan');
  const btnRisk = document.getElementById('btn-risk-scan');
  const btnRetry = document.getElementById('btn-retry-scan');

  if (btnConfirm) {
    btnConfirm.addEventListener('click', async () => {
      try {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';
        
        const user = await auth.getCurrentUser();
        if (!user) {
           window.showToast('You must be logged in to save prescriptions.', true);
           btnConfirm.disabled = false;
           btnConfirm.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirm & Save All';
           return;
        }

        const meds = data.medications || [];
        let savedCount = 0;
        
        for (const med of meds) {
          // Upload image (only for first med to avoid duplicates)
          let imageUrl = '';
          if (image && savedCount === 0) {
            try { imageUrl = await api.uploadPrescriptionImage(user.id, image); } catch(e) {}
          }
          
          await api.addPrescription(user.id, {
            medication: med.name || 'Unknown',
            dosage: med.dosage || '',
            instructions: [med.frequency, med.instructions].filter(Boolean).join(' • '),
            confidence: med.confidence || data.overallConfidence || 0,
            image_url: imageUrl,
            doctorName: data.doctorName || 'Unknown',
            raw_text: data.rawText || '',
            date: new Date().toISOString().split('T')[0],
            insights: JSON.stringify({
              overallConfidence: data.overallConfidence || 0,
              warnings: data.warnings || [],
              frequency: med.frequency || '',
              duration: med.duration || ''
            })
          });
          savedCount++;
        }
        
        window.showToast(`Saved ${savedCount} medication${savedCount !== 1 ? 's' : ''} successfully!`);
        
        // Background: recalculate and cache safety score
        const allMeds = await api.getPrescriptions(user.id);
        const medNames = allMeds.map(m => m.medication).filter(Boolean);
        if (medNames.length >= 2) {
          api.checkInteractions(medNames).then(interaction => {
            let score = 100;
            score -= allMeds.length * 3;
            if (allMeds.length > 5) score -= 5;
            if (interaction.pairs) {
              interaction.pairs.forEach(p => {
                if (p.severity === 'High') score -= 15;
                else if (p.severity === 'Moderate') score -= 8;
              });
            }
            score = Math.max(0, Math.min(100, score));
            api.updateSafetyScore(user.id, score).catch(() => {});
          }).catch(() => {});
        } else {
          api.updateSafetyScore(user.id, 100).catch(() => {});
        }
        
        // Auto-run risk analysis if user has existing meds
        const existingMeds = meds.map(m => m.name).filter(Boolean);
        if (existingMeds.length > 0) {
          sessionStorage.setItem('lastScanMeds', JSON.stringify(existingMeds));
          setTimeout(() => navigate('risk-analysis'), 800);
        } else {
          setTimeout(() => navigate('medications'), 800);
        }
        
      } catch (err) {
        console.error("Save Error:", err);
        window.showToast('Error saving: ' + err.message, true);
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirm & Save All';
      }
    });
  }

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      window.showToast('Edit mode — modify fields directly in the cards above');
    });
  }

  if (btnRisk) {
    btnRisk.addEventListener('click', () => {
      const meds = (data.medications || []).map(m => m.name).filter(Boolean);
      sessionStorage.setItem('lastScanMeds', JSON.stringify(meds));
      navigate('drug-interaction');
    });
  }

  if (btnRetry) {
    btnRetry.addEventListener('click', () => navigate('scanner'));
  }
}
