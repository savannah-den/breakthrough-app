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
  var LOCAL_ONLY = /^(__bt|bt-return$|cmn-open-tab$|cmn-dash-focus$|sb-)/;
  var LS = window.localStorage, VIEWAS = window.BT_VIEWAS || null, TRIAL = !!window.BT_TRIAL;
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function lsGet(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (VIEWAS || TRIAL) LS.setItem(k, v); else rawSet.call(LS, k, v); } catch (e) {} }
  function lsDel(k) { try { if (VIEWAS || TRIAL) LS.removeItem(k); else rawRemove.call(LS, k); } catch (e) {} }

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
    if (VIEWAS || TRIAL || LOCAL_ONLY.test(key)) return;
    queue[key] = { v: value, t: new Date().toISOString() };
    lsSet('__bt_queue', JSON.stringify(queue));
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 900);
  }

  Storage.prototype.setItem = function (k, v) {
    var before = this === LS && k === 'program-decoder-v1' ? LS.getItem(k) : null;
    rawSet.call(this, k, v);
    if (this === LS) queueWrite(String(k), String(v));
    if (this === LS && k === 'program-decoder-v1') { try { newWin(before, v); } catch (e) {} }
  };
  // a brand-new win (added in the last few minutes) pings Sav's phone, once
  function newWin(before, after) {
    if (VIEWAS || TRIAL || !LIVE || !state.user || window.BT_DEMO) return;
    var a = JSON.parse(after || '{}').evidence || [], b = {}; (JSON.parse(before || '{}').evidence || []).forEach(function (e) { b[e.id] = 1; });
    var w = a.filter(function (e) { return e && e.win && !b[e.id] && Date.now() - Number(e.id) < 10 * 60000; })[0];
    if (w) notify('win', w.text);
  }
  function notify(type, text) {
    if (VIEWAS || TRIAL || !LIVE || !state.user || window.BT_DEMO) return;
    sb.auth.getSession().then(function (r) { var tok = r.data && r.data.session && r.data.session.access_token; if (!tok) return;
      return fetch('/.netlify/functions/push-notify', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ type: type, text: String(text || '').slice(0, 200) }) });
    }).catch(function () {});
  }
  window.BT_NOTIFY = notify;
  // phone notifications: sign this phone up (or off), with a daily reminder hour in their own timezone
  function b64u(str) { var p = '='.repeat((4 - str.length % 4) % 4), raw = atob((str + p).replace(/-/g, '+').replace(/_/g, '/')), out = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out; }
  window.BT_PUSH = {
    supported: function () { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
    standalone: function () { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; },
    status: function () { if (!window.BT_PUSH.supported()) return Promise.resolve(null); return navigator.serviceWorker.getRegistration().then(function (reg) { return reg ? reg.pushManager.getSubscription() : null; }).then(function (s) { return s ? { on: true, endpoint: s.endpoint } : { on: false, perm: Notification.permission }; }).catch(function () { return { on: false }; }); },
    on: function (hour) {
      if (!LIVE || !state.user) return Promise.reject(new Error('Log in first'));
      return fetch('/.netlify/functions/push-notify?key=1').then(function (r) { return r.json(); }).then(function (k) {
        if (!k.key) throw new Error('Notifications aren’t switched on for the app yet.');
        return Notification.requestPermission().then(function (perm) {
          if (perm !== 'granted') throw new Error('Notifications are blocked. Turn them on for this app in your phone’s settings.');
          return navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; }).then(function (reg) {
            return reg.pushManager.getSubscription().then(function (s) { return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(k.key) }); });
          });
        });
      }).then(function (sub) {
        var j = sub.toJSON(), tz = (window.BT_TIME && BT_TIME.tz()) || Intl.DateTimeFormat().resolvedOptions().timeZone;
        return sb.from('push_subs').upsert({ endpoint: j.endpoint, user_id: state.user.id, sub: j, tz: tz, remind_hour: hour === null || hour === undefined || hour === '' ? null : Number(hour), updated_at: new Date().toISOString() }).then(function (r) { if (r.error) throw r.error; return true; });
      });
    },
    off: function () {
      return navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.pushManager.getSubscription(); }).then(function (s) {
        if (!s) return true; var ep = s.endpoint; return s.unsubscribe().then(function () { return LIVE ? sb.from('push_subs').delete().eq('endpoint', ep) : null; });
      });
    }
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

  // Tapping something that folds a card away (Done, a tick, "I'm committed"…): keep their place.
  // The folded card lands at the top of the screen with the start of the next card right under it.
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button, label, [role="button"], input[type="checkbox"]') : null;
    if (!b || b.closest('#bt-top, .bt-menu, .bt-party, .bt-tour, .bt-point, dialog')) return;
    var card = b.closest('section, .cc, .bt-card2, details, article, .card') || b.parentElement; if (!card) return;
    var top = card.getBoundingClientRect().top + window.scrollY, docH = document.documentElement.scrollHeight;
    var nav = document.getElementById('bt-top'), off = (nav ? nav.getBoundingClientRect().bottom : 0) + 12;
    var done = false, settle = function () {
      if (done || document.documentElement.scrollHeight > docH - 120) return; // nothing folded away (yet)
      done = true;
      if (window.scrollY > top - off - 4) window.scrollTo({ top: Math.max(0, top - off), behavior: 'smooth' });
    };
    setTimeout(settle, 140); setTimeout(settle, 500);
  });

  /* ---------------- router (replaces each artifact's own) ---------------- */
  // Everyone lands on the same home; 1:1 clients get the 1:1 extras on top.
  function homeView() { return 'Dashboard.dc.html'; }
  function nativeView(name) { var N = window.BT_NATIVE || {}; var base = String(name).split('-')[0]; return N[base] ? N[base] : null; }
  var WEEK_OF = { 'BreakingOut.dc.html': 2, 'StarHome.dc.html': 7, 'StarGoal.dc.html': 7, 'StarPlan.dc.html': 7 };
  function weekLocked(name) { return !!(WEEK_OF[name] && window.BT_COURSE && window.BT_COURSE.weekOpen && !window.BT_COURSE.weekOpen(WEEK_OF[name])); }
  function allowed(name) { if (nativeView(name)) return true; if (name === 'OneOnOne.dc.html') return false; /* 1:1 start-here lives on the home page now */ var v = VIEWS[name]; return v && (!v.private || state.tier === 'private') && !weekLocked(name); }
  function viewProps(name) {
    var v = VIEWS[name], p = Object.assign({}, v.props || {});
    var over = (state.settings.props || {})[name] || {};
    Object.keys(over).forEach(function (k) { if (over[k] !== '' && over[k] != null) p[k] = over[k]; });
    if ('clientName' in p && state.profile && state.profile.full_name) p.clientName = state.profile.full_name.split(' ')[0];
    p.tierLabel = state.tier === 'private' ? '1:1 client' : 'Self-paced';
    return p;
  }
  var current = null;
  function show(name) {
    if (!allowed(name)) name = homeView();
    if (name !== 'Welcome' && window.BT_COURSE && window.BT_COURSE.needsWelcome && window.BT_COURSE.needsWelcome()) name = 'Welcome';
    else if (name !== 'Contract' && name !== 'Welcome' && window.BT_COURSE && window.BT_COURSE.needsContract && window.BT_COURSE.needsContract()) name = 'Contract';
    else if (name !== 'Start' && name !== 'NextTest' && name !== 'Contract' && name !== 'Welcome' && window.BT_COURSE && window.BT_COURSE.needsStart && window.BT_COURSE.needsStart()) name = 'Start';
    else if (window.BT_COURSE && window.BT_COURSE.introBlocked && window.BT_COURSE.introBlocked(name)) name = 'Course';
    var route = name;
    var nvo = nativeView(name);
    if (nvo && nvo.view) { if (nvo.before) nvo.before(); name = nvo.view; } // e.g. #Journal = home view on its Journal tab
    var v = VIEWS[name];
    if (current) { current._dead = true; try { if (current.componentWillUnmount) current.componentWillUnmount(); } catch (e) {} }
    var host = document.getElementById('app');
    while (host.firstChild) host.removeChild(host.firstChild);
    var nv = nativeView(name);
    if (nv && !nv.view) {
      current = null;
      var nroot = h('div', { id: 'v-native', class: 'bt-native' }); host.appendChild(nroot);
      nv(nroot, String(name).split('-').slice(1).join('-'));
      markMenu(name); if (window.BT_COURSE) window.BT_COURSE.afterShow(name);
      try { window.scrollTo(0, 0); } catch (e) {}
      return;
    }
    var root = document.createElement('div'); root.id = 'v-' + v.slug; host.appendChild(root);
    var tpl = Array.prototype.slice.call(document.getElementById('t-' + v.slug).content.childNodes);
    var inst = new v.cls(viewProps(name));
    inst._root = root; inst._tpl = tpl;
    inst._render();
    if (inst.componentDidMount) inst.componentDidMount();
    current = inst; window.BT_VIEW_INST = inst;
    if (v.back || name === 'OneOnOne.dc.html') host.appendChild(h('button', { class: 'cmn-back', type: 'button', text: '← Home', onclick: function () { go(homeView()); } }));
    markMenu(name); if (window.BT_COURSE) window.BT_COURSE.afterShow(route);
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function go(name) {
    name = VIEW_ALIAS[name] || name;
    var target = '#' + String(name).replace('.dc.html', '');
    if (location.hash === target) show(name); else location.hash = target;
  }
  function fromHash() { var x = decodeURIComponent((location.hash || '').replace('#', '')); if (x && nativeView(x)) return x; return x && VIEWS[x + '.dc.html'] ? x + '.dc.html' : homeView(); }
  window.addEventListener('hashchange', function () { if (state.booted) show(fromHash()); });
  // some tools still call a page by its old name (the Rep System test was "Main")
  var VIEW_ALIAS = { 'Main.dc.html': 'RepTest.dc.html' };
  // capture phase, so the tools' own link handling can't swallow these first
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var x = a.getAttribute('href') || '';
    if (/^[A-Za-z0-9_-]+\.dc\.html$/.test(x)) { e.preventDefault(); e.stopPropagation(); go(VIEW_ALIAS[x] || x); return; }
    if (/^\/(tools\/|#)/.test(x) && a.target === '_blank') { e.preventDefault(); e.stopPropagation(); if (x.charAt(1) === '#') { location.hash = x.slice(1); } else location.href = x; return; }
    // links to other websites always open in a new tab/window, so the app stays where they left it
    if (!window.BT_DEMO && /^https?:/i.test(a.href) && a.origin !== location.origin && !/^https?:\/\/(www\.)?(vimeo|youtube|youtu|loom)\./i.test(a.href)) { e.preventDefault(); e.stopPropagation(); window.open(a.href, '_blank', 'noopener'); }
  }, true);

  /* ---------------- menu ---------------- */
  var MENU = [
    { view: 'Course', label: 'Course', sub: 'Pick up where you left off' },
    { view: 'Dashboard.dc.html', label: 'Home', sub: 'Proof, reminders & what’s next' },
    { view: 'Book', label: 'The Becoming Book', sub: 'Your notebook + your journey, dated' },
    { view: 'BreakingOut.dc.html', label: 'Breaking Out of Your Box', sub: 'Bust open limiting beliefs', week: 2 },
    { view: 'StarHome.dc.html', label: 'North Star & STAR Goals', sub: 'Who you’re becoming', week: 7 },
    { view: 'StarPlan.dc.html', label: 'Do what they would do', sub: 'Your daily plan & check-ins', week: 7 },
    { view: 'RepTest.dc.html', label: 'Representational System Test', sub: 'How your brain takes things in', private: true },
    { view: 'ECT.dc.html', label: 'Emotional Breakthrough (ECT)', sub: 'Go deeper with Sav', private: true }
  ];
  // Stand-alone tool pages (built by tools/import_canvas.py into public/tools/)
  var TOOL_MENU = [
    { href: '/tools/emotional-blueprint.html', label: 'Emotional Blueprint', sub: 'Map and rewrite your emotional patterns' },
    { href: '/tools/what-if-workout.html', label: 'The What If? Workout', sub: 'Stretch past the worst-case story' },
    { href: '/tools/rewind.html', label: 'REWIND', sub: 'Respond instead of react' },
    { href: '/tools/coming-home.html', label: 'Coming Home', sub: 'Back into your body' },
    { href: '/tools/understanding-bridge.html', label: 'The Understanding Bridge', sub: 'Meet people where they are' }
  ];
  var menuEl, menuBtn;
  function markMenu(name) { if (!menuEl) return; menuEl.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('on', b.dataset.view === name); }); }
  function buildMenu() {
    if (menuBtn) menuBtn.remove(); if (menuEl) menuEl.remove();
    // the floating bubble is a search now: "find anything" (the top menu and profile cover the rest)
    menuBtn = h('button', { class: 'bt-menubtn bt-findbtn', type: 'button', 'aria-label': 'Find anything', title: 'Find anything', onclick: function () { if (window.BT_COURSE && window.BT_COURSE.find) window.BT_COURSE.find(); else toggleMenu(); } }, [
      h('span', { id: 'bt-sync', class: 'bt-dot', 'data-s': LIVE ? 'ok' : 'local', 'aria-hidden': 'true' })
    ]);
    menuBtn.insertAdjacentHTML('beforeend', '<svg class="bt-find-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>');
    var items = MENU.filter(function (m) { return (VIEWS[m.view] || nativeView(m.view)) && (!m.private || state.tier === 'private'); }).map(function (m) {
      var locked = weekLocked(m.view);
      return h('button', { class: 'bt-mi' + (locked ? ' lock' : ''), type: 'button', 'data-view': m.view, 'aria-disabled': locked ? 'true' : null, onclick: function () { if (locked) { toast('This opens in Week ' + WEEK_OF[m.view] + ' of the course.'); return; } toggleMenu(false); go(m.view); } }, [
        h('span', { class: 'bt-mit', text: (locked ? '🔒 ' : '') + m.label }), h('span', { class: 'bt-mis', text: locked ? 'Opens in Week ' + WEEK_OF[m.view] : m.sub })
      ]);
    });
    var who = state.profile ? (state.profile.full_name || state.profile.email) : 'Preview mode (saving on this device only)';
    menuEl = h('div', { id: 'bt-menu', class: 'bt-menu', hidden: true, role: 'dialog', 'aria-label': 'Menu' }, [
      h('div', { class: 'bt-mhead' }, [h('span', { class: 'bt-mk', text: state.tier === 'private' ? '1:1 Breakthrough' : 'Breakthrough' }), h('span', { class: 'bt-who', text: who })]),
      h('nav', { class: 'bt-mlist' }, items.concat([h('p', { class: 'bt-mh', text: 'Tools' })], TOOL_MENU.filter(function (t) { return !t.private || state.tier === 'private'; }).map(function (t) {
        return h('a', { class: 'bt-mi', href: t.href }, [h('span', { class: 'bt-mit', text: t.label }), h('span', { class: 'bt-mis', text: t.sub })]);
      }))),
      h('div', { class: 'bt-mfoot' }, [
        h('button', { class: 'bt-btn', type: 'button', text: 'My profile', onclick: function () { toggleMenu(false); go('Profile'); } }),
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
    if (open) buildMenu(); // refresh what's unlocked
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
    if (step === 'pw') {
      var em = h('input', { id: 'bt-email', class: 'bt-in', type: 'email', autocomplete: 'email', inputmode: 'email', required: 'true', placeholder: 'you@example.com', value: email || '' });
      var pw = h('input', { id: 'bt-pw', class: 'bt-in', type: 'password', autocomplete: 'current-password', required: 'true', placeholder: 'Your password' });
      card = h('form', { class: 'bt-card', onsubmit: function (ev) {
        ev.preventDefault(); var btn = gate.querySelector('button[type=submit]'); btn.textContent = 'Logging in…';
        sb.auth.signInWithPassword({ email: em.value.trim(), password: pw.value }).then(function (r) {
          if (r.error) return renderGate('pw', em.value.trim(), 'That email and password don’t match. Try again, or get a code instead.');
          start(r.data.session);
        });
      } }, [
        h('label', { for: 'bt-email', class: 'bt-lab', text: 'Your email' }), em,
        h('label', { for: 'bt-pw', class: 'bt-lab', text: 'Password' }), pw,
        err ? h('p', { class: 'bt-err', role: 'alert', text: err }) : null,
        h('button', { class: 'bt-btn lime big', type: 'submit', text: 'Log in' }),
        h('button', { class: 'bt-link', type: 'button', text: 'Forgot it? Email me a code instead', onclick: function () { renderGate('email', em.value.trim()); } })
      ]);
    } else if (step === 'email') {
      var inp = h('input', { id: 'bt-email', class: 'bt-in', type: 'email', autocomplete: 'email', inputmode: 'email', required: 'true', placeholder: 'you@example.com', value: email || '' });
      card = h('form', { class: 'bt-card', onsubmit: function (ev) { ev.preventDefault(); sendCode(inp.value.trim()); } }, [
        h('label', { for: 'bt-email', class: 'bt-lab', text: 'Your email' }), inp,
        err ? h('p', { class: 'bt-err', role: 'alert', text: err }) : null,
        h('button', { class: 'bt-btn lime big', type: 'submit', text: 'Send my code' }),
        h('button', { class: 'bt-link', type: 'button', text: 'I’ve set a password', onclick: function () { renderGate('pw', inp.value.trim()); } })
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
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname + location.search } }).then(function (r) {
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
  window.BT_APP = {
    state: state, h: h, toast: toast, go: function (n) { go(n); }, sb: function () { return sb; }, live: LIVE, flush: function () { return flush(); },
    home: function () { go(homeView()); }, logout: function () { logout(); }, exportData: function () { exportData(); },
    embedUrl: function (u) { return embedUrl(u); }, reload: function () { show(fromHash()); },
    viewProps: function (n) { return viewProps(n); }, views: VIEWS
  };
  function boot() {
    if (window.BT_COURSE) window.BT_COURSE.init(window.BT_APP);
    var nx = new URLSearchParams(location.search).get('next');
    if (nx && /^\/tools\/[\w-]+\.html$/.test(nx)) { location.replace(nx); return; }
    gate.hidden = true;
    buildMenu();
    state.booted = true;
    show(fromHash());
  }
  function start(session) {
    state.user = session.user;
    gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><p class="bt-lede">Opening your space…</p></div>';
    if (VIEWAS) return startViewAs(session);
    if (TRIAL) return startTrial(session);
    Promise.all([
      sb.from('profiles').select('*').eq('id', state.user.id).maybeSingle(),
      sb.from('app_settings').select('key,value'),
      sb.from('contracts').select('*').eq('user_id', state.user.id).maybeSingle().then(function (x) { return x; }, function () { return { data: null }; })
    ]).then(function (r) {
      state.contract = (r[2] && !r[2].error && r[2].data) || null;
      var p = r[0].data || { email: state.user.email, tier: 'self_paced', is_admin: false, full_name: '' };
      state.profile = p; state.tier = p.tier; state.isAdmin = !!p.is_admin;
      (r[1].data || []).forEach(function (row) { state.settings[row.key] = row.value; });
      sb.rpc('touch_last_seen').then(function () {}, function () {});
      return hydrate();
    }).then(boot, function (e) { console.error(e); boot(); });
  }


  // Coach trying the new-client journey: her login, but as a brand-new 1:1 client with a sample agreement. Nothing saves.
  function startTrial(session) {
    Promise.all([
      sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
      sb.from('app_settings').select('key,value')
    ]).then(function (r) {
      var me = r[0].data;
      if (!me || !me.is_admin) { gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><p class="bt-lede">This view is for your coach only.</p></div>'; return; }
      (r[1].data || []).forEach(function (row) { state.settings[row.key] = row.value; });
      state.trial = true; state.profile = Object.assign({}, me, { is_admin: false, tier: 'private' }); state.tier = 'private'; state.isAdmin = false;
      var C = window.BT_CONTRACT, t = C ? C.defaults() : {};
      t.call = { zoom: 'https://zoom.us/j/0000000000', times: 'Tuesdays at 10am (your time)', upcoming: [new Date(Date.now() + 3 * 864e5).toISOString()] };
      state.contract = { user_id: session.user.id, status: 'sent', terms: t };
      try { sessionStorage.removeItem('bt-ns-ok'); } catch (e) {}
      var bar = h('div', { id: 'bt-viewas', class: 'bt-viewas', role: 'status' }, [h('span', { text: '🧪 Trying the new-client journey. Nothing you do here is saved, and the agreement is a sample.' }), h('a', { href: '/admin.html', text: 'Back to dashboard' })]);
      document.body.appendChild(bar); document.body.classList.add('bt-viewing');
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      boot();
    }, function () { boot(); });
  }

  // Coach viewing a client's app: load her data into the throwaway copy, read-only
  function startViewAs(session) {
    sb.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle().then(function (me) {
      if (!me.data || !me.data.is_admin) { gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><p class="bt-lede">This view is for your coach only.</p></div>'; return; }
      return Promise.all([
        sb.from('profiles').select('*').eq('id', VIEWAS).maybeSingle(),
        sb.from('app_settings').select('key,value'),
        sb.from('client_data').select('key,value').eq('user_id', VIEWAS),
        sb.from('contracts').select('*').eq('user_id', VIEWAS).maybeSingle().then(function (x) { return x; }, function () { return { data: null }; })
      ]).then(function (r) {
        var p = r[0].data; if (!p) { gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><p class="bt-lede">Couldn’t find that client.</p></div>'; return; }
        state.user = { id: VIEWAS, email: p.email }; state.viewAs = true; state.profile = p; state.tier = p.tier; state.isAdmin = false; state.contract = (r[3] && r[3].data) || null;
        (r[1].data || []).forEach(function (row) { state.settings[row.key] = row.value; });
        (r[2].data || []).forEach(function (row) { if (row.value != null) LS.setItem(row.key, row.value); });
        try { sessionStorage.setItem('bt-ns-ok', '1'); } catch (e) {}
        var bar = h('div', { id: 'bt-viewas', class: 'bt-viewas', role: 'status' }, [h('span', { text: '👀 Viewing ' + ((p.full_name || p.email).replace(/^Example:\s*/, '')) + '’s app. Read-only: nothing you tap here is saved.' }), h('a', { href: window.BT_DEMO ? 'admin.html' : '/admin.html', text: 'Back to dashboard' })]);
        document.body.appendChild(bar); document.body.classList.add('bt-viewing');
        boot();
      });
    });
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
