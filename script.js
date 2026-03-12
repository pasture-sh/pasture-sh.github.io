/* =========================================================
   Pasture — Landing Page Scripts
   ========================================================= */

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
        button.style.background = '#6db46b';
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
