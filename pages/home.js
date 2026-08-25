// Home Dashboard with Role-Based Rendering
export function renderHome(navigate) {
  const role = window.__currentUserRole || 'patient';
  if (role === 'pharmacist') return renderPharmacistMode(navigate);
  
  // Default 'patient' mode
  return renderPatientMode(navigate);
}

// ----------------------------------------------------
// PATIENT (Default) HUB
// ----------------------------------------------------
function renderPatientMode(navigate) {
  const t = window.__t || ((key) => key);
  const circumference = 2 * Math.PI * 58;

  return `
  <div class="page-enter">
    <!-- Hero Section -->
    <section class="home-hero">
      <div class="home-hero-text">
        <h2 class="page-title">${t('greeting', { name: window.__currentUserName || 'Guest' })}</h2>
        <p class="page-subtitle">${t('greetingSub')}</p>
        <button class="sos-pill-btn" id="sos-btn" style="margin-top:var(--space-4); display:flex; align-items:center; gap:var(--space-2); background:var(--error); color:white; border:none; padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-weight:900; box-shadow:0 0 15px rgba(186,26,26,0.5); width:fit-content;">
           <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">emergency_share</span>
           EMERGENCY SOS
        </button>
      </div>
      <div class="safety-gauge" id="home-safety-gauge">
        <div class="deco">
          <span class="material-symbols-outlined">shield_with_heart</span>
        </div>
        <div style="position:relative; width:8rem; height:8rem; display:flex; align-items:center; justify-content:center;">
          <svg class="gauge-svg" viewBox="0 0 128 128">
            <circle class="gauge-bg" cx="64" cy="64" r="58" />
            <circle id="gauge-fill" class="gauge-fill" cx="64" cy="64" r="58" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" />
          </svg>
          <div class="gauge-center">
            <span id="gauge-value" class="gauge-value">--</span>
            <span class="gauge-label">${t('safety')}</span>
          </div>
        </div>
        <span class="gauge-title">${t('medSafetyScore')}</span>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="quick-actions">
      <div class="action-card action-card--scan" id="action-scan">
        <span class="material-symbols-outlined">document_scanner</span>
        <div>
          <h4>${t('scanPrescription')}</h4>
          <p>${t('scanDesc')}</p>
        </div>
      </div>
      <div class="action-card action-card--mood card" id="action-mood">
        <span class="material-symbols-outlined">wb_sunny</span>
        <div>
          <h4>${t('checkMood')}</h4>
          <p>${t('moodDesc')}</p>
        </div>
      </div>
      <div class="action-card action-card--alerts card" id="action-alerts">
        <span class="alert-dot"></span>
        <span class="material-symbols-outlined">notifications_active</span>
        <div>
          <h4>${t('viewAlerts')}</h4>
          <p>${t('alertsDesc')}</p>
        </div>
      </div>
    </section>

    <!-- Next Dose -->
    <section class="next-dose" id="next-dose-container">
      <div class="next-dose-info">
        <div class="next-dose-icon">
          <span class="material-symbols-outlined">pill</span>
        </div>
        <div id="next-dose-details">
          <span class="label-caps">${t('yourNextDose')}</span>
          <h3 class="next-dose-name">Loading...</h3>
          <div class="next-dose-meta">
            <span class="chip">---</span>
          </div>
        </div>
      </div>
      <button class="btn-primary" id="take-dose-btn" style="box-shadow: 0 8px 24px rgba(1,45,29,0.1);">${t('markAsTaken')}</button>
    </section>

    <!-- Essential Tools Grid -->
    <section style="margin-bottom:var(--space-10);">
      <h3 class="section-title" style="margin-bottom:var(--space-4);">${t('holisticTools')}</h3>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-4);">
        <div class="card" id="tool-symptoms" style="cursor:pointer; padding:var(--space-4); text-align:center;">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem; margin-bottom:var(--space-2);">record_voice_over</span>
          <h5 style="font-weight:700; color:var(--primary); font-size:0.875rem;">${t('symptomCheck')}</h5>
        </div>
        <div class="card" id="tool-meds" style="cursor:pointer; padding:var(--space-4); text-align:center;">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem; margin-bottom:var(--space-2);">join</span>
          <h5 style="font-weight:700; color:var(--primary); font-size:0.875rem;">${t('mergedMeds')}</h5>
        </div>
        <div class="card" id="tool-caregiver" style="cursor:pointer; padding:var(--space-4); text-align:center;">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem; margin-bottom:var(--space-2);">family_home</span>
          <h5 style="font-weight:700; color:var(--primary); font-size:0.875rem;">${t('caregiverHub')}</h5>
        </div>
        <div class="card" id="tool-report" style="cursor:pointer; padding:var(--space-4); text-align:center;">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem; margin-bottom:var(--space-2);">insert_chart</span>
          <h5 style="font-weight:700; color:var(--primary); font-size:0.875rem;">${t('weeklyReport')}</h5>
        </div>
        <div class="card" id="tool-interaction" style="cursor:pointer; padding:var(--space-4); text-align:center;">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem; margin-bottom:var(--space-2);">hub</span>
          <h5 style="font-weight:700; color:var(--primary); font-size:0.875rem;">${t('interactionMap')}</h5>
        </div>
      </div>
    </section>

    <!-- Insights Banner -->
    <section class="insights-banner">
      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG5AMcOSnCys69_lYg7aO1ZjK8H1KQJaSFz9L2wwjsR3wj_E8K2NmRUhLHXkZf-zG9K58hD0kI6RMXOqcXAUrCusYPB4hbZnHuWiq5ncEmsF_kXkBOq3W9Rvz30_6T2RdVGEuS27T8-B4VsDwrPlDA9u1mk6295cId4NsM0CszOQtImq_ptOtznJT6AcskPr7vLvCSTT3o52X7ivQyOVuZ7wivAOBXoIAZKvzG-hmKoTyyumwdXO5VKglYHrlDqLRiUBcrGt9THg" alt="Herbs and medicine flat lay" />
      <div class="insights-banner-overlay">
        <span class="tag">${t('weeklyWisdom')}</span>
        <h3>${t('insightTitle')}</h3>
        <p>${t('insightDesc')}</p>
      </div>
    </section>
  </div>
  `;
}

export async function initHome() {
  const gaugeValue = document.getElementById('gauge-value');
  const gaugeFill = document.getElementById('gauge-fill');
  const nextDoseDetails = document.getElementById('next-dose-details');
  const takeDoseBtn = document.getElementById('take-dose-btn');
  
  if (!gaugeValue) return;

  try {
    const { api } = await import('../api.js');
    const userId = localStorage.getItem('userId');
    
    // 1. Fetch Prescriptions (Only if logged in)
    const meds = (userId && userId !== '1') ? await api.getPrescriptions(userId) : [];
    
    // 2. Calculate Safety Score (Live)
    let score = 100;
    if (meds.length > 0) {
      const medNames = meds.map(m => m.medication);
      const interaction = await api.checkInteractions(medNames);
      if (interaction.hasInteraction) score = 65; // High risk
      else if (meds.length > 3) score = 90; // Polypharmacy caution
      else score = 98;
    }

    // Update Gauge
    const circumference = 2 * Math.PI * 58;
    const offset = circumference * (1 - score / 100);
    gaugeValue.innerText = score;
    gaugeFill.style.strokeDashoffset = offset;
    if (score < 70) gaugeFill.style.stroke = 'var(--error)';

    // 3. Update Next Dose
    if (meds.length > 0) {
      const next = meds[0];
      nextDoseDetails.innerHTML = `
        <span class="label-caps">${window.__t('yourNextDose')}</span>
        <h3 class="next-dose-name">${next.medication} (${next.dosage})</h3>
        <div class="next-dose-meta">
          <span class="chip">
            <span class="material-symbols-outlined" style="font-size:1.125rem">schedule</span> 08:30 AM
          </span>
          <span class="chip" style="background:var(--secondary-container)">
            <span class="material-symbols-outlined" style="font-size:1.125rem">water_drop</span> ${next.instructions}
          </span>
        </div>
      `;
    } else {
      nextDoseDetails.innerHTML = `
        <h3 class="next-dose-name">No meds scheduled</h3>
        <p style="font-size:0.875rem; color:var(--on-surface-variant);">Scan a prescription to start tracking.</p>
      `;
      if (takeDoseBtn) takeDoseBtn.style.display = 'none';
    }

  } catch (err) {
    console.error('Home Init Error:', err);
  }
}

// ----------------------------------------------------
// DOCTOR HUB
// ----------------------------------------------------
function renderDoctorMode(navigate) {
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="page-title">Doctor Portal</h2>
          <p class="page-subtitle">Patient Safety Overview</p>
        </div>
        <span class="material-symbols-outlined" style="color:var(--primary); font-size:2rem;">medical_services</span>
      </div>
    </header>

    <!-- Alerts -->
    <div class="alert-warning-card" style="margin-bottom:var(--space-6); background:var(--error-container); color:var(--on-error-container);">
      <div class="alert-header">
        <div class="alert-icon-wrap" style="background:var(--error); color:white;"><span class="material-symbols-outlined">warning</span></div>
        <div>
          <h3 style="color:var(--error);">Critical Interaction Detected</h3>
          <p class="severity">Patient: Rahul S.</p>
        </div>
      </div>
      <div class="alert-body">
        <p>Fluoxetine & Metoprolol cascade risk detected. Requires immediate review.</p>
        <button class="btn-primary" style="margin-top:var(--space-2); background:var(--error); color:white;" id="dr-action-resolve">Review Protocol</button>
      </div>
    </div>

    <!-- Patient Roster -->
    <h3 class="section-title" style="margin-bottom:var(--space-4);">Your Patients</h3>
    <div style="display:grid; gap:var(--space-4); margin-bottom:var(--space-8);">
      
      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:var(--space-3); align-items:center;">
          <div class="brand-avatar" style="width:3rem; height:3rem;">
             <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Rahul" style="width:100%; border-radius:50%;"/>
          </div>
          <div>
            <h4 style="font-weight:700;">Rahul S.</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Risk Score: <span style="color:var(--error); font-weight:700;">HIGH</span></p>
          </div>
        </div>
        <button class="icon-btn"><span class="material-symbols-outlined">chevron_right</span></button>
      </div>

      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:var(--space-3); align-items:center;">
          <div class="brand-avatar" style="width:3rem; height:3rem; background:var(--secondary-container);">
             <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Anita" style="width:100%; border-radius:50%;"/>
          </div>
          <div>
            <h4 style="font-weight:700;">Anita P.</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Risk Score: <span style="color:var(--primary); font-weight:700;">SAFE</span></p>
          </div>
        </div>
        <button class="icon-btn"><span class="material-symbols-outlined">chevron_right</span></button>
      </div>

    </div>
  </div>
  `;
}

// ----------------------------------------------------
// PHARMACIST HUB
// ----------------------------------------------------
function renderPharmacistMode(navigate) {
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="page-title">Pharmacy Queue</h2>
          <p class="page-subtitle">Verification & Dispensary</p>
        </div>
        <span class="material-symbols-outlined" style="color:var(--tertiary); font-size:2rem;">local_pharmacy</span>
      </div>
    </header>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4); margin-bottom:var(--space-8);">
      <div class="card" style="text-align:center; background:var(--tertiary-fixed);">
        <h2 style="font-size:2rem; color:var(--on-tertiary-fixed);">14</h2>
        <p style="font-size:0.875rem; font-weight:600; color:var(--on-tertiary-fixed);">Pending Scripts</p>
      </div>
      <div class="card" style="text-align:center; background:var(--primary-fixed);">
        <h2 style="font-size:2rem; color:var(--on-primary-fixed);">2</h2>
        <p style="font-size:0.875rem; font-weight:600; color:var(--on-primary-fixed);">Interactions Flagged</p>
      </div>
    </div>

    <h3 class="section-title" style="margin-bottom:var(--space-4);">Active Dispensary Orders</h3>
    <div class="card" style="border-left: 4px solid var(--tertiary); margin-bottom:var(--space-4);">
      <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
        <h4 style="font-weight:700;">Rx-8821 (Rahul S.)</h4>
        <span class="chip" style="background:var(--error-container); color:var(--on-error-container);">Needs Review</span>
      </div>
      <p style="font-size:0.875rem; color:var(--on-surface-variant); margin-bottom:var(--space-4);">Metformin (Glucophage) + Fluoxetine</p>
      <div style="display:flex; gap:var(--space-2);">
         <button class="btn-primary" style="flex:1; padding:var(--space-2); background:var(--tertiary); color:white; justify-content:center;">Suggest Generic</button>
         <button class="btn-secondary" style="flex:1; padding:var(--space-2); justify-content:center;">Hold Order</button>
      </div>
    </div>
  </div>
  `;
}

// ----------------------------------------------------
// HOSPITAL / CLINIC HUB
// ----------------------------------------------------
function renderHospitalMode(navigate) {
  return `
  <div class="page-enter">
    <header style="margin-bottom: var(--space-8);">
      <h2 class="page-title">Hospital Admin</h2>
      <p class="page-subtitle">Sanjeev AI Facility Overview</p>
    </header>

    <div class="card" style="background:linear-gradient(135deg, var(--primary) 0%, #011E13 100%); color:white; margin-bottom:var(--space-6);">
      <h3 style="color:var(--primary-fixed); font-size:0.875rem; text-transform:uppercase; margin-bottom:var(--space-6); letter-spacing:1px;">Global Facility Health</h3>
      
      <div style="display:flex; align-items:flex-end; gap:var(--space-8); margin-bottom:var(--space-4);">
        <div>
          <span style="font-size:3rem; font-weight:700; line-height:1;">92<span style="font-size:1.5rem;">%</span></span>
          <p style="font-size:0.875rem; color:rgba(255,255,255,0.7);">Overall Safety Index</p>
        </div>
        <div>
          <span style="font-size:2rem; font-weight:700; line-height:1; color:var(--error-container);">3</span>
          <p style="font-size:0.875rem; color:rgba(255,255,255,0.7);">Active Cascades</p>
        </div>
      </div>
    </div>

    <h3 class="section-title" style="margin-bottom:var(--space-4);">Ward Analysis</h3>
    <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:var(--space-3);">
       <li class="card" style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4);">
          <div>
            <h4 style="font-weight:700;">ICU - Cardiac</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Capacity: 12/15</p>
          </div>
          <span class="chip" style="background:var(--primary-container); color:var(--on-primary-container);">Safe</span>
       </li>
       <li class="card" style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4);">
          <div>
            <h4 style="font-weight:700;">Ward B - Psychiatry</h4>
            <p style="font-size:0.75rem; color:var(--on-surface-variant);">Capacity: 30/40</p>
          </div>
          <span class="chip" style="background:var(--error-container); color:var(--on-error-container);">2 Alerts</span>
       </li>
    </ul>
  </div>
  `;
}
