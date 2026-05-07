/* Neilz Network — main.js
   Fetches data/services.json and populates the page. */

(async function () {
  'use strict';

  // ── Load data ──────────────────────────────────────────────
  let data;
  try {
    const res = await fetch('data/services.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('[NeilzNetwork] Could not load services.json:', err);
    return;
  }

  const { meta, services, processSteps } = data;

  // ── Page meta ──────────────────────────────────────────────
  document.title = `${meta.businessName} — Professional Web Design & Hosting`;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = meta.subtitle;

  // ── Hero ───────────────────────────────────────────────────
  setText('hero-headline', meta.tagline);
  setText('hero-sub', meta.subtitle);

  const heroCta = $('hero-cta');
  if (heroCta) {
    heroCta.textContent = meta.heroCtaText;
    heroCta.href = meta.heroCtaLink;
  }

  // ── About ──────────────────────────────────────────────────
  setText('about-title', meta.aboutTitle);
  setText('about-text', meta.aboutText);
  setText('about-initials', initials(meta.ownerName));

  // ── Contact ────────────────────────────────────────────────
  const emailLink = $('contact-email');
  if (emailLink) {
    emailLink.href = `mailto:${meta.email}`;
  }
  setText('contact-email-text', meta.email);
  setText('footer-copy', meta.footerText);

  // ── Services grid ──────────────────────────────────────────
  const grid = $('services-grid');
  if (grid) {
    services.forEach((svc, i) => {
      const featured = !!svc.badge;
      const card = document.createElement('article');
      card.className = [
        'service-card',
        'reveal',
        `reveal-delay-${i + 1}`,
        featured ? 'service-card--featured' : ''
      ].filter(Boolean).join(' ');

      card.innerHTML = `
        ${svc.badge ? `<div class="service-card__badge">⚡ ${esc(svc.badge)}</div>` : ''}
        <span class="service-card__icon" aria-hidden="true">${esc(svc.icon)}</span>
        <h3 class="service-card__name">${esc(svc.name)}</h3>
        <p class="service-card__desc">${esc(svc.description)}</p>
        <div class="service-card__price">
          <span class="price-main">${esc(svc.price)}</span>
          <span class="price-note">${esc(svc.priceNote)}</span>
        </div>
        <ul class="service-card__features" aria-label="Features">
          ${svc.features.map(f => `
            <li class="feature-item">
              <span class="feature-check" aria-hidden="true">✓</span>
              ${esc(f)}
            </li>`).join('')}
        </ul>
        <a href="#contact" class="btn ${featured ? 'btn--primary' : 'btn--ghost'}">
          Get Started →
        </a>
      `;
      grid.appendChild(card);
    });
  }

  // ── Process steps ──────────────────────────────────────────
  const stepsEl = $('process-steps');
  if (stepsEl) {
    // Connecting line between step circles
    const connector = document.createElement('div');
    connector.className = 'process__connector';
    connector.setAttribute('aria-hidden', 'true');
    stepsEl.appendChild(connector);

    processSteps.forEach((step, i) => {
      const div = document.createElement('div');
      div.className = `process-step reveal reveal-delay-${i + 1}`;
      div.innerHTML = `
        <div class="process-step__num" aria-hidden="true">${esc(step.number)}</div>
        <h3 class="process-step__title">${esc(step.title)}</h3>
        <p class="process-step__desc">${esc(step.description)}</p>
      `;
      stepsEl.appendChild(div);
    });
  }

  // ── Populate contact service dropdown ─────────────────────
  const serviceSelect = $('contact-service');
  if (serviceSelect) {
    services.forEach(svc => {
      const opt = document.createElement('option');
      opt.value = svc.id;
      opt.textContent = svc.name;
      serviceSelect.appendChild(opt);
    });
    // Add general option
    const other = document.createElement('option');
    other.value = 'other';
    other.textContent = 'Something Else';
    serviceSelect.appendChild(other);
  }

  // ── Scroll-reveal observer ─────────────────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ── Nav scroll effect ─────────────────────────────────────
  const nav = $('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile nav hamburger ──────────────────────────────────
  const hamburger = $('hamburger');
  const navLinks = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Contact form ──────────────────────────────────────────
  const form = $('contact-form');
  const formNote = $('form-note');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = form.querySelector('#contact-name').value.trim();
    const email   = form.querySelector('#contact-email-field').value.trim();
    const service = form.querySelector('#contact-service').value;
    const message = form.querySelector('#contact-message').value.trim();

    if (!name || !email) {
      showNote('Please fill in your name and email.', 'error');
      return;
    }

    const subject = encodeURIComponent(`Neilz Network Inquiry — ${service || 'General'}`);
    const body    = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`
    );

    window.location.href = `mailto:${meta.email}?subject=${subject}&body=${body}`;
    showNote('Opening your email client…', 'success');
    setTimeout(() => showNote('', ''), 5000);
  });

  function showNote(msg, type) {
    formNote.textContent = msg;
    formNote.className = `form-note${type ? ' ' + type : ''}`;
  }

  // ── Smooth active nav highlight ───────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav__links a:not(.btn)');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinkEls.forEach(a => {
            a.style.color = a.getAttribute('href') === `#${id}`
              ? 'var(--text)'
              : '';
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(s => sectionObserver.observe(s));

})();

// ── Helpers ───────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function initials(name) {
  return (name || '')
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
