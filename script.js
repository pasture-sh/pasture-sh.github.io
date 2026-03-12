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

// Waitlist form
function handleWaitlist(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const email = input.value.trim();
  if (!email) return;

  button.textContent = '✓ You\'re on the list!';
  button.disabled = true;
  input.disabled = true;
  button.style.background = '#6db46b';
  button.style.color = 'white';
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
