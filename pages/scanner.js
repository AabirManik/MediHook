// Prescription Scanner — Redesigned UI
export function renderScanner(navigate) {
  const t = window.__t;

  return `
  <div class="page-enter scanner-page">

    <!-- Header -->
    <div class="scanner-header">
      <div class="scanner-icon-badge">
        <span class="material-symbols-outlined" style="font-size:1.8rem; font-variation-settings:'FILL' 1; color:var(--primary);">document_scanner</span>
      </div>
      <h2 class="page-title" style="margin-bottom:var(--space-1);">${t('scannerTitle')}</h2>
      <p class="page-subtitle">${t('scannerSub')}</p>
    </div>

    <!-- Scanner Viewfinder -->
    <div class="scanner-viewfinder-wrap">
      <div class="scanner-viewfinder">
        <!-- Corner brackets -->
        <div class="scan-corner tl"></div>
        <div class="scan-corner tr"></div>
        <div class="scan-corner bl"></div>
        <div class="scan-corner br"></div>
        <!-- Laser scan line -->
        <div class="scan-laser"></div>
        <!-- Center placeholder content -->
        <div class="scanner-viewfinder-inner">
          <span class="material-symbols-outlined" style="font-size:3rem; color:rgba(255,255,255,0.3); font-variation-settings:'FILL' 1;">receipt_long</span>
          <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px; text-align:center;">Camera preview appears here</p>
        </div>
      </div>
      <p class="scanner-hint-text">
        <span class="material-symbols-outlined" style="font-size:0.9rem; vertical-align:middle;">info</span>
        Align prescription within the frame
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="scanner-actions">
      <input type="file" id="camera-capture-input" accept="image/*" capture="environment" style="display:none;" onchange="
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            window.showToast('Prescription Captured! Analyzing...');
            sessionStorage.setItem('scanImage', e.target.result.split(',')[1]);
            sessionStorage.removeItem('scanText');
            setTimeout(() => window.navigate('clearscript'), 800);
          };
          reader.readAsDataURL(this.files[0]);
        }
      ">
      <button class="btn-primary scanner-btn-primary" id="scanner-capture" onclick="document.getElementById('camera-capture-input').click()">
        <span class="material-symbols-outlined">camera</span>
        ${t('captureBtn')}
      </button>

      <div class="scanner-divider"><span>or</span></div>

      <input type="file" id="gallery-upload-input" accept="image/*" style="display:none;" onchange="
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            window.showToast('Image uploaded! Analyzing with AI...');
            sessionStorage.setItem('scanImage', e.target.result.split(',')[1]);
            sessionStorage.removeItem('scanText');
            setTimeout(() => window.navigate('clearscript'), 800);
          };
          reader.readAsDataURL(this.files[0]);
        }
      ">
      <button class="scanner-btn-upload" onclick="document.getElementById('gallery-upload-input').click()">
        <span class="material-symbols-outlined">photo_library</span>
        ${t('uploadBtn')}
      </button>
    </div>

    <!-- Manual Text Input Card -->
    <div class="scanner-manual-card">
      <div class="scanner-manual-header">
        <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.1rem;">edit_note</span>
        <span style="font-weight:600; font-size:0.9rem; color:var(--on-surface);">Type or Paste Prescription Text</span>
        <span style="font-size:0.75rem; color:var(--on-surface-variant); margin-left:auto;">Manual fallback</span>
      </div>
      <textarea
        id="scanner-input"
        placeholder="Paste or type doctor's messy prescription text here... e.g. Rx Metformin 500mg, twice a day, Dr. Sharma"
        class="scanner-textarea"
      ></textarea>
      <button class="btn-primary" id="scanner-text-submit" style="width:100%; justify-content:center; margin-top:var(--space-3); padding:14px;" onclick="
        const text = document.getElementById('scanner-input').value;
        if (!text.trim()) { window.showToast('Please enter some prescription text first.', true); return; }
        sessionStorage.setItem('scanText', text);
        sessionStorage.removeItem('scanImage');
        window.navigate('clearscript');
      ">
        <span class="material-symbols-outlined">smart_toy</span>
        Analyze with AI
      </button>
    </div>

    <!-- Privacy Badge -->
    <div style="text-align:center; margin-top:var(--space-4); margin-bottom:var(--space-6);">
      <span class="chip" style="background:var(--surface-container); color:var(--on-surface-variant); font-size:0.8rem;">
        <span class="material-symbols-outlined" style="font-size:0.9rem;">lock</span>
        ${t('privacyNote')}
      </span>
    </div>

  </div>

  <style>
    .scanner-page {
      max-width: 500px;
      margin: 0 auto;
      padding: var(--space-4) var(--space-4) 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-5);
    }

    /* Header */
    .scanner-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .scanner-icon-badge {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: var(--primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(1,45,29,0.15);
    }

    /* Viewfinder */
    .scanner-viewfinder-wrap {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .scanner-viewfinder {
      width: 100%;
      max-width: 340px;
      aspect-ratio: 4/3;
      background: linear-gradient(135deg, #0d1f17 0%, #1b3a2a 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .scanner-viewfinder-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
    }
    /* Corner brackets */
    .scan-corner {
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: var(--primary-fixed);
      border-style: solid;
      border-width: 0;
    }
    .scan-corner.tl { top: 16px; left: 16px; border-top-width: 3px; border-left-width: 3px; border-radius: 4px 0 0 0; }
    .scan-corner.tr { top: 16px; right: 16px; border-top-width: 3px; border-right-width: 3px; border-radius: 0 4px 0 0; }
    .scan-corner.bl { bottom: 16px; left: 16px; border-bottom-width: 3px; border-left-width: 3px; border-radius: 0 0 0 4px; }
    .scan-corner.br { bottom: 16px; right: 16px; border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 4px 0; }
    /* Laser */
    .scan-laser {
      position: absolute;
      left: 16px;
      right: 16px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary-fixed), transparent);
      box-shadow: 0 0 8px var(--primary-fixed), 0 0 20px rgba(193,236,212,0.4);
      animation: scanLaser 2.4s ease-in-out infinite;
    }
    @keyframes scanLaser {
      0%   { top: 20%; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { top: 80%; opacity: 0; }
    }
    .scanner-hint-text {
      font-size: 0.78rem;
      color: var(--on-surface-variant);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Actions */
    .scanner-actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }
    .scanner-btn-primary {
      width: 100%;
      justify-content: center;
      padding: 16px;
      font-size: 1rem;
      border-radius: var(--radius-xl);
    }
    .scanner-btn-upload {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      border-radius: var(--radius-xl);
      border: 1.5px dashed var(--outline-variant);
      background: var(--surface-container-low);
      color: var(--on-surface);
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .scanner-btn-upload:hover {
      background: var(--surface-container);
      border-color: var(--primary);
      color: var(--primary);
    }
    .scanner-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      color: var(--on-surface-variant);
      font-size: 0.8rem;
    }
    .scanner-divider::before,
    .scanner-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--outline-variant);
    }

    /* Manual card */
    .scanner-manual-card {
      width: 100%;
      background: var(--surface-container-low);
      border: 1px solid var(--outline-variant);
      border-radius: var(--radius-xl);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .scanner-manual-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .scanner-textarea {
      width: 100%;
      min-height: 110px;
      background: var(--surface);
      border: 1.5px solid var(--outline-variant);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      color: var(--on-surface);
      font-family: monospace;
      font-size: 0.9rem;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .scanner-textarea:focus {
      border-color: var(--primary);
    }
    .scanner-textarea::placeholder {
      color: var(--on-surface-variant);
      opacity: 0.7;
    }
  </style>
  `;
}
