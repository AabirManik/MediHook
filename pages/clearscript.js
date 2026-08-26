// ClearScript Validation
import { api } from '../api.js';
import { auth } from '../auth.js';

export function renderClearScript(navigate) {
  const t = window.__t;

  // Simulate scanning when page loads
  setTimeout(async () => {
    const container = document.getElementById('clearscript-results');
    if (!container) return;
    
    const rawText = sessionStorage.getItem('scanText');
    const image = sessionStorage.getItem('scanImage');

    try {
      container.innerHTML = `
        <div style="text-align:center; padding:var(--space-8);">
          <span class="material-symbols-outlined" style="font-size:3rem; color:var(--primary); animation: pulse 1.5s infinite;">document_scanner</span>
          <p style="margin-top:var(--space-4); color:var(--on-surface-variant); font-weight:600;">Gemini AI is analyzing ${image ? 'your image' : 'text'}...</p>
        </div>
      `;
      
      const data = await api.scanPrescription(rawText, image);
      sessionStorage.setItem('lastScan', JSON.stringify(data));
      
      let confidenceColor = '#2E7D32';
      let confidenceBg = '#E8F5E9';
      let confidenceStatus = t('autoAccepted') || 'Auto-Accepted Processing';
      let actionHtml = '';

      if (data.confidence < 90 && data.confidence >= 60) { 
        confidenceColor = '#E65100'; 
        confidenceBg = '#FFF3E0'; 
        confidenceStatus = 'Requires Manual Confirmation';
        actionHtml = `
          <div style="margin-top:16px; display:flex; gap:8px;">
            <button id="btn-confirm-scan" class="btn-primary" style="flex:1; justify-content:center; padding:10px;">Confirm</button>
            <button id="btn-edit-scan" class="btn-secondary" style="flex:1; justify-content:center; padding:10px;">Edit</button>
          </div>
        `;
      } else if (data.confidence < 60) { 
        confidenceColor = '#C62828'; 
        confidenceBg = '#FFEBEE'; 
        confidenceStatus = 'Manual Fallback Required';
        actionHtml = `
          <div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">
            <input type="text" id="fallback-med" value="${data.medication}" style="padding:10px; border-radius:8px; border:1px solid var(--outline-variant); width:100%; font-family:inherit;">
            <input type="text" id="fallback-dose" value="${data.dosage} • ${data.instructions}" style="padding:10px; border-radius:8px; border:1px solid var(--outline-variant); width:100%; font-family:inherit;">
            <button id="btn-save-fallback" class="btn-primary" style="width:100%; justify-content:center; padding:12px;">Save Fallback</button>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="ocr-layer">
          <div class="ocr-layer-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span class="chip" style="background:${confidenceBg}; color:${confidenceColor}; font-weight:700;">&gt;${data.confidence}% Match</span>
            <span class="material-symbols-outlined" style="color:${confidenceColor};">check_circle</span>
          </div>
          <p class="ocr-layer-desc" style="margin-bottom:var(--space-2); color:var(--on-surface-variant); font-weight:600;">${confidenceStatus}</p>
          <div class="ocr-extracted-text">
            <h4>${data.medication}</h4>
            <span class="label-caps">${data.dosage} • ${data.instructions}</span>
            <p style="margin-top:8px; font-size:0.75rem; color:var(--on-surface-variant);">Prescribed by: ${data.doctorName}</p>
          </div>
          ${actionHtml}
        </div>
      `;
      
      // Enable confirm button after analysis
      const confirmBtn = document.getElementById('clearscript-confirm');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
        const icon = confirmBtn.querySelector('#confirm-icon');
        const text = confirmBtn.querySelector('#confirm-text');
        if (icon) icon.textContent = 'analytics';
        if (text) text.textContent = t('runRiskAnalysis');
      }

      // Bind interactive buttons
      setTimeout(() => {
        const btnConfirm = document.getElementById('btn-confirm-scan');
        const btnEdit = document.getElementById('btn-edit-scan');
        const btnSaveFallback = document.getElementById('btn-save-fallback');
        
        if (btnConfirm) {
          btnConfirm.addEventListener('click', async () => {
            try {
              btnConfirm.style.opacity = '0.5';
              btnConfirm.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Saving...';
              
              const user = await auth.getCurrentUser();
              if (!user) {
                 window.showToast('You must be logged in to save prescriptions.', true);
                 return;
              }
              
              // 1. Upload image to Supabase Storage if available
              let imageUrl = '';
              if (image) {
                  imageUrl = await api.uploadPrescriptionImage(user.id, image);
              }
              
              // 2. Save structured data to database
              await api.addPrescription(user.id, {
                 medication_name: data.medication || 'Unknown',
                 dosage: data.dosage || '',
                 instructions: data.instructions || '',
                 confidence: data.confidence || 0,
                 image_url: imageUrl,
                 doctor_name: data.doctorName || 'Unknown',
                 raw_text: data.rawText || ''
              });
              
              window.showToast('Prescription confirmed and saved!');
              
              // Simulate navigation back to home/medications
              setTimeout(() => {
                document.getElementById('nav-home')?.click();
              }, 1000);
              
            } catch (err) {
              console.error("Save Error:", err);
              window.showToast('Error saving: ' + err.message, true);
              btnConfirm.style.opacity = '1';
              btnConfirm.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirm Details';
            }
          });
        }
        if (btnEdit) btnEdit.addEventListener('click', () => window.showToast('Edit mode activated'));
        if (btnSaveFallback) {
          btnSaveFallback.addEventListener('click', () => {
            const medInput = document.getElementById('fallback-med');
            const doseInput = document.getElementById('fallback-dose');
            if (medInput && doseInput) {
               data.medication = medInput.value;
               data.dosage = doseInput.value.split('•')[0]?.trim() || '';
               data.instructions = doseInput.value.split('•')[1]?.trim() || '';
               sessionStorage.setItem('lastScan', JSON.stringify(data));
               window.showToast('Manual entry saved!');
            }
          });
        }
      }, 50);
    } catch (err) {
      container.innerHTML = `
        <div style="padding:var(--space-4); color:var(--error); text-align:center;">
          <span class="material-symbols-outlined">error</span>
          <p style="font-weight:700; margin-top:8px;">Scan Error</p>
          <p style="font-size:0.875rem;">${err.message}</p>
        </div>
      `;
    }
  }, 100);

  return `
  <div class="page-enter">
    <header style="margin-bottom:var(--space-6);">
      <h2 class="page-title">${t('clearscriptTitle')}</h2>
      <p class="page-subtitle">${t('clearscriptSub')}</p>
    </header>

    <div class="clearscript-container">
      <div id="clearscript-results" class="ocr-layers card-white" style="margin-bottom:var(--space-6); min-height: 200px;">
        <!-- Dynamic content injected here -->
      </div>

      <button id="clearscript-confirm" class="btn-primary" disabled style="width:100%; justify-content:center; padding:16px; opacity:0.5; cursor:not-allowed;">
        <span class="material-symbols-outlined" id="confirm-icon">sync</span> 
        <span id="confirm-text">Analyzing Prescription...</span>
      </button>
    </div>
  </div>
  `;
}
