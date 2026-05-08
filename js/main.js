/* Neilz Network — main.js
   Loads data/services.json and drives the entire page. */

(async function () {
  'use strict';

  // ── Load JSON ──────────────────────────────────────────────
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
  const heroStats    = data.heroStats    || [];
  const promiseItems = data.promiseItems || [];
  const navLinks     = data.navLinks     || [];

  // ── Apply theme colours from JSON ──────────────────────────
  const root        = document.documentElement;
  const savedTheme  = localStorage.getItem('nn-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initMode    = (savedTheme === 'dark' || (!savedTheme && prefersDark)) ? 'dark' : 'light';

  root.setAttribute('data-theme', initMode);
  applyThemeVars(initMode);

  function applyThemeVars(mode) {
    if (!data.theme || !data.theme[mode]) return;
    Object.entries(data.theme[mode]).forEach(([k, v]) => {
      root.style.setProperty(k, v);
      // Recompute accent-derived variables automatically
      if (k === '--accent') {
        const rgb = hexToRgb(v);
        if (rgb) {
          const { r, g, b } = rgb;
          root.style.setProperty('--accent-dim',    `rgba(${r},${g},${b},0.09)`);
          root.style.setProperty('--accent-glow',   `rgba(${r},${g},${b},0.20)`);
          root.style.setProperty('--accent-border', `rgba(${r},${g},${b},0.28)`);
        }
      }
    });
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : null;
  }

  // ── SEO ────────────────────────────────────────────────────
  if (meta.seoTitle)       document.title = meta.seoTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && meta.seoDescription) metaDesc.content = meta.seoDescription;

  // ── Hero ───────────────────────────────────────────────────
  setText('hero-headline', meta.tagline);
  setText('hero-sub',      meta.subtitle);
  setText('hero-meet-btn', meta.heroMeetText || 'Meet Simon');

  const heroCta = $('hero-cta');
  if (heroCta) {
    heroCta.textContent = meta.heroCtaText;
    heroCta.href        = meta.heroCtaLink;
  }

  // Hero stats
  const statsEl = $('hero-stats');
  if (statsEl && heroStats.length) {
    statsEl.innerHTML = heroStats.map((s, i) => `
      ${i > 0 ? '<div class="stat__divider"></div>' : ''}
      <div class="stat">
        <span class="stat__num">${esc(s.num)}</span>
        <span class="stat__label">${esc(s.label)}</span>
      </div>`).join('');
  }

  // ── About ──────────────────────────────────────────────────
  setText('about-title',    meta.aboutTitle);
  setText('about-text',     meta.aboutText);
  setText('about-initials', initials(meta.ownerName));

  // Use base64 photo from JSON if present; otherwise keep assets/simon.jpg
  if (meta.aboutPhoto) {
    const photoEl = $('about-photo');
    if (photoEl) {
      photoEl.src = meta.aboutPhoto;
      photoEl.style.display = '';
      const inits = $('about-initials');
      if (inits) inits.style.display = 'none';
    }
  }

  // ── Contact ────────────────────────────────────────────────
  setText('contact-title',      meta.contactTitle || 'Ready to Build\nSomething?');
  setText('contact-sub',        meta.contactSub);
  setText('contact-email-text', meta.email);
  setText('footer-copy',        meta.footerText);

  const emailLink = $('contact-email');
  if (emailLink) emailLink.href = `mailto:${meta.email}`;

  // Promise items
  const promiseEl = $('promise-list');
  if (promiseEl && promiseItems.length) {
    promiseEl.innerHTML = promiseItems.map(item => `
      <div class="promise-item">
        <span class="promise-check">✓</span> ${esc(item)}
      </div>`).join('');
  }

  // ── Services grid ──────────────────────────────────────────
  const grid = $('services-grid');
  if (grid) {
    services.forEach((svc, i) => {
      const featured = !!svc.badge;
      const card = document.createElement('article');
      card.className = [
        'service-card', 'reveal', `reveal-delay-${i + 1}`,
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
        <a href="#contact" class="btn ${featured ? 'btn--primary' : 'btn--ghost'}">Get Started →</a>
      `;
      grid.appendChild(card);
    });
  }

  // ── Process steps ──────────────────────────────────────────
  const stepsEl = $('process-steps');
  if (stepsEl) {
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

  // ── Contact service dropdown ──────────────────────────────
  const serviceSelect = $('contact-service');
  if (serviceSelect) {
    services.forEach(svc => {
      const opt = document.createElement('option');
      opt.value = svc.id;
      opt.textContent = svc.name;
      serviceSelect.appendChild(opt);
    });
    const other = document.createElement('option');
    other.value = 'other';
    other.textContent = 'Something Else';
    serviceSelect.appendChild(other);
  }

  // ── Scroll-reveal observer ─────────────────────────────────
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ── Dark / Light mode toggle ──────────────────────────────
  const themeToggle = $('theme-toggle');

  themeToggle.addEventListener('click', () => {
    const isDark  = root.getAttribute('data-theme') === 'dark';
    const newMode = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', newMode);
    localStorage.setItem('nn-theme', newMode);
    applyThemeVars(newMode);
  });

  // ── Nav scroll effect ─────────────────────────────────────
  const nav = $('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile hamburger ─────────────────────────────────────
  const hamburger = $('hamburger');
  const navLinksEl = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('mobile-open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinksEl.classList.remove('mobile-open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Contact form (Formspree) ──────────────────────────────
  const form      = $('contact-form');
  const formNote  = $('form-note');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = form.querySelector('#contact-name').value.trim();
    const email   = form.querySelector('#contact-email-field').value.trim();
    const service = form.querySelector('#contact-service').value;
    const message = form.querySelector('#contact-message').value.trim();

    if (!name || !email) { showNote('Please fill in your name and email.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, service, message,
          _subject: `Neilz Network Inquiry — ${service || 'General'}` })
      });
      if (res.ok) {
        showNote("Message sent! I'll get back to you within 24 hours.", 'success');
        form.reset();
      } else {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.errors ? d.errors.map(e => e.message).join(', ') : 'Server error');
      }
    } catch {
      const subject = encodeURIComponent(`Neilz Network Inquiry — ${service || 'General'}`);
      const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`);
      window.location.href = `mailto:${meta.email}?subject=${subject}&body=${body}`;
      showNote('Opening your email client…', 'success');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
    setTimeout(() => showNote('', ''), 7000);
  });

  function showNote(msg, type) {
    formNote.textContent = msg;
    formNote.className = `form-note${type ? ' ' + type : ''}`;
  }

  // ── Active nav highlight ──────────────────────────────────
  const sections    = document.querySelectorAll('section[id]');
  const navLinkEls  = document.querySelectorAll('.nav__links a:not(.btn)');
  const sectionObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkEls.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--text)' : '';
        });
      }
    }),
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach(s => sectionObserver.observe(s));

})();

// ── Helpers ───────────────────────────────────────────────────
function $(id)         { return document.getElementById(id); }
function setText(id, t){ const el = $(id); if (el) el.textContent = t; }
function initials(n)   { return (n||'').split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2); }
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
