// Prescription Scanner
export function renderScanner(navigate) {
  const t = window.__t;
  
  return `
  <div class="page-enter">
    <header style="margin-bottom:var(--space-6);">
      <h2 class="page-title">${t('scannerTitle')}</h2>
      <p class="page-subtitle">${t('scannerSub')}</p>
    </header>

    <div class="scanner-container">
      <div class="scanner-frame" style="background:rgba(0,0,0,0.4); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:var(--space-4);">
        <textarea id="scanner-input" placeholder="Paste or type doctor's messy prescription text here..." style="width:100%; height:150px; background:rgba(255,255,255,0.9); border:none; border-radius:8px; padding:12px; color:#333; font-family:monospace; resize:none;"></textarea>
      </div>
      <div class="scanner-overlay">
        <p style="background:rgba(0,0,0,0.6); padding:4px 12px; border-radius:20px; font-size:0.875rem;">Type text to simulate AI OCR</p>
      </div>
    </div>

    <div style="margin-top:var(--space-8); display:flex; flex-direction:column; gap:var(--space-4); position:relative; z-index:10;">
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
      <button class="btn-primary" id="scanner-capture" style="justify-content:center; padding:16px;" onclick="document.getElementById('camera-capture-input').click()">
        <span class="material-symbols-outlined">camera</span> ${t('captureBtn')}
      </button>
      <input type="file" id="gallery-upload-input" accept="image/*" style="display:none;" onchange="
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            window.showToast('Image uploaded successfully! Analyzing with AI...');
            sessionStorage.setItem('scanImage', e.target.result.split(',')[1]); // Store only base64 data
            sessionStorage.removeItem('scanText'); // Clear text if image is used
            setTimeout(() => window.navigate('clearscript'), 800);
          };
          reader.readAsDataURL(this.files[0]);
        }
      ">
      <button class="btn-secondary" style="justify-content:center; padding:16px;" onclick="document.getElementById('gallery-upload-input').click()">
        <span class="material-symbols-outlined">photo_library</span> ${t('uploadBtn')}
      </button>
    </div>

    <div style="margin-top:var(--space-6); text-align:center;">
      <span class="chip" style="background:var(--surface-container); color:var(--on-surface-variant);">
        <span class="material-symbols-outlined">lock</span> ${t('privacyNote')}
      </span>
    </div>
  </div>
  `;
}
