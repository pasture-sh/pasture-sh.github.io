/* =========================================================
   Pasture — Landing Page Scripts
   ========================================================= */

// ── Theme toggle ─────────────────────────────────────────

const THEME_KEY = 'pasture-theme';
const html = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');

const SUN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
const MOON_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  if (toggleBtn) {
    toggleBtn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// Default to light; respect saved preference
const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
applyTheme(savedTheme);

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// ── Scroll: nav + parallax (single listener) ─────────────

const topNav      = document.querySelector('.top-nav');
const heroContent = document.querySelector('.hero-content');
const heroPhone   = document.querySelector('.hero-phone');

window.addEventListener('scroll', () => {
  const y = window.scrollY;

  if (topNav) topNav.classList.toggle('scrolled', y > window.innerHeight * 0.8);

  if (y < window.innerHeight) {
    if (heroContent) {
      heroContent.style.transform = `translateY(${y * 0.22}px)`;
      heroContent.style.opacity = 1 - (y / (window.innerHeight * 0.7));
    }
    if (heroPhone) {
      heroPhone.style.transform = `translateY(${y * 0.14}px)`;
      heroPhone.style.opacity = 1 - (y / (window.innerHeight * 0.8));
    }
  }
}, { passive: true });

// ── Scroll reveal ─────────────────────────────────────────

const revealArray = Array.from(document.querySelectorAll(
  '.step, .feature-card, .req-list li, .section-title, .section-eyebrow'
));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Use stable DOM index so stagger order is consistent regardless of batch size
        const i = revealArray.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), (i % 6) * 60);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealArray.forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// ── Beta signup form ──────────────────────────────────────

const betaForm    = document.getElementById('beta-form');
const betaSuccess = document.getElementById('beta-success');
const betaWrap    = document.getElementById('beta-form-wrap');

if (betaForm) {
  betaForm.addEventListener('submit', async e => {
    e.preventDefault();
    const button    = betaForm.querySelector('button');
    const firstName = betaForm.querySelector('[name="firstName"]').value.trim();
    const email     = betaForm.querySelector('[name="email"]').value.trim();
    if (!firstName || !email) return;

    button.textContent = 'Joining…';
    button.disabled = true;

    const workerUrl = betaForm.dataset.worker;

    try {
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Fade out form, reveal success state
        betaWrap.style.transition = 'opacity 0.3s';
        betaWrap.style.opacity = '0';
        setTimeout(() => {
          betaWrap.hidden = true;
          betaSuccess.hidden = false;
          betaSuccess.style.opacity = '0';
          betaSuccess.style.transition = 'opacity 0.4s';
          requestAnimationFrame(() => { betaSuccess.style.opacity = '1'; });
        }, 300);
      } else {
        const msg = data.error === 'already_registered'
          ? 'Already registered — check your email for the TestFlight invite.'
          : 'Something went wrong. Try again.';
        button.textContent = msg;
        button.disabled = false;
      }
    } catch {
      button.textContent = 'Try again';
      button.disabled = false;
    }
  });
}

// ── Feature card modals ───────────────────────────────────

const featureModal = document.getElementById('feature-modal');

if (featureModal) {
  const modalEmoji    = document.getElementById('modal-emoji');
  const modalTitle    = document.getElementById('modal-title');
  const modalBody     = document.getElementById('modal-body');
  const modalClose    = document.getElementById('modal-close');
  const modalBackdrop = featureModal.querySelector('.feature-modal-backdrop');

  let savedScrollY = 0;

  function openModal(card) {
    savedScrollY = window.scrollY;
    modalEmoji.textContent = card.querySelector('.feature-emoji').textContent;
    modalTitle.textContent = card.querySelector('h3').textContent;
    modalBody.innerHTML    = card.dataset.detail;
    featureModal.classList.add('open');
    // Lock scroll; save position so page doesn't jump to top (iOS Safari fix)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${savedScrollY}px`;
    modalClose.focus();
  }

  function closeModal() {
    featureModal.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    // Bypass smooth-scroll so position restores instantly, not with a jarring animation
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScrollY);
    requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ''; });
  }

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && featureModal.classList.contains('open')) closeModal();
  });
}
