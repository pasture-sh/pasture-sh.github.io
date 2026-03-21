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

// Nav style when scrolled out of hero
const topNav = document.querySelector('.top-nav');
window.addEventListener('scroll', () => {
  if (!topNav) return;
  topNav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.8);
}, { passive: true });

// Scroll reveal
const revealEls = document.querySelectorAll(
  '.step, .feature-card, .req-list li, .section-title, .section-eyebrow'
);

const observer = new IntersectionObserver(
  entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children slightly
        const delay = (i % 6) * 60;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealEls.forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Waitlist form — submits to Formspree via fetch, shows inline confirmation
const waitlistForm = document.querySelector('.waitlist-form');
if (waitlistForm) {
  waitlistForm.addEventListener('submit', async e => {
    e.preventDefault();
    const input  = waitlistForm.querySelector('input');
    const button = waitlistForm.querySelector('button');
    if (!input.value.trim()) return;

    button.textContent = 'Sending…';
    button.disabled = true;

    try {
      const res = await fetch(waitlistForm.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(waitlistForm),
      });
      if (res.ok) {
        button.textContent = '✓ You\'re on the list!';
        button.style.background = '#617F67';
        button.style.color = 'white';
        input.disabled = true;
      } else {
        button.textContent = 'Try again';
        button.disabled = false;
      }
    } catch {
      button.textContent = 'Try again';
      button.disabled = false;
    }
  });
}

// Subtle parallax on hero content on scroll
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroContent && y < window.innerHeight) {
    heroContent.style.transform = `translateY(${y * 0.22}px)`;
    heroContent.style.opacity = 1 - (y / (window.innerHeight * 0.7));
  }
}, { passive: true });
