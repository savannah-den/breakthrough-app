/* Breakthrough app shell: login, cloud sync, menu, router, video player, AI coach.
   The tools themselves (views) live in the merged bundle inside index.html. */
(function () {
  'use strict';
  var CFG = window.BT_CONFIG || {};
  var VIEWS = window.BT_VIEWS || {};
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  var sb = LIVE ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: '__bt_auth' }
  }) : null;

  // Keys that are UI-only and never need syncing
  var LOCAL_ONLY = /^(__bt|cmn-open-tab$|cmn-dash-focus$|sb-)/;
  var LS = window.localStorage;
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function lsGet(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { rawSet.call(LS, k, v); } catch (e) {} }
  function lsDel(k) { try { rawRemove.call(LS, k); } catch (e) {} }

  var state = { user: null, profile: null, tier: 'self_paced', isAdmin: false, settings: {}, door: doorFromUrl() };

  function doorFromUrl() {
    var p = (location.pathname || '').toLowerCase(), q = new URLSearchParams(location.search);
    if (/1to1|private|one-on-one/.test(p) || q.get('door') === 'private') return 'private';
    return 'course';
  }

  /* ---------------- tiny DOM helper ---------------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function toast(msg) {
    var t = h('div', { class: 'bt-toast', role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---------------- sync: localStorage <-> Supabase ---------------- */
  var queue = {};
  try { queue = JSON.parse(lsGet('__bt_queue') || '{}') || {}; } catch (e) { queue = {}; }
  var flushTimer = null, flushing = false;

  function queueWrite(key, value) {
    if (LOCAL_ONLY.test(key)) return;
    queue[key] = { v: value, t: new Date().toISOString() };
    lsSet('__bt_queue', JSON.stringify(queue));
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 900);
  }

  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === LS) queueWrite(String(k), String(v));
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === LS) queueWrite(String(k), null);
  };

  function setSyncDot(s) { var d = document.getElementById('bt-sync'); if (d) { d.dataset.s = s; d.title = s === 'ok' ? 'Saved to your account' : s === 'off' ? 'Offline: saved on this phone, will sync later' : 'Saving…'; } }

  function flush() {
    if (!LIVE || !state.user || flushing) return Promise.resolve();
    var keys = Object.keys(queue);
    if (!keys.length) { setSyncDot('ok'); return Promise.resolve(); }
    if (!navigator.onLine) { setSyncDot('off'); return Promise.resolve(); }
    flushing = true; setSyncDot('busy');
    var snapshot = {}; keys.forEach(function (k) { snapshot[k] = queue[k]; });
    var ups = [], dels = [];
    keys.forEach(function (k) { if (snapshot[k].v === null) dels.push(k); else ups.push({ user_id: state.user.id, key: k, value: snapshot[k].v, updated_at: snapshot[k].t }); });
    var jobs = [];
    if (ups.length) jobs.push(sb.from('client_data').upsert(ups, { onConflict: 'user_id,key' }));
    if (dels.length) jobs.push(sb.from('client_data').delete().eq('user_id', state.user.id).in('key', dels));
    return Promise.all(jobs).then(function (res) {
      var err = res.filter(function (r) { return r && r.error; })[0];
      if (err) throw err.error;
      keys.forEach(function (k) { if (queue[k] && queue[k].t === snapshot[k].t) delete queue[k]; });
      lsSet('__bt_queue', JSON.stringify(queue));
      setSyncDot(Object.keys(queue).length ? 'busy' : 'ok');
    }).catch(function (e) {
      console.warn('[bt] sync failed, will retry', e);
      setSyncDot('off');
      clearTimeout(flushTimer); flushTimer = setTimeout(flush, 15000);
    }).then(function () { flushing = false; if (Object.keys(queue).length) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 1500); } });
  }
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  function appKeys() {
    var out = [];
    for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && !LOCAL_ONLY.test(k)) out.push(k); }
    return out;
  }

  function hydrate() {
    // Different person on this phone? Wipe the last person's local copy first.
    var prev = lsGet('__bt_uid');
    if (prev && prev !== state.user.id) { appKeys().forEach(lsDel); queue = {}; lsSet('__bt_queue', '{}'); }
    // Brand-new account on a phone that already has data (e.g. used before login existed): keep it and upload it.
    if (!prev && appKeys().length) appKeys().forEach(function (k) { queue[k] = { v: lsGet(k), t: new Date().toISOString() }; });
    lsSet('__bt_uid', state.user.id);
    return flush().then(function () {
      return sb.from('client_data').select('key,value,updated_at').eq('user_id', state.user.id);
    }).then(function (r) {
      if (r.error) throw r.error;
      (r.data || []).forEach(function (row) { if (!queue[row.key]) { if (row.value == null) lsDel(row.key); else lsSet(row.key, row.value); } });
    }).catch(function (e) { console.warn('[bt] could not load from cloud, using this phone’s copy', e); setSyncDot('off'); });
  }

  /* ---------------- AI coach (replaces Claude's built-in sample) ---------------- */
  function aiCall(prompt, opts, wantJson) {
    if (!LIVE) return Promise.reject(new Error('AI needs the live app'));
    return sb.auth.getSession().then(function (s) {
      var tok = s && s.data && s.data.session && s.data.session.access_token;
      return fetch('/.netlify/functions/ai', {
        method: 'POST', signal: opts && opts.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ prompt: String(prompt), json: !!wantJson })
      });
    }).then(function (r) { if (!r.ok) throw new Error('AI ' + r.status); return r.json(); })
      .then(function (d) { return wantJson ? d.json : { text: d.text || '' }; });
  }
  window.claude = {
    use: function (name) {
      if (name === 'sample' && CFG.aiEnabled && LIVE) {
        var fn = function (p, o) { return aiCall(p, o, false); };
        fn.json = function (p, o) { return aiCall(p, o, true); };
        return Promise.resolve(fn);
      }
      return Promise.resolve(null); // views fall back to normal downloads etc.
    }
  };

  /* ---------------- video player (embeds YouTube / Vimeo / Bunny / Loom links) ---------------- */
  function embedUrl(u) {
    var m;
    try { var url = new URL(u); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return 'https://www.youtube-nocookie.com/embed/' + url.pathname.slice(1) + '?rel=0&playsinline=1';
    if (/youtube\.com$/.test(host)) {
      var id = url.searchParams.get('v') || ((m = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)) && m[1]);
      if (id) return 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&playsinline=1';
    }
    if (host === 'vimeo.com' && (m = url.pathname.match(/^\/(\d+)(?:\/(\w+))?/))) return 'https://player.vimeo.com/video/' + m[1] + (m[2] ? '?h=' + m[2] : '');
    if (host === 'player.vimeo.com') return u;
    if (/mediadelivery\.net$/.test(host)) return u.replace('/play/', '/embed/');
    if (host === 'loom.com' && (m = url.pathname.match(/\/share\/(\w+)/))) return 'https://www.loom.com/embed/' + m[1];
    return null;
  }
  function openVideo(src) {
    var close = function () { bg.remove(); box.remove(); };
    var bg = h('button', { class: 'bt-vbg', 'aria-label': 'Close video', onclick: close });
    var box = h('div', { class: 'bt-vbox', role: 'dialog', 'aria-label': 'Video' }, [
      h('div', { class: 'bt-vframe' }, [h('iframe', { src: src, allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media', allowfullscreen: 'true', title: 'Video' })]),
      h('button', { class: 'bt-btn', onclick: close, text: 'Close video' })
    ]);
    document.body.appendChild(bg); document.body.appendChild(box);
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var src = embedUrl(a.href);
    if (src) { e.preventDefault(); e.stopPropagation(); openVideo(src); }
  }, true);

  /* ---------------- router (replaces each artifact's own) ---------------- */
  function homeView() { return state.tier === 'private' ? 'OneOnOne.dc.html' : 'Dashboard.dc.html'; }
  function allowed(name) { var v = VIEWS[name]; return v && (!v.private || state.tier === 'private'); }
  function viewProps(name) {
    var v = VIEWS[name], p = Object.assign({}, v.props || {});
    var over = (state.settings.props || {})[name] || {};
    Object.keys(over).forEach(function (k) { if (over[k] !== '' && over[k] != null) p[k] = over[k]; });
    if ('clientName' in p && state.profile && state.profile.full_name) p.clientName = state.profile.full_name.split(' ')[0];
    return p;
  }
  var current = null;
  function show(name) {
    if (!allowed(name)) name = homeView();
    var v = VIEWS[name];
    if (current) { current._dead = true; try { if (current.componentWillUnmount) current.componentWillUnmount(); } catch (e) {} }
    var host = document.getElementById('app');
    while (host.firstChild) host.removeChild(host.firstChild);
    var root = document.createElement('div'); root.id = 'v-' + v.slug; host.appendChild(root);
    var tpl = Array.prototype.slice.call(document.getElementById('t-' + v.slug).content.childNodes);
    var inst = new v.cls(viewProps(name));
    inst._root = root; inst._tpl = tpl;
    inst._render();
    if (inst.componentDidMount) inst.componentDidMount();
    current = inst;
    if (v.back) host.appendChild(h('button', { class: 'cmn-back', type: 'button', text: '← Home', onclick: function () { go(homeView()); } }));
    markMenu(name);
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function go(name) {
    var target = '#' + name.replace('.dc.html', '');
    if (location.hash === target) show(name); else location.hash = target;
  }
  function fromHash() { var x = (location.hash || '').replace('#', ''); return x && VIEWS[x + '.dc.html'] ? x + '.dc.html' : homeView(); }
  window.addEventListener('hashchange', function () { if (state.booted) show(fromHash()); });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var x = a.getAttribute('href') || '';
    if (/^[A-Za-z0-9_-]+\.dc\.html$/.test(x)) { e.preventDefault(); go(x); }
  });

  /* ---------------- menu ---------------- */
  var MENU = [
    { view: 'OneOnOne.dc.html', label: 'My 1:1 home', sub: 'Start here, your sessions & extras', private: true },
    { view: 'Dashboard.dc.html', label: 'Breakthrough Companion', sub: 'Your course companion' },
    { view: 'StarHome.dc.html', label: 'North Star & STAR Goals', sub: 'Who you’re becoming' },
    { view: 'StarPlan.dc.html', label: 'Do what they would do', sub: 'Your daily plan & check-ins' },
    { view: 'BreakingOut.dc.html', label: 'Breaking Out of Your Box', sub: 'Bust open limiting beliefs' },
    { view: 'RepTest.dc.html', label: 'Representational System Test', sub: 'How your brain takes things in', private: true },
    { view: 'ECT.dc.html', label: 'Emotional Breakthrough (ECT)', sub: 'Go deeper with Sav', private: true }
  ];
  var menuEl, menuBtn;
  function markMenu(name) { if (!menuEl) return; menuEl.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('on', b.dataset.view === name); }); }
  function buildMenu() {
    if (menuBtn) menuBtn.remove(); if (menuEl) menuEl.remove();
    menuBtn = h('button', { class: 'bt-menubtn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'bt-menu', onclick: function () { toggleMenu(); } }, [
      h('span', { id: 'bt-sync', class: 'bt-dot', 'data-s': LIVE ? 'ok' : 'local', 'aria-hidden': 'true' }), 'Menu'
    ]);
    var items = MENU.filter(function (m) { return VIEWS[m.view] && (!m.private || state.tier === 'private'); }).map(function (m) {
      return h('button', { class: 'bt-mi', type: 'button', 'data-view': m.view, onclick: function () { toggleMenu(false); go(m.view); } }, [
        h('span', { class: 'bt-mit', text: m.label }), h('span', { class: 'bt-mis', text: m.sub })
      ]);
    });
    var who = state.profile ? (state.profile.full_name || state.profile.email) : 'Preview mode (saving on this device only)';
    menuEl = h('div', { id: 'bt-menu', class: 'bt-menu', hidden: true, role: 'dialog', 'aria-label': 'Menu' }, [
      h('div', { class: 'bt-mhead' }, [h('span', { class: 'bt-mk', text: state.tier === 'private' ? '1:1 Breakthrough' : 'Breakthrough' }), h('span', { class: 'bt-who', text: who })]),
      h('nav', { class: 'bt-mlist' }, items),
      h('div', { class: 'bt-mfoot' }, [
        state.isAdmin ? h('a', { class: 'bt-btn lime', href: '/admin', text: 'Coach dashboard' }) : null,
        h('button', { class: 'bt-btn ghost', type: 'button', text: 'Back up my answers', onclick: exportData }),
        h('label', { class: 'bt-btn ghost' }, ['Restore a backup', h('input', { type: 'file', accept: 'application/json,.json', class: 'bt-file', onchange: importData })]),
        LIVE ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Log out', onclick: logout }) : null,
        h('button', { class: 'bt-btn', type: 'button', text: 'Close', onclick: function () { toggleMenu(false); } })
      ])
    ]);
    document.body.appendChild(menuBtn); document.body.appendChild(menuEl);
  }
  function toggleMenu(force) {
    var open = force == null ? menuEl.hidden : force;
    menuEl.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { markMenu(fromHash()); var f = menuEl.querySelector('.bt-mi'); if (f) f.focus(); }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuEl && !menuEl.hidden) toggleMenu(false); });

  /* ---------------- backup / restore ---------------- */
  function exportData() {
    var data = {}; appKeys().forEach(function (k) { data[k] = lsGet(k); });
    var file = { app: 'breakthrough', version: 1, exportedAt: new Date().toISOString(), email: state.profile ? state.profile.email : null, data: data };
    var blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    var name = 'breakthrough-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    var f = null; try { f = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'My Breakthrough backup' }).catch(function () {}); return; }
    var a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); a.remove();
  }
  function importData(e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    file.text().then(function (txt) {
      var j = JSON.parse(txt);
      if (!j || j.app !== 'breakthrough' || !j.data) throw new Error('not a backup');
      Object.keys(j.data).forEach(function (k) { if (j.data[k] != null) LS.setItem(k, j.data[k]); });
      toast('Backup restored.'); toggleMenu(false); show(fromHash());
    }).catch(function () { toast('That file isn’t a Breakthrough backup.'); });
  }

  /* ---------------- login screen ---------------- */
  var gate = document.getElementById('bt-gate');
  function renderGate(step, email, err) {
    gate.hidden = false; gate.innerHTML = '';
    var priv = state.door === 'private';
    var title = priv ? 'Your 1:1 Breakthrough' : 'Breakthrough Companion';
    var lede = priv ? 'Welcome to your private space with Sav. Pop in the email you booked with and we’ll send you a 6-digit code.' : 'Your self-paced companion. Pop in the email you bought the course with and we’ll send you a 6-digit code.';
    var card;
    if (step === 'email') {
      var inp = h('input', { id: 'bt-email', class: 'bt-in', type: 'email', autocomplete: 'email', inputmode: 'email', required: 'true', placeholder: 'you@example.com', value: email || '' });
      card = h('form', { class: 'bt-card', onsubmit: function (ev) { ev.preventDefault(); sendCode(inp.value.trim()); } }, [
        h('label', { for: 'bt-email', class: 'bt-lab', text: 'Your email' }), inp,
        err ? h('p', { class: 'bt-err', role: 'alert', text: err }) : null,
        h('button', { class: 'bt-btn lime big', type: 'submit', text: 'Send my code' })
      ]);
    } else {
      var code = h('input', { id: 'bt-code', class: 'bt-in code', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]*', maxlength: '8', required: 'true', placeholder: '123456' });
      card = h('form', { class: 'bt-card', onsubmit: function (ev) { ev.preventDefault(); verifyCode(email, code.value.replace(/\D/g, '')); } }, [
        h('p', { class: 'bt-note', text: 'We\u2019ve emailed ' + email + '. Type the 6-digit code from the email here, or just tap the link in it. It can take a minute, so check your junk folder too.' }),
        h('label', { for: 'bt-code', class: 'bt-lab', text: '6-digit code' }), code,
        err ? h('p', { class: 'bt-err', role: 'alert', text: err }) : null,
        h('button', { class: 'bt-btn lime big', type: 'submit', text: 'Let me in' }),
        h('button', { class: 'bt-link', type: 'button', text: 'Use a different email', onclick: function () { renderGate('email', email); } })
      ]);
    }
    gate.appendChild(h('div', { class: 'bt-gwrap' }, [
      h('img', { class: 'bt-logo', src: '/icons/icon-192.png', alt: '' }),
      h('p', { class: 'bt-kick', text: priv ? 'Private client' : 'Self-paced' }),
      h('h1', { class: 'bt-h1', text: title }),
      h('p', { class: 'bt-lede', text: lede }),
      card,
      isStandalone() ? null : h('p', { class: 'bt-tip', text: 'Tip: on iPhone, tap Share → Add to Home Screen first, then log in from the new icon so it opens like an app.' })
    ]));
    var f = gate.querySelector('input'); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function sendCode(email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return renderGate('email', email, 'That email doesn’t look quite right.');
    gate.querySelector('button[type=submit]').textContent = 'Sending…';
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } }).then(function (r) {
      if (r.error) return renderGate('email', email, r.error.status === 429 ? 'Too many tries. Wait a minute and try again.' : 'Couldn’t send the code. Try again in a moment.');
      renderGate('code', email);
    });
  }
  function verifyCode(email, token) {
    sb.auth.verifyOtp({ email: email, token: token, type: 'email' }).then(function (r) {
      if (r.error) return renderGate('code', email, 'That code didn’t work. Check it, or go back and get a new one.');
      start(r.data.session);
    });
  }
  function logout() {
    flush().then(function () { return sb.auth.signOut(); }).then(function () {
      appKeys().forEach(lsDel); lsDel('__bt_uid'); lsDel('__bt_queue'); queue = {};
      location.href = state.tier === 'private' ? '/1to1' : '/';
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    gate.hidden = true;
    buildMenu();
    state.booted = true;
    show(fromHash());
  }
  function start(session) {
    state.user = session.user;
    gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><p class="bt-lede">Opening your space…</p></div>';
    Promise.all([
      sb.from('profiles').select('*').eq('id', state.user.id).maybeSingle(),
      sb.from('app_settings').select('key,value')
    ]).then(function (r) {
      var p = r[0].data || { email: state.user.email, tier: 'self_paced', is_admin: false, full_name: '' };
      state.profile = p; state.tier = p.tier; state.isAdmin = !!p.is_admin;
      (r[1].data || []).forEach(function (row) { state.settings[row.key] = row.value; });
      sb.rpc('touch_last_seen').then(function () {}, function () {});
      return hydrate();
    }).then(boot, function (e) { console.error(e); boot(); });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(function () {});

  if (!LIVE) {
    // Preview mode: no backend yet. Everything saves to this device. ?door=private shows the 1:1 menu.
    state.tier = state.door === 'private' ? 'private' : 'self_paced';
    boot();
    toast('Preview mode: answers save on this device only.');
  } else {
    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (s) { if (location.hash.indexOf('access_token') >= 0) history.replaceState(null, '', location.pathname); start(s); } else renderGate('email');
    });
  }
})();
