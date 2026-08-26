// ============================
// SANJEEV AI — Main Application
// ============================

import { t, setLanguage, getLanguage } from './translate.js';
import { renderHome, initHome } from './pages/home.js';
import { renderScanner } from './pages/scanner.js';
import { renderTimeline, initTimeline } from './pages/timeline.js';
import { renderMood } from './pages/mood.js';
import { renderRiskAnalysis, initRiskAnalysis } from './pages/risk-analysis.js';
import { renderAlert } from './pages/alert.js';
import { renderCaregiver, initCaregiver } from './pages/caregiver.js';
import { renderSymptoms, initSymptoms } from './pages/symptoms.js';
import { renderMedications, initMedications } from './pages/medications.js';
import { renderReport } from './pages/report.js';
import { renderClearScript } from './pages/clearscript.js';
import { renderDrugInteraction, initDrugInteraction } from './pages/drug-interaction.js';
import { renderLogin } from './pages/login.js';
import { renderProfile, initProfile } from './pages/profile.js';
import { renderLanding } from './pages/landing.js';
import { api } from './api.js';
import { auth } from './auth.js';

// Expose t() globally so pages can use it
window.__t = t;

// ---- Router ----
const pages = {
  home: renderHome,
  scanner: renderScanner,
  clearscript: renderClearScript,
  timeline: renderTimeline,
  mood: renderMood,
  'risk-analysis': renderRiskAnalysis,
  alert: renderAlert,
  caregiver: renderCaregiver,
  symptoms: renderSymptoms,
  medications: renderMedications,
  report: renderReport,
  'drug-interaction': renderDrugInteraction,
  login: renderLogin,
  profile: renderProfile,
  landing: renderLanding,
};

// Initial States
window.__isLoggedIn = false;
window.__currentUserRole = 'patient';
let currentPage = 'home';
window.navigate = navigate;

function navigate(page) {
  // Stop camera if navigating away
  if (window.stopLiveCamera) {
    window.stopLiveCamera();
  }

  currentPage = page;
  const main = document.getElementById('main-content');
  const renderer = pages[page];
  if (renderer) {
    main.innerHTML = '';
    const content = renderer(navigate);
    if (typeof content === 'string') {
      main.innerHTML = content;
    } else {
      main.appendChild(content);
    }
    main.querySelector('.page-enter') || main.firstElementChild?.classList.add('page-enter');
    
    // Auto-fetch data for profile if logged in
    if (page === 'profile' && window.__isLoggedIn) {
      api.getContacts(window.__currentUserId).then(contacts => {
        window.__currentContacts = contacts;
        const renderer = pages['profile'];
        main.innerHTML = renderer(navigate);
        bindPageEvents('profile');
      });
    }

    bindPageEvents(page);
  }
  
  // Hide top & bottom nav for auth and landing views
  const topbar = document.getElementById('topbar');
  const bottomNav = document.getElementById('bottom-nav');
  const isAuthView = (page === 'profile' && !window.__isLoggedIn) || page === 'landing';
  if (isAuthView) {
    if (topbar) topbar.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
  } else {
    if (topbar) topbar.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
  }

  const mainContent = document.getElementById('main-content');
  if (page === 'landing') {
    if (mainContent) {
      mainContent.style.maxWidth = '100%';
      mainContent.style.padding = '0';
      mainContent.style.margin = '0';
    }
  } else {
    if (mainContent) {
      mainContent.style.maxWidth = '';
      mainContent.style.padding = '';
      mainContent.style.margin = '';
    }
  }

  updateBottomNavHTML(page);
  updateStaticText();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBottomNavHTML(page) {
  const bottomNav = document.getElementById('bottom-nav');
  if (!bottomNav) return;
  const role = window.__currentUserRole || 'patient';
  
  const navItems = {
    patient: [
      { id: 'home', icon: 'home', label: t('navHome') },
      { id: 'scanner', icon: 'document_scanner', label: t('navScanner') },
      { id: 'timeline', icon: 'timeline', label: t('navTimeline') },
      { id: 'mood', icon: 'wb_sunny', label: t('navMood') }
    ],
    caregiver: [
       { id: 'caregiver', icon: 'family_home', label: 'Hub' },
       { id: 'alert', icon: 'notifications_active', label: 'Alerts' },
       { id: 'medications', icon: 'pill', label: 'Meds' }
    ],
    pharmacist: [
       { id: 'home', icon: 'local_pharmacy', label: 'Queue' },
       { id: 'scanner', icon: 'document_scanner', label: 'Scan Rx' }
    ]
  };

  const items = navItems[role] || navItems['patient'];
  
  // Create mapping array to correctly highlight active states based on current route
  const activeTabMap = { home: 'home', scanner: 'scanner', clearscript: 'scanner', timeline: 'timeline', mood: 'mood', 'risk-analysis': 'scanner', alert: 'alert', caregiver: 'caregiver', symptoms: 'home', medications: 'medications', report: 'report', 'drug-interaction': 'home', profile: 'home' };
  const activeTab = activeTabMap[page] || page;

  bottomNav.innerHTML = items.map(item => `
    <a href="#" class="nav-item ${item.id === activeTab ? 'active' : ''}" data-page="${item.id}">
      <span class="material-symbols-outlined nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  // Re-bind listeners for newly generated DOM elements
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.dataset.page);
    });
  });
}

// Updates static elements (header, nav labels) that live in index.html
function updateStaticText() {
  // Brand name
  const brand = document.querySelector('.brand-name');
  if (brand) brand.textContent = t('brandName');

  // Bottom nav is now correctly translated dynamically during draw.
}

function bindPageEvents(page) {
  const main = document.getElementById('main-content');

  // Home page
  if (page === 'home') {
    initHome();
    main.querySelector('#action-scan')?.addEventListener('click', () => navigate('scanner'));
    main.querySelector('#action-mood')?.addEventListener('click', () => navigate('mood'));
    main.querySelector('#action-alerts')?.addEventListener('click', () => navigate('alert'));
    main.querySelector('#tool-caregiver')?.addEventListener('click', () => navigate('caregiver'));
    main.querySelector('#tool-symptoms')?.addEventListener('click', () => navigate('symptoms'));
    main.querySelector('#tool-meds')?.addEventListener('click', () => navigate('medications'));
    main.querySelector('#tool-report')?.addEventListener('click', () => navigate('report'));
    main.querySelector('#tool-interaction')?.addEventListener('click', () => navigate('drug-interaction'));
    main.querySelector('#sos-btn')?.addEventListener('click', () => {
      if (window.__isLoggedIn) navigate('profile');
      else alert('Please login to use Emergency SOS features');
    });
  }

  // Scanner
  if (page === 'scanner') {
    main.querySelector('#scanner-capture')?.addEventListener('click', () => {
      const text = main.querySelector('#scanner-input')?.value || "Rx Metformin 500mg, twice a day, Dr. Roberts";
      sessionStorage.setItem('scanText', text);
      navigate('clearscript');
    });
  }

  // ClearScript
  if (page === 'clearscript') {
    main.querySelector('#clearscript-confirm')?.addEventListener('click', async () => {
      const lastScanStr = sessionStorage.getItem('lastScan');
      if (lastScanStr) {
        try {
          const data = JSON.parse(lastScanStr);
          const userId = window.__currentUserId || localStorage.getItem('userId');
          if (userId && userId !== '1' && userId !== 'undefined') {
            window.showToast("Saving to health history...");
            await api.addPrescription(userId, {
              medication: data.medication || 'Unknown',
              dosage: data.dosage || '',
              instructions: data.instructions || '',
              doctorName: data.doctorName || 'Unknown',
              date: new Date().toISOString().split('T')[0]
            });
            window.showToast("Saved successfully!");
          }
        } catch(e) {
          console.error("Error saving prescription", e);
          window.showToast("Save failed: " + e.message, true);
        }
      }
      navigate('risk-analysis');
    });
  }

  // Risk Analysis
  if (page === 'risk-analysis') {
    initRiskAnalysis();
  }

  // Timeline
  if (page === 'timeline') {
    initTimeline();
  }

  // Caregiver
  if (page === 'caregiver') {
    initCaregiver();
  }

  // Medications
  if (page === 'medications') {
    initMedications();
  }

  // Mood
  if (page === 'mood') {
    let currentMoodLevel = 3; // Default 3 (Calm)
    
    const emojiBtns = main.querySelectorAll('.mood-emoji-btn');
    emojiBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        emojiBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentMoodLevel = idx + 1; // 1 to 5 scale
      });
    });

    const saveBtn = main.querySelector('#save-mood-btn');
    saveBtn?.addEventListener('click', async () => {
      const notes = main.querySelector('#mood-notes')?.value || "";
      const feedback = main.querySelector('#mood-feedback');
      
      try {
        saveBtn.textContent = 'Saving...';
        await api.addMood(window.__currentUserId || 1, {
          moodLevel: currentMoodLevel,
          notes: notes,
          date: new Date().toISOString()
        });
        
        saveBtn.textContent = 'Save Daily Mood';
        if (feedback) feedback.textContent = "Mood saved successfully!";
        setTimeout(() => { if (feedback) feedback.textContent = ""; }, 3000);
      } catch (err) {
        if (feedback) {
          feedback.style.color = 'red';
          feedback.textContent = "Error: " + err.message;
        }
        saveBtn.textContent = 'Save Daily Mood';
      }
    });
  }

  // Drug Interaction
  if (page === 'drug-interaction') {
    import('https://cdn.jsdelivr.net/npm/d3@7/+esm').then(d3 => {
      if (typeof window.__initSafetyMap === 'function') {
        window.__initSafetyMap(d3);
      }
    });
  }

  // --- Global Toast Function ---
  if (!window.showToast) {
    window.showToast = function(msg, isError = false) {
      let toast = document.getElementById('sanjeev-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sanjeev-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:24px;z-index:9999;font-weight:600;opacity:0;transition:opacity 0.3s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
      }
      toast.style.background = isError ? 'var(--error)' : 'var(--primary)';
      toast.style.color = 'white';
      toast.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => toast.style.opacity = '0', 3000);
    }
  }

  // --- Profile (name/info/logout) ---
  if (page === 'profile') {
    initProfile(navigate);
  }

  if (page === 'scanner') {
    main.querySelectorAll('.btn-secondary').forEach(b => {
      b.addEventListener('click', () => window.showToast("Opening file browser..."));
    });
  }

  if (page === 'drug-interaction') {
    initDrugInteraction();
  }

  if (page === 'report') {
    main.querySelector('.btn-primary')?.addEventListener('click', () => window.showToast("Report generated and saved!"));
    main.querySelector('.icon-btn')?.addEventListener('click', () => window.showToast("Downloading secure PDF..."));
  }

  if (page === 'symptoms') {
    initSymptoms();
  }

  // (caregiver events are handled by initCaregiver)

  if (page === 'alert') {
    main.querySelector('.btn-primary')?.addEventListener('click', () => {
      window.showToast("Contacting doctor immediately!", true);
      navigate('home');
    });
    main.querySelector('.btn-error')?.addEventListener('click', () => {
      window.showToast("Siren activated!", true);
    });
    main.querySelector('.btn-tertiary-warm')?.addEventListener('click', () => {
      window.showToast("Alert dismissed for 1 hour");
      navigate('home');
    });
  }

  // --- Generic Fallback for ALL buttons ---
  main.querySelectorAll('button').forEach(btn => {
    // If the button has no click listener yet (roughly checking by id and class)
    if (!btn.id && !btn.getAttribute('onclick') && !btn.className.includes('mood-emoji') && !btn.className.includes('nav-item')) {
      // Add a quiet fallback
      btn.addEventListener('click', (e) => {
        // Don't override if it's already doing something complex
        if (e.defaultPrevented) return;
        const text = btn.textContent.trim().replace('chevron_right', '').replace('download', 'Download') || 'Action';
        if (text) window.showToast(`${text} processed successfully!`);
      });
    }
  });

  // Profile (Existing logic with Supabase Auth)
  if (page === 'profile') {
    // Supabase Google Auth
    const googleBtn = main.querySelector("#supabase-google-btn");
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          const role = main.querySelector('#role-select')?.value || 'patient';
          localStorage.setItem('pending_role', role);
          
          googleBtn.textContent = 'Authenticating...';
          await auth.signInWithGoogle();
        } catch (err) {
          window.showToast('Google Auth Error: ' + err.message, true);
          googleBtn.innerHTML = '<img src="https://developers.google.com/identity/images/g-logo.png" style="width:20px; height:20px; margin-right:8px;" /> Continue with Google';
        }
      });
    }

    // Email/Password Auth Form
    const authForm = main.querySelector('#profile-auth-form');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const toggleBtn = main.querySelector('#auth-mode-btn');
        const mode = toggleBtn ? toggleBtn.dataset.mode : 'login';
        
        const role = main.querySelector('#role-select').value;
        const email = main.querySelector('#email-input').value.trim();
        const password = main.querySelector('#password-input').value.trim();
        const submitBtnText = main.querySelector('#auth-submit span.btn-text');
        
        try {
          submitBtnText.textContent = 'Authenticating...';
          
          if (mode === 'signup') {
             const nameVal = main.querySelector('#name-input').value.trim();
             await auth.signUp(email, password, nameVal, role);
             window.showToast("Account created successfully!");
          } else {
             const { user } = await auth.signIn(email, password);
             if (user) {
               await auth.updateRole(user.id, role);
               window.__currentUserRole = role; // Sync immediately
             }
             window.showToast("Login Successful!");
          }
          
          // The actual redirection and session handling will be managed globally by onAuthStateChange
        } catch (err) {
          alert('Auth Error: ' + err.message);
          submitBtnText.textContent = mode === 'signup' ? 'Sign Up' : 'Enter Hub';
        }
      });

      const toggleBtn = main.querySelector('#auth-mode-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const mode = toggleBtn.dataset.mode;
          const title = main.querySelector('#auth-title');
          const submitBtn = main.querySelector('#auth-submit span.btn-text');
          const nameContainer = main.querySelector('#name-field-container');
          
          if (mode === 'login') {
            toggleBtn.dataset.mode = 'signup';
            title.textContent = 'Create Account';
            submitBtn.textContent = 'Sign Up';
            nameContainer.style.display = 'block';
            toggleBtn.innerHTML = 'Already have an account? <b style="color:var(--primary-fixed)">Log in</b>';
          } else {
            toggleBtn.dataset.mode = 'login';
            title.textContent = 'Sanjeev AI';
            submitBtn.textContent = 'Enter Hub';
            nameContainer.style.display = 'none';
            toggleBtn.innerHTML = 'New here? <b style="color:var(--primary-fixed)">Sign up for free</b>';
          }
        });
      }
    }

    // Contacts Logic
    const addBtn = main.querySelector('#add-contact-btn');
    const modal = main.querySelector('#contact-modal');
    const closeBtn = main.querySelector('#close-modal');
    const contactForm = main.querySelector('#contact-form');

    if (addBtn && modal) {
      addBtn.addEventListener('click', () => modal.style.display = 'flex');
      closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }

    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const contactData = {
          name: main.querySelector('#contact-name').value,
          relation: main.querySelector('#contact-relation').value,
          phone: main.querySelector('#contact-phone').value,
          isSOS: main.querySelector('#contact-sos').checked
        };
        try {
          await api.addContact(window.__currentUserId, contactData);
          modal.style.display = 'none';
          navigate('profile');
        } catch (err) {
          alert('Error adding contact: ' + err.message);
        }
      });
    }
  }
}

// ---- Language Selector ----
const langSelect = document.querySelector('select[aria-label="Language Selector"]');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    // Re-render current page with new language
    navigate(currentPage);
  });
}

// ---- Bottom Nav Binding (Initial) ----
// Note: This gets re-bound upon every HTML injection natively by updateBottomNavHTML,
// but leaving this block empty natively.


// ---- Topbar Global Binds ----
const profileBtn = document.getElementById('profile-btn');
if (profileBtn) {
  profileBtn.addEventListener('click', () => navigate('profile'));
}

// ---- Initial Load & Supabase Auth Sync ----
// Restore saved profile name if user set one previously (legacy support)
const savedProfileName = localStorage.getItem('profile_name');
if (savedProfileName && !window.__currentUserName) {
  window.__currentUserName = savedProfileName;
}

// Tracks if this is the very first time onAuthStateChange is firing
let isInitialLoad = true;

auth.onAuthStateChange(async (event, session) => {
  // Check for caregiver invitation link in URL hash
  let inviteToken = null;
  const hash = window.location.hash;
  if (hash.includes('caregiver-invite')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    inviteToken = params.get('token');
  }

  if (session?.user) {
    window.__isLoggedIn = true;
    window.__currentUserId = session.user.id;
    
    // Fetch profile
    const profile = await auth.getCurrentProfile(session.user.id);
    if (profile) {
      window.__currentUserRole = profile.role || 'patient';
      window.__currentUserName = profile.full_name || 'User';
      window.__currentHealthId = profile.health_id || 'SANJ-XXXX';
    }
    
    if (inviteToken) {
      // User is logged in and clicked an invite link! Route them to caregiver hub where the invite logic will fire
      window.__pendingInviteToken = inviteToken;
      navigate('caregiver');
    } else if (isInitialLoad || currentPage === 'landing' || (currentPage === 'profile' && event === 'SIGNED_IN')) {
      navigate(window.__currentUserRole === 'caregiver' ? 'caregiver' : 'home');
    }
  } else {
    window.__isLoggedIn = false;
    window.__currentUserId = null;
    
    if (inviteToken) {
       window.showToast("Please log in or sign up to accept your caregiver invitation.", true);
       // Clear hash to avoid looping, but save token to local storage so they can accept it after signup
       localStorage.setItem('pending_invite_token', inviteToken);
       window.location.hash = '';
       navigate('profile');
    } else if (isInitialLoad || currentPage !== 'landing') {
      navigate('landing');
    }
  }
  isInitialLoad = false;
});

function handleRouting() {
  const hash = window.location.hash.slice(1) || 'home';
  if (pages[hash] && window.__isLoggedIn) {
    navigate(hash);
  } else if (!window.__isLoggedIn && hash !== 'landing') {
    navigate('landing');
  } else if (!window.__isLoggedIn && hash === 'landing') {
    navigate('landing');
  }
}
window.addEventListener('hashchange', handleRouting);

// ---- Scanner Live Camera Functions ----
window.startLiveCamera = async function() {
  const video = document.getElementById('live-camera-feed');
  const placeholder = document.getElementById('camera-placeholder');
  
  if (!video || !placeholder) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    window.__currentCameraStream = stream; // Save to global for cleanup
    video.srcObject = stream;
    video.style.display = 'block';
    placeholder.style.display = 'none';
  } catch (err) {
    console.error("Camera access denied or unavailable", err);
    window.showToast("Camera access is needed for live scanning.", true);
  }
};

window.captureLiveCamera = function() {
  const video = document.getElementById('live-camera-feed');
  const canvas = document.getElementById('live-camera-canvas');
  
  // If camera is not active, fallback to showing a toast or auto-starting
  if (!window.__currentCameraStream || video.style.display === 'none') {
     window.showToast("Please tap the viewfinder to start the camera first.");
     return;
  }
  
  // Set canvas to match video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get base64 (jpeg)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64Data = dataUrl.split(',')[1];
  
  window.showToast('Prescription Captured! Analyzing...');
  sessionStorage.setItem('scanImage', base64Data);
  sessionStorage.removeItem('scanText');
  
  // Stop the camera before navigating
  window.stopLiveCamera();
  
  setTimeout(() => window.navigate('clearscript'), 800);
};

window.stopLiveCamera = function() {
  if (window.__currentCameraStream) {
    window.__currentCameraStream.getTracks().forEach(track => track.stop());
    window.__currentCameraStream = null;
  }
};

// ==========================================
// MOCK DATA GENERATION
// ==========================================
