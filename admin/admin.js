/* Neilz Network — admin.js
   Handles login, content editing, and JSON export for the admin panel. */

(function () {
  'use strict';

  let siteData = null; // live copy of services.json in memory

  // ── Boot ──────────────────────────────────────────────────
  async function init() {
    // Load services.json from one level up
    try {
      const res = await fetch('../data/services.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      siteData = await res.json();
    } catch (err) {
      showError('Could not load ../data/services.json — ' + err.message);
      return;
    }

    setupLogin();
  }

  // ── Login ─────────────────────────────────────────────────
  function setupLogin() {
    const btn   = $('login-btn');
    const input = $('pw-input');
    const err   = $('login-error');

    function attempt() {
      err.textContent = '';
      if (input.value === siteData.adminPassword) {
        $('login-screen').classList.add('hidden');
        $('admin-panel').classList.remove('hidden');
        buildAdmin();
      } else {
        err.textContent = 'Incorrect password. Try again.';
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    input.focus();
  }

  // ── Build admin UI ────────────────────────────────────────
  function buildAdmin() {
    buildServicesEditor();
    buildMetaEditor();
    setupTabs();
    setupDownload();
  }

  // ── Tab switching ─────────────────────────────────────────
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        $(`tab-${tab}`).classList.add('active');
      });
    });
  }

  // ── Services Editor ───────────────────────────────────────
  function buildServicesEditor() {
    const container = $('services-editor');
    container.innerHTML = '';

    siteData.services.forEach((svc, idx) => {
      const card = document.createElement('div');
      card.className = 'service-editor-card';
      card.dataset.idx = idx;

      card.innerHTML = `
        <div class="service-editor-header">
          <div class="service-editor-header-left">
            <span class="service-editor-icon">${esc(svc.icon)}</span>
            <div>
              <div class="service-editor-name">${esc(svc.name)}</div>
              <div class="service-editor-price">${esc(svc.price)} ${esc(svc.priceNote)}</div>
            </div>
          </div>
          <span class="service-editor-toggle">▾</span>
        </div>
        <div class="service-editor-body">
          <div style="margin-top:20px;">
            <div class="two-col">
              <div class="field-group">
                <label>Icon / Emoji</label>
                <input type="text" data-field="icon" value="${esc(svc.icon)}" maxlength="8">
              </div>
              <div class="field-group">
                <label>Service ID (no spaces)</label>
                <input type="text" data-field="id" value="${esc(svc.id)}" maxlength="50">
              </div>
            </div>

            <div class="field-group">
              <label>Service Name</label>
              <input type="text" data-field="name" value="${esc(svc.name)}">
            </div>

            <div class="field-group">
              <label>Description</label>
              <textarea data-field="description" rows="3">${esc(svc.description)}</textarea>
            </div>

            <div class="two-col">
              <div class="field-group">
                <label>Price (e.g. $499)</label>
                <input type="text" data-field="price" value="${esc(svc.price)}">
              </div>
              <div class="field-group">
                <label>Price Note (e.g. one-time)</label>
                <input type="text" data-field="priceNote" value="${esc(svc.priceNote)}">
              </div>
            </div>

            <div class="field-group">
              <label>Badge Text (leave blank for none)</label>
              <div class="badge-row">
                <input type="text" data-field="badge" value="${esc(svc.badge)}" placeholder="e.g. Most Popular" style="max-width:220px;">
                <span style="font-size:0.8rem;color:var(--text-dim);">Shown as a highlighted label on the card</span>
              </div>
            </div>

            <div class="field-group" style="margin-bottom:8px;">
              <label>Features List</label>
            </div>
            <div class="features-editor" data-features-idx="${idx}">
              ${svc.features.map((f, fi) => featureRow(f, fi)).join('')}
            </div>
            <button class="btn btn--ghost btn--sm" style="margin-bottom:20px;" data-add-feature="${idx}">
              + Add Feature
            </button>

            <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--border);">
              <button class="btn btn--danger btn--sm" data-delete-service="${idx}">Delete Service</button>
            </div>
          </div>
        </div>
      `;

      // Toggle expand/collapse
      card.querySelector('.service-editor-header').addEventListener('click', () => {
        card.classList.toggle('open');
      });

      // Live sync inputs → siteData
      card.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', () => {
          const field = input.dataset.field;
          siteData.services[idx][field] = input.value;
          // Update the header preview
          card.querySelector('.service-editor-name').textContent = siteData.services[idx].name;
          card.querySelector('.service-editor-price').textContent =
            siteData.services[idx].price + ' ' + siteData.services[idx].priceNote;
          card.querySelector('.service-editor-icon').textContent = siteData.services[idx].icon;
        });
      });

      // Add feature
      card.querySelector(`[data-add-feature="${idx}"]`).addEventListener('click', () => {
        siteData.services[idx].features.push('New feature');
        const fi = siteData.services[idx].features.length - 1;
        const featEl = card.querySelector(`[data-features-idx="${idx}"]`);
        const row = document.createElement('div');
        row.innerHTML = featureRow('New feature', fi);
        featEl.appendChild(row.firstElementChild);
        bindFeatureRow(featEl.lastElementChild, idx);
        featEl.lastElementChild.querySelector('input').focus();
        featEl.lastElementChild.querySelector('input').select();
      });

      // Delete service (with confirmation)
      card.querySelector(`[data-delete-service="${idx}"]`).addEventListener('click', () => {
        if (confirm(`Delete "${svc.name}"? This cannot be undone until you re-download services.json.`)) {
          siteData.services.splice(idx, 1);
          buildServicesEditor(); // rebuild
          showStatus('Service deleted — download JSON to save.', 'info');
        }
      });

      // Bind existing feature rows
      card.querySelectorAll('[data-features-idx] .feature-row').forEach(row => {
        bindFeatureRow(row, idx);
      });

      container.appendChild(card);
    });

    // Add new service button
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn--primary';
    addBtn.style.marginTop = '8px';
    addBtn.textContent = '+ Add New Service';
    addBtn.addEventListener('click', () => {
      siteData.services.push({
        id: 'new-service-' + Date.now(),
        icon: '◆',
        name: 'New Service',
        description: 'Describe this service.',
        price: '$0',
        priceNote: 'one-time',
        badge: '',
        features: ['Feature one', 'Feature two']
      });
      buildServicesEditor();
      showStatus('Service added — scroll down to edit it.', 'info');
    });
    container.appendChild(addBtn);
  }

  function featureRow(text, fi) {
    return `
      <div class="feature-row" data-fi="${fi}">
        <input type="text" value="${esc(text)}" placeholder="Feature description">
        <button class="btn-remove" title="Remove feature" type="button">×</button>
      </div>
    `;
  }

  function bindFeatureRow(row, svcIdx) {
    const input = row.querySelector('input');
    const fi    = parseInt(row.dataset.fi);

    input.addEventListener('input', () => {
      siteData.services[svcIdx].features[fi] = input.value;
    });

    row.querySelector('.btn-remove').addEventListener('click', () => {
      const featuresEl = row.closest('[data-features-idx]');
      const allRows    = Array.from(featuresEl.querySelectorAll('.feature-row'));
      const rowIdx     = allRows.indexOf(row);
      siteData.services[svcIdx].features.splice(rowIdx, 1);
      row.remove();
      // Re-index data-fi attributes
      featuresEl.querySelectorAll('.feature-row').forEach((r, i) => {
        r.dataset.fi = i;
      });
    });
  }

  // ── Meta Editor ───────────────────────────────────────────
  function buildMetaEditor() {
    const container = $('meta-editor');
    container.innerHTML = '';
    const m = siteData.meta;

    // Basic info card
    container.appendChild(metaCard('Business & Contact', `
      <div class="two-col">
        <div class="field-group">
          <label>Business Name</label>
          <input type="text" data-meta="businessName" value="${esc(m.businessName)}">
        </div>
        <div class="field-group">
          <label>Owner Name</label>
          <input type="text" data-meta="ownerName" value="${esc(m.ownerName)}">
        </div>
      </div>
      <div class="field-group">
        <label>Email Address</label>
        <input type="email" data-meta="email" value="${esc(m.email)}">
      </div>
      <div class="field-group">
        <label>Phone (optional)</label>
        <input type="text" data-meta="phone" value="${esc(m.phone)}" placeholder="e.g. (555) 123-4567">
      </div>
    `));

    // Hero / tagline card
    container.appendChild(metaCard('Hero Section', `
      <div class="field-group">
        <label>Tagline (Hero Headline)</label>
        <input type="text" data-meta="tagline" value="${esc(m.tagline)}">
      </div>
      <div class="field-group">
        <label>Subtitle (below headline)</label>
        <textarea data-meta="subtitle" rows="2">${esc(m.subtitle)}</textarea>
      </div>
      <div class="two-col">
        <div class="field-group">
          <label>Hero Button Text</label>
          <input type="text" data-meta="heroCtaText" value="${esc(m.heroCtaText)}">
        </div>
        <div class="field-group">
          <label>Hero Button Link</label>
          <input type="text" data-meta="heroCtaLink" value="${esc(m.heroCtaLink)}">
        </div>
      </div>
    `));

    // About card
    container.appendChild(metaCard('About Section', `
      <div class="field-group">
        <label>About Title (e.g. "Meet Skye")</label>
        <input type="text" data-meta="aboutTitle" value="${esc(m.aboutTitle)}">
      </div>
      <div class="field-group">
        <label>About Text</label>
        <textarea data-meta="aboutText" rows="5">${esc(m.aboutText)}</textarea>
      </div>
    `));

    // Footer card
    container.appendChild(metaCard('Footer', `
      <div class="field-group">
        <label>Footer Copyright Text</label>
        <input type="text" data-meta="footerText" value="${esc(m.footerText)}">
      </div>
    `));

    // Password card
    const pwCard = document.createElement('div');
    pwCard.className = 'meta-card';
    pwCard.innerHTML = `
      <h3>Admin Password</h3>
      <div class="password-note">
        ⚠ The admin password is stored in services.json. Because this is a static site, anyone with access to your repo can read it. Keep your repository private or use a hard-to-guess password.
      </div>
      <div class="field-group">
        <label>Current Password</label>
        <input type="text" id="pw-display" value="${esc(siteData.adminPassword)}">
      </div>
      <div class="two-col" style="margin-top:4px;">
        <div class="field-group">
          <label>New Password</label>
          <input type="password" id="new-pw" placeholder="Enter new password" autocomplete="new-password">
        </div>
        <div class="field-group">
          <label>Confirm New Password</label>
          <input type="password" id="confirm-pw" placeholder="Confirm new password" autocomplete="new-password">
        </div>
      </div>
      <button class="btn btn--primary btn--sm" id="change-pw-btn">Update Password</button>
      <p id="pw-msg" style="font-size:0.82rem;margin-top:10px;min-height:18px;"></p>
    `;
    container.appendChild(pwCard);

    // Bind meta inputs
    container.querySelectorAll('[data-meta]').forEach(input => {
      input.addEventListener('input', () => {
        siteData.meta[input.dataset.meta] = input.value;
      });
    });

    // Password change
    $('change-pw-btn').addEventListener('click', () => {
      const np = $('new-pw').value;
      const cp = $('confirm-pw').value;
      const msg = $('pw-msg');

      if (!np) { msg.style.color = 'var(--red)'; msg.textContent = 'Enter a new password.'; return; }
      if (np !== cp) { msg.style.color = 'var(--red)'; msg.textContent = 'Passwords do not match.'; return; }
      if (np.length < 6) { msg.style.color = 'var(--red)'; msg.textContent = 'Password must be at least 6 characters.'; return; }

      siteData.adminPassword = np;
      $('pw-display').value = np;
      $('new-pw').value = '';
      $('confirm-pw').value = '';
      msg.style.color = 'var(--green)';
      msg.textContent = 'Password updated — download JSON to save.';
      setTimeout(() => { msg.textContent = ''; }, 4000);
    });
  }

  function metaCard(title, innerHtml) {
    const card = document.createElement('div');
    card.className = 'meta-card';
    card.innerHTML = `<h3>${title}</h3>${innerHtml}`;
    return card;
  }

  // ── Download JSON ─────────────────────────────────────────
  function setupDownload() {
    $('download-btn').addEventListener('click', downloadJSON);
  }

  function downloadJSON() {
    const json = JSON.stringify(siteData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'services.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('services.json downloaded! Replace /data/services.json and push to GitHub.', 'success');
  }

  // ── Status toast ──────────────────────────────────────────
  let statusTimer = null;

  function showStatus(msg, type = 'info') {
    const bar = $('status-bar');
    bar.textContent = msg;
    bar.className   = `show ${type}`;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { bar.classList.remove('show'); }, 4000);
  }

  // ── Login error helper ────────────────────────────────────
  function showError(msg) {
    const err = $('login-error');
    if (err) err.textContent = msg;
  }

  // ── Utilities ─────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Start ─────────────────────────────────────────────────
  init();

})();
