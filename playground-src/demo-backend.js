/* PLAYGROUND ONLY. Stands in for the real database so the copy of the app in Claude
   works on its own: you're logged in automatically, your answers save in this browser,
   and the coach dashboard shows you plus a few made-up example clients.
   Nothing here ever touches the live app or real client data. */
(function () {
  'use strict';
  var K = '__bt_demo_db', raw = Storage.prototype.setItem;
  var ME = 'u-me';
  function iso(daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); }
  function seed() {
    return {
      seq: 10,
      profiles: [
        { id: ME, email: 'you@playground', full_name: 'Sav (playground)', tier: 'private', is_admin: true, created_at: iso(30), last_seen_at: iso(0), program_start: iso(14).slice(0, 10) },
        { id: 'u-ex1', email: 'example.anna@sample.test', full_name: 'Example: Anna', tier: 'private', is_admin: false, created_at: iso(12), last_seen_at: iso(1), program_start: iso(16).slice(0, 10) },
        { id: 'u-ex2', email: 'example.bec@sample.test', full_name: 'Example: Bec', tier: 'self_paced', is_admin: false, created_at: iso(40), last_seen_at: iso(9) }
      ],
      client_data: [
        { user_id: 'u-ex1', key: 'cmn-rep-results', value: JSON.stringify({ ranks: [{ 0: 4, 1: 2, 2: 3, 3: 1 }, { 0: 1, 1: 4, 2: 2, 3: 3 }, { 0: 4, 1: 3, 2: 1, 3: 2 }, { 0: 1, 1: 2, 2: 4, 3: 3 }, { 0: 2, 1: 1, 2: 4, 3: 3 }], name: 'Anna', date: 'Example' }), updated_at: iso(3) },
        { user_id: 'u-ex1', key: 'cmn-1to1-dashboard', value: JSON.stringify({ guideOk: true, wa: true, repDone: true, hd: { type: 'sent', sent: true, date: 'Example' }, weeks: { w1: true, w2: true } }), updated_at: iso(1) },
        { user_id: 'u-ex1', key: 'north-star-home-v1', value: JSON.stringify({ northStar: 'Example answer: I am a calm, grounded woman who trusts herself and leads from ease rather than fear.', identity: ['Calm', 'Trusting', 'Playful'] }), updated_at: iso(2) },
        { user_id: 'u-ex2', key: 'cmn-companion', value: JSON.stringify({ checks: { watched: true, joined: true } }), updated_at: iso(9) }
      ],
      coach_notes: [{ id: 1, client_id: 'u-ex1', body: 'Example note: big shift in session 2 around her money story.', created_at: iso(2) }],
      invites: [{ email: 'example.anna@sample.test', tier: 'private', full_name: 'Example: Anna', created_at: iso(12) }],
      app_settings: [],
      contracts: [{ user_id: 'u-ex1', status: 'signed', terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(16).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber' }, signed_at: iso(15), signed: { client: { name: 'Example: Anna', signedName: 'Example: Anna', email: 'example.anna@sample.test', phone: '0400 000 000', address: '1 Example St, Brisbane QLD', consent: 'anon', tz: 'Australia/Brisbane' }, terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(16).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber' } } }]
    };
  }
  var D; try { D = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { D = null; }
  if (!D || !D.profiles) D = seed();
  if (!D.contracts) D.contracts = seed().contracts;
  if (!D.coach_clients) D.coach_clients = [];
  function save() { try { raw.call(localStorage, K, JSON.stringify(D)); } catch (e) {} }

  // keep her on the page she was working on when the playground reloads
  try {
    if (!location.hash || location.hash === '#') { var lh = localStorage.getItem('__bt_lasthash'); if (lh && lh !== '#Dashboard' && !(window.BT_DEMO && window.BT_DEMO.file && !/app\.html/.test(window.BT_DEMO.file))) location.hash = lh; }
    window.addEventListener('hashchange', function () { try { if (/^#[A-Za-z]/.test(location.hash) && !/^#(ActDone|Back)-/.test(location.hash)) raw.call(localStorage, '__bt_lasthash', location.hash); } catch (e) {} });
  } catch (e) {}

  // "New client experience": start Sav's playground login from scratch, as a brand-new 1:1 client would
  if (window.BT_DEMO && window.BT_DEMO.fresh) {
    D.client_data = D.client_data.filter(function (r) { return r.user_id !== ME; });
    D.contracts = (D.contracts || []).filter(function (r) { return r.user_id !== ME; });
    D.contracts.push({ user_id: ME, status: 'sent', terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(-3).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber', call: { zoom: 'https://zoom.us/j/0000000000', times: 'Tuesdays at 10am (your time)', upcoming: [iso(-3), iso(-10)] } } });
    try { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k0 = localStorage.key(i); if (k0 && !/^__bt_demo_db$/.test(k0)) ks.push(k0); } ks.forEach(function (k) { localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) {}
    // start part-way: after the profile set-up, or straight at the agreement
    var skip = window.BT_DEMO.skip || '';
    if (skip) { try { localStorage.setItem('bt-profile', JSON.stringify({ onboarded: Date.now(), tz: 'Australia/Brisbane', country: 'AU', phone: '0400 000 000' })); if (skip === 'contract') localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true }));
      // straight to step 5, the welcome module: app saved, agreement signed, WhatsApp joined, tests left for later
      if (skip === 'welcome' || skip === 'ready') {
        localStorage.setItem('bt-profile', JSON.stringify({ onboarded: Date.now(), tz: 'Australia/Brisbane', country: 'AU', phone: '0400 000 000', startDone: Date.now() }));
        localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true, wa: true }));
        var c0 = D.contracts[D.contracts.length - 1], cl = { name: 'Sav (playground)', email: 'you@playground', phone: '0400 000 000', address: '12 Example St, Noosa QLD', consent: 'anon', notesAgreed: true, termsAgreed: true, signedName: 'Sav (playground)', tz: 'Australia/Brisbane' };
        c0.status = 'signed'; c0.signed_at = new Date().toISOString(); c0.signed = { client: cl, terms: c0.terms };
        // all set up: tests done and the welcome module finished, so everything's unlocked
        if (skip === 'ready') {
          var dd = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
          localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true, wa: true, repDone: true, repSent: true, hd: { type: 'sent', sent: true, date: dd }, disc: { type: 'sent', sent: true, date: dd } }));
          localStorage.setItem('bt-course', JSON.stringify({ done: { i1: Date.now(), i3: Date.now(), i2: Date.now() }, pct: {} }));
        }
      } } catch (e) {} }
  }
  // Which version am I looking at? ?door=private (1:1) or ?door=course (self-paced)
  var door = (window.BT_DEMO && window.BT_DEMO.door) || new URLSearchParams(location.search).get('door');
  var me = D.profiles.filter(function (p) { return p.id === ME; })[0];
  if (me && door) { me.tier = door === 'private' ? 'private' : 'self_paced'; }
  save();

  function Q(t) { this.t = t; this.f = []; this.op = 'select'; }
  Q.prototype.select = function () { this.ret = true; return this; };
  Q.prototype.eq = function (c, v) { this.f.push(function (r) { return r[c] === v; }); return this; };
  Q.prototype.in = function (c, v) { this.f.push(function (r) { return v.indexOf(r[c]) >= 0; }); return this; };
  Q.prototype.order = function () { return this; };
  Q.prototype.maybeSingle = function () { this.single = true; return this; };
  Q.prototype.upsert = function (rows) { this.op = 'upsert'; this.rows = [].concat(rows); return this; };
  Q.prototype.insert = function (rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; };
  Q.prototype.update = function (v) { this.op = 'update'; this.val = v; return this; };
  Q.prototype.delete = function () { this.op = 'delete'; return this; };
  Q.prototype.then = function (res, rej) {
    var self = this, T = D[this.t] || (D[this.t] = []), out;
    var m = function (r) { return self.f.every(function (f) { return f(r); }); };
    if (this.op === 'select') { out = T.filter(m).map(function (r) { return Object.assign({}, r); }); if (this.single) out = out[0] || null; }
    else if (this.op === 'upsert') {
      var pk = this.t === 'client_data' ? ['user_id', 'key'] : this.t === 'invites' ? ['email'] : this.t === 'profiles' ? ['id'] : this.t === 'contracts' ? ['user_id'] : this.t === 'coach_clients' ? ['client_id'] : ['key'];
      this.rows.forEach(function (r) { var ex = T.filter(function (x) { return pk.every(function (k) { return x[k] === r[k]; }); })[0]; if (ex) Object.assign(ex, r); else T.push(Object.assign({ created_at: new Date().toISOString() }, r)); });
      out = this.rows;
    }
    else if (this.op === 'insert') { this.rows.forEach(function (r) { r.id = D.seq++; r.created_at = new Date().toISOString(); T.push(r); }); out = this.rows; }
    else if (this.op === 'update') { T.filter(m).forEach(function (r) { Object.assign(r, self.val); }); out = null; }
    else if (this.op === 'delete') { D[this.t] = T.filter(function (r) { return !m(r); }); out = null; }
    save();
    return Promise.resolve({ data: out, error: null }).then(res, rej);
  };
  var session = { access_token: 'playground', user: { id: ME, email: 'you@playground' } };
  window.supabase = { createClient: function () { return {
    from: function (t) { return new Q(t); },
    rpc: function (name, args) {
      if (name === 'sign_my_contract') { var row = (D.contracts || []).filter(function (x) { return x.user_id === ME; })[0]; if (!row || row.status !== 'sent') return Promise.resolve({ data: null, error: { message: 'No agreement waiting to be signed' } }); var t = new Date().toISOString(); row.signed = { client: args.sig, terms: row.terms }; row.signed_at = t; row.status = 'signed'; row.updated_at = t; save(); return Promise.resolve({ data: t, error: null }); }
      if (me && name === 'update_my_profile' && args && args.new_name) me.full_name = args.new_name;
      if (me) { me.last_seen_at = new Date().toISOString(); save(); }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getSession: function () { return Promise.resolve({ data: { session: session } }); },
      signInWithOtp: function () { return Promise.resolve({ error: null }); },
      verifyOtp: function () { return Promise.resolve({ data: { session: session }, error: null }); },
      signOut: function () { return Promise.resolve({}); },
      signInWithPassword: function () { return Promise.resolve({ data: { session: session }, error: null }); },
      updateUser: function (u) { if (u && u.email && me) { me.email = u.email; save(); } return Promise.resolve({ data: {}, error: null }); }
    }
  }; } };

  // Pretend Google Calendar: weekly 1:1s with Example: Anna (one missing next booking), plus a couple of other appointments
  var realFetch = window.fetch;
  window.fetch = function (url, opts) {
    if (String(url).indexOf('/.netlify/functions/calendar') >= 0) {
      var ev = [], day = 86400000, base = new Date(); base.setUTCHours(0, 0, 0, 0);
      [-15, -8, -1].forEach(function (d, i) { var t = new Date(base.getTime() + d * day + 0 * 3600000); ev.push({ id: 'demo-anna-' + i, start: t.toISOString(), end: new Date(t.getTime() + 3600000).toISOString(), title: '1:1 Breakthrough session: Anna', attendees: ['example.anna@sample.test'], location: 'Zoom' }); });
      ev.push({ id: 'demo-group-1', start: new Date(base.getTime() + 2 * day + 7 * 3600000).toISOString(), end: new Date(base.getTime() + 2 * day + 8 * 3600000).toISOString(), title: 'Breakthrough group coaching call', attendees: [], location: 'Zoom' });
      ev.push({ id: 'demo-me-1', start: new Date(base.getTime() + 1 * day + 23 * 3600000).toISOString(), end: new Date(base.getTime() + 1 * day + 24 * 3600000).toISOString(), title: '1:1 session: Sav (playground)', attendees: ['you@playground'], location: 'Zoom' });
      return Promise.resolve(new Response(JSON.stringify({ events: ev, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    // Pretend Stripe + Shopify: Anna's first instalment paid, her second one failed, plus a couple of course sales
    // Pretend Vimeo: three videos named like lessons, with captions
    if (String(url).indexOf('/.netlify/functions/vimeo') >= 0) {
      var vids = [{ id: '900000001', name: 'Lesson 1: Welcome', link: 'https://vimeo.com/900000001', duration: 545 }, { id: '900000002', name: 'Lesson 1: Brain + Body', link: 'https://vimeo.com/900000002', duration: 1320 }, { id: '900000003', name: 'Lesson 2: Conscious + Unconscious Mind', link: 'https://vimeo.com/900000003', duration: 1105 }];
      var tr = { '900000001': 'Welcome to Breakthrough. I am so proud of you for being here. In this program we rewire the beliefs that keep you stuck, so you can finally follow through without burning out.', '900000002': 'Your brain and body are one system. When you feel overwhelmed, your nervous system is trying to keep you safe. Today we look at why procrastination is protection, not laziness.', '900000003': 'Your unconscious mind runs most of your day. The programs you picked up as a kid still drive your choices, especially around money, rest and saying no.' };
      var want = []; try { want = JSON.parse((opts && opts.body) || '{}').want || []; } catch (e) {}
      var tsx = {}; want.forEach(function (id) { if (tr[id]) tsx[id] = tr[id]; });
      return Promise.resolve(new Response(JSON.stringify({ videos: vids, transcripts: tsx, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    // Pretend Zoom: summaries, transcripts and recordings for Anna's past sessions
    if (String(url).indexOf('/.netlify/functions/zoom') >= 0) {
      var ss = []; try { ss = JSON.parse((opts && opts.body) || '{}').sessions || []; } catch (e) {}
      var found = {}; ss.forEach(function (x, i) { found[x.key] = { topic: '1:1 Breakthrough session', video: 'https://zoom.us/rec/share/demo-' + i, summary: 'Quick recap\nAnna worked through her biggest roadblock: starting things late at night when her energy dips. We reframed it as her nervous system looking for safety, not laziness.\n\nNext steps:\n• Anna: try the 5-minute start before 3pm on 3 days\n• Anna: notice and write down the “I’ll do it later” thought\n• Sav: send the vagal tone exercise', transcript: 'Savannah: How did this week go?\nAnna: Honestly, better than I thought. I did the reps three times.\nSavannah: Amazing. What got in the way on the other days?' }; });
      return Promise.resolve(new Response(JSON.stringify({ found: found, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    if (String(url).indexOf('/.netlify/functions/payments') >= 0) {
      var dd = function (n, h) { var t = new Date(Date.now() - n * 86400000); t.setHours(h || 10, 0, 0, 0); return t.toISOString(); };
      var items = [
        { id: 'ch_demo1', src: 'Stripe', date: dd(16), amount: 1275, currency: 'AUD', status: 'paid', email: 'example.anna@sample.test', name: 'Anna Example', desc: 'Breakthrough 1:1 · payment 1 of 4' },
        { id: 'ch_demo2', src: 'Stripe', date: dd(2), amount: 1275, currency: 'AUD', status: 'failed', email: 'example.anna@sample.test', name: 'Anna Example', desc: 'Breakthrough 1:1 · payment 2 of 4', reason: 'Your card was declined.' },
        { id: 'ch_demo3', src: 'Stripe', date: dd(5), amount: 297, currency: 'AUD', status: 'paid', email: 'jess.course@sample.test', name: 'Jess Sample', desc: 'Breakthrough self-paced course (Stan Store)' },
        { id: 'shp_demo4', src: 'Shopify', date: dd(9), amount: 47, currency: 'AUD', status: 'paid', email: 'kim.shop@sample.test', name: 'Kim Sample', desc: '#1042 · Money Magic' }
      ];
      return Promise.resolve(new Response(JSON.stringify({ stripe: { connected: true }, shopify: { connected: true }, items: items, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return realFetch.apply(this, arguments);
  };

  // Wipe everything and start the playground fresh (used by the launcher)
  window.BT_DEMO_RESET = function () {
    var keep = [];
    for (var i = 0; i < localStorage.length; i++) keep.push(localStorage.key(i));
    keep.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  };

  // Links between app pages go back through the playground launcher, which shows the next page
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !window.parent || window.parent === window || !window.parent.BT_OPEN) return;
    var href = a.getAttribute('href') || '';
    // in-page links (#Course, #Lesson-…): the playground frame has a <base> tag, so do these by hand
    if (href.charAt(0) === '#') { if (href.length > 1) { e.preventDefault(); if (location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = href; } return; }
    if (/^(https?:|mailto:|tel:|data:|blob:)/.test(href) || /\.dc\.html$/.test(href)) return;
    if (!/(\.html|^\.{0,2}\/?)([?#].*)?$/.test(href)) return;
    e.preventDefault(); e.stopPropagation();
    var abs = new URL(href, document.baseURI).href, root = window.parent.BT_ROOT || '';
    window.parent.BT_OPEN(abs.indexOf(root) === 0 ? abs.slice(root.length) : href);
  }, true);

  // Videos can't play inside a Claude artifact, so open them in a new tab instead
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && /youtu\.?be|vimeo\.com|loom\.com|mediadelivery\.net/.test(a.href)) { e.stopPropagation(); a.target = '_blank'; a.rel = 'noopener'; }
  }, true);

  // Inside the playground launcher the bar at the top already leads back; on its own, show a small tag.
  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var a = document.createElement('span');
    a.textContent = 'PLAYGROUND';
    a.setAttribute('style', 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;padding:4px 14px;border-radius:0 0 12px 12px;background:#F4C2F7;color:#1F1412;font:600 11.5px Poppins,system-ui,sans-serif;letter-spacing:.05em;border:1px solid #1F1412;border-top:0;pointer-events:none');
    document.body.appendChild(a);
  });
})();
