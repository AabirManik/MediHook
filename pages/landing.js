export function renderLanding(navigate) {
  // Wait a tick for the DOM to update, then bind events for the landing page
  setTimeout(() => {
    // Scroll handling for sticky nav
    const nav = document.getElementById('landing-nav');
    if (nav) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      });
    }

    // FAQ Accordion logic
    const faqItems = document.querySelectorAll('.landing-faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.landing-faq-question');
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all others
        faqItems.forEach(i => {
          i.classList.remove('active');
          const ans = i.querySelector('.landing-faq-answer');
          if(ans) ans.style.maxHeight = null;
        });
        
        if (!isActive) {
          item.classList.add('active');
          const ans = item.querySelector('.landing-faq-answer');
          if(ans) ans.style.maxHeight = ans.scrollHeight + "px";
        }
      });
    });

    // Mobile Menu Toggle
    const menuBtn = document.getElementById('landing-menu-btn');
    const mobileMenu = document.getElementById('landing-mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        const icon = menuBtn.querySelector('.material-symbols-outlined');
        if (mobileMenu.classList.contains('active')) {
          icon.textContent = 'close';
        } else {
          icon.textContent = 'menu';
        }
      });
    }

    // CTA routing
    const ctas = document.querySelectorAll('.landing-cta-signin, .landing-cta-start');
    ctas.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('profile'); // Assuming profile handles auth
      });
    });

    // Smooth scroll for anchors
    document.querySelectorAll('.landing-nav-links a[href^="#"], .landing-mobile-menu a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          if (mobileMenu && mobileMenu.classList.contains('active')) {
             mobileMenu.classList.remove('active');
             const icon = menuBtn.querySelector('.material-symbols-outlined');
             if(icon) icon.textContent = 'menu';
          }
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

  }, 50);

  return `
  <div class="landing-page-container">
    <!-- SECTION 1 - NAVIGATION -->
    <nav id="landing-nav" class="landing-nav">
      <div class="landing-nav-inner">
        <div class="landing-brand">
          <div class="brand-avatar">
            <span class="material-symbols-outlined brand-icon" style="font-variation-settings: 'FILL' 1; color: var(--primary-fixed);">spa</span>
          </div>
          <h1 class="brand-name">Sanjeev AI</h1>
        </div>
        <div class="landing-nav-links desktop-only">
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#responsible-ai">Responsible AI</a>
          <a href="#for-you">For You</a>
        </div>
        <div class="landing-nav-actions desktop-only">
          <button class="btn-secondary landing-cta-signin" style="padding: 8px 16px;">Sign In</button>
          <button class="btn-primary landing-cta-start" style="padding: 8px 20px;">Get Started</button>
        </div>
        <button id="landing-menu-btn" class="icon-btn mobile-only" aria-label="Menu">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
      <!-- Mobile Menu -->
      <div id="landing-mobile-menu" class="landing-mobile-menu">
        <a href="#how-it-works">How It Works</a>
        <a href="#features">Features</a>
        <a href="#responsible-ai">Responsible AI</a>
        <a href="#for-you">For You</a>
        <div style="display:flex; flex-direction:column; gap:var(--space-4); margin-top:var(--space-6);">
          <button class="btn-secondary landing-cta-signin" style="width:100%; justify-content:center;">Sign In</button>
          <button class="btn-primary landing-cta-start" style="width:100%; justify-content:center;">Get Started</button>
        </div>
      </div>
    </nav>

    <!-- SECTION 2 - HERO -->
    <section class="landing-hero">
      <div class="landing-hero-content">
        <span class="landing-eyebrow">Your medications, unified.</span>
        <h2 class="landing-headline">One place to understand your medications. Together.</h2>
        <p class="landing-subheadline">Sanjeev AI helps bring your medications, symptoms, and wellbeing into one unified safety view, revealing important connections.</p>
        <div class="landing-hero-ctas">
          <button class="btn-primary landing-cta-start" style="padding: 14px 28px; font-size: 1.1rem; box-shadow: 0 8px 24px rgba(1,45,29,0.15);">Get Started</button>
          <a href="#how-it-works" class="btn-secondary" style="padding: 14px 28px; font-size: 1.1rem; text-decoration:none;">See How It Works</a>
        </div>
        <div class="landing-trust-badge">
          <span class="material-symbols-outlined" style="color:var(--primary); font-size:1.2rem;">health_and_safety</span>
          <span>AI-powered insights • Human verification • Not a replacement for medical advice</span>
        </div>
      </div>
      <div class="landing-hero-visual">
        <div class="hero-network-visual">
          <div class="network-nodes-left">
            <div class="network-node doc-node"><span class="material-symbols-outlined">stethoscope</span> Dr. A</div>
            <div class="network-node doc-node"><span class="material-symbols-outlined">stethoscope</span> Dr. B</div>
            <div class="network-node doc-node"><span class="material-symbols-outlined">stethoscope</span> Dr. C</div>
          </div>
          <div class="network-lines-in">
            <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="none">
              <path class="network-path" d="M0,25 C50,25 50,75 100,75" />
              <path class="network-path" d="M0,75 C50,75 50,75 100,75" />
              <path class="network-path" d="M0,125 C50,125 50,75 100,75" />
            </svg>
          </div>
          <div class="network-center-node">
            <div class="unified-profile">
              <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--primary);">person</span>
              <span>Unified Profile</span>
            </div>
          </div>
          <div class="network-lines-out">
            <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="none">
              <path class="network-path" d="M0,75 C50,75 50,25 100,25" />
              <path class="network-path" d="M0,75 C50,75 50,75 100,75" />
              <path class="network-path" d="M0,75 C50,75 50,125 100,125" />
            </svg>
          </div>
          <div class="network-nodes-right">
            <div class="network-node insight-node"><span class="material-symbols-outlined">shield</span> Safety</div>
            <div class="network-node insight-node"><span class="material-symbols-outlined">wb_sunny</span> Mood</div>
            <div class="network-node insight-node"><span class="material-symbols-outlined">warning</span> Risks</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3 - THE PROBLEM -->
    <section class="landing-section landing-problem">
      <div class="landing-section-header">
        <h2 class="landing-section-title">Healthcare is connected. Prescriptions often aren't.</h2>
        <p class="landing-section-subtitle">Each prescription may make sense on its own. The risk can appear when the complete medication picture is viewed together.</p>
      </div>
      <div class="landing-problem-cards">
        <div class="problem-card">
          <div class="problem-icon"><span class="material-symbols-outlined">monitor_heart</span></div>
          <h4>Doctor A</h4>
          <p>Prescribes Heart Medicine</p>
        </div>
        <div class="problem-card">
          <div class="problem-icon"><span class="material-symbols-outlined">accessibility_new</span></div>
          <h4>Doctor B</h4>
          <p>Prescribes Pain Medicine</p>
        </div>
        <div class="problem-card">
          <div class="problem-icon"><span class="material-symbols-outlined">bedtime</span></div>
          <h4>Doctor C</h4>
          <p>Prescribes Sleep Medicine</p>
        </div>
      </div>
      <div class="problem-arrow">
        <span class="material-symbols-outlined">arrow_downward</span>
      </div>
      <div class="problem-conclusion card-white">
        <span class="material-symbols-outlined" style="color:var(--error); font-size:2rem; margin-bottom:var(--space-2);">visibility_off</span>
        <h4>Patient takes everything together.</h4>
        <p>But no one sees the complete picture.</p>
      </div>
    </section>

    <!-- SECTION 4 - WHAT SANJEEV AI DOES -->
    <section class="landing-section landing-pillars-section">
      <div class="landing-section-header">
        <h2 class="landing-section-title">Sanjeev AI connects the missing dots.</h2>
      </div>
      <div class="landing-pillars-grid">
        <div class="landing-pillar-card card">
          <div class="pillar-icon-wrapper"><span class="material-symbols-outlined">hub</span></div>
          <h3 class="pillar-title">UNIFY</h3>
          <p>Bring prescriptions from multiple doctors into one organized medication view.</p>
        </div>
        <div class="landing-pillar-card card">
          <div class="pillar-icon-wrapper"><span class="material-symbols-outlined">troubleshoot</span></div>
          <h3 class="pillar-title">ANALYZE</h3>
          <p>Identify potential interactions and patterns using AI-assisted analysis.</p>
        </div>
        <div class="landing-pillar-card card">
          <div class="pillar-icon-wrapper"><span class="material-symbols-outlined">translate</span></div>
          <h3 class="pillar-title">EXPLAIN</h3>
          <p>Turn complex medication information into clear, understandable language.</p>
        </div>
        <div class="landing-pillar-card card">
          <div class="pillar-icon-wrapper"><span class="material-symbols-outlined">support_agent</span></div>
          <h3 class="pillar-title">ESCALATE</h3>
          <p>Help users understand when something may need attention from a doctor, pharmacist, or caregiver.</p>
        </div>
      </div>
    </section>

    <!-- SECTION 5 - HOW IT WORKS -->
    <section id="how-it-works" class="landing-section landing-how-it-works">
      <div class="landing-section-header">
        <h2 class="landing-section-title">How It Works</h2>
        <p class="landing-section-subtitle">A simple, transparent process to build your unified medication safety profile.</p>
      </div>
      <div class="landing-steps-container">
        <div class="landing-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Add Your Prescription</h4>
            <p>Upload a prescription image or enter medication details manually.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>AI Reads It</h4>
            <p>ClearScript extracts medication information and shows a confidence level.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Verify Important Details</h4>
            <p>If confidence is uncertain, you confirm or edit the information.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>Build Your Unified View</h4>
            <p>Medications from multiple doctors are organized together.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="step-number">5</div>
          <div class="step-content">
            <h4>Understand Potential Risks</h4>
            <p>Sanjeev AI highlights potential interactions and patterns that may require review.</p>
          </div>
        </div>
        <div class="landing-step">
          <div class="step-number">6</div>
          <div class="step-content">
            <h4>Take Informed Next Steps</h4>
            <p>Understand the information clearly and discuss concerns with your healthcare professional.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6 - FEATURE SHOWCASE -->
    <section id="features" class="landing-section landing-features">
      <div class="landing-section-header">
        <h2 class="landing-section-title">Platform Features</h2>
      </div>

      <!-- Feature 1: ClearScript -->
      <div class="landing-feature-row">
        <div class="feature-text">
          <span class="label-caps">ClearScript OCR</span>
          <h3>From handwritten prescription to structured medication information.</h3>
          <p>AI uncertainty is visible—not hidden. Our three-layer confidence system ensures humans remain in the loop.</p>
          <ul class="feature-list">
            <li><span class="material-symbols-outlined" style="color:#2E7D32;">check_circle</span> <strong>High Confidence:</strong> Auto-processed</li>
            <li><span class="material-symbols-outlined" style="color:#E65100;">warning</span> <strong>Medium Confidence:</strong> Review and confirm</li>
            <li><span class="material-symbols-outlined" style="color:#C62828;">error</span> <strong>Low Confidence:</strong> Manual verification required</li>
          </ul>
        </div>
        <div class="feature-visual card-white">
          <div class="mock-ui">
             <div class="mock-header">
               <span class="mock-chip" style="background:#E8F5E9; color:#2E7D32; font-weight:700;">&gt;90% Match</span>
             </div>
             <div class="mock-body">
               <h4>Metformin</h4>
               <span class="label-caps">500mg • Twice a day</span>
             </div>
          </div>
        </div>
      </div>

      <!-- Feature 2: Unified View -->
      <div class="landing-feature-row reverse">
        <div class="feature-text">
          <span class="label-caps">Unified Medication View</span>
          <h3>See medications from multiple doctors in one place.</h3>
          <p>Stop relying on scattered paper prescriptions and siloed pharmacy records. Build one complete, holistic view of your active medications.</p>
        </div>
        <div class="feature-visual">
          <div class="mock-flow-visual">
            <div class="mock-flow-item card">Dr. A → Heart Meds</div>
            <div class="mock-flow-item card">Dr. B → Pain Meds</div>
            <div class="mock-flow-item card">Dr. C → Sleep Meds</div>
            <div class="mock-flow-arrow"><span class="material-symbols-outlined">arrow_downward</span></div>
            <div class="mock-flow-result card-white" style="border: 2px solid var(--primary-fixed);">Your Medication Profile</div>
          </div>
        </div>
      </div>

      <!-- Feature 3: Safety Map -->
      <div class="landing-feature-row">
        <div class="feature-text">
          <span class="label-caps">Safety Map™</span>
          <h3>See relationships between medications.</h3>
          <p>Visual connections can help users understand why certain medications may require closer review. The interactive map highlights potential CYP enzyme interactions and clashes.</p>
          <div class="feature-disclaimer">
            <span class="material-symbols-outlined">info</span>
            <small>The graph alone does not provide clinical decisions. Consult your doctor.</small>
          </div>
        </div>
        <div class="feature-visual" style="background:#0D1117; color:white; padding: 0;">
          <img src="/changes/Cascade.png" alt="Safety Map" style="width:100%; height:100%; object-fit:cover; border-radius: var(--radius-2xl);" />
        </div>
      </div>

      <!-- Feature 4: Cascade Patterns -->
      <div class="landing-feature-row reverse">
        <div class="feature-text">
          <span class="label-caps">Cascade Early Warning</span>
          <h3>Potential Prescription Cascade Patterns.</h3>
          <p>Sometimes a new medication may appear after a symptom that could be related to an earlier medication. We help identify these temporal patterns.</p>
          <div class="feature-disclaimer">
            <span class="material-symbols-outlined">info</span>
            <small>A detected pattern is not a diagnosis. It is a signal for further review.</small>
          </div>
        </div>
        <div class="feature-visual card-white">
          <div class="mock-timeline">
            <div class="mock-tl-item">Medication A Started</div>
            <div class="mock-tl-connector"></div>
            <div class="mock-tl-item highlight">New Symptom Reported</div>
            <div class="mock-tl-connector"></div>
            <div class="mock-tl-item">Medication B Added</div>
            <div class="mock-tl-connector"></div>
            <div class="mock-tl-item alert">Potential Pattern Identified</div>
          </div>
        </div>
      </div>

      <!-- Feature 5: Mood Timeline -->
      <div class="landing-feature-row">
        <div class="feature-text">
          <span class="label-caps">Mood & Medication Timeline</span>
          <h3>Understand possible changes over time.</h3>
          <p>Sanjeev AI can highlight temporal patterns by cross-referencing your daily mood and symptom logs with your active medication timeline.</p>
          <div class="feature-disclaimer">
            <span class="material-symbols-outlined">info</span>
            <small>Correlation does not automatically mean causation.</small>
          </div>
        </div>
        <div class="feature-visual" style="padding: 0;">
           <img src="/changes/mood.jpg" alt="Mood Timeline" style="width:100%; height:100%; object-fit:cover; border-radius: var(--radius-2xl);" />
        </div>
      </div>
    </section>

    <!-- SECTION 7 - RESPONSIBLE AI -->
    <section id="responsible-ai" class="landing-section landing-responsible-ai">
      <div class="landing-section-header">
        <h2 class="landing-section-title" style="color:var(--on-primary);">AI should be honest about what it knows.</h2>
        <p class="landing-section-subtitle" style="color:var(--primary-fixed);">We believe in human-in-the-loop healthcare technology.</p>
      </div>
      <div class="responsible-ai-content">
        <div class="responsible-ai-flow">
          <div class="ra-flow-step">AI Analysis</div>
          <span class="material-symbols-outlined ra-arrow">arrow_downward</span>
          <div class="ra-flow-step highlight">Confidence Transparency</div>
          <span class="material-symbols-outlined ra-arrow">arrow_downward</span>
          <div class="ra-flow-step highlight">Human Verification</div>
          <span class="material-symbols-outlined ra-arrow">arrow_downward</span>
          <div class="ra-flow-step">Evidence & Context</div>
          <span class="material-symbols-outlined ra-arrow">arrow_downward</span>
          <div class="ra-flow-step final">Professional Review</div>
        </div>
        <div class="responsible-ai-principles">
          <div class="ra-principle">
            <h4>1. Confidence Transparency</h4>
            <p>The system shows uncertainty instead of pretending every AI result is correct.</p>
          </div>
          <div class="ra-principle">
            <h4>2. Human Verification</h4>
            <p>Important medication information can be reviewed and corrected by the user.</p>
          </div>
          <div class="ra-principle">
            <h4>3. Explainable Insights</h4>
            <p>Potential risks should be explained clearly, not hidden behind a mysterious AI score.</p>
          </div>
          <div class="ra-principle">
            <h4>4. Humans Make Medical Decisions</h4>
            <p>Sanjeev AI provides information and awareness. Medical decisions remain with qualified healthcare professionals.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 8 - WHO IS IT FOR -->
    <section id="for-you" class="landing-section landing-who">
      <div class="landing-section-header">
        <h2 class="landing-section-title">Built for the whole care circle.</h2>
      </div>
      <div class="landing-who-grid">
        <div class="card-white who-card">
          <span class="material-symbols-outlined">person</span>
          <h4>PATIENT</h4>
          <p>Understand your complete medication picture and track how your body feels.</p>
        </div>
        <div class="card-white who-card">
          <span class="material-symbols-outlined">family_home</span>
          <h4>CAREGIVER</h4>
          <p>Stay informed and help loved ones monitor medication-related concerns and compliance.</p>
        </div>
        <div class="card-white who-card">
          <span class="material-symbols-outlined">stethoscope</span>
          <h4>DOCTOR</h4>
          <p>Receive a more complete view of a patient's medication history outside your clinic.</p>
        </div>
        <div class="card-white who-card">
          <span class="material-symbols-outlined">local_pharmacy</span>
          <h4>PHARMACIST</h4>
          <p>Review medication information with additional patient context before dispensing.</p>
        </div>
      </div>
    </section>

    <!-- SECTION 9 - FAQ -->
    <section class="landing-section landing-faq">
      <div class="landing-section-header">
        <h2 class="landing-section-title">Frequently Asked Questions</h2>
      </div>
      <div class="faq-container">
        <div class="landing-faq-item">
          <button class="landing-faq-question">
            Does Sanjeev AI replace my doctor?
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div class="landing-faq-answer">
            <p>No. Sanjeev AI is designed to provide medication information and potential risk insights. Medical decisions should always be made with qualified healthcare professionals.</p>
          </div>
        </div>
        <div class="landing-faq-item">
          <button class="landing-faq-question">
            Can AI make mistakes?
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div class="landing-faq-answer">
            <p>Yes. AI systems can be uncertain or incorrect. Sanjeev AI is designed to make uncertainty visible and allow human verification.</p>
          </div>
        </div>
        <div class="landing-faq-item">
          <button class="landing-faq-question">
            Does a potential interaction mean I should stop my medication?
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div class="landing-faq-answer">
            <p>No. Do not stop or change prescribed medication based solely on an AI-generated insight. Discuss concerns with a qualified doctor or pharmacist.</p>
          </div>
        </div>
        <div class="landing-faq-item">
          <button class="landing-faq-question">
            What is a prescription cascade?
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div class="landing-faq-answer">
            <p>A prescription cascade happens when a side effect of one medication is mistakenly identified as a new medical condition, leading to the prescription of a second medication to treat that side effect.</p>
          </div>
        </div>
        <div class="landing-faq-item">
          <button class="landing-faq-question">
            How does ClearScript work?
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div class="landing-faq-answer">
            <p>ClearScript uses advanced OCR and AI to read prescription text or images, extracting the medication name and dosage, and providing a confidence score so you know when to double-check its reading.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 10 - FINAL CTA -->
    <section class="landing-section landing-final-cta">
      <div class="final-cta-content">
        <h2>See your medication picture. Together.</h2>
        <p>Bring your medications into one place and better understand the connections that may otherwise remain hidden.</p>
        <div class="landing-hero-ctas" style="justify-content:center; margin-top:var(--space-6);">
          <button class="btn-primary landing-cta-start" style="padding: 14px 32px; font-size: 1.1rem; box-shadow: 0 8px 24px rgba(1,45,29,0.15);">Get Started with Sanjeev AI</button>
          <button class="btn-secondary landing-cta-signin" style="padding: 14px 32px; font-size: 1.1rem;">Sign In</button>
        </div>
      </div>
    </section>

    <!-- SECTION 11 - FOOTER -->
    <footer class="landing-footer">
      <div class="landing-footer-inner">
        <div class="landing-footer-brand">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="color:var(--primary-fixed);">spa</span>
            <span style="font-family:var(--font-headline); font-weight:700; color:var(--on-primary);">Sanjeev AI</span>
          </div>
          <p style="margin-top:var(--space-4); color:var(--on-primary-container); font-size:0.875rem;">
            A unified safety layer for your physical medications and mental health. Built for AI UTKARSH 2026.
          </p>
        </div>
        <div class="landing-footer-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#responsible-ai">Responsible AI</a>
          <a href="#for-you">For You</a>
        </div>
      </div>
      <div class="landing-footer-disclaimer">
        <p><strong>Medical Disclaimer:</strong> Sanjeev AI provides informational and AI-assisted insights and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        <p style="margin-top:var(--space-2); opacity:0.7;">&copy; 2026 Sanjeev AI. All rights reserved.</p>
      </div>
    </footer>
  </div>
  `;
}
