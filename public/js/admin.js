/* Coach dashboard: see every client, what they've filled in, where they're up to, your notes, and app settings. */
(function () {
  'use strict';
  var CFG = window.BT_CONFIG || {};
  var root = document.getElementById('admin'), gate = document.getElementById('bt-gate');
  if (!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase)) {
    root.innerHTML = '<div class="ad-wrap"><h1 class="ad-h1">Coach dashboard</h1><p class="ad-card">Connect Supabase first: add your project URL and anon key to <b>public/js/config.js</b>.</p></div>';
    return;
  }
  // Same login storage as the client app, so logging in once covers both.
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: '__bt_auth' } });

  /* What each saved key is, in plain words */
  var TOOLS = {
    'cmn-companion': { name: 'Companion home', note: 'Start-here steps, checklist and notes' },
    'cmn-1to1-dashboard': { name: '1:1 home', note: 'Start-here steps, weeks and 1:1 extras' },
    'north-star-home-v1': { name: 'North Star', note: 'Their North Star and identity statements' },
    'star-goal-activity-v1': { name: 'STAR Goals', note: 'Goal, see/hear/feel and vision' },
    'star-plan-v1': { name: 'Do what they would do', note: 'Daily actions and check-ins' },
    'program-decoder-v1': { name: 'Breaking Out of Your Box', note: 'Limiting beliefs and programs' },
    'cmn-rep-results': { name: 'Representational System Test', note: 'V / A / K / Ad results' }
  };
  var SETTINGS = [
    { view: 'Dashboard.dc.html', label: 'Companion home', fields: [['videoUrl', 'Start-here video link'], ['holVideoUrl', 'Second video link'], ['courseLink', 'Course link'], ['discountCode', 'Discount code'], ['contactEmail', 'Contact email']] },
    { view: 'OneOnOne.dc.html', label: '1:1 home', fields: [['courseLink', 'Course link'], ['whatsappNumber', 'WhatsApp number']] },
    { view: 'ECT.dc.html', label: 'ECT page', fields: [['ectVideoUrl', 'ECT video link'], ['enquiryEmail', 'Enquiry email']] }
  ];

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
  function when(ts) {
    if (!ts) return 'never';
    var d = new Date(ts), mins = Math.round((Date.now() - d) / 60000);
    if (mins < 2) return 'just now'; if (mins < 60) return mins + ' min ago';
    if (mins < 1440) return Math.round(mins / 60) + ' h ago'; if (mins < 10080) return Math.round(mins / 1440) + ' days ago';
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function human(k) { return String(k).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); }

  /* Turn any saved answers into readable blocks */
  function render(v, depth) {
    depth = depth || 0;
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
    if (typeof v === 'boolean') return h('span', { class: 'ad-yes', text: v ? '✓ Yes' : 'No' });
    if (typeof v === 'number') return h('span', { text: String(v) });
    if (typeof v === 'string') {
      if (/^data:image\//.test(v)) return h('img', { class: 'ad-img', src: v, alt: 'Image they saved' });
      if (/^<svg[\s>]/i.test(v)) return h('span', { class: 'ad-muted', text: '(drawn image saved)' });
      return h('p', { class: 'ad-text', text: v });
    }
    if (Array.isArray(v)) {
      if (v.every(function (x) { return typeof x !== 'object' || x === null; })) return h('div', { class: 'ad-chips' }, v.filter(function (x) { return x !== '' && x != null; }).map(function (x) { return h('span', { class: 'ad-chip', text: String(x) }); }));
      return h('ol', { class: 'ad-list' }, v.slice(0, 60).map(function (x) { var r = render(x, depth + 1); return r ? h('li', null, [r]) : null; }));
    }
    var keys = Object.keys(v), rows = [];
    // objects of true/false flags (checklists) read better as chips of what's ticked
    if (keys.length && keys.every(function (k) { return typeof v[k] === 'boolean' || v[k] === 1 || v[k] === 0; })) {
      var on = keys.filter(function (k) { return v[k]; });
      return on.length ? h('div', { class: 'ad-chips' }, on.map(function (k) { return h('span', { class: 'ad-chip on', text: '✓ ' + human(k) }); })) : null;
    }
    keys.forEach(function (k) {
      var r = render(v[k], depth + 1);
      if (r) rows.push(h('div', { class: 'ad-row' }, [h('div', { class: 'ad-k', text: human(k) }), h('div', { class: 'ad-v' }, [r])]));
    });
    return rows.length ? h('div', { class: depth ? 'ad-obj nested' : 'ad-obj' }, rows) : null;
  }

  var S = { tab: 'clients', clients: [], data: {}, filter: 'all', q: '', open: null };

  function load() {
    return Promise.all([
      sb.from('profiles').select('*').order('last_seen_at', { ascending: false, nullsFirst: false }),
      sb.from('client_data').select('user_id,key,updated_at'),
      sb.from('invites').select('*').order('created_at', { ascending: false }),
      sb.from('app_settings').select('*')
    ]).then(function (r) {
      S.clients = (r[0].data || []).filter(function (p) { return !p.is_admin; });
      S.activity = {}; (r[1].data || []).forEach(function (row) { (S.activity[row.user_id] = S.activity[row.user_id] || []).push(row); });
      S.invites = r[2].data || [];
      S.settings = {}; (r[3].data || []).forEach(function (row) { S.settings[row.key] = row.value; });
    });
  }

  function page() {
    root.innerHTML = '';
    var tabs = [['clients', 'Clients'], ['invite', 'Add a client'], ['settings', 'App settings']];
    root.appendChild(h('div', { class: 'ad-wrap' }, [
      h('header', { class: 'ad-top' }, [
        h('div', null, [h('p', { class: 'ad-kick', text: 'Breakthrough' }), h('h1', { class: 'ad-h1', text: 'Coach dashboard' })]),
        h('div', { class: 'ad-topbtns' }, [h('a', { class: 'bt-btn ghost', href: '/', text: 'Open the app' }), h('button', { class: 'bt-btn ghost', text: 'Log out', onclick: function () { sb.auth.signOut().then(function () { location.reload(); }); } })])
      ]),
      h('nav', { class: 'ad-tabs' }, tabs.map(function (t) { return h('button', { class: 'ad-tab' + (S.tab === t[0] ? ' on' : ''), text: t[1], onclick: function () { S.tab = t[0]; S.open = null; page(); } }); })),
      S.tab === 'clients' ? (S.open ? clientView(S.open) : clientList()) : S.tab === 'invite' ? inviteView() : settingsView()
    ]));
  }

  function clientList() {
    var q = S.q.toLowerCase();
    var list = S.clients.filter(function (c) {
      return (S.filter === 'all' || c.tier === S.filter) && (!q || (c.email + ' ' + (c.full_name || '')).toLowerCase().indexOf(q) >= 0);
    });
    var search = h('input', { class: 'bt-in', type: 'search', placeholder: 'Search name or email', value: S.q, 'aria-label': 'Search clients', oninput: function (e) { S.q = e.target.value; var pos = e.target.selectionStart; page(); var n = root.querySelector('input[type=search]'); n.focus(); n.setSelectionRange(pos, pos); } });
    var filters = h('div', { class: 'ad-chips' }, [['all', 'Everyone'], ['private', '1:1 clients'], ['self_paced', 'Self-paced']].map(function (f) {
      return h('button', { class: 'ad-fchip' + (S.filter === f[0] ? ' on' : ''), text: f[1] + ' (' + S.clients.filter(function (c) { return f[0] === 'all' || c.tier === f[0]; }).length + ')', onclick: function () { S.filter = f[0]; page(); } });
    }));
    var cards = list.map(function (c) {
      var act = S.activity[c.id] || [];
      var used = act.filter(function (a) { return TOOLS[a.key]; }).map(function (a) { return TOOLS[a.key].name; });
      return h('button', { class: 'ad-client', onclick: function () { openClient(c); } }, [
        h('div', { class: 'ad-cn' }, [h('span', { class: 'ad-name', text: c.full_name || c.email }), h('span', { class: 'ad-badge ' + c.tier, text: c.tier === 'private' ? '1:1' : 'Self-paced' })]),
        c.full_name ? h('span', { class: 'ad-muted', text: c.email }) : null,
        h('span', { class: 'ad-meta', text: 'Last in: ' + when(c.last_seen_at) + ' · ' + used.length + ' tool' + (used.length === 1 ? '' : 's') + ' used' }),
        used.length ? h('div', { class: 'ad-chips' }, used.map(function (u) { return h('span', { class: 'ad-chip', text: u }); })) : null
      ]);
    });
    return h('section', { class: 'ad-sec' }, [search, filters,
      cards.length ? h('div', { class: 'ad-grid' }, cards) : h('p', { class: 'ad-card', text: S.clients.length ? 'No one matches that.' : 'No clients yet. Once someone logs in to the app they’ll show up here.' })]);
  }

  function openClient(c) {
    S.open = c; page();
    Promise.all([
      sb.from('client_data').select('*').eq('user_id', c.id),
      sb.from('coach_notes').select('*').eq('client_id', c.id).order('created_at', { ascending: false })
    ]).then(function (r) { S.data[c.id] = { rows: r[0].data || [], notes: r[1].data || [] }; if (S.open === c) page(); });
  }

  function clientView(c) {
    var d = S.data[c.id];
    var name = h('input', { class: 'bt-in', value: c.full_name || '', 'aria-label': 'Name' });
    var tier = h('select', { class: 'bt-in', 'aria-label': 'Access' }, [
      h('option', { value: 'self_paced', text: 'Self-paced (Companion only)', selected: c.tier === 'self_paced' ? 'selected' : null }),
      h('option', { value: 'private', text: '1:1 client (Companion + 1:1 extras)', selected: c.tier === 'private' ? 'selected' : null })
    ]);
    var start = h('input', { class: 'bt-in', type: 'date', value: c.program_start || '', 'aria-label': 'Program start date' });
    var saveP = h('button', { class: 'bt-btn', text: 'Save details', onclick: function () {
      saveP.textContent = 'Saving…';
      sb.from('profiles').update({ full_name: name.value.trim(), tier: tier.value, program_start: start.value || null }).eq('id', c.id).then(function (r) {
        if (r.error) { saveP.textContent = 'Couldn’t save'; return; }
        c.full_name = name.value.trim(); c.tier = tier.value; c.program_start = start.value || null; saveP.textContent = 'Saved ✓';
      });
    } });

    var tools = null, notes = null;
    if (!d) tools = h('p', { class: 'ad-muted', text: 'Loading their answers…' });
    else {
      var rows = d.rows.slice().sort(function (a, b) { return (b.updated_at || '').localeCompare(a.updated_at || ''); });
      tools = rows.length ? h('div', { class: 'ad-tools' }, rows.map(function (row) {
        var meta = TOOLS[row.key] || { name: human(row.key), note: '' }, val;
        try { val = JSON.parse(row.value); } catch (e) { val = row.value; }
        var body = render(val);
        return h('details', { class: 'ad-tool', open: rows.length <= 3 ? 'open' : null }, [
          h('summary', null, [h('span', { class: 'ad-tn', text: meta.name }), h('span', { class: 'ad-muted', text: 'updated ' + when(row.updated_at) })]),
          meta.note ? h('p', { class: 'ad-muted', text: meta.note }) : null,
          body || h('p', { class: 'ad-muted', text: 'Opened but nothing filled in yet.' })
        ]);
      })) : h('p', { class: 'ad-card', text: 'Nothing saved yet.' });

      var nb = h('textarea', { class: 'bt-in ad-ta', placeholder: 'Session notes, what to follow up, wins… (only you can see these)', 'aria-label': 'New note' });
      notes = h('div', { class: 'ad-notes' }, [nb,
        h('button', { class: 'bt-btn', text: 'Add note', onclick: function () {
          var v = nb.value.trim(); if (!v) return;
          sb.from('coach_notes').insert({ client_id: c.id, body: v }).select().then(function (r) { if (!r.error) { d.notes.unshift(r.data[0]); page(); } });
        } })
      ].concat(d.notes.map(function (n) {
        return h('div', { class: 'ad-note' }, [h('span', { class: 'ad-muted', text: new Date(n.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) }), h('p', { class: 'ad-text', text: n.body }),
          h('button', { class: 'ad-del', text: 'Delete', onclick: function () { if (confirm('Delete this note?')) sb.from('coach_notes').delete().eq('id', n.id).then(function () { d.notes = d.notes.filter(function (x) { return x !== n; }); page(); }); } })]);
      })));
    }
    return h('section', { class: 'ad-sec' }, [
      h('button', { class: 'bt-btn ghost', text: '← All clients', onclick: function () { S.open = null; page(); } }),
      h('div', { class: 'ad-card ad-head' }, [
        h('h2', { class: 'ad-h2', text: c.full_name || c.email }),
        h('p', { class: 'ad-muted', text: c.email + ' · joined ' + when(c.created_at) + ' · last in ' + when(c.last_seen_at) }),
        h('div', { class: 'ad-form' }, [h('label', null, ['Name', name]), h('label', null, ['Access', tier]), h('label', null, ['Program start', start]), saveP])
      ]),
      h('h3', { class: 'ad-h3', text: 'Their answers & progress' }), tools,
      h('h3', { class: 'ad-h3', text: 'Your private notes' }), notes || h('p', { class: 'ad-muted', text: 'Loading…' })
    ]);
  }

  function inviteView() {
    var email = h('input', { class: 'bt-in', type: 'email', placeholder: 'client@email.com', 'aria-label': 'Client email' });
    var name = h('input', { class: 'bt-in', placeholder: 'First and last name', 'aria-label': 'Client name' });
    var tier = h('select', { class: 'bt-in', 'aria-label': 'Access' }, [h('option', { value: 'private', text: '1:1 client' }), h('option', { value: 'self_paced', text: 'Self-paced' })]);
    var msg = h('p', { class: 'ad-muted', role: 'status' });
    var add = h('button', { class: 'bt-btn lime', text: 'Add client', onclick: function () {
      var e = email.value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.textContent = 'Check the email.'; return; }
      sb.from('invites').upsert({ email: e, full_name: name.value.trim(), tier: tier.value }).then(function (r) {
        if (r.error) { msg.textContent = 'Couldn’t add: ' + r.error.message; return; }
        // already has an account? update them straight away
        var ex = S.clients.filter(function (c) { return c.email.toLowerCase() === e; })[0];
        var p = ex ? sb.from('profiles').update({ tier: tier.value, full_name: name.value.trim() || ex.full_name }).eq('id', ex.id) : Promise.resolve();
        return p.then(function () { return load(); }).then(function () { S.tab = 'invite'; page(); });
      });
    } });
    return h('section', { class: 'ad-sec' }, [
      h('div', { class: 'ad-card' }, [
        h('h2', { class: 'ad-h2', text: 'Add a client' }),
        h('p', { class: 'ad-text', text: 'Add their email here, then send them their link. When they log in with that email they’ll land in the right version automatically.' }),
        h('div', { class: 'ad-form' }, [h('label', null, ['Email', email]), h('label', null, ['Name', name]), h('label', null, ['Access', tier]), add]), msg,
        h('div', { class: 'ad-links' }, [
          h('p', null, [h('b', { text: '1:1 clients’ link: ' }), h('code', { text: location.origin + '/1to1' })]),
          h('p', null, [h('b', { text: 'Self-paced link: ' }), h('code', { text: location.origin + '/course' })]),
          h('p', { class: 'ad-muted', text: 'Anyone who logs in without being added here gets self-paced access. You can upgrade them on their client page.' })
        ])
      ]),
      h('h3', { class: 'ad-h3', text: 'Added (' + S.invites.length + ')' }),
      h('div', { class: 'ad-grid' }, S.invites.map(function (i) {
        var joined = S.clients.some(function (c) { return c.email.toLowerCase() === i.email; });
        return h('div', { class: 'ad-client static' }, [h('div', { class: 'ad-cn' }, [h('span', { class: 'ad-name', text: i.full_name || i.email }), h('span', { class: 'ad-badge ' + i.tier, text: i.tier === 'private' ? '1:1' : 'Self-paced' })]),
          h('span', { class: 'ad-muted', text: i.email }), h('span', { class: 'ad-meta', text: joined ? '✓ Has logged in' : 'Hasn’t logged in yet' })]);
      }))
    ]);
  }

  function settingsView() {
    var props = JSON.parse(JSON.stringify((S.settings.props) || {}));
    var groups = SETTINGS.map(function (g) {
      props[g.view] = props[g.view] || {};
      return h('div', { class: 'ad-card' }, [h('h3', { class: 'ad-h3', text: g.label })].concat(g.fields.map(function (f) {
        return h('label', { class: 'ad-field' }, [f[1], h('input', { class: 'bt-in', value: props[g.view][f[0]] || '', placeholder: 'Leave blank to use the built-in one', oninput: function (e) { props[g.view][f[0]] = e.target.value.trim(); } })]);
      })));
    });
    var msg = h('p', { class: 'ad-muted', role: 'status' });
    return h('section', { class: 'ad-sec' }, [
      h('p', { class: 'ad-text', text: 'Paste YouTube, Vimeo, Bunny or Loom links and they play inside the app. Changes show for everyone next time they open it.' })
    ].concat(groups).concat([
      h('button', { class: 'bt-btn lime big', text: 'Save settings', onclick: function () {
        sb.from('app_settings').upsert({ key: 'props', value: props, updated_at: new Date().toISOString() }).then(function (r) { msg.textContent = r.error ? 'Couldn’t save: ' + r.error.message : 'Saved ✓'; if (!r.error) S.settings.props = props; });
      } }), msg
    ]));
  }

  /* login (same 6-digit code flow as the app) */
  function login(step, email, err) {
    gate.hidden = false; gate.innerHTML = '';
    var inp = h('input', { class: 'bt-in' + (step === 'code' ? ' code' : ''), type: step === 'code' ? 'text' : 'email', inputmode: step === 'code' ? 'numeric' : 'email', autocomplete: step === 'code' ? 'one-time-code' : 'email', 'aria-label': step === 'code' ? '6-digit code' : 'Email', required: 'true' });
    var form = h('form', { class: 'bt-card', onsubmit: function (e) {
      e.preventDefault();
      if (step === 'email') sb.auth.signInWithOtp({ email: inp.value.trim(), options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } }).then(function (r) { r.error ? login('email', inp.value, 'Couldn’t send a code to that email.') : login('code', inp.value.trim()); });
      else sb.auth.verifyOtp({ email: email, token: inp.value.replace(/\D/g, ''), type: 'email' }).then(function (r) { r.error ? login('code', email, 'That code didn’t work.') : boot(); });
    } }, [h('label', { class: 'bt-lab', text: step === 'code' ? 'Code sent to ' + email : 'Your admin email' }), inp, err ? h('p', { class: 'bt-err', text: err }) : null, h('button', { class: 'bt-btn lime big', type: 'submit', text: step === 'code' ? 'Log in' : 'Send my code' })]);
    gate.appendChild(h('div', { class: 'bt-gwrap' }, [h('p', { class: 'bt-kick', text: 'Coach only' }), h('h1', { class: 'bt-h1', text: 'Coach dashboard' }), form]));
    inp.focus();
  }
  function boot() {
    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session; if (!s) return login('email');
      return sb.from('profiles').select('is_admin').eq('id', s.user.id).maybeSingle().then(function (p) {
        if (!p.data || !p.data.is_admin) { gate.hidden = false; gate.innerHTML = '<div class="bt-gwrap"><h1 class="bt-h1">Coach only</h1><p class="bt-lede">This page is just for Sav. <a href="/" style="color:#F1F9A6">Go to the app</a></p></div>'; return; }
        gate.hidden = true; return load().then(page);
      });
    });
  }
  boot();
})();
