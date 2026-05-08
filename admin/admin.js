/* Neilz Network — admin.js
   Handles login, all panel editors, and JSON download for the sidebar admin. */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────
  let DATA = null;

  // ── Helpers ────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function mk(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(function(entry) {
        const k = entry[0]; const v = entry[1];
        if      (k === 'class')  el.className = v;
        else if (k === 'html')   el.innerHTML = v;
        else if (k === 'text')   el.textContent = v;
        else if (k === 'style')  el.style.cssText = v;
        else el.setAttribute(k, v);
      });
    }
    return el;
  }

  function on(el, ev, fn) { el.addEventListener(ev, fn); return el; }

  function toast(msg, type) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'show ' + (type || 'ok');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() { t.className = ''; }, 3200);
  }

  function makeInput(val, ph) {
    const el = mk('input', { type: 'text' });
    el.value = val || '';
    if (ph) el.placeholder = ph;
    return el;
  }

  function makeTA(val, rows) {
    const el = document.createElement('textarea');
    el.rows = rows || 3;
    el.value = val || '';
    return el;
  }

  function btnX(title) {
    const b = mk('button', { class: 'btn-x', type: 'button', html: '&#x2715;' });
    b.title = title || 'Remove';
    return b;
  }

  function wrapField(labelTxt, inputEl) {
    const f = mk('div', { class: 'field' });
    f.appendChild(mk('label', { text: labelTxt }));
    f.appendChild(inputEl);
    return f;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Load / Download JSON ───────────────────────────────────────────
  async function loadData() {
    const res = await fetch('../data/services.json?nc=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function downloadJSON() {
    const json = JSON.stringify(DATA, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = mk('a', { href: url, download: 'services.json' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    toast('services.json downloaded! Replace the file in your project and push to GitHub.', 'ok');
  }

  // ── LOGIN ──────────────────────────────────────────────────────────
  function initLogin() {
    const btn = $('login-btn');
    const inp = $('pw-input');
    const err = $('login-error');

    async function attempt() {
      const pw = inp.value.trim();
      if (!pw) { err.textContent = 'Please enter your password.'; return; }
      btn.disabled = true;
      btn.textContent = 'Checking…';
      err.textContent = '';
      try {
        DATA = await loadData();
        if (pw !== DATA.adminPassword) {
          err.textContent = 'Incorrect password — try again.';
          inp.value = '';
          inp.focus();
          DATA = null;
        } else {
          $('login-screen').classList.add('hidden');
          $('admin-app').classList.remove('hidden');
          initApp();
        }
      } catch (e) {
        err.textContent = 'Could not load site data. Open this page through VS Code Live Server (not by double-clicking the file).';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In →';
      }
    }

    on(btn, 'click', attempt);
    on(inp, 'keydown', function(e) { if (e.key === 'Enter') attempt(); });
    inp.focus();
  }

  // ── SIDEBAR NAVIGATION ─────────────────────────────────────────────
  var PANEL_LABELS = {
    dashboard: 'Dashboard', hero: 'Hero Section', about: 'About',
    services: 'Services', process: 'Process Steps', contact: 'Contact',
    colors: 'Color Theme', navigation: 'Navigation', seo: 'SEO & Meta',
    security: 'Security', publish: 'Publish'
  };

  function showPanel(name) {
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.sb-link[data-panel]').forEach(function(l) { l.classList.remove('active'); });
    var panel = $('panel-' + name);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.sb-link[data-panel="' + name + '"]').forEach(function(l) { l.classList.add('active'); });
    $('topbar-title').textContent = PANEL_LABELS[name] || name;
    window.scrollTo(0, 0);
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────
  function renderDashboard() {
    $('d-svc').textContent   = (DATA.services || []).length;
    $('d-steps').textContent = (DATA.processSteps || []).length;
    $('d-email').textContent = (DATA.meta && DATA.meta.email) || '—';
  }

  // ── META FIELD BINDING ─────────────────────────────────────────────
  function bindMetaFields() {
    document.querySelectorAll('[data-meta]').forEach(function(el) {
      var key = el.dataset.meta;
      el.value = (DATA.meta && DATA.meta[key] != null) ? DATA.meta[key] : '';
      on(el, 'input', function() { DATA.meta[key] = el.value; });
    });
  }

  // ── HERO — Stats bar ───────────────────────────────────────────────
  function renderStatsEditor() {
    var c = $('stats-editor');
    c.innerHTML = '';
    (DATA.heroStats || []).forEach(function(stat, i) {
      var row    = mk('div', { class: 'list-row' });
      var numInp = makeInput(stat.num, 'e.g. 100%');
      numInp.style.cssText = 'flex:0 0 100px;min-width:0';
      on(numInp, 'input', function() { DATA.heroStats[i].num = numInp.value; });
      var lblInp = makeInput(stat.label, 'e.g. Custom Built');
      on(lblInp, 'input', function() { DATA.heroStats[i].label = lblInp.value; });
      var del = btnX('Remove stat');
      on(del, 'click', function() { DATA.heroStats.splice(i, 1); renderStatsEditor(); });
      row.appendChild(numInp);
      row.appendChild(lblInp);
      row.appendChild(del);
      c.appendChild(row);
    });
  }

  function initHero() {
    renderStatsEditor();
    on($('add-stat'), 'click', function() {
      if (!DATA.heroStats) DATA.heroStats = [];
      DATA.heroStats.push({ num: '', label: '' });
      renderStatsEditor();
    });
  }

  // ── ABOUT — Photo upload ───────────────────────────────────────────
  function initAbout() {
    var photoInput = $('photo-input');
    var photoPrev  = $('photo-prev');
    var photoIcon  = $('photo-icon');
    var removeBtn  = $('remove-photo');

    function showPhoto(src) {
      photoPrev.src = src;
      photoPrev.classList.add('show');
      photoIcon.style.display = 'none';
      removeBtn.style.display = '';
    }
    function clearPhoto() {
      photoPrev.src = '';
      photoPrev.classList.remove('show');
      photoIcon.style.display = '';
      removeBtn.style.display = 'none';
      DATA.meta.aboutPhoto = '';
    }

    if (DATA.meta && DATA.meta.aboutPhoto) showPhoto(DATA.meta.aboutPhoto);

    on(photoInput, 'change', function() {
      var file = photoInput.files[0];
      if (!file) return;
      if (file.size > 2.5 * 1024 * 1024) {
        toast('Image too large — max ~2.5 MB. Try compressing it first.', 'err');
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        DATA.meta.aboutPhoto = e.target.result;
        showPhoto(e.target.result);
        toast('Photo loaded — download JSON & publish to go live!', 'info');
      };
      reader.readAsDataURL(file);
    });

    on(removeBtn, 'click', function() {
      clearPhoto();
      photoInput.value = '';
      toast('Photo removed');
    });
  }

  // ── SERVICES CRUD ──────────────────────────────────────────────────
  function renderFeatures(si, listEl) {
    listEl.innerHTML = '';
    var feats = DATA.services[si].features || [];
    feats.forEach(function(feat, fi) {
      var row = mk('div', { class: 'feat-row' });
      var inp = makeInput(feat, 'Feature text');
      on(inp, 'input', function() { DATA.services[si].features[fi] = inp.value; });
      var del = btnX('Remove feature');
      on(del, 'click', function() {
        DATA.services[si].features.splice(fi, 1);
        renderFeatures(si, listEl);
      });
      row.appendChild(inp);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  function renderServicesEditor() {
    var c = $('services-editor');
    c.innerHTML = '';
    (DATA.services || []).forEach(function(svc, si) {
      var card  = mk('div', { class: 'svc-card' });
      var hdr   = mk('div', { class: 'svc-hdr' });
      var hdrL  = mk('div', { class: 'svc-hdr-l' });
      var iconEl  = mk('span', { class: 'svc-icon',  text: svc.icon  || '●' });
      var info    = mk('div');
      var nameEl  = mk('div',  { class: 'svc-name',  text: svc.name  || 'Untitled' });
      var priceEl = mk('div',  { class: 'svc-price', text: (svc.price || '') + (svc.priceNote ? ' · ' + svc.priceNote : '') });
      info.appendChild(nameEl);
      info.appendChild(priceEl);
      hdrL.appendChild(iconEl);
      hdrL.appendChild(info);
      var chev = mk('span', { class: 'svc-chev', html: '&#9660;' });
      hdr.appendChild(hdrL);
      hdr.appendChild(chev);
      on(hdr, 'click', function() { card.classList.toggle('open'); });

      var body = mk('div', { class: 'svc-body' });

      // Row 1: icon · id · badge
      var r1 = mk('div', { class: 'three-col', style: 'margin-bottom:12px' });
      var iconInp  = makeInput(svc.icon,  '✶');
      var idInp    = makeInput(svc.id,    'service-id');
      var badgeInp = makeInput(svc.badge || '', 'Most Popular');
      on(iconInp,  'input', function() { DATA.services[si].icon  = iconInp.value;  iconEl.textContent = iconInp.value; });
      on(idInp,    'input', function() { DATA.services[si].id    = idInp.value; });
      on(badgeInp, 'input', function() { DATA.services[si].badge = badgeInp.value; });
      r1.appendChild(wrapField('Icon (emoji)', iconInp));
      r1.appendChild(wrapField('ID (unique, no spaces)', idInp));
      r1.appendChild(wrapField('Badge (blank = none)', badgeInp));
      body.appendChild(r1);

      // Name
      var nameInp = makeInput(svc.name, 'Service Name');
      on(nameInp, 'input', function() {
        DATA.services[si].name = nameInp.value;
        nameEl.textContent = nameInp.value;
      });
      body.appendChild(wrapField('Service Name', nameInp));

      // Description
      var descTa = makeTA(svc.description, 3);
      on(descTa, 'input', function() { DATA.services[si].description = descTa.value; });
      body.appendChild(wrapField('Description', descTa));

      // Price + Note
      var r2 = mk('div', { class: 'two-col' });
      var priceInp = makeInput(svc.price, '$499');
      var noteInp  = makeInput(svc.priceNote, 'one-time');
      on(priceInp, 'input', function() {
        DATA.services[si].price = priceInp.value;
        priceEl.textContent = priceInp.value + (DATA.services[si].priceNote ? ' · ' + DATA.services[si].priceNote : '');
      });
      on(noteInp, 'input', function() {
        DATA.services[si].priceNote = noteInp.value;
        priceEl.textContent = (DATA.services[si].price || '') + (noteInp.value ? ' · ' + noteInp.value : '');
      });
      r2.appendChild(wrapField('Price', priceInp));
      r2.appendChild(wrapField('Price Note (e.g. one-time)', noteInp));
      body.appendChild(r2);

      // Features
      body.appendChild(mk('div', { class: 'card-title', style: 'margin-top:18px;margin-bottom:10px', text: 'Features' }));
      var featList = mk('div', { class: 'feat-list' });
      body.appendChild(featList);
      renderFeatures(si, featList);

      var addFeat = mk('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: '+ Add Feature' });
      on(addFeat, 'click', function() {
        if (!DATA.services[si].features) DATA.services[si].features = [];
        DATA.services[si].features.push('');
        renderFeatures(si, featList);
      });
      body.appendChild(addFeat);

      // Delete service
      var delBtn = mk('button', { class: 'btn btn--danger btn--sm', type: 'button', text: '🗑  Delete This Service', style: 'margin-top:20px' });
      on(delBtn, 'click', function() {
        if (confirm('Delete service "' + (DATA.services[si].name || 'Untitled') + '"?')) {
          DATA.services.splice(si, 1);
          renderServicesEditor();
          renderDashboard();
          toast('Service deleted');
        }
      });
      body.appendChild(delBtn);

      card.appendChild(hdr);
      card.appendChild(body);
      c.appendChild(card);
    });
  }

  function initServices() {
    renderServicesEditor();
    on($('add-svc'), 'click', function() {
      if (!DATA.services) DATA.services = [];
      DATA.services.push({
        id: 'service-' + Date.now(),
        icon: '✶',
        name: 'New Service',
        description: '',
        price: '',
        priceNote: '',
        badge: '',
        features: []
      });
      renderServicesEditor();
      renderDashboard();
      // Auto-open the new card
      var cards = document.querySelectorAll('#services-editor .svc-card');
      if (cards.length) cards[cards.length - 1].classList.add('open');
      toast('New service added — fill in the details below', 'info');
    });
  }

  // ── PROCESS STEPS ──────────────────────────────────────────────────
  function renderProcessEditor() {
    var c = $('process-editor');
    c.innerHTML = '';
    (DATA.processSteps || []).forEach(function(step, i) {
      var row   = mk('div', { class: 'step-row' });
      var badge = mk('div', { class: 'step-num-badge', text: step.number || String(i + 1).padStart(2, '0') });

      var fields = mk('div', { class: 'step-fields' });
      var r1     = mk('div', { class: 'two-col' });
      var numInp   = makeInput(step.number, '01');
      var titleInp = makeInput(step.title,  'Step Title');
      on(numInp,   'input', function() { DATA.processSteps[i].number = numInp.value;   badge.textContent = numInp.value; });
      on(titleInp, 'input', function() { DATA.processSteps[i].title  = titleInp.value; });
      r1.appendChild(wrapField('Step Number', numInp));
      r1.appendChild(wrapField('Title', titleInp));

      var descTa = makeTA(step.description, 2);
      on(descTa, 'input', function() { DATA.processSteps[i].description = descTa.value; });

      fields.appendChild(r1);
      fields.appendChild(wrapField('Description', descTa));

      var del = btnX('Remove step');
      del.classList.add('step-del');
      on(del, 'click', function() {
        DATA.processSteps.splice(i, 1);
        renderProcessEditor();
        renderDashboard();
      });

      row.appendChild(badge);
      row.appendChild(fields);
      row.appendChild(del);
      c.appendChild(row);
    });
  }

  function initProcess() {
    renderProcessEditor();
    on($('add-step'), 'click', function() {
      if (!DATA.processSteps) DATA.processSteps = [];
      var n = String(DATA.processSteps.length + 1).padStart(2, '0');
      DATA.processSteps.push({ number: n, title: '', description: '' });
      renderProcessEditor();
      renderDashboard();
    });
  }

  // ── CONTACT — Promise items ────────────────────────────────────────
  function renderPromiseEditor() {
    var c = $('promise-editor');
    c.innerHTML = '';
    (DATA.promiseItems || []).forEach(function(item, i) {
      var row = mk('div', { class: 'list-row' });
      var inp = makeInput(item, 'e.g. Response within 24 hours');
      on(inp, 'input', function() { DATA.promiseItems[i] = inp.value; });
      var del = btnX('Remove item');
      on(del, 'click', function() { DATA.promiseItems.splice(i, 1); renderPromiseEditor(); });
      row.appendChild(inp);
      row.appendChild(del);
      c.appendChild(row);
    });
  }

  function initContact() {
    renderPromiseEditor();
    on($('add-promise'), 'click', function() {
      if (!DATA.promiseItems) DATA.promiseItems = [];
      DATA.promiseItems.push('');
      renderPromiseEditor();
    });
  }

  // ── THEME PRESETS ──────────────────────────────────────────────────
  var THEME_PRESETS = [
    {
      name: 'Warm Coffee',
      light: { '--bg':'#FAF4EC','--surface':'#F2E8D8','--card':'#FFFFFF','--accent':'#7A5C3E','--accent-light':'#997E67','--text':'#231008','--text-muted':'#5C3D25','--text-dim':'#997E67' },
      dark:  { '--bg':'#100a06','--surface':'#181009','--card':'#20150d','--accent':'#997E67','--accent-light':'#CCBEB1','--text':'#FFDBBB','--text-muted':'#CCBEB1','--text-dim':'#664930' }
    },
    {
      name: 'Ocean Blue',
      light: { '--bg':'#F0F6FF','--surface':'#E4EEFB','--card':'#FFFFFF','--accent':'#1E6BB8','--accent-light':'#3B82C4','--text':'#0B1E35','--text-muted':'#1E4A7A','--text-dim':'#5B8FB9' },
      dark:  { '--bg':'#040D1A','--surface':'#071424','--card':'#0C1E30','--accent':'#4B9EE8','--accent-light':'#93C5FD','--text':'#C8E0FF','--text-muted':'#93C5FD','--text-dim':'#1E4A7A' }
    },
    {
      name: 'Forest Green',
      light: { '--bg':'#F2F7F2','--surface':'#E8F0E8','--card':'#FFFFFF','--accent':'#2D6A3F','--accent-light':'#3D8B53','--text':'#0D2416','--text-muted':'#1A4A29','--text-dim':'#5A8A68' },
      dark:  { '--bg':'#040F08','--surface':'#071610','--card':'#0C1E14','--accent':'#4CAF6E','--accent-light':'#86EFB0','--text':'#C2F0D0','--text-muted':'#86EFB0','--text-dim':'#1A4A29' }
    },
    {
      name: 'Deep Purple',
      light: { '--bg':'#F5F3FF','--surface':'#EDE9FE','--card':'#FFFFFF','--accent':'#6D28D9','--accent-light':'#7C3AED','--text':'#1E0550','--text-muted':'#4C1D95','--text-dim':'#7C3AED' },
      dark:  { '--bg':'#07050F','--surface':'#0F0B1E','--card':'#17112E','--accent':'#8B5CF6','--accent-light':'#C4B5FD','--text':'#EDE9FE','--text-muted':'#C4B5FD','--text-dim':'#4C1D95' }
    },
    {
      name: 'Slate Grey',
      light: { '--bg':'#F8FAFC','--surface':'#F1F5F9','--card':'#FFFFFF','--accent':'#334155','--accent-light':'#475569','--text':'#0F172A','--text-muted':'#1E293B','--text-dim':'#64748B' },
      dark:  { '--bg':'#080A0D','--surface':'#0F1117','--card':'#161B24','--accent':'#94A3B8','--accent-light':'#CBD5E1','--text':'#E2E8F0','--text-muted':'#CBD5E1','--text-dim':'#334155' }
    },
    {
      name: 'Sunset Orange',
      light: { '--bg':'#FFF7F0','--surface':'#FEEEE0','--card':'#FFFFFF','--accent':'#C2410C','--accent-light':'#EA580C','--text':'#2D0E00','--text-muted':'#7C2D12','--text-dim':'#C2410C' },
      dark:  { '--bg':'#0F0600','--surface':'#1A0C00','--card':'#261200','--accent':'#FB923C','--accent-light':'#FDBA74','--text':'#FFF0E0','--text-muted':'#FDBA74','--text-dim':'#7C2D12' }
    },
    {
      name: 'Rose Gold',
      light: { '--bg':'#FFF5F8','--surface':'#FFE8EF','--card':'#FFFFFF','--accent':'#BE185D','--accent-light':'#DB2777','--text':'#3B001A','--text-muted':'#831843','--text-dim':'#BE185D' },
      dark:  { '--bg':'#0F0007','--surface':'#1A000D','--card':'#250014','--accent':'#F472B6','--accent-light':'#FBCFE8','--text':'#FFE4F2','--text-muted':'#FBCFE8','--text-dim':'#831843' }
    },
    {
      name: 'Pure Black',
      light: { '--bg':'#F7F7F7','--surface':'#EEEEEE','--card':'#FFFFFF','--accent':'#111111','--accent-light':'#333333','--text':'#000000','--text-muted':'#222222','--text-dim':'#888888' },
      dark:  { '--bg':'#000000','--surface':'#0A0A0A','--card':'#111111','--accent':'#FFFFFF','--accent-light':'#CCCCCC','--text':'#FFFFFF','--text-muted':'#CCCCCC','--text-dim':'#555555' }
    }
  ];

  function renderThemePresets() {
    var grid = $('presets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    THEME_PRESETS.forEach(function(preset) {
      var card = mk('div', { class: 'preset-card' });

      // 5-swatch colour strip using light palette
      var strip = mk('div', { class: 'preset-swatches' });
      ['--bg','--surface','--accent','--accent-light','--text'].forEach(function(k) {
        var sw = mk('div', { class: 'preset-swatch' });
        sw.style.background = preset.light[k] || '#888';
        strip.appendChild(sw);
      });

      var lbl = mk('div', { class: 'preset-name', text: preset.name });
      card.appendChild(strip);
      card.appendChild(lbl);

      // Mark as active if it matches current theme
      if (DATA.theme && DATA.theme.light && DATA.theme.light['--accent'] === preset.light['--accent']) {
        card.classList.add('chosen');
      }

      on(card, 'click', function() {
        // Deep-copy preset into DATA.theme
        DATA.theme = {
          light: Object.assign({}, preset.light),
          dark:  Object.assign({}, preset.dark)
        };
        // Re-render color pickers
        renderColorsEditor('light');
        renderColorsEditor('dark');
        // Update active state
        document.querySelectorAll('.preset-card').forEach(function(c) { c.classList.remove('chosen'); });
        card.classList.add('chosen');
        toast('Theme "' + preset.name + '" applied — download & publish to go live!', 'info');
      });

      grid.appendChild(card);
    });
  }

  // ── COLORS ─────────────────────────────────────────────────────────
  var COLOR_LABEL = {
    '--bg':           'Background',
    '--surface':      'Surface / Nav',
    '--card':         'Card',
    '--accent':       'Accent',
    '--accent-light': 'Accent Light',
    '--text':         'Text',
    '--text-muted':   'Text Muted',
    '--text-dim':     'Text Dim'
  };

  function refreshColorPreview(mode) {
    var prevEl = $(mode + '-prev');
    if (!prevEl || !DATA.theme || !DATA.theme[mode]) return;
    var keys = ['--bg', '--surface', '--card', '--accent', '--accent-light', '--text'];
    prevEl.innerHTML = keys.map(function(k) {
      var col = DATA.theme[mode][k] || '#888888';
      return '<div class="color-swatch" style="background:' + col + '" title="' + k + '"></div>';
    }).join('');
  }

  function renderColorsEditor(mode) {
    var c = $(mode + '-colors');
    if (!c || !DATA.theme || !DATA.theme[mode]) return;
    c.innerHTML = '';

    Object.entries(DATA.theme[mode]).forEach(function(entry) {
      var key   = entry[0];
      var value = entry[1];
      var item   = mk('div', { class: 'color-item' });
      var lbl    = mk('label', { text: COLOR_LABEL[key] || key });
      var row    = mk('div', { class: 'color-row' });
      var picker = mk('input', { type: 'color' });
      var hex    = mk('input', { class: 'color-hex', type: 'text', placeholder: '#000000', maxlength: '7' });

      var safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#888888';
      picker.value = safe;
      hex.value    = safe.toUpperCase();

      on(picker, 'input', function() {
        hex.value = picker.value.toUpperCase();
        DATA.theme[mode][key] = picker.value;
        refreshColorPreview(mode);
      });
      on(hex, 'input', function() {
        var v = hex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          picker.value = v;
          DATA.theme[mode][key] = v;
          refreshColorPreview(mode);
        }
      });
      on(hex, 'blur', function() {
        hex.value = DATA.theme[mode][key].toUpperCase();
      });

      row.appendChild(picker);
      row.appendChild(hex);
      item.appendChild(lbl);
      item.appendChild(row);
      c.appendChild(item);
    });

    refreshColorPreview(mode);
  }

  // ── NAVIGATION ─────────────────────────────────────────────────────
  function renderNavEditor() {
    var c = $('nav-editor');
    c.innerHTML = '';
    (DATA.navLinks || []).forEach(function(link, i) {
      var row     = mk('div', { class: 'list-row' });
      var lblInp  = makeInput(link.label, 'Label');
      var hrefInp = makeInput(link.href,  '#section');
      hrefInp.classList.add('narrow');
      on(lblInp,  'input', function() { DATA.navLinks[i].label = lblInp.value; });
      on(hrefInp, 'input', function() { DATA.navLinks[i].href  = hrefInp.value; });
      var del = btnX('Remove link');
      on(del, 'click', function() { DATA.navLinks.splice(i, 1); renderNavEditor(); });
      row.appendChild(lblInp);
      row.appendChild(hrefInp);
      row.appendChild(del);
      c.appendChild(row);
    });
  }

  // ── SECURITY ───────────────────────────────────────────────────────
  function initSecurity() {
    $('cur-pw').value = DATA.adminPassword || '';

    on($('change-pw'), 'click', function() {
      var newPw  = $('new-pw').value.trim();
      var confPw = $('conf-pw').value.trim();
      var msg    = $('pw-msg');

      if (!newPw) {
        msg.style.color = 'var(--red)'; msg.textContent = 'Enter a new password.'; return;
      }
      if (newPw.length < 6) {
        msg.style.color = 'var(--red)'; msg.textContent = 'Must be at least 6 characters.'; return;
      }
      if (newPw !== confPw) {
        msg.style.color = 'var(--red)'; msg.textContent = "Passwords don’t match."; return;
      }

      DATA.adminPassword     = newPw;
      $('cur-pw').value      = newPw;
      $('new-pw').value      = '';
      $('conf-pw').value     = '';
      msg.style.color        = 'var(--green)';
      msg.textContent        = '✓ Password updated. Download JSON to save!';
      toast('Password changed — download & publish to apply', 'ok');
    });
  }

  // ── INIT APP ───────────────────────────────────────────────────────
  function initApp() {
    // Sidebar links
    document.querySelectorAll('.sb-link[data-panel]').forEach(function(btn) {
      on(btn, 'click', function() { showPanel(btn.dataset.panel); });
    });
    // Dashboard shortcuts
    document.querySelectorAll('.dash-sc[data-go]').forEach(function(sc) {
      on(sc, 'click', function() { showPanel(sc.dataset.go); });
    });
    // Logout
    on($('logout-btn'), 'click', function() {
      DATA = null;
      $('admin-app').classList.add('hidden');
      $('login-screen').classList.remove('hidden');
      $('pw-input').value          = '';
      $('login-error').textContent = '';
      $('pw-input').focus();
    });
    // Download
    on($('dl-btn'),  'click', downloadJSON);
    on($('pub-dl'),  'click', downloadJSON);
    // Add nav link
    on($('add-nav'), 'click', function() {
      if (!DATA.navLinks) DATA.navLinks = [];
      DATA.navLinks.push({ label: '', href: '#' });
      renderNavEditor();
    });

    // Populate all editors
    renderDashboard();
    bindMetaFields();
    initHero();
    initAbout();
    initServices();
    initProcess();
    initContact();
    renderThemePresets();
    renderColorsEditor('light');
    renderColorsEditor('dark');
    renderNavEditor();
    initSecurity();

    showPanel('dashboard');
  }

  // ── BOOT ───────────────────────────────────────────────────────────
  initLogin();

})();
