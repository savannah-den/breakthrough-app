/* Coach dashboard ("back of house"): every client at a glance, a visual journey for each one,
   readable answers for every tool, your private notes, and app settings. */
(function () {
  'use strict';
  var CFG = window.BT_CONFIG || {};
  var root = document.getElementById('admin'), gate = document.getElementById('bt-gate');
  if (!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase)) {
    root.innerHTML = '<div class="ad-wrap"><h1 class="ad-h1">Coach dashboard</h1><p class="ad-card">Connect Supabase first: add your project URL and anon key to <b>public/js/config.js</b>.</p></div>';
    return;
  }
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: '__bt_auth' } });

  /* Every tool in the app, in journey order. key = what the tool saves under. */
  var TOOLS = [
    { key: 'cmn-1to1-dashboard', name: '1:1 home', note: 'Start-here steps, tests and weeks', color: '#F1F9A6', private: true },
    { key: 'bt-saves', name: 'Becoming Book: saved activities', note: 'Activities they saved to their book', color: '#FBE6FC' },
    { key: 'bt-wins', name: 'Becoming Book: wins', note: 'Wins they’ve added', color: '#FFD9A8' },
    { key: 'bt-course', name: 'Course progress', note: 'Lessons watched and finished', color: '#F4C2F7' },
    { key: 'cmn-companion', name: 'Home, intentions & journal', note: 'Set-up steps, intentions and journal answers', color: '#F1F9A6' },
    { key: 'cmn-rep-results', name: 'Rep System Test', note: 'How their brain takes things in', color: '#F4C2F7', private: true },
    { key: 'north-star-home-v1', name: 'North Star', note: 'Who they’re becoming', color: '#FBE6FC' },
    { key: 'star-goal-activity-v1', name: 'STAR Goals', note: 'Goal, see / hear / feel, vision', color: '#F28C3B' },
    { key: 'star-plan-v1', name: 'Do what they would do', note: 'Daily actions and check-ins', color: '#FFD9A8' },
    { key: 'program-decoder-v1', name: 'Breaking Out of Your Box', note: 'Limiting beliefs and new proof', color: '#F4C2F7' },
    { key: 'emotional-blueprint-v1', name: 'Emotional Blueprint', note: 'Emotional patterns and sessions', color: '#F1F9A6' },
    { key: 'what-am-i-feeling-v1', name: 'What am I feeling?', note: 'Emotion check-ins', color: '#FBE6FC' },
    { key: 'what-if-workout-v1', name: 'What If? Workout', note: 'Worst-case to best-case stretches', color: '#F28C3B' },
    { key: 'rewind-v1', name: 'REWIND', note: 'Respond instead of react', color: '#F4C2F7' },
    { key: 'coming-home-v3', name: 'Coming Home', note: 'Back into the body', color: '#FFD9A8' },
    { key: 'understanding-bridge-v1', name: 'Understanding Bridge', note: 'Meeting people where they are', color: '#F1F9A6' }
  ];
  var HIDDEN_KEYS = { 'bt-profile': 1, 'bt-dismissed': 1, 'bt-jlog': 1 };
  var TOOL_BY_KEY = {}; TOOLS.forEach(function (t) { TOOL_BY_KEY[t.key] = t; });

  var SETTINGS = [
    { view: 'Dashboard.dc.html', label: 'Companion home', fields: [['videoUrl', 'Start-here video link'], ['holVideoUrl', 'Second video link'], ['courseLink', 'Course link'], ['discountCode', 'Discount code'], ['contactEmail', 'Contact email']] },
    { view: 'OneOnOne.dc.html', label: '1:1 home', fields: [['courseLink', 'Course link'], ['whatsappNumber', 'WhatsApp number']] },
    { view: 'ECT.dc.html', label: 'ECT page', fields: [['ectVideoUrl', 'ECT video link'], ['enquiryEmail', 'Enquiry email']] },
    { view: 'tool:emotional-blueprint', label: 'Emotional Blueprint', fields: [['courseIntroVideo', 'Course intro video link'], ['courseVideos', 'Course videos link'], ['ectVideoUrl', 'ECT video link'], ['anxietyVideoUrl', 'Anxiety video link'], ['enquiryEmail', 'Enquiry email'], ['big7Name', 'Name for the "Big 7"']] }
  ];

  /* Representational System Test (same scoring as the client's results page) */
  var REP_QS = [
    { q: 'Important decisions', o: ['K', 'A', 'V', 'Ad'] },
    { q: 'During an argument', o: ['A', 'V', 'Ad', 'K'] },
    { q: 'Expressing myself', o: ['V', 'K', 'Ad', 'A'] },
    { q: 'What comes easiest', o: ['A', 'Ad', 'K', 'V'] },
    { q: 'Things around me', o: ['A', 'Ad', 'K', 'V'] }
  ];
  var SYS = {
    V: { name: 'Visual', tag: 'Sees it', color: '#F4C2F7', ink: '#2A0F0C', tip: 'Show, don’t tell: diagrams, colour, demos, vision boards. Expect fast talking and looking up while thinking.' },
    A: { name: 'Auditory', tag: 'Hears it', color: '#F1F9A6', ink: '#2A0F0C', tip: 'Talk it through and mind your tone. Voice notes land well. Give them time to discuss before deciding.' },
    K: { name: 'Kinesthetic', tag: 'Feels it', color: '#F28C3B', ink: '#2A0F0C', tip: 'Slow down and leave pauses. Learning by doing, movement and feeling into the body works best.' },
    Ad: { name: 'Auditory digital', tag: 'Makes sense of it', color: '#4E0C08', ink: '#F1F9A6', tip: 'Give the why, clear steps and time to process. Check their second system too, that’s often where information comes in.' }
  };
  var ORDER = ['V', 'A', 'K', 'Ad'];

  /* ---------- helpers ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k === 'style') el.setAttribute('style', attrs[k]);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function when(ts) {
    if (!ts) return 'never';
    var d = new Date(ts), mins = Math.round((Date.now() - d) / 60000);
    if (mins < 2) return 'just now'; if (mins < 60) return mins + ' min ago';
    if (mins < 1440) return Math.round(mins / 60) + ' h ago'; if (mins < 2880) return 'yesterday';
    if (mins < 10080) return Math.round(mins / 1440) + ' days ago';
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function daysSince(ts) { return ts ? (Date.now() - new Date(ts)) / 86400000 : Infinity; }
  function human(k) { return String(k).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }); }
  function avatar(c, big) {
    var a = (S.avatars || {})[c.id] || {}, el = h('span', { class: 'ad-av ' + (big ? 'big ' : '') + (c.is_admin ? 'me' : c.tier) });
    if (a.photo) { el.classList.add('pic'); el.appendChild(h('img', { src: a.photo, alt: '' })); }
    else if (a.char && window.BT_COURSE) { el.classList.add('pic'); el.innerHTML = window.BT_COURSE.charSvg(a.char); }
    else el.textContent = initials(c);
    return el;
  }
  function initials(c) { var n = (c.full_name || c.email || '?').trim(); var p = n.split(/[\s@.]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] && c.full_name ? p[1][0] : '')).toUpperCase(); }
  function parse(v) { try { return JSON.parse(v); } catch (e) { return v; } }
  function toolsFor(c) { return TOOLS.filter(function (t) { return !t.private || c.tier === 'private' || c.is_admin; }); }

  /* Keys that only remember where they were on screen, not answers */
  var UI_KEY = /^(_.*|tab|tabs|step|t?Step|pStep|qi|cur|current|open|opened|closed|filter|focus|view|mode|screen|page|idx|index|scroll|expanded|collapsed|show.*|flash|err|.*Err|ex|viewer|editing|edit|draft.*|sel|selected|active|modal|menu|sheet|panel|ui|seen.*|intro.*Seen|exportUrl|hover|playing|timer|anim.*)$/i;

  function isEmpty(v) {
    if (v == null || v === '' || v === false) return true;
    if (Array.isArray(v)) return v.every(isEmpty);
    if (typeof v === 'object') return Object.keys(v).every(function (k) { return UI_KEY.test(k) || isEmpty(v[k]); });
    return false;
  }
  function countAnswers(v) {
    if (v == null || v === '' || v === false) return 0;
    if (typeof v === 'string') return v.trim() ? 1 : 0;
    if (typeof v === 'number' || v === true) return 1;
    if (Array.isArray(v)) return v.reduce(function (n, x) { return n + countAnswers(x); }, 0);
    return Object.keys(v).reduce(function (n, k) { return UI_KEY.test(k) ? n : n + countAnswers(v[k]); }, 0);
  }

  /* ---------- readable answers (works for any tool) ---------- */
  function fileLink(v, label) {
    if (/^data:image\//.test(v)) return h('a', { href: v, target: '_blank', rel: 'noopener', class: 'ad-thumb' }, [h('img', { src: v, alt: label || 'Image they saved' })]);
    if (/^data:application\/pdf/.test(v)) return h('a', { href: v, download: (label || 'file') + '.pdf', class: 'bt-btn ghost' }, ['Open the PDF']);
    return null;
  }
  function value(v, label, depth) {
    depth = depth || 0;
    if (isEmpty(v)) return null;
    if (v === true) return h('span', { class: 'ad-tick', text: '✓ Done' });
    if (typeof v === 'number') return h('span', { class: 'ad-num', text: String(v) });
    if (typeof v === 'string') {
      var f = fileLink(v, label); if (f) return f;
      if (/^\s*<svg[\s>]/i.test(v)) return h('a', { class: 'ad-thumb', href: '#', onclick: function (e) { e.preventDefault(); } }, [h('img', { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(v), alt: label || 'Image they made' })]);
      if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(v)) return h('span', { class: 'ad-pill', text: new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) });
      if (/^https?:\/\//.test(v)) return h('a', { href: v, target: '_blank', rel: 'noopener', class: 'ad-link', text: v });
      return v.length > 48 || /\n/.test(v) ? h('blockquote', { class: 'ad-quote', text: v }) : h('span', { class: 'ad-pill', text: v });
    }
    if (Array.isArray(v)) {
      var items = v.filter(function (x) { return !isEmpty(x); });
      if (items.every(function (x) { return typeof x !== 'object'; }) && items.every(function (x) { return String(x).length <= 60; }))
        return h('div', { class: 'ad-chips' }, items.map(function (x) { return h('span', { class: 'ad-chip', text: String(x) }); }));
      return h('div', { class: 'ad-stack' }, items.slice(0, 40).map(function (x, i) {
        var r = value(x, label, depth + 1);
        return h('div', { class: 'ad-entry' }, [h('span', { class: 'ad-entry-n', text: String(i + 1) }), h('div', { class: 'ad-entry-b' }, [r])]);
      }).concat(items.length > 40 ? [h('p', { class: 'ad-muted', text: '+ ' + (items.length - 40) + ' more' })] : []));
    }
    var keys = Object.keys(v).filter(function (k) { return !UI_KEY.test(k) && !isEmpty(v[k]); });
    if (!keys.length) return null;
    // a checklist: { thing: true, other: false }
    if (keys.every(function (k) { return v[k] === true || v[k] === 1; }) && Object.keys(v).every(function (k) { return typeof v[k] === 'boolean' || v[k] === 0 || v[k] === 1; }))
      return h('div', { class: 'ad-chips' }, keys.map(function (k) { return h('span', { class: 'ad-chip on', text: '✓ ' + human(k) }); }));
    var simple = [], rich = [];
    keys.forEach(function (k) {
      var x = v[k], isRich = typeof x === 'object' || (typeof x === 'string' && (x.length > 48 || /^data:|^\s*<svg/i.test(x)));
      (isRich ? rich : simple).push(k);
    });
    var out = [];
    if (simple.length) out.push(h('div', { class: 'ad-facts' }, simple.map(function (k) {
      return h('div', { class: 'ad-fact' }, [h('span', { class: 'ad-fk', text: human(k) }), value(v[k], human(k), depth + 1)]);
    })));
    rich.forEach(function (k) {
      out.push(h('div', { class: 'ad-block' + (depth ? ' nested' : '') }, [h('p', { class: 'ad-bk', text: human(k) }), value(v[k], human(k), depth + 1)]));
    });
    return h('div', { class: 'ad-obj' }, out);
  }

  /* ---------- special views ---------- */
  function repScores(ranks) {
    var t = { V: 0, A: 0, K: 0, Ad: 0 };
    REP_QS.forEach(function (q, qi) { q.o.forEach(function (sys, oi) { t[sys] += (ranks[qi] && ranks[qi][oi]) || 0; }); });
    var max = Math.max(t.V, t.A, t.K, t.Ad), min = Math.min(t.V, t.A, t.K, t.Ad), spread = max - min;
    var sorted = ORDER.slice().sort(function (a, b) { return t[b] - t[a]; });
    var lvl = spread <= 4 ? 'Highly flexible' : spread <= 8 ? 'Clear lean, room to stretch' : 'Strongly anchored';
    var txt = spread <= 4 ? 'Their scores sit close together. They move between seeing, hearing, feeling and thinking it through with ease.'
      : spread <= 8 ? 'A clear go-to channel, with the others there but taking more effort. Building up the quieter system is the next step.'
      : 'They lean heavily on one channel. Great when the world speaks their language, a squeeze when it doesn’t. This is where you build flexibility.';
    return { t: t, sorted: sorted, leads: ORDER.filter(function (k) { return t[k] === max; }), lows: ORDER.filter(function (k) { return t[k] === min; }), spread: spread, lvl: lvl, txt: txt, flex: Math.max(0, Math.round(100 * (1 - spread / 15))) };
  }
  function repView(v) {
    if (!v || !v.ranks) return value(v);
    var s = repScores(v.ranks), lead = SYS[s.sorted[0]];
    var bars = h('div', { class: 'rp-bars' }, s.sorted.map(function (k, i) {
      var sy = SYS[k], pct = Math.round(100 * s.t[k] / 20);
      return h('div', { class: 'rp-bar' }, [
        h('div', { class: 'rp-lab' }, [h('b', { text: sy.name }), h('span', { text: sy.tag })]),
        h('div', { class: 'rp-track' }, [h('div', { class: 'rp-fill', style: 'width:' + pct + '%;background:' + sy.color + ';animation-delay:' + (i * 120) + 'ms' })]),
        h('span', { class: 'rp-score', text: s.t[k] + '/20' })
      ]);
    }));
    var qs = h('div', { class: 'rp-qs' }, REP_QS.map(function (q, qi) {
      var r = v.ranks[qi] || {};
      var opts = q.o.map(function (sys, oi) { return { sys: sys, rank: r[oi] || 0 }; }).sort(function (a, b) { return b.rank - a.rank; });
      return h('div', { class: 'rp-q' }, [h('span', { class: 'rp-qn', text: 'Q' + (qi + 1) + ' · ' + q.q })].concat([h('div', { class: 'rp-qrow' }, opts.map(function (o) {
        var sy = SYS[o.sys];
        return h('span', { class: 'rp-cell', style: 'background:' + sy.color + ';color:' + sy.ink + ';flex-grow:' + Math.max(o.rank, 0.6), title: sy.name + ': ' + o.rank }, [o.sys + ' ' + o.rank]);
      }))]));
    }));
    return h('div', { class: 'rp' }, [
      h('div', { class: 'rp-hero', style: 'background:' + lead.color + ';color:' + lead.ink }, [
        h('span', { class: 'rp-kick', text: s.leads.length > 1 ? 'Leads with (tie)' : 'Leads with' }),
        h('span', { class: 'rp-big', text: s.leads.map(function (k) { return SYS[k].name; }).join(' + ') }),
        h('p', { class: 'rp-tip', text: 'How to work with them: ' + lead.tip })
      ]),
      bars,
      h('div', { class: 'rp-flex' }, [
        h('div', { class: 'rp-ring', style: '--p:' + s.flex }, [h('span', { text: s.flex + '%' })]),
        h('div', null, [h('b', { class: 'rp-lvl', text: s.lvl }), h('p', { class: 'ad-text', text: s.txt }),
          h('p', { class: 'ad-muted', text: 'Quietest system: ' + s.lows.map(function (k) { return SYS[k].name; }).join(', ') + '. Spread between top and bottom: ' + s.spread + ' points.' })])
      ]),
      h('details', { class: 'rp-more' }, [h('summary', { text: 'See how they ranked each question' }), h('p', { class: 'ad-muted', text: 'Each bar shows the four answers, biggest = “most like me” (4).' }), qs]),
      v.date || v.name ? h('p', { class: 'ad-muted', text: [v.name ? 'Name on results: ' + v.name : '', v.date ? 'Taken ' + v.date : ''].filter(Boolean).join(' · ') }) : null
    ]);
  }
  function testFile(rec, label) {
    if (!rec) return h('div', { class: 'oo-test off' }, [h('b', { text: label }), h('span', { class: 'ad-muted', text: 'Not done yet' })]);
    var media = rec.data ? fileLink(rec.data, label) : null;
    return h('div', { class: 'oo-test' }, [h('b', { text: label }),
      h('span', { class: 'ad-muted', text: (rec.type === 'sent' ? 'Sent to you on WhatsApp' : rec.noCopy ? 'Uploaded (too big to keep a copy here)' : 'Uploaded') + (rec.date ? ' · ' + rec.date : '') }),
      media]);
  }
  function oneOnOneView(v, all) {
    v = v || {};
    var rep = all['cmn-rep-results'];
    var steps = [
      ['Read the welcome guide', !!v.guideOk],
      ['Joined WhatsApp', !!v.wa],
      ['Rep System Test', !!(v.repDone || rep)],
      ['Human Design chart', !!v.hd],
      ['DISC profile', !!v.disc],
      ['Saved the app to home screen', !!v.homeSaved]
    ];
    var done = steps.filter(function (s) { return s[1]; }).length;
    var rest = {}; Object.keys(v).forEach(function (k) { if (['guideOk', 'wa', 'repDone', 'repSent', 'hd', 'disc', 'homeSaved'].indexOf(k) < 0) rest[k] = v[k]; });
    return h('div', { class: 'oo' }, [
      h('div', { class: 'oo-prog' }, [h('div', { class: 'ad-bar' }, [h('div', { class: 'ad-barfill', style: 'width:' + Math.round(100 * done / steps.length) + '%' })]), h('span', { class: 'ad-muted', text: done + ' of ' + steps.length + ' start-here steps done' })]),
      h('div', { class: 'oo-steps' }, steps.map(function (s) { return h('div', { class: 'oo-step' + (s[1] ? ' on' : '') }, [h('span', { class: 'oo-dot', text: s[1] ? '✓' : '' }), s[0]]); })),
      h('div', { class: 'oo-tests' }, [testFile(v.hd, 'Human Design'), testFile(v.disc, 'DISC')]),
      value(rest)
    ]);
  }

  /* ====================== coach tools: time zones, photos, journey, sessions, calendar, wins ====================== */
  function myTz() { var a = (S.avatars || {})[S.me] || {}; try { return a.tz || Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'Australia/Brisbane'; } }
  function tzOf(c) { return ((S.avatars || {})[c.id] || {}).tz || ''; }
  function placeOf(c) { var a = (S.avatars || {})[c.id] || {}, city = a.tz ? a.tz.split('/').pop().replace(/_/g, ' ') : ''; var cn = ''; try { cn = a.country ? new Intl.DisplayNames(['en'], { type: 'region' }).of(a.country) : ''; } catch (e) { cn = a.country || ''; } return [city, cn].filter(Boolean).join(', '); }
  function tFmt(tz, d, opts) { try { return (d || new Date()).toLocaleString('en-AU', Object.assign({ timeZone: tz, hour: 'numeric', minute: '2-digit' }, opts || {})); } catch (e) { return ''; } }
  function offMin(tz, d) { d = d || new Date(); try { var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), o = {}; f.formatToParts(d).forEach(function (p) { o[p.type] = p.value; }); return Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute) - Math.floor(d.getTime() / 60000) * 60000) / 60000); } catch (e) { return 0; } }
  function offLabel(tz) { var m = offMin(tz), s = m < 0 ? '−' : '+'; m = Math.abs(m); return 'UTC' + s + Math.floor(m / 60) + (m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''); }
  function diffLabel(tz) { var d = offMin(tz) - offMin(myTz()); if (!d) return 'same time as you'; var hrs = Math.abs(d) / 60; return (hrs % 1 ? hrs.toFixed(1) : hrs) + 'h ' + (d > 0 ? 'ahead of you' : 'behind you'); }
  function hourIn(tz) { return +tFmt(tz, new Date(), { hour: 'numeric', minute: undefined, hourCycle: 'h23' }).replace(/\D/g, '') % 24; }
  function liveClock(tz, cls) { var e = h('span', { class: 'ad-clock ' + (cls || ''), 'data-tz': tz }); paintClock(e); return e; }
  function paintClock(e) { var tz = e.getAttribute('data-tz'), hr = hourIn(tz); e.textContent = (hr >= 7 && hr < 19 ? '☀️ ' : '🌙 ') + tFmt(tz, null, { weekday: 'short' }); }
  setInterval(function () { document.querySelectorAll('.ad-clock[data-tz]').forEach(paintClock); }, 30000);

  // coach-only record per client (photo, HD/DISC notes, session notes, celebrated wins)
  function coach(c) { return (S.coach || {})[c.id] || {}; }
  function saveCoach(c, patch, redraw) {
    var d = Object.assign({}, coach(c), patch); S.coach = S.coach || {}; S.coach[c.id] = d;
    return sb.from('coach_clients').upsert({ client_id: c.id, data: d, updated_at: new Date().toISOString() }).then(function (r) { if (r.error) console.warn(r.error); if (redraw !== false) page(); });
  }
  function squarePhoto(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej; fr.onload = function () { var img = new Image(); img.onerror = rej; img.onload = function () {
        var s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = 320;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 320, 320); res(c.toDataURL('image/jpeg', 0.85)); }; img.src = fr.result; }; fr.readAsDataURL(file);
    });
  }
  function shrinkImage(file, max) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej; fr.onload = function () { var img = new Image(); img.onerror = rej; img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.85)); }; img.src = fr.result; }; fr.readAsDataURL(file);
    });
  }
  function photoBox(c, cls) {
    var ph = coach(c).photo, a = (S.avatars || {})[c.id] || {}, el = h('span', { class: 'ad-photo ' + (cls || '') + ' ' + (c.is_admin ? 'me' : c.tier) });
    if (ph || a.photo) el.appendChild(h('img', { src: ph || a.photo, alt: '' }));
    else if (a.char && window.BT_COURSE) el.innerHTML = window.BT_COURSE.charSvg(a.char);
    else el.appendChild(h('span', { class: 'ad-photo-i', text: initials(c) }));
    return el;
  }

  // calendar: events matched to a client by invite email or their name in the title
  function loadCalendar() {
    if (S.cal && S.cal.loading) return;
    S.cal = { loading: true, events: [] };
    sb.auth.getSession().then(function (r) {
      var tok = r.data && r.data.session && r.data.session.access_token;
      return fetch('/.netlify/functions/calendar', { headers: { Authorization: 'Bearer ' + tok } });
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { S.cal = { events: d.events || [], setup: !!d.setup, at: Date.now() }; page(); })
      .catch(function () { S.cal = { events: [], error: true, at: Date.now() }; page(); });
  }
  function nameBits(c) { var n = (c.full_name || '').replace(/^Example:\s*/i, '').trim().toLowerCase(); return n ? [n].concat(n.split(/\s+/).length > 1 ? [] : []) : []; }
  function eventsFor(c) {
    var em = (c.email || '').toLowerCase(), names = nameBits(c), first = names[0] ? names[0].split(/\s+/)[0] : '';
    var ow = ((coach(c).cal || {}).match || '').toLowerCase().trim();
    return ((S.cal || {}).events || []).filter(function (e) {
      if (e.allDay) return false;
      var t = (e.title || '').toLowerCase();
      if (ow) return t.indexOf(ow) >= 0 || (e.attendees || []).indexOf(ow) >= 0;
      if (em && (e.attendees || []).indexOf(em) >= 0) return true;
      if (names[0] && t.indexOf(names[0]) >= 0) return true;
      return !!(first && first.length >= 3 && new RegExp('(^|[^a-z])' + first + '([^a-z]|$)').test(t) && /1:1|session|coaching|call|breakthrough/.test(t));
    });
  }
  function contractTerms(c) { var k = (S.contracts || {})[c.id]; return k ? ((k.signed && k.signed.terms) || k.terms || null) : null; }
  function sessionsTotal(c) {
    var ov = coach(c).sessionsTotal; if (ov) return ov;
    var t = contractTerms(c);
    if (t && t.one && Number(t.one.n)) { var w = Number(t.weeks) || 8, per = t.one.per === 'Fortnight' ? 2 : t.one.per === 'Month' ? 4.33 : 1; return Math.max(1, Math.round(Number(t.one.n) * w / per)); }
    return c.tier === 'private' && !c.is_admin ? 8 : 0;
  }
  function sessionPlan(c) {
    var total = sessionsTotal(c), t = contractTerms(c), startMs = t && t.start ? new Date(t.start + 'T00:00:00').getTime() - 7 * 86400000 : 0;
    var ev = eventsFor(c).filter(function (e) { return new Date(e.start).getTime() >= startMs; }), now = Date.now();
    var past = ev.filter(function (e) { return new Date(e.start).getTime() < now; }), fut = ev.filter(function (e) { return new Date(e.start).getTime() >= now; });
    var slots = []; for (var i = 0; i < Math.max(total, ev.length); i++) { var e = ev[i]; slots.push({ n: i + 1, ev: e || null, state: !e ? 'empty' : new Date(e.start).getTime() < now ? 'done' : 'booked', extra: i >= total }); }
    return { total: total, slots: slots, past: past, fut: fut, left: Math.max(0, total - ev.length) };
  }
  function bookingAlert(c) {
    if (c.is_admin || c.tier !== 'private' || !S.cal || S.cal.loading || S.cal.error || S.cal.setup) return '';
    var p = sessionPlan(c); if (!p.total || p.left <= 0 || p.fut.length) return '';
    var first = (c.full_name || c.email).replace(/^Example:\s*/i, '').split(' ')[0];
    if (!p.past.length) return first + ' hasn’t got her first 1:1 booked yet.';
    var last = p.past[p.past.length - 1], days = Math.floor((Date.now() - new Date(last.start)) / 86400000);
    return days >= 3 ? 'No next 1:1 booked for ' + first + '. Her last session was ' + days + ' days ago (' + p.left + ' left).' : '';
  }

  // wins across clients
  function winsAll() {
    var out = []; Object.keys(S.decoder || {}).forEach(function (uid) {
      var c = S.clients.filter(function (x) { return x.id === uid; })[0]; if (!c) return;
      ((S.decoder[uid] || {}).evidence || []).forEach(function (e) { if (!e.win && !e.spark) return; var at = Number(e.id) || 0; out.push({ c: c, id: String(e.id), text: e.text || '', spark: e.spark || 'win', at: at }); });
    });
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  function celebrated(c, id) { return ((coach(c).cheered || {})[id]); }
  function shout(w) { var first = (w.c.full_name || '').replace(/^Example:\s*/i, '').split(' ')[0] || 'this legend'; return '🎉 Shout out to ' + first + '! “' + w.text + '” Proof you’re rewiring that brain. So proud of you 💛'; }
  function copyText(t, btn) { var done = function () { if (btn) { var o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = o; }, 1600); } }; try { navigator.clipboard.writeText(t).then(done, function () { window.prompt('Copy this:', t); }); } catch (e) { window.prompt('Copy this:', t); } }

  // home: heads up + clients' time right now + new wins
  function coachHome() {
    var real = S.clients.filter(function (c) { return !c.is_admin; });
    var alerts = real.map(function (c) { var m = bookingAlert(c); return m ? { c: c, m: m } : null; }).filter(Boolean);
    var wins = winsAll().filter(function (w) { return !w.c.is_admin && !celebrated(w.c, w.id) && Date.now() - w.at < 21 * 86400000; });
    var box = h('div', { class: 'ad-home' });
    if (alerts.length || (S.cal && (S.cal.setup || S.cal.error))) box.appendChild(h('div', { class: 'ad-card ad-alerts' }, [h('h3', { class: 'ad-h3', text: 'Heads up' })].concat(alerts.map(function (a) {
      return h('button', { class: 'ad-alert', type: 'button', onclick: function () { openClient(a.c); } }, [photoBox(a.c, 'xs'), h('span', { text: a.m }), h('b', { text: 'Open →' })]);
    })).concat(S.cal && S.cal.setup ? [h('p', { class: 'ad-muted', text: 'Connect your Google Calendar to see bookings here: ask Claude for the 2-minute setup (it’s one setting in Netlify).' })] : S.cal && S.cal.error ? [h('p', { class: 'ad-muted', text: 'Couldn’t reach your calendar just now.' })] : [])));
    if (wins.length) box.appendChild(h('div', { class: 'ad-card ad-wins' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: '🎉 New wins to celebrate' }), h('span', { class: 'ad-ct-st sent', text: wins.length + ' new' })])].concat(wins.slice(0, 8).map(function (w) {
      var cp = h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Copy shout-out', onclick: function () { copyText(shout(w), cp); } });
      return h('div', { class: 'ad-win' }, [photoBox(w.c, 'xs'), h('div', { class: 'ad-win-t' }, [h('b', { text: (w.c.full_name || w.c.email).replace(/^Example:\s*/i, '') }), h('p', { text: '“' + w.text + '”' }), h('span', { class: 'ad-muted', text: when(new Date(w.at).toISOString()) })]),
        h('div', { class: 'ad-win-a' }, [cp, h('button', { class: 'bt-btn ghost sm', type: 'button', text: '✓ Celebrated', onclick: function () { var ch = Object.assign({}, coach(w.c).cheered || {}); ch[w.id] = Date.now(); saveCoach(w.c, { cheered: ch }); } })])]);
    }))));
    var withTz = real.filter(function (c) { return tzOf(c); });
    if (withTz.length) box.appendChild(h('div', { class: 'ad-card ad-now' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: 'Right now for your clients' }), h('span', { class: 'ad-muted' }, ['You: ', liveClock(myTz())])]),
      h('div', { class: 'ad-now-row' }, withTz.sort(function (a, b) { return offMin(tzOf(b)) - offMin(tzOf(a)); }).map(function (c) {
        return h('button', { class: 'ad-now-c', type: 'button', onclick: function () { openClient(c); } }, [photoBox(c, 'xs'), h('div', null, [h('b', { text: (c.full_name || c.email).replace(/^Example:\s*/i, '').split(' ')[0] }), liveClock(tzOf(c), 'big'), h('span', { class: 'ad-muted', text: placeOf(c) + ' · ' + diffLabel(tzOf(c)) })])]);
      }))]));
    return box;
  }

  // the client's local time + converter (like timeanddate.com)
  function timeCard(c) {
    var tz = tzOf(c), me = myTz(), first = (c.full_name || c.email).replace(/^Example:\s*/i, '').split(' ')[0];
    var card = h('div', { class: 'ad-card ad-tz' }, [h('h3', { class: 'ad-h3', text: 'Time zones' })]);
    if (!tz) { card.appendChild(h('p', { class: 'ad-muted', text: first + ' hasn’t set her country and timezone yet. It’s part of the welcome steps in her app.' })); return card; }
    card.appendChild(h('div', { class: 'ad-tz-now' }, [h('div', null, [h('span', { class: 'ad-fk', text: first + ' · ' + placeOf(c) }), liveClock(tz, 'big'), h('span', { class: 'ad-muted', text: offLabel(tz) + ' · ' + diffLabel(tz) })]), h('div', null, [h('span', { class: 'ad-fk', text: 'You · ' + me.split('/').pop().replace(/_/g, ' ') }), liveClock(me, 'big'), h('span', { class: 'ad-muted', text: offLabel(me) })])]));
    // converter
    var dirMe = true, dt = h('input', { class: 'bt-in', type: 'datetime-local', 'aria-label': 'Pick a time' }), out = h('div', { class: 'ad-tz-out', 'aria-live': 'polite' });
    var lbl = h('span', { class: 'ad-fk', text: 'If it’s this time for you…' });
    function wallToUtc(str, zone) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(str); if (!m) return null; var g = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]); return new Date(g - offMin(zone, new Date(g)) * 60000); }
    function calc() { var from = dirMe ? me : tz, to = dirMe ? tz : me, d = wallToUtc(dt.value, from); out.innerHTML = ''; if (!d) return; out.appendChild(h('b', { text: tFmt(to, d, { weekday: 'long', day: 'numeric', month: 'short' }) })); out.appendChild(h('span', { class: 'ad-muted', text: dirMe ? 'for ' + first : 'for you' })); var hr = +tFmt(to, d, { hour: 'numeric', minute: undefined, hourCycle: 'h23' }).replace(/\D/g, '') % 24; if (hr < 7 || hr >= 21) out.appendChild(h('span', { class: 'ad-tz-warn', text: '🌙 That’s outside normal waking hours for ' + (dirMe ? first : 'you') + '.' })); }
    var now = new Date(Date.now() + offMin(me) * 60000); now.setUTCMinutes(0); dt.value = now.toISOString().slice(0, 16);
    dt.addEventListener('input', calc);
    var sw = h('button', { class: 'bt-btn ghost sm', type: 'button', text: '⇄ Swap', onclick: function () { dirMe = !dirMe; lbl.textContent = dirMe ? 'If it’s this time for you…' : 'If it’s this time for ' + first + '…'; calc(); } });
    card.appendChild(h('div', { class: 'ad-tz-conv' }, [lbl, h('div', { class: 'ad-ct-inline' }, [dt, sw]), out]));
    // 24-hour strip: your hours vs theirs, good overlap highlighted
    var d0 = new Date(); d0.setMinutes(0, 0, 0);
    var strip = h('div', { class: 'ad-tz-strip', role: 'table', 'aria-label': 'Hours side by side' });
    [[me, 'You'], [tz, first]].forEach(function (z) {
      strip.appendChild(h('div', { class: 'ad-tz-row', role: 'row' }, [h('span', { class: 'ad-tz-n', text: z[1] })].concat(Array.from({ length: 24 }, function (_, i) {
        var t = new Date(d0.getTime() + (i - 2) * 3600000), hr = +tFmt(z[0], t, { hour: 'numeric', minute: undefined, hourCycle: 'h23' }).replace(/\D/g, '') % 24;
        var ok = hr >= 8 && hr < 20, hmT = new Date(d0.getTime() + (i - 2) * 3600000), hm = +tFmt(me, hmT, { hour: 'numeric', minute: undefined, hourCycle: 'h23' }).replace(/\D/g, '') % 24, ht = +tFmt(tz, hmT, { hour: 'numeric', minute: undefined, hourCycle: 'h23' }).replace(/\D/g, '') % 24;
        var both = hm >= 8 && hm < 20 && ht >= 8 && ht < 20;
        return h('span', { class: 'ad-tz-h' + (ok ? ' day' : '') + (both ? ' both' : '') + (i === 2 ? ' nowh' : ''), role: 'cell', title: tFmt(z[0], t, { weekday: 'short' }), text: hr === 0 ? tFmt(z[0], t, { weekday: 'short', hour: undefined, minute: undefined }) : String(hr % 12 || 12) + (hr < 12 ? 'a' : 'p') });
      }))));
    });
    card.appendChild(h('div', { class: 'ad-tz-wrap' }, [strip]));
    card.appendChild(h('p', { class: 'ad-muted small', text: 'Green = 8am to 8pm for both of you. The outlined column is now.' }));
    return card;
  }

  // journey as an ordered to-do list with logos
  function journeyList(c, all) {
    var prog = all['bt-course'] || {}, done = prog.done || {}, open = weeksOpenFor(c), first = (c.full_name || c.email).replace(/^Example:\s*/i, '').split(' ')[0];
    var flat = []; courseData().weeks.forEach(function (w) { (w.lessons || []).forEach(function (l) { flat.push({ w: w, l: l }); }); });
    var lastDone = -1; flat.forEach(function (x, i) { if (done[x.l.id]) lastDone = i; });
    var nextSet = false, missed = 0;
    var rows = flat.map(function (x, i) {
      var st = done[x.l.id] ? 'done' : x.w.week > open ? 'locked' : i < lastDone ? 'missed' : !nextSet ? (nextSet = true, 'next') : 'todo';
      if (st === 'missed') missed++;
      x.st = st; return x;
    });
    var allBtn = h('button', { class: 'bt-btn ghost sm ad-jl-all', type: 'button', text: 'Expand all', onclick: function () { var opening = allBtn.textContent === 'Expand all'; box.querySelectorAll('details.ad-jl-wk').forEach(function (d) { d.open = opening; }); allBtn.textContent = opening ? 'Collapse all' : 'Expand all'; } });
    var box = h('div', { class: 'ad-jl' }, [h('div', { class: 'ad-jl-sum' }, [h('span', { class: 'ad-ct-st signed', text: rows.filter(function (x) { return x.st === 'done'; }).length + ' done' }), missed ? h('span', { class: 'ad-ct-st miss', text: missed + ' missed' }) : null, h('span', { class: 'ad-muted', text: 'In the order she should do them' }), allBtn])]);
    var nowList = h('ol', { class: 'ad-jl-list ad-jl-now' });
    box.appendChild(h('p', { class: 'ad-jl-w', text: 'Up to now' })); box.appendChild(nowList);
    var curW = null, list, wkDone = {}, wkMiss = {};
    rows.forEach(function (x) { var k = x.w.week; wkDone[k] = (wkDone[k] || 0) + (x.st === 'done' ? 1 : 0); wkMiss[k] = (wkMiss[k] || 0) + (x.st === 'missed' ? 1 : 0); });
    rows.forEach(function (x) {
      if (x.w !== curW) { curW = x.w; var n = (x.w.lessons || []).length; list = h('ol', { class: 'ad-jl-list' }); box.appendChild(h('details', { class: 'ad-jl-wk' + (x.w.week > open ? ' lock' : '') }, [h('summary', null, [h('span', { class: 'ad-jl-wt', text: weekLabel(x.w) + (x.w.week > open ? ' · not open yet' : '') }), h('span', { class: 'ad-jl-wc', text: wkDone[x.w.week] + '/' + n + (wkMiss[x.w.week] ? ' · ' + wkMiss[x.w.week] + ' missed' : '') })]), list])); }
      var r = (x.l.res || [])[0], ic = r && window.BT_COURSE && window.BT_COURSE.emblem ? window.BT_COURSE.emblem(r) : h('span', { class: 'ad-jl-play', 'aria-hidden': 'true', text: /^embodiment/i.test(x.l.title) ? '⚡' : '▶' });
      var lab = { done: '✓ Done ' + (typeof done[x.l.id] === 'number' ? new Date(done[x.l.id]).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''), missed: 'Missed', next: 'Up next', todo: 'Not yet', locked: '🔒' }[x.st];
      var li = h('li', { class: 'ad-jl-i ' + x.st }, [h('span', { class: 'ad-jl-ic' }, [ic]), h('span', { class: 'ad-jl-t', text: x.l.title }), h('span', { class: 'ad-jl-s', text: lab })]);
      if (x.st === 'missed' || x.st === 'next') { var b = h('button', { class: 'ad-jl-nudge', type: 'button', title: 'Copy a reminder message', text: '💬', onclick: function () { copyText('Hey ' + first + '! Little nudge from me: have you had a chance to do “' + x.l.title.replace(/^(Lesson \d+|Activity|Embodiment|Side Quest|Bonus):\s*/i, '') + '” yet? It’s a good one. The doing creates the change 💛', b); } }); li.appendChild(b); }
      list.appendChild(li);
      if (x.st === 'next') nowList.appendChild(li.cloneNode(true)).querySelectorAll('.ad-jl-nudge').forEach(function (b) { b.remove(); });
    });
    if (!nowList.children.length) nowList.appendChild(h('li', { class: 'ad-jl-i done' }, [h('span', { class: 'ad-jl-t', text: 'Everything open so far is done 🎉' })]));
    return box;
  }

  // Zoom: after a session, bring in the AI summary, transcript and recording link (only fills empty boxes)
  function pullZoom(c, slots, force) {
    S.zoom = S.zoom || {}; if (!force && S.zoom[c.id]) return; S.zoom[c.id] = { loading: true };
    var notes = coach(c).sessions || {}, want = [];
    slots.forEach(function (s) { if (!s.ev || new Date(s.ev.start) > new Date()) return; var rec = notes[s.ev.id] || {}; if (rec.summary && rec.transcript && rec.video) return; want.push({ key: s.ev.id, start: s.ev.start, needSummary: !rec.summary, needTranscript: !rec.transcript }); });
    if (!want.length) { S.zoom[c.id] = { done: true, n: 0 }; return; }
    sb.auth.getSession().then(function (r) { var tok = r.data && r.data.session && r.data.session.access_token; return fetch('/.netlify/functions/zoom', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ sessions: want }) }); })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (d.setup) { S.zoom[c.id] = { setup: true }; page(); return; }
        if (d.error) { S.zoom[c.id] = { error: d.error }; page(); return; }
        var all = Object.assign({}, coach(c).sessions || {}), n = 0;
        Object.keys(d.found || {}).forEach(function (k) { var f = d.found[k], cur = Object.assign({}, all[k] || {}), ch = false;
          ['summary', 'transcript', 'video'].forEach(function (x) { if (f[x] && !cur[x]) { cur[x] = f[x]; ch = true; } });
          if (ch) { cur.zoom = Date.now(); all[k] = cur; n++; } });
        S.zoom[c.id] = { done: true, n: n };
        if (n) saveCoach(c, { sessions: all }); else page();
      }).catch(function () { S.zoom[c.id] = { error: 'Couldn’t reach Zoom just now' }; page(); });
  }
  function zoomLine(c, slots) {
    var z = (S.zoom || {})[c.id] || {};
    var btn = h('button', { class: 'bt-btn ghost sm', type: 'button', text: '↻ Check Zoom', onclick: function () { pullZoom(c, slots, true); page(); } });
    var t = z.loading ? 'Checking Zoom for summaries and recordings…' : z.setup ? 'Connect Zoom and each session’s AI summary, transcript and recording drop in here by themselves (ask Claude for the steps).' : z.error ? 'Zoom: ' + z.error : z.done ? (z.n ? '✓ Brought in Zoom notes for ' + z.n + ' session' + (z.n === 1 ? '' : 's') + '.' : 'Zoom: nothing new to bring in.') : '';
    return t ? h('div', { class: 'ad-conns' }, [h('span', { class: 'ad-conn ' + (z.error ? 'err' : z.setup ? 'off' : 'on'), text: t }), z.loading ? null : btn]) : null;
  }
  // 1:1 sessions: slots filled from the calendar, with Zoom summary / transcript / Drive link / notes
  function sessionsCard(c) {
    var p = sessionPlan(c), notes = coach(c).sessions || {}, first = (c.full_name || c.email).replace(/^Example:\s*/i, '').split(' ')[0];
    var card = h('div', { class: 'ad-card ad-sess' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: '1:1 sessions' }), h('span', { class: 'ad-ct-st ' + (p.left ? 'draft' : 'signed'), text: p.slots.filter(function (s) { return s.ev; }).length + ' of ' + p.total + ' booked' })])]);
    var alert = bookingAlert(c); if (alert) card.appendChild(h('p', { class: 'ad-sess-alert', text: '⚠ ' + alert }));
    if (S.cal && !S.cal.loading && !S.cal.setup) { pullZoom(c, p.slots); var zl = zoomLine(c, p.slots); if (zl) card.appendChild(zl); }
    if (S.cal && S.cal.setup) card.appendChild(h('p', { class: 'ad-muted', text: 'Connect your Google Calendar and these fill in by themselves as sessions appear (ask Claude for the setup).' }));
    var mInp = h('input', { class: 'bt-in sm', placeholder: 'e.g. their email or “Anna”', value: (coach(c).cal || {}).match || '' });
    var tInp = h('input', { class: 'bt-in sm', type: 'number', min: '0', value: coach(c).sessionsTotal || '', placeholder: String(sessionsTotal(c)) });
    // what she sees in her profile: call times, Zoom link, booked dates (dates sync from your calendar)
    var k0 = (S.contracts || {})[c.id], terms0 = (k0 && k0.terms) || {}, call0 = terms0.call || {};
    var zIn = h('input', { class: 'bt-in sm', type: 'url', placeholder: 'https://zoom.us/j/…', value: call0.zoom || '' }), tIn2 = h('input', { class: 'bt-in sm', placeholder: 'e.g. Tuesdays at 10am (your time)', value: call0.times || '' });
    function saveCall(patch, quiet) {
      var k = (S.contracts || {})[c.id] || { user_id: c.id, status: 'draft', terms: {} }, t = Object.assign({}, k.terms || {}); t.call = Object.assign({}, t.call || {}, patch);
      var row = { user_id: c.id, terms: t, status: k.status || 'draft', updated_at: new Date().toISOString() };
      return sb.from('contracts').upsert(row).then(function (r) { if (r.error) return; S.contracts[c.id] = Object.assign({}, k, row); if (!quiet) page(); });
    }
    var upISO = p.fut.map(function (e) { return e.start; });
    if (S.cal && !S.cal.loading && !S.cal.error && !S.cal.setup && JSON.stringify(upISO) !== JSON.stringify(call0.upcoming || [])) saveCall({ upcoming: upISO }, true);
    card.appendChild(h('div', { class: 'ad-sess-call' }, [h('b', { text: 'In ' + first + '’s profile' }), h('span', { class: 'ad-muted', text: 'Booked dates copy across from your calendar by themselves.' }),
      h('label', { class: 'ad-field' }, ['Zoom link', zIn]), h('label', { class: 'ad-field' }, ['Call times', tIn2]),
      h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Save', onclick: function (e) { saveCall({ zoom: zIn.value.trim(), times: tIn2.value.trim() }); } })]));
    card.appendChild(h('details', { class: 'ad-sess-set' }, [h('summary', { text: 'Matching + number of sessions' }), h('p', { class: 'ad-muted', text: 'Sessions are found in your calendar by ' + first + '’s email in the invite or her name in the title. If yours are named differently, type what to look for.' }),
      h('div', { class: 'ad-ct-inline' }, [mInp, tInp, h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Save', onclick: function () { saveCoach(c, { cal: { match: mInp.value.trim() }, sessionsTotal: Number(tInp.value) || 0 }); } })])]));
    var list = h('ol', { class: 'ad-sess-list' });
    p.slots.forEach(function (s) {
      var key = s.ev ? s.ev.id : 'slot' + s.n, rec = notes[key] || {}, d = s.ev ? new Date(s.ev.start) : null;
      var head = h('summary', null, [h('span', { class: 'ad-sess-n', text: String(s.n) }), h('div', { class: 'ad-sess-h' }, [h('b', { text: d ? tFmt(myTz(), d, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Not booked yet' }), d && tzOf(c) ? h('span', { class: 'ad-muted', text: tFmt(tzOf(c), d, { weekday: 'short' }) + ' for ' + first }) : null]),
        h('span', { class: 'ad-sess-st ' + s.state, text: s.state === 'done' ? (rec.summary || rec.notes ? '✓ Notes' : '✓ Done') : s.state === 'booked' ? 'Booked' : 'Empty' })]);
      var row = h('details', { class: 'ad-sess-i ' + s.state }, [head]);
      if (s.ev) {
        var f = function (k, label, ph, big) { var i = big ? h('textarea', { class: 'bt-in ad-ta', placeholder: ph, 'aria-label': label }) : h('input', { class: 'bt-in', placeholder: ph, 'aria-label': label }); i.value = rec[k] || ''; i.addEventListener('change', function () { var all = Object.assign({}, coach(c).sessions || {}); all[key] = Object.assign({}, all[key] || {}, (function () { var o = {}; o[k] = i.value; o.at = s.ev.start; return o; })()); saveCoach(c, { sessions: all }, false); }); return h('label', { class: 'ad-field' }, [label, i]); };
        row.appendChild(h('div', { class: 'ad-sess-b' }, [
          h('p', { class: 'ad-muted', text: s.ev.title + (s.ev.location ? ' · ' + s.ev.location : '') }),
          f('summary', 'Zoom AI summary', 'Paste the Zoom AI meeting summary', true),
          rec.zoom ? h('span', { class: 'ad-conn on', text: '✓ From Zoom' }) : null,
          rec.video ? h('a', { class: 'bt-btn ghost sm', href: rec.video, target: '_blank', rel: 'noopener', text: '▶ Open the recording' }) : null,
          f('video', 'Recording link (Zoom or Google Drive)', 'https://zoom.us/rec/… or https://drive.google.com/…'),
          h('details', { class: 'ad-sess-tr' }, [h('summary', { text: 'Transcript' + (rec.transcript ? ' ✓' : '') }), f('transcript', 'Transcript', 'Paste the transcript', true)]),
          f('notes', 'My notes', 'Your own notes for this session', true)
        ]));
      }
      list.appendChild(row);
    });
    card.appendChild(list);
    return card;
  }

  // Rep system, Human Design and DISC side by side, with her uploads and yours
  function profilesCard(c, all) {
    var one = all['cmn-1to1-dashboard'] || {}, rep = all['cmn-rep-results'], co = coach(c);
    function prof(key, label, rec) {
      var mine = co[key] || {}, img = mine.img || (rec && /^data:image/.test(rec.data || '') ? rec.data : '');
      var file = h('input', { type: 'file', accept: 'image/*', class: 'bt-file', id: 'cp-' + key + '-' + c.id, onchange: function (e) { var fl = e.target.files && e.target.files[0]; if (!fl) return; shrinkImage(fl, 1400).then(function (u) { var o = {}; o[key] = Object.assign({}, mine, { img: u }); saveCoach(c, o); }); } });
      var nt = h('textarea', { class: 'bt-in ad-ta sm', placeholder: key === 'hd' ? 'Type, strategy, authority, profile…' : 'Style, e.g. High I, S…', 'aria-label': label + ' notes' }); nt.value = mine.notes || '';
      nt.addEventListener('change', function () { var o = {}; o[key] = Object.assign({}, coach(c)[key] || {}, { notes: nt.value }); saveCoach(c, o, false); });
      return h('div', { class: 'ad-prof' }, [h('b', { text: label }),
        h('span', { class: 'ad-muted', text: rec ? (rec.type === 'sent' ? 'She sent it on WhatsApp' + (rec.date ? ' · ' + rec.date : '') : rec.type === 'skip' ? 'She skipped this' : 'She uploaded it' + (rec.date ? ' · ' + rec.date : '')) : 'Not done yet' }),
        img ? h('a', { class: 'ad-prof-img', href: img, target: '_blank', rel: 'noopener' }, [h('img', { src: img, alt: label + ' screenshot' })]) : null,
        h('label', { class: 'bt-btn ghost sm', for: 'cp-' + key + '-' + c.id }, [img ? 'Replace screenshot' : 'Add a screenshot', file]), nt]);
    }
    // compact summary: lead rep system + levels, and the two screenshots
    var sumKids = [];
    if (rep && rep.ranks) { var sc = repScores(rep.ranks); sumKids.push(h('div', { class: 'ad-pf-rep' }, [h('b', { text: sc.leads.map(function (k) { return SYS[k].name; }).join(' + ') }), h('span', { class: 'ad-pf-lv' }, sc.sorted.map(function (k) { return h('span', { class: 'ad-pf-chip', style: 'background:' + SYS[k].color + ';color:' + SYS[k].ink, text: SYS[k].name + ' ' + sc.t[k] }); }))])); }
    else sumKids.push(h('span', { class: 'ad-muted', text: 'Rep system not done yet' }));
    ['hd', 'disc'].forEach(function (k) { var rec = one[k], img = (co[k] || {}).img || (rec && /^data:image/.test(rec.data || '') ? rec.data : ''); sumKids.push(img ? h('img', { class: 'ad-pf-thumb', src: img, alt: k === 'hd' ? 'Human Design' : 'DISC' }) : h('span', { class: 'ad-pf-none', text: (k === 'hd' ? 'Human Design' : 'DISC') + ': none yet' })); });
    // always open: no drop-down, the tests are right there
    var det = h('section', { class: 'ad-card ad-profs open' }, [
      h('h3', { class: 'ad-h3', text: 'Rep system, Human Design + DISC' }),
      h('div', { class: 'ad-prof rep wide' }, [rep ? repView(rep) : h('span', { class: 'ad-muted', text: 'Rep system not done yet' })]),
      h('div', { class: 'ad-profs-g two' }, [prof('hd', 'Human Design', one.hd), prof('disc', 'DISC', one.disc)])]);
    return det;
  }

  /* ====================== finance: payment schedule from agreements + what's come in ====================== */
  function money0(n) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-AU'); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  // real payments (Stripe / Shopify), loaded once and matched to clients by email
  function loadPayments(force) {
    if (S.pay && (S.pay.loading || (!force && S.pay.at))) return;
    S.pay = { loading: true, items: [] };
    sb.auth.getSession().then(function (r) {
      var tok = r.data && r.data.session && r.data.session.access_token;
      return fetch('/.netlify/functions/payments', { headers: { Authorization: 'Bearer ' + tok } });
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { S.pay = { items: d.items || [], stripe: d.stripe || {}, shopify: d.shopify || {}, at: Date.now() }; page(); })
      .catch(function () { S.pay = { items: [], error: true, at: Date.now() }; page(); });
  }
  function payEmails(c) { return [c.email || ''].concat(coach(c).payEmails || []).map(function (e) { return String(e).toLowerCase().trim(); }).filter(Boolean); }
  function realFor(c) { var em = payEmails(c); return ((S.pay || {}).items || []).filter(function (x) { return x.email && em.indexOf(x.email) >= 0; }); }
  // each real payment ticks off the earliest instalment still open; a failed one near a due date flags it
  function matchPayments(c, mine, used) {
    var real = realFor(c); if (!real.length) return;
    var open = mine.filter(function (m) { return !m.manual; });
    real.filter(function (x) { return x.status === 'paid'; }).forEach(function (x) {
      var m = open.filter(function (m) { return !m.auto; })[0]; if (!m || Number(x.amount) < m.amount * 0.5) return;
      m.auto = x; m.paid = true; used[x.id] = 1;
    });
    real.filter(function (x) { return x.status === 'failed' || x.status === 'overdue' || x.status === 'open'; }).forEach(function (x) {
      var xd = new Date(x.date), m = mine.filter(function (m) { return !m.paid && Math.abs(m.date - xd) < 12 * 864e5; })[0];
      if (m) { m.flag = x; used[x.id] = 1; }
    });
  }
  function payStatus(p) {
    var today = ymd(new Date());
    if (p.paid) return { cls: 'paid', text: p.auto ? '✓ Paid · ' + p.auto.src : p.real ? '✓ ' + p.src : '✓ Received' };
    if (p.flag && p.flag.status === 'failed') return { cls: 'failed', text: '✕ Payment failed' + (p.flag.reason ? ': ' + p.flag.reason : '') };
    if (p.flag && p.flag.status === 'overdue') return { cls: 'late', text: 'Invoice overdue' };
    if (p.key < today) return { cls: 'late', text: 'Overdue' };
    if (p.flag && p.flag.status === 'open') return { cls: 'up', text: 'Invoice sent' };
    return { cls: 'up', text: 'Upcoming' };
  }
  function payConnLine() {
    var P = S.pay || {}, bits = [];
    if (P.loading) return h('p', { class: 'ad-muted small', text: 'Checking Stripe and Shopify…' });
    if (P.error) return h('p', { class: 'ad-muted small', text: 'Couldn’t reach Stripe or Shopify just now. Payments below are from your own ticks.' });
    [['Stripe', P.stripe || {}], ['Shopify', P.shopify || {}]].forEach(function (x) { bits.push(h('span', { class: 'ad-conn ' + (x[1].error ? 'err' : x[1].connected ? 'on' : 'off'), text: x[0] + (x[1].error ? ': couldn’t connect' : x[1].connected ? ' connected' : ' not connected') })); });
    bits.push(h('span', { class: 'ad-conn off', text: 'Bank transfers: tick them off' }));
    bits.push(h('button', { class: 'bt-btn ghost sm', type: 'button', text: '↻ Refresh', onclick: function () { loadPayments(true); page(); } }));
    return h('div', { class: 'ad-conns' }, bits);
  }
  // payments that came in but don't match a client's email: link them once and they're remembered
  function unmatchedCard() {
    var known = {}; S.clients.forEach(function (c) { payEmails(c).forEach(function (e) { known[e] = 1; }); });
    var plans = {}; S.clients.forEach(function (c) { if ((S.contracts || {})[c.id]) plans[c.id] = c; });
    var list = ((S.pay || {}).items || []).filter(function (x) { return x.email && !known[x.email] && (x.status === 'paid' || x.status === 'failed') && new Date(x.date) > addDays(new Date(), -120); }).slice(-12).reverse();
    if (!list.length || !Object.keys(plans).length) return null;
    return h('div', { class: 'ad-card' }, [h('h3', { class: 'ad-h3', text: 'Payments from someone not linked yet' }), h('p', { class: 'ad-muted', text: 'If one of these is a 1:1 client paying from a different email, link it and their plan updates itself. Course sales can stay as they are.' })].concat(list.map(function (x) {
      var sel = h('select', { class: 'bt-in sm', 'aria-label': 'Link to client' }, [h('option', { value: '', text: 'Link to…' })].concat(Object.keys(plans).map(function (id) { var c = plans[id]; return h('option', { value: id, text: (c.full_name || c.email).replace(/^Example:\s*/i, '') }); })));
      sel.addEventListener('change', function () { var c = plans[sel.value]; if (!c) return; saveCoach(c, { payEmails: (coach(c).payEmails || []).concat([x.email]) }); });
      return h('div', { class: 'ad-fin-row' }, [h('div', { class: 'ad-fin-rt' }, [h('b', { text: x.name || x.email }), h('span', { class: 'ad-muted', text: x.email + ' · ' + new Date(x.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + ' · ' + x.src + (x.status === 'failed' ? ' · failed' : '') })]), h('b', { class: 'ad-fin-amt', text: money0(x.amount) }), sel]);
    })));
  }
  // the client's own plan, for their page in the dashboard
  function paymentsCard(c) {
    var mine = paySchedule().filter(function (p) { return p.c && p.c.id === c.id; });
    if (!mine.length) return null;
    var got = mine.filter(function (p) { return p.paid; }).reduce(function (s, p) { return s + p.amount; }, 0), tot = mine.reduce(function (s, p) { return s + p.amount; }, 0);
    return h('div', { class: 'ad-card ad-paycard' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: 'Payments' }), h('span', { class: 'ad-ct-st ' + (got >= tot ? 'signed' : 'draft'), text: money0(got) + ' of ' + money0(tot) })]), payConnLine()].concat(mine.map(payRow)));
  }
  function paySchedule() {
    var out = [], used = {};
    S.clients.forEach(function (c) {
      var k = (S.contracts || {})[c.id]; if (!k || (k.status !== 'signed' && k.status !== 'sent')) return;
      var t = (k.signed && k.signed.terms) || k.terms || {}; if (!t.start) return;
      var start = new Date(t.start + 'T00:00:00'), n = 1, step = 0, amt = Number(t.amount) || 0;
      if (t.plan === 'full') { n = 1; amt = Number(t.amount) || 4900; }
      else if (t.plan === 'in4') { n = 4; step = 14; amt = (Number(t.amount) || 5100) / 4; }
      else if (t.plan === 'weekly') { n = 12; step = 7; amt = (Number(t.amount) || 5400) / 12; }
      else if (t.plan === 'bespoke') { var b = t.bespoke || {}; n = Math.max(1, Number(b.count) || 1); step = b.freq === 'week' ? 7 : b.freq === 'fortnight' ? 14 : b.freq === 'month' ? 30 : 0; amt = Number(b.per) || (Number(t.amount) || 0) / n; }
      var paid = (coach(c).payments || {}), mine = [];
      for (var i = 0; i < n; i++) {
        var d = t.plan === 'bespoke' && (t.bespoke || {}).freq === 'month' ? new Date(start.getFullYear(), start.getMonth() + i, start.getDate()) : addDays(start, i * step), key = ymd(d);
        mine.push({ c: c, date: d, key: key, n: i + 1, of: n, amount: Math.round(amt * 100) / 100, paid: !!paid[key], manual: !!paid[key], pending: k.status !== 'signed', plan: t.plan });
      }
      matchPayments(c, mine, used);
      out.push.apply(out, mine);
    });
    // real payments from Stripe / Shopify that aren't part of a payment plan (course sales etc.)
    ((S.pay || {}).items || []).forEach(function (x) { if (x.status !== 'paid' || used[x.id]) return; out.push({ c: null, other: (x.name || x.email || 'Payment') + (x.desc ? ' · ' + x.desc : ''), src: x.src, date: new Date(x.date), key: ymd(new Date(x.date)), amount: Number(x.amount) || 0, paid: true, real: x }); });
    var me = S.clients.filter(function (c) { return c.id === S.me; })[0];
    ((me && coach(me).income) || []).forEach(function (x, i) { out.push({ c: null, other: x.note || 'Other income', date: new Date(x.date + 'T00:00:00'), key: x.date, amount: Number(x.amount) || 0, paid: true, idx: i }); });
    return out.sort(function (a, b) { return a.date - b.date; });
  }
  function financeView() {
    var all = paySchedule(), now = new Date(), today = ymd(now), mk = function (d) { return d.getFullYear() + '-' + d.getMonth(); };
    S.finMonth = S.finMonth || new Date(now.getFullYear(), now.getMonth(), 1);
    var thisM = mk(now), inM = all.filter(function (p) { return mk(p.date) === thisM; });
    var in30 = all.filter(function (p) { return !p.paid && p.date >= now && p.date <= addDays(now, 30); });
    var overdue = all.filter(function (p) { return !p.paid && p.c && (p.key < today || (p.flag && p.flag.status === 'failed')); });
    var yr = all.filter(function (p) { return p.paid && p.date.getFullYear() === now.getFullYear(); });
    var owed = all.filter(function (p) { return !p.paid && p.c; });
    var sum = function (l) { return l.reduce(function (s, p) { return s + p.amount; }, 0); };
    var sec = h('section', { class: 'ad-sec ad-fin' });
    if (!S.pay) loadPayments();
    sec.appendChild(payConnLine());
    sec.appendChild(h('div', { class: 'ad-fin-tiles' }, [
      tile('This month', money0(sum(inM)), money0(sum(inM.filter(function (p) { return p.paid; }))) + ' in so far', '#F1F9A6'),
      tile('Next 30 days', money0(sum(in30)), in30.length + ' payment' + (in30.length === 1 ? '' : 's') + ' due', '#F4C2F7'),
      tile('Still to come', money0(sum(owed)), 'across all payment plans', '#FBE6FC'),
      tile('Earned this year', money0(sum(yr)), 'marked as received', '#BFE3D0')
    ]));
    if (overdue.length) sec.appendChild(h('div', { class: 'ad-card ad-alerts' }, [h('h3', { class: 'ad-h3', text: 'Overdue, failed or not marked yet' })].concat(overdue.map(payRow))));
    var um = unmatchedCard(); if (um) sec.appendChild(um);
    // monthly bars: last 6 months + next 6
    var months = []; for (var m = -5; m <= 6; m++) months.push(new Date(now.getFullYear(), now.getMonth() + m, 1));
    var vals = months.map(function (d) { var l = all.filter(function (p) { return mk(p.date) === mk(d); }); return { d: d, got: sum(l.filter(function (p) { return p.paid; })), due: sum(l.filter(function (p) { return !p.paid; })) }; });
    var max = Math.max.apply(null, vals.map(function (v) { return v.got + v.due; }).concat([1]));
    sec.appendChild(h('div', { class: 'ad-card' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: 'Month by month' }), h('span', { class: 'ad-fin-key' }, [h('i', { class: 'got' }), 'Received ', h('i', { class: 'due' }), 'Scheduled'])]),
      h('div', { class: 'ad-fin-bars', role: 'img', 'aria-label': 'Income by month' }, vals.map(function (v) {
        var cur = mk(v.d) === thisM;
        return h('div', { class: 'ad-fin-col' + (cur ? ' cur' : ''), title: v.d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) + ': ' + money0(v.got) + ' received, ' + money0(v.due) + ' scheduled' }, [
          h('span', { class: 'ad-fin-v', text: v.got + v.due ? money0(v.got + v.due) : '' }),
          h('div', { class: 'ad-fin-stack' }, [h('div', { class: 'due', style: 'height:' + (v.due / max * 100) + '%' }), h('div', { class: 'got', style: 'height:' + (v.got / max * 100) + '%' })]),
          h('span', { class: 'ad-fin-m', text: v.d.toLocaleDateString('en-AU', { month: 'short' }) })]);
      }))]));
    // calendar
    var fm = S.finMonth, first = new Date(fm.getFullYear(), fm.getMonth(), 1), lead = (first.getDay() + 6) % 7, dim = new Date(fm.getFullYear(), fm.getMonth() + 1, 0).getDate();
    var monthPays = all.filter(function (p) { return mk(p.date) === mk(fm); });
    var grid = h('div', { class: 'ad-fin-cal' }, ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return h('span', { class: 'ad-fin-dow', text: d }); }));
    for (var i = 0; i < lead; i++) grid.appendChild(h('span', { class: 'ad-fin-day empty' }));
    for (var dd = 1; dd <= dim; dd++) {
      var key = ymd(new Date(fm.getFullYear(), fm.getMonth(), dd)), ps = monthPays.filter(function (p) { return p.key === key; });
      grid.appendChild(h('div', { class: 'ad-fin-day' + (key === today ? ' today' : '') + (ps.length ? ' has' : '') }, [h('b', { text: String(dd) })].concat(ps.map(function (p) {
        return h('span', { class: 'ad-fin-pay' + (p.paid ? ' paid' : p.key < today ? ' late' : ''), title: (p.c ? (p.c.full_name || p.c.email) + ' · payment ' + p.n + ' of ' + p.of : p.other) + ' · ' + money0(p.amount) }, [p.c ? photoBox(p.c, 'xxs') : null, money0(p.amount)]);
      }))));
    }
    sec.appendChild(h('div', { class: 'ad-card' }, [h('div', { class: 'ad-ct-top' }, [
      h('button', { class: 'bt-btn ghost sm', type: 'button', text: '‹', 'aria-label': 'Previous month', onclick: function () { S.finMonth = new Date(fm.getFullYear(), fm.getMonth() - 1, 1); page(); } }),
      h('h3', { class: 'ad-h3', text: fm.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) + ' · ' + money0(sum(monthPays)) }),
      h('button', { class: 'bt-btn ghost sm', type: 'button', text: '›', 'aria-label': 'Next month', onclick: function () { S.finMonth = new Date(fm.getFullYear(), fm.getMonth() + 1, 1); page(); } })]), grid]));
    // upcoming list
    var upcoming = all.filter(function (p) { return !p.paid && p.key >= today; }).slice(0, 15);
    sec.appendChild(h('div', { class: 'ad-card' }, [h('h3', { class: 'ad-h3', text: 'Coming up' })].concat(upcoming.length ? upcoming.map(payRow) : [h('p', { class: 'ad-muted', text: 'Nothing scheduled. Payment plans show up here once a client has an agreement.' })])));
    // other income
    var amt = h('input', { class: 'bt-in sm', type: 'number', min: '0', placeholder: 'Amount (AUD)' }), dt = h('input', { class: 'bt-in sm', type: 'date', value: today }), note = h('input', { class: 'bt-in sm', placeholder: 'What for? e.g. course sale' });
    sec.appendChild(h('div', { class: 'ad-card' }, [h('h3', { class: 'ad-h3', text: 'Add other income' }), h('p', { class: 'ad-muted', text: 'Course sales, workshops, anything outside a payment plan.' }),
      h('div', { class: 'ad-ct-inline' }, [amt, dt, note, h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Add', onclick: function () { var me = S.clients.filter(function (c) { return c.id === S.me; })[0]; if (!me || !Number(amt.value)) return; saveCoach(me, { income: (coach(me).income || []).concat([{ amount: Number(amt.value), date: dt.value, note: note.value.trim() }]) }); } })])]));
    sec.appendChild(h('p', { class: 'ad-muted small', text: 'Schedules come from each client’s agreement (plan + start date). Stripe and Shopify payments tick themselves off when the email matches; bank transfers you tick off yourself. Payments that aren’t part of a plan (like course sales) count as other income.' }));
    return sec;
  }
  function tile(label, big, sub, col) { return h('div', { class: 'ad-fin-tile', style: '--tc:' + col }, [h('span', { class: 'ad-fk', text: label }), h('b', { text: big }), h('span', { class: 'ad-muted', text: sub })]); }
  function payRow(p) {
    var today = ymd(new Date());
    return h('div', { class: 'ad-fin-row' + (p.key < today && !p.paid ? ' late' : '') + (p.flag && p.flag.status === 'failed' ? ' failed' : '') }, [p.c ? photoBox(p.c, 'xs') : h('span', { class: 'ad-photo xs', text: '＋' }),
      h('div', { class: 'ad-fin-rt' }, [h('b', { text: p.c ? (p.c.full_name || p.c.email).replace(/^Example:\s*/i, '') : p.other }), h('span', { class: 'ad-muted', text: p.date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) + (p.c ? ' · payment ' + p.n + ' of ' + p.of : '') + (p.pending ? ' · agreement not signed yet' : '') })]),
      h('b', { class: 'ad-fin-amt', text: money0(p.amount) }),
      p.c ? h('span', { class: 'ad-pay-st ' + payStatus(p).cls, text: payStatus(p).text }) : p.real ? h('span', { class: 'ad-pay-st paid', text: '✓ ' + p.src }) : null,
      p.c && !p.auto ? h('button', { class: 'bt-btn ' + (p.paid ? 'ghost' : 'lime') + ' sm', type: 'button', text: p.paid ? 'Undo' : 'Mark received', onclick: function () { var pays = Object.assign({}, coach(p.c).payments || {}); if (pays[p.key]) delete pays[p.key]; else pays[p.key] = Date.now(); saveCoach(p.c, { payments: pays }); } }) : null]);
  }

  /* ---------- state ---------- */
  var S = { tab: 'clients', clients: [], filter: 'all', q: '', open: null, data: {}, me: null };

  function load() {
    return Promise.all([
      sb.from('profiles').select('*').order('last_seen_at', { ascending: false, nullsFirst: false }),
      sb.from('client_data').select('user_id,key,updated_at'),
      sb.from('invites').select('*').order('created_at', { ascending: false }),
      sb.from('app_settings').select('*'),
      sb.from('client_data').select('user_id,value').eq('key', 'bt-profile'),
      sb.from('coach_clients').select('*').then(function (x) { return x; }, function () { return { data: [] }; }),
      sb.from('client_data').select('user_id,value').eq('key', 'program-decoder-v1'),
      sb.from('contracts').select('user_id,status,terms,signed').then(function (x) { return x; }, function () { return { data: [] }; })
    ]).then(function (r) {
      S.coach = {}; ((r[5] && r[5].data) || []).forEach(function (row) { S.coach[row.client_id] = row.data || {}; });
      S.decoder = {}; ((r[6] && r[6].data) || []).forEach(function (row) { S.decoder[row.user_id] = parse(row.value) || {}; });
      S.contracts = {}; ((r[7] && r[7].data) || []).forEach(function (row) { S.contracts[row.user_id] = row; });
      if (!S.cal) setTimeout(loadCalendar, 50);
      if (!S.pay) setTimeout(loadPayments, 80);
      S.avatars = {}; (r[4].data || []).forEach(function (row) { S.avatars[row.user_id] = parse(row.value) || {}; });
      S.clients = (r[0].data || []).sort(function (a, b) { return (a.is_admin ? 1 : 0) - (b.is_admin ? 1 : 0); });
      S.activity = {}; (r[1].data || []).forEach(function (row) { (S.activity[row.user_id] = S.activity[row.user_id] || []).push(row); });
      S.invites = r[2].data || [];
      S.settings = {}; (r[3].data || []).forEach(function (row) { S.settings[row.key] = row.value; });
    });
  }

  function page() {
    root.innerHTML = '';
    var real = S.clients.filter(function (c) { return !c.is_admin; });
    var tabs = [['clients', 'Clients'], ['finance', 'Finance'], ['course', 'Course'], ['reminders', 'Open loops'], ['invite', 'Add a client'], ['settings', 'App settings']];
    root.appendChild(h('div', { class: 'ad-wrap' }, [
      h('header', { class: 'ad-hero' }, [
        h('div', { class: 'ad-hero-t' }, [
          h('div', null, [h('p', { class: 'ad-kick', text: 'Back of house' }), h('h1', { class: 'ad-h1', text: 'Hey Sav' })]),
          h('div', { class: 'ad-topbtns' }, [h('a', { class: 'bt-btn lime', href: '/', text: 'Open the app' }), h('button', { class: 'bt-btn ghost on-dark', text: 'Log out', onclick: function () { sb.auth.signOut().then(function () { location.reload(); }); } })])
        ]),
        h('div', { class: 'ad-stats' }, [
          stat(real.length, 'clients', '#F1F9A6'),
          stat(real.filter(function (c) { return c.tier === 'private'; }).length, '1:1 clients', '#F4C2F7'),
          stat(real.filter(function (c) { return daysSince(c.last_seen_at) < 7; }).length, 'in the app this week', '#F28C3B'),
          stat(real.filter(function (c) { return daysSince(c.created_at) < 30; }).length, 'new this month', '#FBE6FC')
        ]),
        h('svg', { class: 'ad-squiggle', viewBox: '0 0 400 40', 'aria-hidden': 'true' })
      ]),
      h('nav', { class: 'ad-tabs' }, tabs.map(function (t) { return h('button', { class: 'ad-tab' + (S.tab === t[0] ? ' on' : ''), text: t[1], onclick: function () { if (S.dirty && t[0] !== 'course' && S.tab === 'course') { S.tab = t[0]; S.open = null; page(); return; } S.tab = t[0]; S.open = null; page(); } }); })),
      S.tab === 'clients' ? (S.open ? clientView(S.open) : clientList()) : S.tab === 'finance' ? financeView() : S.tab === 'course' ? courseView() : S.tab === 'reminders' ? remindersView() : S.tab === 'invite' ? inviteView() : settingsView()
    ]));
    var sq = root.querySelector('.ad-squiggle'); if (sq) sq.innerHTML = '<path d="M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20" fill="none" stroke="#F1F9A6" stroke-width="3" stroke-linecap="round"/>';
  }
  function stat(n, label, color) {
    return h('div', { class: 'ad-stat' }, [h('span', { class: 'ad-stat-n', style: 'color:' + color, text: String(n) }), h('span', { class: 'ad-stat-l', text: label })]);
  }

  function clientList() {
    var q = S.q.toLowerCase();
    var list = S.clients.filter(function (c) {
      var f = S.filter === 'all' || (S.filter === 'me' ? c.is_admin : !c.is_admin && c.tier === S.filter);
      return f && (!q || (c.email + ' ' + (c.full_name || '')).toLowerCase().indexOf(q) >= 0);
    });
    var search = h('input', { class: 'bt-in ad-search', type: 'search', placeholder: 'Search name or email', value: S.q, 'aria-label': 'Search clients', oninput: function (e) { S.q = e.target.value; var pos = e.target.selectionStart; page(); var n = root.querySelector('input[type=search]'); n.focus(); n.setSelectionRange(pos, pos); } });
    var count = function (f) { return S.clients.filter(function (c) { return f === 'all' || (f === 'me' ? c.is_admin : !c.is_admin && c.tier === f); }).length; };
    var filters = h('div', { class: 'ad-chips' }, [['all', 'Everyone'], ['private', '1:1 clients'], ['self_paced', 'Self-paced'], ['me', 'My test logins']].map(function (f) {
      return h('button', { class: 'ad-fchip' + (S.filter === f[0] ? ' on' : ''), text: f[1] + ' · ' + count(f[0]), onclick: function () { S.filter = f[0]; page(); } });
    }));
    var cards = list.map(function (c) {
      var act = S.activity[c.id] || [], avail = toolsFor(c);
      var used = avail.filter(function (t) { return act.some(function (a) { return a.key === t.key; }); });
      var last = act.reduce(function (m, a) { return a.updated_at > m ? a.updated_at : m; }, '');
      var fresh = daysSince(c.last_seen_at) < 7;
      var tz = tzOf(c), al = bookingAlert(c), nw = winsAll().filter(function (w) { return w.c === c && !celebrated(c, w.id) && Date.now() - w.at < 21 * 86400000; }).length;
      return h('button', { class: 'ad-client has-photo', onclick: function () { openClient(c); } }, [photoBox(c, 'card'), h('div', { class: 'ad-client-b' }, [
        h('div', { class: 'ad-cn' }, [
          h('div', { class: 'ad-cn-t' }, [
            h('span', { class: 'ad-name', text: c.full_name || c.email }),
            h('span', { class: 'ad-muted', text: c.full_name ? c.email : '' })
          ]),
          h('span', { class: 'ad-badge ' + (c.is_admin ? 'me' : c.tier), text: c.is_admin ? 'You' : c.tier === 'private' ? '1:1' : 'Self-paced' })
        ]),
        h('div', { class: 'ad-prog' }, [h('div', { class: 'ad-bar' }, [h('div', { class: 'ad-barfill', style: 'width:' + Math.round(100 * used.length / avail.length) + '%' })]), h('span', { class: 'ad-prog-l', text: used.length + '/' + avail.length + ' tools' })]),
        h('div', { class: 'ad-dots', 'aria-hidden': 'true' }, avail.map(function (t) { return h('span', { class: 'ad-tdot' + (used.indexOf(t) >= 0 ? ' on' : ''), style: used.indexOf(t) >= 0 ? 'background:' + t.color : '', title: t.name }); })),
        tz ? h('span', { class: 'ad-loc' }, [h('span', { text: '📍 ' + placeOf(c) + ' · ' }), liveClock(tz)]) : h('span', { class: 'ad-loc muted', text: '📍 Timezone not set yet' }),
        h('span', { class: 'ad-meta' }, [h('span', { class: 'ad-live' + (fresh ? ' on' : '') }), 'Last in ' + when(c.last_seen_at) + (last ? ' · last saved ' + when(last) : '')]),
        al || nw ? h('div', { class: 'ad-flags' }, [al ? h('span', { class: 'ad-flag warn', text: '⚠ Next 1:1 not booked' }) : null, nw ? h('span', { class: 'ad-flag win', text: '🎉 ' + nw + ' new win' + (nw === 1 ? '' : 's') }) : null]) : null
      ])]);
    });
    return h('section', { class: 'ad-sec' }, [coachHome(), search, filters,
      cards.length ? h('div', { class: 'ad-grid' }, cards) : h('p', { class: 'ad-card', text: S.clients.length ? 'No one matches that.' : 'No clients yet. Once someone logs in to the app they’ll show up here.' })]);
  }

  function openClient(c) {
    S.open = c; page(); window.scrollTo(0, 0);
    Promise.all([
      sb.from('client_data').select('*').eq('user_id', c.id),
      sb.from('coach_notes').select('*').eq('client_id', c.id).order('created_at', { ascending: false }),
      sb.from('contracts').select('*').eq('user_id', c.id).maybeSingle().then(function (x) { return x; }, function () { return { data: null, error: true }; })
    ]).then(function (r) { S.data[c.id] = { rows: r[0].data || [], notes: r[1].data || [], contract: (r[2] && !r[2].error && r[2].data) || null, contractOff: !!(r[2] && r[2].error) }; if (S.open === c) page(); });
  }

  function clientView(c) {
    var d = S.data[c.id];
    var back = h('button', { class: 'bt-btn ghost', text: '← All clients', onclick: function () { S.open = null; page(); } });
    var phFile = h('input', { type: 'file', accept: 'image/*', class: 'bt-file', id: 'ad-ph-' + c.id, onchange: function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; squarePhoto(f).then(function (u) { saveCoach(c, { photo: u }); }); } });
    var viewHref = (window.BT_DEMO ? 'app.html?door=' + (c.tier === 'private' ? 'private' : 'course') + '&viewas=' : '/?viewas=') + encodeURIComponent(c.id);
    var head = h('div', { class: 'ad-chead' }, [
      h('div', { class: 'ad-ph-wrap' }, [photoBox(c, 'big'), h('label', { class: 'ad-ph-btn', for: 'ad-ph-' + c.id, title: 'Only you see this photo' }, [coach(c).photo ? 'Change photo' : 'Add a photo', phFile])]),
      h('div', { class: 'ad-chead-t' }, [h('h2', { class: 'ad-h2', text: c.full_name || c.email }),
        h('p', { class: 'ad-muted', text: c.email + ' · joined ' + when(c.created_at) + ' · last in ' + when(c.last_seen_at) }),
        tzOf(c) ? h('p', { class: 'ad-loc big' }, [h('span', { text: '📍 ' + placeOf(c) + ' · ' }), liveClock(tzOf(c)), h('span', { class: 'ad-muted', text: ' · ' + diffLabel(tzOf(c)) })]) : null,
        h('div', { class: 'ad-ct-acts' }, [h('span', { class: 'ad-badge ' + (c.is_admin ? 'me' : c.tier), text: c.is_admin ? 'You (test login)' : c.tier === 'private' ? '1:1 client' : 'Self-paced' }),
          h('a', { class: 'bt-btn lime sm', href: viewHref, target: window.BT_DEMO ? null : '_blank', rel: 'noopener', text: '👀 View her app (read-only)' })])])
    ]);
    if (!d) return h('section', { class: 'ad-sec' }, [back, head, h('p', { class: 'ad-card ad-loading', text: 'Loading their answers…' })]);

    var all = {}, rowBy = {};
    d.rows.forEach(function (r) { all[r.key] = parse(r.value); rowBy[r.key] = r; });
    var avail = toolsFor(c);
    var extra = d.rows.filter(function (r) { return !TOOL_BY_KEY[r.key] && !HIDDEN_KEYS[r.key]; }).map(function (r) { return { key: r.key, name: human(r.key), note: 'Other saved answers', color: '#F6EFEC' }; });

    var journey = h('div', { class: 'ad-journey' }, avail.map(function (t, i) {
      var r = rowBy[t.key], n = r && t.key !== 'cmn-rep-results' && t.key !== 'bt-course' ? countAnswers(all[t.key]) : 0;
      return h('a', { class: 'ad-jt' + (r ? ' on' : ''), href: '#tool-' + t.key, style: (r ? 'background:' + t.color + ';' : '') + 'animation-delay:' + (i * 50) + 'ms', onclick: function (e) {
        e.preventDefault(); var el = document.getElementById('tool-' + t.key); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      } }, [h('span', { class: 'ad-jn', text: t.name }), h('span', { class: 'ad-js', text: r ? (n ? n + ' answer' + (n === 1 ? '' : 's') + ' · ' : '') + when(r.updated_at) : 'Not opened yet' })]);
    }));

    var started = avail.concat(extra).filter(function (t) { return rowBy[t.key]; })
      .sort(function (a, b) { return (rowBy[b.key].updated_at || '').localeCompare(rowBy[a.key].updated_at || ''); });
    var sections = started.length ? started.map(function (t, i) {
      var v = all[t.key], body;
      if (t.key === 'cmn-rep-results') body = repView(v);
      else if (t.key === 'cmn-1to1-dashboard') body = oneOnOneView(v, all);
      else if (t.key === 'bt-course') body = courseProgressView(v, c);
      else if (t.key === 'cmn-companion') body = companionView(v);
      else body = value(v);
      var n = t.key === 'cmn-rep-results' || t.key === 'bt-course' ? 0 : countAnswers(v);
      var recent = daysSince(rowBy[t.key].updated_at) < 2 && i === 0;
      return h('details', { class: 'ad-tool', id: 'tool-' + t.key, open: recent ? 'open' : null, style: '--tc:' + t.color }, [
        h('summary', null, [h('span', { class: 'ad-tswatch' }), h('span', { class: 'ad-tt' }, [h('span', { class: 'ad-tn', text: t.name }), h('span', { class: 'ad-muted', text: t.note })]),
          h('span', { class: 'ad-tmeta', text: (n ? n + (n === 1 ? ' answer · ' : ' answers · ') : '') + when(rowBy[t.key].updated_at) })]),
        h('div', { class: 'ad-tbody' }, [body || h('p', { class: 'ad-muted', text: 'Opened, but nothing filled in yet.' })])
      ]);
    }) : [h('p', { class: 'ad-card', text: 'Nothing saved yet. Their answers appear here as soon as they start a tool.' })];

    return h('section', { class: 'ad-sec' }, [back, h('div', { class: 'ad-cols' }, [
      h('div', { class: 'ad-main' }, [
        h('div', { class: 'ad-card' }, [head]),
        sessionsCard(c),
        h('h3', { class: 'ad-h3', text: 'Their journey' }),
        h('div', { class: 'ad-card' }, [journeyList(c, all)]),
        c.tier === 'private' || c.is_admin ? profilesCard(c, all) : null,
        contractCard(c, d),
        paymentsCard(c),
        h('h3', { class: 'ad-h3', text: 'Their answers' }),
        h('div', { class: 'ad-tools' }, sections)
      ]),
      h('aside', { class: 'ad-side' }, [timeCard(c), notesCard(c, d), detailsCard(c)])
    ])]);
  }

  function detailsCard(c) {
    var name = h('input', { class: 'bt-in', value: c.full_name || '', 'aria-label': 'Name' });
    var tier = h('select', { class: 'bt-in', 'aria-label': 'Access' }, [
      h('option', { value: 'self_paced', text: 'Self-paced (Companion only)', selected: c.tier === 'self_paced' ? 'selected' : null }),
      h('option', { value: 'private', text: '1:1 client (+ 1:1 extras)', selected: c.tier === 'private' ? 'selected' : null })
    ]);
    var start = h('input', { class: 'bt-in', type: 'date', value: c.program_start || '', 'aria-label': 'Program start date' });
    var save = h('button', { class: 'bt-btn', text: 'Save details', onclick: function () {
      save.textContent = 'Saving…';
      sb.from('profiles').update({ full_name: name.value.trim(), tier: tier.value, program_start: start.value || null }).eq('id', c.id).then(function (r) {
        if (r.error) { save.textContent = 'Couldn’t save'; return; }
        c.full_name = name.value.trim(); c.tier = tier.value; c.program_start = start.value || null; save.textContent = 'Saved ✓';
      });
    } });
    var wk = c.program_start ? Math.floor((Date.now() - new Date(c.program_start)) / (7 * 86400000)) + 1 : null;
    var unl = (S.settings.unlocks || {})[c.id], maxW = courseData().weeks.reduce(function (m, w) { return Math.max(m, w.week); }, 1);
    var drip = h('select', { class: 'bt-in', 'aria-label': 'Course weeks open' }, [h('option', { value: '', text: 'Normal (unlocks as she finishes each lesson)', selected: unl == null ? 'selected' : null })]
      .concat(Array.from({ length: Math.max(0, maxW - 1) }, function (_, i) { var n = i + 2; return h('option', { value: String(n), text: 'Open up to Week ' + n + ' now', selected: unl === n ? 'selected' : null }); }))
      .concat([h('option', { value: 'all', text: 'Open every week now', selected: unl === 'all' ? 'selected' : null })]));
    var dripMsg = h('span', { class: 'ad-muted', role: 'status' });
    drip.addEventListener('change', function () {
      var u = Object.assign({}, S.settings.unlocks || {}), v = drip.value;
      if (!v) delete u[c.id]; else u[c.id] = v === 'all' ? 'all' : Number(v);
      sb.from('app_settings').upsert({ key: 'unlocks', value: u, updated_at: new Date().toISOString() }).then(function (r) { dripMsg.textContent = r.error ? 'Couldn’t save' : 'Saved ✓'; if (!r.error) S.settings.unlocks = u; });
    });
    var weekCtl = drip;
    if (c.tier === 'private') {
      // 1:1: weeks stay locked until Sav opens them, one at a time
      var cur = unl === 'all' ? maxW : typeof unl === 'number' ? unl : 1, first = (c.full_name || 'them').replace(/^Example:\s*/, '').split(' ')[0];
      var setCap = function (v) {
        var u = Object.assign({}, S.settings.unlocks || {}); u[c.id] = v;
        dripMsg.textContent = 'Saving…';
        sb.from('app_settings').upsert({ key: 'unlocks', value: u, updated_at: new Date().toISOString() }).then(function (r) { if (r.error) { dripMsg.textContent = 'Couldn’t save'; return; } S.settings.unlocks = u; page(); });
      };
      weekCtl = h('div', { class: 'ad-weeklock' }, [
        h('div', { class: 'ad-wl-row', role: 'list' }, Array.from({ length: maxW }, function (_, i) { var n = i + 1, on = n <= cur; return h('span', { class: 'ad-wl-w' + (on ? ' on' : ''), role: 'listitem', title: 'Week ' + n + (on ? ' open' : ' locked'), text: (on ? '' : '🔒 ') + n }); })),
        h('p', { class: 'ad-muted', text: cur >= maxW ? 'Every week is open for ' + first + '.' : 'Open for ' + first + ': up to Week ' + cur + '. Week ' + (cur + 1) + ' stays locked until you open it.' }),
        h('div', { class: 'ad-wl-acts' }, [
          cur < maxW ? h('button', { class: 'bt-btn lime', type: 'button', text: 'Unlock Week ' + (cur + 1) + ' for ' + first + ' →', onclick: function () { setCap(cur + 1); } }) : null,
          cur > 1 ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Lock Week ' + cur + ' again', onclick: function () { setCap(cur - 1); } }) : null
        ])
      ]);
    }
    return h('div', { class: 'ad-card' }, [
      h('h3', { class: 'ad-h3', text: 'Their details' }),
      wk && wk > 0 ? h('p', { class: 'ad-week' }, [h('b', { text: 'Week ' + wk }), ' since they started']) : null,
      h('label', { class: 'ad-field' }, ['Name', name]), h('label', { class: 'ad-field' }, ['Access', tier]), h('label', { class: 'ad-field' }, ['Program start (week 1 opens this day)', start]), save,
      c.tier === 'private' ? h('div', { class: 'ad-field' }, [h('span', { text: '1:1 weeks open (you unlock each week)' }), weekCtl]) : h('label', { class: 'ad-field' }, ['Course weeks open', drip]), dripMsg
    ]);
  }

  /* ---------- package + coaching agreement ---------- */
  function contractCard(c, d) {
    var C = window.BT_CONTRACT; if (!C) return null;
    var ct = d.contract, first = (c.full_name || 'them').replace(/^Example:\s*/, '').split(' ')[0];
    var card = h('div', { class: 'ad-card ad-ct' });
    var title = h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: 'Package & agreement' }),
      h('span', { class: 'ad-ct-st ' + (ct ? ct.status : 'none'), text: !ct ? 'No agreement yet' : ct.status === 'signed' ? '✓ Signed ' + new Date(ct.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ct.status === 'sent' ? 'Waiting for ' + first + ' to sign' : 'Draft' })]);
    card.appendChild(title);
    if (d.contractOff) { card.appendChild(h('p', { class: 'ad-muted', text: 'Agreements need one quick database update before they work. Ask Claude for the “contracts” SQL to run in Supabase.' })); return card; }
    function save(terms, status, extra) {
      var row = Object.assign({ user_id: c.id, terms: terms, status: status, updated_at: new Date().toISOString() }, extra || {});
      return sb.from('contracts').upsert(row).then(function (r) { if (r.error) { alert0('Couldn’t save: ' + r.error.message); return; } d.contract = Object.assign({}, d.contract || {}, row); page(); });
    }
    var msgEl = h('p', { class: 'ad-muted', role: 'status' }); function alert0(t) { msgEl.textContent = t; }
    if (ct && ct.status === 'signed' && ct.signed) {
      var sv = ct.signed.terms || {}, pl = C.planLines(sv);
      card.appendChild(h('div', { class: 'ad-facts' }, [
        fact('Package', (sv.package || '1:1') + ' · ' + (sv.programs || []).join(' + ')), fact('Length', (sv.weeks || 8) + ' weeks from ' + C.fmtDate(sv.start)),
        fact('Investment', C.money(sv.amount)), fact('Payment plan', pl.line),
        fact('Marketing consent', ({ none: 'No consent', anon: 'Yes, identity confidential', public: 'Yes, publicly identified' })[(ct.signed.client || {}).consent] || 'No consent (left blank)'),
        fact('Signed as', (ct.signed.client || {}).signedName || '')
      ]));
      var holder = h('div');
      card.appendChild(h('div', { class: 'ad-ct-acts' }, [
        h('button', { class: 'bt-btn lime', type: 'button', text: 'View signed copy', onclick: function (e) { if (holder.firstChild) { holder.innerHTML = ''; e.target.textContent = 'View signed copy'; return; } holder.appendChild(C.render(ct.signed.terms, ct.signed.client, { signed: { client: ct.signed.client, signed_at: ct.signed_at } }).node); e.target.textContent = 'Hide signed copy'; } }),
        h('button', { class: 'bt-btn ghost', type: 'button', text: 'Start a new agreement', onclick: function (e) {
          if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Tap again: the signed copy is kept in their history'; return; }
          var t = Object.assign({}, ct.signed.terms); t.archive = (ct.terms.archive || []).concat([{ signed: ct.signed, signed_at: ct.signed_at }]);
          save(t, 'draft', { signed: null, signed_at: null });
        } })
      ]), holder);
      if ((ct.terms.archive || []).length) card.appendChild(h('p', { class: 'ad-muted', text: ct.terms.archive.length + ' earlier signed agreement' + (ct.terms.archive.length === 1 ? '' : 's') + ' kept in their history.' }));
      return card;
    }
    // edit form
    var t = Object.assign(C.defaults(c.program_start || undefined), ct ? ct.terms : {});
    t.inclusions = Object.assign({}, C.defaults().inclusions, t.inclusions || {}); t.bespoke = Object.assign({ per: '', freq: '', count: '', notes: '' }, t.bespoke || {});
    var pkg = h('select', { class: 'bt-in', 'aria-label': 'Package' }, ['1:1', 'Self-paced'].map(function (x) { return h('option', { value: x, text: x, selected: t.package === x ? 'selected' : null }); }));
    var progs = h('div', { class: 'ad-ct-chk' }, C.PROGRAMS.concat((t.programs || []).filter(function (x) { return C.PROGRAMS.indexOf(x) < 0; })).map(function (pn) { var cb = h('input', { type: 'checkbox', value: pn }); cb.checked = (t.programs || []).indexOf(pn) >= 0; return h('label', { class: 'cb-check' }, [cb, pn]); }));
    var incl = h('div', { class: 'ad-ct-chk col' }, C.INCL.map(function (x) { var cb = h('input', { type: 'checkbox', value: x[0] }); cb.checked = !!t.inclusions[x[0]]; return h('label', { class: 'cb-check' }, [cb, h('span', null, [x[1], x[0] === 'library' ? h('span', { class: 'ad-ct-note', text: ' Opens the resource library in their app. The library isn’t built yet: Claude will remind you.' }) : null])]); }));
    var PER = ['Week', 'Fortnight', 'Month'];
    function perSel(v) { return h('select', { class: 'bt-in sm' }, PER.map(function (x) { return h('option', { value: x, text: 'per ' + x.toLowerCase(), selected: v === x ? 'selected' : null }); })); }
    var gN = h('input', { class: 'bt-in sm', type: 'number', min: '0', value: t.group.n }), gP = perSel(t.group.per), oN = h('input', { class: 'bt-in sm', type: 'number', min: '0', value: t.one.n }), oP = perSel(t.one.per);
    var weeks = h('input', { class: 'bt-in', type: 'number', min: '1', value: t.weeks }), start = h('input', { class: 'bt-in', type: 'date', value: t.start || '' });
    var amount = h('input', { class: 'bt-in', type: 'number', min: '0', step: '1', value: t.amount });
    var bPer = h('input', { class: 'bt-in sm', type: 'number', min: '0', placeholder: 'Amount', value: t.bespoke.per }), bFreq = h('select', { class: 'bt-in sm' }, ['week', 'fortnight', 'month', 'payment'].map(function (x) { return h('option', { value: x, text: 'per ' + x, selected: t.bespoke.freq === x ? 'selected' : null }); })), bCount = h('input', { class: 'bt-in sm', type: 'number', min: '1', placeholder: 'How many', value: t.bespoke.count }), bNotes = h('input', { class: 'bt-in', placeholder: 'Notes (e.g. first payment due on…)', value: t.bespoke.notes });
    var bespokeBox = h('div', { class: 'ad-ct-bes', hidden: t.plan !== 'bespoke' }, [h('div', { class: 'ad-ct-inline' }, [bPer, bFreq, bCount]), bNotes]);
    var planBox = h('div', { class: 'ad-ct-plans', role: 'radiogroup', 'aria-label': 'Payment plan' }, ['full', 'in4', 'weekly', 'bespoke'].map(function (k) {
      var P = C.PLANS[k];
      return h('button', { class: 'ad-ct-plan' + (t.plan === k ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': t.plan === k ? 'true' : 'false', onclick: function () { t.plan = k; if (P.total) amount.value = P.total; bespokeBox.hidden = k !== 'bespoke'; Array.prototype.forEach.call(planBox.children, function (b) { b.classList.toggle('on', b === this); b.setAttribute('aria-checked', b === this ? 'true' : 'false'); }, this); } }, [h('b', { text: P.label }), h('span', { text: k === 'bespoke' ? 'Set your own' : P.line.replace(/^[^:]+: /, '') }), P.total ? h('span', { class: 'ad-muted', text: 'Total ' + C.money(P.total) }) : null]);
    }));
    function bespokeTotal() { var v = Number(bPer.value) * Number(bCount.value); if (v) amount.value = v; }
    bPer.addEventListener('input', bespokeTotal); bCount.addEventListener('input', bespokeTotal);
    function read() {
      return Object.assign({}, ct ? ct.terms : {}, { package: pkg.value, programs: Array.prototype.filter.call(progs.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; }),
        inclusions: Array.prototype.reduce.call(incl.querySelectorAll('input'), function (o, x) { o[x.value] = x.checked; return o; }, {}),
        group: { n: Number(gN.value) || 0, per: gP.value }, one: { n: Number(oN.value) || 0, per: oP.value }, weeks: Number(weeks.value) || 8, start: start.value,
        plan: t.plan, amount: Number(amount.value) || 0, bespoke: { per: bPer.value, freq: bFreq.value, count: bCount.value, notes: bNotes.value.trim() }, coach: 'Savannah Barber' });
    }
    var prev = h('div');
    card.appendChild(h('div', { class: 'ad-ct-form' }, [
      h('label', { class: 'ad-field' }, ['Package', pkg]),
      h('div', { class: 'ad-field' }, [h('span', { text: 'Program' }), progs]),
      h('div', { class: 'ad-field wide' }, [h('span', { text: 'Inclusions' }), incl]),
      h('div', { class: 'ad-field' }, [h('span', { text: 'Group 1 hour sessions' }), h('div', { class: 'ad-ct-inline' }, [gN, gP])]),
      h('div', { class: 'ad-field' }, [h('span', { text: 'Individual 1 hour sessions' }), h('div', { class: 'ad-ct-inline' }, [oN, oP])]),
      h('label', { class: 'ad-field' }, ['How long (weeks)', weeks]),
      h('label', { class: 'ad-field' }, [h('span', null, ['Start date ', h('span', { class: 'ad-muted', text: '(no fixed end date, in case they extend)' })]), start]),
      h('div', { class: 'ad-field wide' }, [h('span', { text: 'Payment plan' }), planBox, bespokeBox]),
      h('label', { class: 'ad-field' }, ['Investment (AUD, total)', amount])
    ]));
    var status = ct ? ct.status : 'draft';
    card.appendChild(h('div', { class: 'ad-ct-acts' }, [
      status === 'sent' ? h('button', { class: 'bt-btn lime', type: 'button', text: 'Update the agreement', onclick: function () { save(read(), 'sent'); } })
        : h('button', { class: 'bt-btn lime', type: 'button', text: 'Send to ' + first + ' to sign →', onclick: function (e) { if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Tap again: their app opens on the agreement until they sign'; return; } save(read(), 'sent'); } }),
      status === 'sent' ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Take it back to draft', onclick: function () { save(read(), 'draft'); } }) : h('button', { class: 'bt-btn ghost', type: 'button', text: 'Save draft', onclick: function () { save(read(), 'draft'); } }),
      h('button', { class: 'bt-btn ghost', type: 'button', text: 'Preview what they’ll see', onclick: function (e) { if (prev.firstChild) { prev.innerHTML = ''; return; } prev.appendChild(C.render(read(), { name: c.full_name, email: c.email }, {}).node); } })
    ]), msgEl, prev);
    if (status === 'sent') card.appendChild(h('p', { class: 'ad-muted', text: 'Their app opens on this agreement until they sign. Changes you save here show up for them straight away.' }));
    return card;
  }
  function fact(k, v) { return h('div', { class: 'ad-fact' }, [h('span', { class: 'ad-fk', text: k }), h('span', { text: v || '—' })]); }
  function notesCard(c, d) {
    var nb = h('textarea', { class: 'bt-in ad-ta', placeholder: 'Session notes, follow-ups, wins… only you can see these', 'aria-label': 'New note' });
    return h('div', { class: 'ad-card ad-notes' }, [
      h('h3', { class: 'ad-h3', text: 'Your private notes' }), nb,
      h('button', { class: 'bt-btn lime', text: 'Add note', onclick: function () {
        var v = nb.value.trim(); if (!v) return;
        sb.from('coach_notes').insert({ client_id: c.id, body: v }).select().then(function (r) { if (!r.error) { d.notes.unshift(r.data[0]); page(); } });
      } })
    ].concat(d.notes.map(function (n) {
      var del = h('button', { class: 'ad-del', text: 'Delete', onclick: function () {
        if (del.dataset.sure) sb.from('coach_notes').delete().eq('id', n.id).then(function () { d.notes = d.notes.filter(function (x) { return x !== n; }); page(); });
        else { del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; }
      } });
      return h('div', { class: 'ad-note' }, [h('span', { class: 'ad-muted', text: new Date(n.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) }), h('p', { class: 'ad-text', text: n.body }), del]);
    })));
  }

  /* ---------- course content (what Sav edits) ---------- */
  function defaultCourse() { var d = window.BT_COURSE_DEFAULT; return JSON.parse(JSON.stringify(d && d.weeks ? d : { weeks: [] })); }
  function courseData() { var c = S.settings && S.settings.course; return c && c.weeks && c.weeks.length ? c : defaultCourse(); }
  function lessonIndex() { var m = {}; courseData().weeks.forEach(function (w) { (w.lessons || []).forEach(function (l) { m[l.id] = { w: w, l: l }; }); }); return m; }
  function weekLabel(w) { return w.week === 0 ? w.title : 'Week ' + w.week + ' · ' + w.title; }
  function weeksOpenFor(c) {
    var u = (S.settings.unlocks || {})[c.id]; if (u === 'all') return 99;
    if (c.tier === 'private') return typeof u === 'number' ? u : 1;
    var st = c.program_start ? new Date(c.program_start + 'T00:00:00') : new Date();
    var w = 1 + Math.floor((Date.now() - st.getTime()) / (7 * 86400000));
    return Math.max(1, typeof u === 'number' ? Math.max(u, w) : w);
  }

  /* their course progress, week by week */
  function courseProgressView(v, c) {
    v = v || {}; var done = v.done || {}, pct = v.pct || {}, open = weeksOpenFor(c);
    var weeks = courseData().weeks.filter(function (w) { return (w.lessons || []).length; });
    var total = 0, fin = 0; weeks.forEach(function (w) { w.lessons.forEach(function (l) { total++; if (done[l.id]) fin++; }); });
    var idx = lessonIndex(), last = v.last && idx[v.last];
    return h('div', { class: 'cp' }, [
      h('div', { class: 'oo-prog' }, [h('div', { class: 'ad-bar' }, [h('div', { class: 'ad-barfill', style: 'width:' + (total ? Math.round(100 * fin / total) : 0) + '%' })]),
        h('span', { class: 'ad-muted', text: fin + ' of ' + total + ' lessons done · ' + (open >= 99 ? 'every week open' : 'weeks open: up to ' + open) + (last ? ' · last opened “' + last.l.title + '” ' + (v.lastAt ? when(new Date(v.lastAt).toISOString()) : '') : '') })]),
      h('div', { class: 'cp-weeks' }, weeks.map(function (w) {
        var locked = w.week > open;
        return h('div', { class: 'cp-w' + (locked ? ' lock' : '') }, [
          h('b', { text: weekLabel(w) + (locked ? ' (not open yet)' : '') }),
          h('div', { class: 'cp-ls' }, w.lessons.map(function (l) {
            var p = done[l.id] ? 100 : (pct[l.id] || 0);
            return h('span', { class: 'cp-l' + (done[l.id] ? ' done' : p ? ' part' : ''), title: l.title + (p ? ' · ' + p + '%' : ''), style: '--p:' + p }, [h('span', { text: l.title.replace(/^(Lesson|Activity|Bonus|Embodiment)\s*\d*:\s*/, '') })]);
          }))
        ]);
      }))
    ]);
  }

  /* intentions + journal answers with the question they answered */
  function companionView(v) {
    v = v || {};
    var out = [], ints = [['Anchor word', v.anchor], ['Who they’re becoming', v.nsToward], ['Who they’re not anymore', v.nsAway], ['Their why', v.intention]].filter(function (r) { return r[1] && String(r[1]).trim(); });
    if (ints.length) out.push(h('div', { class: 'ad-block' }, [h('p', { class: 'ad-bk', text: 'Their intentions' })].concat(ints.map(function (r) { return h('div', { class: 'ad-fact' }, [h('span', { class: 'ad-fk', text: r[0] }), h('blockquote', { class: 'ad-quote', text: r[1] })]); }))));
    var j = v.j || {}, idx = lessonIndex(), byLesson = {};
    Object.keys(j).forEach(function (k) { if (!String(j[k] || '').trim()) return; var m = /^(.*)_(\d+|n)$/.exec(k); if (!m) return; (byLesson[m[1]] = byLesson[m[1]] || []).push({ i: m[2], a: j[k] }); });
    var ids = Object.keys(byLesson);
    if (ids.length) {
      var order = []; courseData().weeks.forEach(function (w) { (w.lessons || []).forEach(function (l) { if (byLesson[l.id]) order.push(l.id); }); });
      ids.forEach(function (id) { if (order.indexOf(id) < 0) order.push(id); });
      out.push(h('div', { class: 'ad-block' }, [h('p', { class: 'ad-bk', text: 'Their journal' })].concat(order.map(function (id) {
        var f = idx[id];
        return h('div', { class: 'jr-l' }, [h('b', { class: 'jr-t', text: f ? f.l.title : id }), f ? h('span', { class: 'ad-muted', text: weekLabel(f.w) }) : null].concat(byLesson[id].sort(function (a, b) { return a.i === 'n' ? 1 : b.i === 'n' ? -1 : a.i - b.i; }).map(function (x) {
          var q = x.i === 'n' ? 'Their notes' : f && f.l.prompts && f.l.prompts[+x.i] ? f.l.prompts[+x.i][0] : 'Question ' + (+x.i + 1);
          return h('div', { class: 'jr-qa' }, [h('span', { class: 'jr-q', text: q }), h('blockquote', { class: 'ad-quote', text: x.a })]);
        })));
      }))));
    }
    var rest = {}; Object.keys(v).forEach(function (k) { if (['j', 'anchor', 'nsToward', 'nsAway', 'intention'].indexOf(k) < 0) rest[k] = v[k]; });
    var r = value(rest); if (r) out.push(h('details', { class: 'rp-more' }, [h('summary', { text: 'Set-up steps and other answers' }), r]));
    return out.length ? h('div', { class: 'ad-obj' }, out) : null;
  }

  /* ---------- Course builder ---------- */
  function vimeoId(u) { var m = /vimeo\.com\/(?:video\/|manage\/videos\/)?(\d+)/.exec(u || ''); return m ? m[1] : ''; }
  function normT(t) { return String(t || '').toLowerCase().replace(/^activity:\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function syncVimeo(C, btn, msg, dirty, rerender) {
    var call = function (want) { return sb.auth.getSession().then(function (r) { var tok = r.data && r.data.session && r.data.session.access_token; return fetch('/.netlify/functions/vimeo', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ want: want }) }); }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
    var all = []; C.weeks.forEach(function (w) { (w.lessons || []).forEach(function (l) { all.push(l); }); });
    btn.disabled = true; btn.textContent = 'Syncing…';
    var done = function (t) { btn.disabled = false; btn.textContent = '↻ Sync with Vimeo'; S.vimeoMsg = t; msg.textContent = t; };
    call([]).then(function (d) {
      if (d.setup) return done('Vimeo isn’t connected yet: add VIMEO_TOKEN in Netlify (ask Claude for the steps).');
      if (d.error) return done('Couldn’t reach Vimeo: ' + d.error);
      var byId = {}, byName = {}; (d.videos || []).forEach(function (v) { byId[v.id] = v; if (!byName[normT(v.name)]) byName[normT(v.name)] = v; });
      var linked = 0, lens = 0, want = [];
      all.forEach(function (l) {
        if (!vimeoId(l.vimeo)) { var v0 = byName[normT(l.title)]; if (v0 && l.title) { l.vimeo = v0.link; linked++; } }
        var v = byId[vimeoId(l.vimeo)]; if (!v) return;
        var m = Math.max(1, Math.round(v.duration / 60)); if (v.duration && l.mins !== m) { l.mins = m; lens++; }
        if (!(l.transcript || '').trim() || l.trSrc === 'vimeo') want.push(v.id);
      });
      return (want.length ? call(want) : Promise.resolve({ transcripts: {} })).then(function (d2) {
        var trs = 0; all.forEach(function (l) { var id = vimeoId(l.vimeo), t = (d2.transcripts || {})[id]; if (t && t !== l.transcript) { l.transcript = t; l.trSrc = 'vimeo'; trs++; } });
        var none = (d.videos || []).length === 0;
        done(none ? 'Connected, but there are no videos on your Vimeo yet.' : (linked || lens || trs) ? 'Linked ' + linked + ' video' + (linked === 1 ? '' : 's') + ', updated ' + lens + ' length' + (lens === 1 ? '' : 's') + ', added ' + trs + ' transcript' + (trs === 1 ? '' : 's') + '. Press “Save course” to keep it.' : 'Everything’s already up to date ✓' + (want.length ? ' (no captions yet on ' + want.length + ' video' + (want.length === 1 ? '' : 's') + ')' : ''));
        if (linked || lens || trs) { dirty(); rerender(); }
      });
    }).catch(function () { done('Couldn’t reach Vimeo just now. Try again in a minute.'); });
  }
  function courseView() {
    if (!S.course) S.course = JSON.parse(JSON.stringify(courseData()));
    var C = S.course, RES = window.BT_RESOURCES || [];
    var status = h('span', { class: 'cb-status', role: 'status', text: S.dirty ? 'Unsaved changes' : (S.settings.course ? 'All saved' : 'Not saved yet: this is the starting outline') });
    var dirty = function () { S.dirty = true; status.textContent = 'Unsaved changes'; status.className = 'cb-status warn'; };
    var saveBtn = h('button', { class: 'bt-btn lime', text: 'Save course', onclick: function () {
      saveBtn.textContent = 'Saving…';
      sb.from('app_settings').upsert({ key: 'course', value: C, updated_at: new Date().toISOString() }).then(function (r) {
        saveBtn.textContent = 'Save course';
        if (r.error) { status.textContent = 'Couldn’t save: ' + r.error.message; status.className = 'cb-status warn'; return; }
        S.settings.course = JSON.parse(JSON.stringify(C)); S.dirty = false; status.textContent = 'Saved ✓ Students see it next time they open the app.'; status.className = 'cb-status ok';
      });
    } });
    var rerender = function () { var y = window.scrollY; page(); window.scrollTo(0, y); };
    var input = function (obj, key, attrs, area) {
      var el = h(area ? 'textarea' : 'input', Object.assign({ class: 'bt-in' + (area ? ' ad-ta' : '') }, attrs || {}));
      el.value = obj[key] || '';
      el.addEventListener('input', function () { obj[key] = el.value; dirty(); });
      return el;
    };
    var resPicker = function (list, onChange) {
      return h('div', { class: 'cb-res' }, RES.map(function (r) {
        var on = list.indexOf(r.id) >= 0;
        return h('button', { type: 'button', class: 'ad-fchip' + (on ? ' on' : ''), text: (on ? '✓ ' : '') + r.title + ' (wk ' + r.week + ')', onclick: function (e) {
          var i = list.indexOf(r.id); if (i >= 0) list.splice(i, 1); else list.push(r.id);
          e.currentTarget.className = 'ad-fchip' + (i < 0 ? ' on' : ''); e.currentTarget.textContent = (i < 0 ? '✓ ' : '') + r.title + ' (wk ' + r.week + ')'; onChange();
        } });
      }));
    };
    var move = function (arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; dirty(); rerender(); };
    var vimeoNote = function (u) { var m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u || ''); return m ? '✓ Vimeo video ' + m[1] : (u ? 'That doesn’t look like a Vimeo link' : 'Paste the Vimeo link (unlisted links work)'); };

    var weeks = C.weeks.map(function (w, wi) {
      var lessons = (w.lessons = w.lessons || []).map(function (l, li) {
        l.prompts = l.prompts || []; l.res = l.res || [];
        var vNote = h('span', { class: 'ad-muted', text: vimeoNote(l.vimeo) });
        var vim = input(l, 'vimeo', { placeholder: 'https://vimeo.com/123456789/abcdef', type: 'url' }); vim.addEventListener('input', function () { vNote.textContent = vimeoNote(vim.value); });
        var titleEl = input(l, 'title', { placeholder: 'Lesson 1: …' });
        var sumT = h('span', { class: 'cb-lt', text: l.title || 'Untitled lesson' }); titleEl.addEventListener('input', function () { sumT.textContent = titleEl.value || 'Untitled lesson'; });
        var trWords = h('span', { class: 'ad-muted', text: (l.transcript ? l.transcript.split(/\s+/).filter(Boolean).length : 0) + ' words' });
        var tr = input(l, 'transcript', { placeholder: 'Paste the video transcript. It powers the “What’s going on for you?” search.', rows: '6' }, true);
        tr.addEventListener('input', function () { trWords.textContent = tr.value.split(/\s+/).filter(Boolean).length + ' words'; });
        var flags = [l.vimeo ? 'Vimeo' + (l.mins ? ' · ' + l.mins + ' min' : '') : l.video ? 'Stan video' : null, l.optional ? 'optional' : null, l.desc ? 'description' : null, l.prompts.length ? l.prompts.length + ' question' + (l.prompts.length === 1 ? '' : 's') : null, l.transcript ? 'transcript' : null].filter(Boolean);
        var del = h('button', { type: 'button', class: 'ad-del', text: 'Delete lesson', onclick: function () { if (del.dataset.sure) { w.lessons.splice(li, 1); dirty(); rerender(); } else { del.dataset.sure = 1; del.textContent = 'Tap again to delete'; } } });
        return h('details', { class: 'cb-l', open: S.openLesson === l.id ? 'open' : null, ontoggle: function (e) { if (e.target.open) S.openLesson = l.id; } }, [
          h('summary', null, [h('span', { class: 'cb-ln', text: String(li + 1) }), sumT, h('span', { class: 'cb-flags' }, flags.map(function (f) { return h('span', { class: 'cb-flag', text: f }); }).concat(flags.length ? [] : [h('span', { class: 'cb-flag empty', text: 'needs content' })]))]),
          h('div', { class: 'cb-lb' }, [
            h('label', { class: 'ad-field' }, ['Title', titleEl]),
            h('label', { class: 'ad-field' }, ['Vimeo link', vim, vNote, l.video && !l.vimeo ? h('span', { class: 'ad-muted', text: 'Until you add one, students see the video copied from Stan.' }) : null]),
            h('label', { class: 'ad-field' }, ['Description (shows under the video)', input(l, 'desc', { rows: '4', placeholder: 'What this lesson is about, what to do after watching…' }, true)]),
            h('div', { class: 'ad-field' }, ['Journal questions (students type their answers under the video)',
              h('div', { class: 'cb-qs' }, l.prompts.map(function (q, qi) {
                var qa = h('textarea', { class: 'bt-in ad-ta cb-q', rows: '2', placeholder: 'The question' }); qa.value = q[0] || '';
                qa.addEventListener('input', function () { q[0] = qa.value; dirty(); });
                var qn = h('input', { class: 'bt-in', placeholder: 'Your note or example (optional)' }); qn.value = q[1] || '';
                qn.addEventListener('input', function () { q[1] = qn.value; dirty(); });
                return h('div', { class: 'cb-qrow' }, [h('span', { class: 'cb-qn', text: 'Q' + (qi + 1) }), h('div', { class: 'cb-qf' }, [qa, qn]),
                  h('button', { type: 'button', class: 'ad-copy', text: 'Remove', onclick: function () { l.prompts.splice(qi, 1); dirty(); rerender(); } })]);
              }).concat([h('button', { type: 'button', class: 'ad-copy', text: '+ Add a question', onclick: function () { l.prompts.push(['', '']); S.openLesson = l.id; dirty(); rerender(); } })]))]),
            h('label', { class: 'cb-check' }, [(function () { var cbx = h('input', { type: 'checkbox' }); cbx.checked = !!l.optional; cbx.addEventListener('change', function () { l.optional = cbx.checked; dirty(); }); return cbx; })(), 'Optional (bonus): students don’t need to finish it to unlock the next lesson']),
            h('label', { class: 'cb-check' }, [(function () { var cbx = h('input', { type: 'checkbox' }); cbx.checked = !!l.notes; cbx.addEventListener('change', function () { l.notes = cbx.checked; dirty(); }); return cbx; })(), 'Add a free “My notes” box']),
            h('div', { class: 'ad-field' }, ['Resources for this lesson', resPicker(l.res, dirty)]),
            h('label', { class: 'ad-field' }, [h('span', { class: 'cb-trh' }, ['Transcript ', trWords]), tr]),
            h('div', { class: 'cb-lact' }, [
              h('button', { type: 'button', class: 'ad-copy', text: '↑ Move up', onclick: function () { move(w.lessons, li, -1); } }),
              h('button', { type: 'button', class: 'ad-copy', text: '↓ Move down', onclick: function () { move(w.lessons, li, 1); } }),
              del
            ])
          ])
        ]);
      });
      var wt = input(w, 'title', { placeholder: 'Week title' });
      var wdel = h('button', { type: 'button', class: 'ad-del', text: 'Delete week', onclick: function () { if (wdel.dataset.sure) { C.weeks.splice(wi, 1); dirty(); rerender(); } else { wdel.dataset.sure = 1; wdel.textContent = 'Tap again to delete this week and its lessons'; } } });
      return h('section', { class: 'cb-w' }, [
        h('div', { class: 'cb-wh' }, [h('span', { class: 'cb-wn', text: w.week === 0 ? 'Intro' : 'Week ' + w.week }), wt,
          h('span', { class: 'ad-muted cb-drip', text: 'Opens once they’ve finished every lesson before it' })]),
        h('div', { class: 'cb-ls' }, lessons.length ? lessons : [h('p', { class: 'ad-muted', text: 'No lessons yet. Students see “coming soon”.' })]),
        h('div', { class: 'cb-wact' }, [
          h('button', { type: 'button', class: 'bt-btn', text: '+ Add a lesson', onclick: function () { var id = 'w' + w.week + 'x' + Date.now().toString(36); w.lessons.push({ id: id, title: 'New lesson', desc: '', vimeo: '', prompts: [], res: [], notes: false, transcript: '' }); S.openLesson = id; dirty(); rerender(); } }),
          h('div', { class: 'ad-field cb-wres' }, ['This week’s resources (Resources tab order)', resPicker(w.res = w.res || [], dirty)]),
          wdel
        ])
      ]);
    });
    // Vimeo: link videos by title, pull lengths and caption transcripts (powers the search)
    var vMsg = h('p', { class: 'ad-muted', role: 'status', text: S.vimeoMsg || 'Upload a video to Vimeo with the same name as the lesson (e.g. “Lesson 1: Welcome”) and it links itself. Lengths and transcripts (from Vimeo’s auto-captions) come across too.' });
    var vBtn = h('button', { class: 'bt-btn ghost sm', type: 'button', text: '↻ Sync with Vimeo', onclick: function () { syncVimeo(C, vBtn, vMsg, dirty, rerender); } });
    var vCard = h('div', { class: 'ad-card cb-vimeo' }, [h('div', { class: 'ad-ct-top' }, [h('h3', { class: 'ad-h3', text: 'Vimeo' }), vBtn]), vMsg]);
    return h('section', { class: 'ad-sec' }, [
      h('div', { class: 'cb-bar' }, [h('div', null, [h('h2', { class: 'ad-h2', text: 'Your course' }), status]), saveBtn]),
      vCard,
      h('p', { class: 'ad-text', text: 'Students see every week and lesson, locked until they get there. A lesson unlocks as soon as they’ve finished the one before it, so they go at their own pace. Activities never hold them up: they can move on and the activity stays un-ticked, with reminders on their home page to go back and do it. Tap a lesson to add its Vimeo link, description, journal questions, resources and transcript. Nothing changes for students until you tap Save course.' })
    ].concat(weeks).concat([
      h('button', { type: 'button', class: 'bt-btn ghost cb-addw', text: '+ Add a week', onclick: function () { var n = C.weeks.reduce(function (m, w) { return Math.max(m, w.week); }, 0) + 1; C.weeks.push({ week: n, title: 'New week', res: [], lessons: [] }); dirty(); rerender(); } })
    ]));
  }

  /* ---------- Reminders (announcements on everyone's home page) ---------- */
  function remindersView() {
    var A = JSON.parse(JSON.stringify((S.settings.announcements || {}).items || []));
    var msg = h('p', { class: 'ad-muted', role: 'status' });
    var list = h('div', { class: 'rm-list' });
    var draw = function () {
      list.innerHTML = '';
      if (!A.length) list.appendChild(h('p', { class: 'ad-card', text: 'No announcements yet. Add one below and it shows at the top of everyone’s home page.' }));
      A.forEach(function (a, i) {
        var f = function (key, label, attrs, area) { var el = h(area ? 'textarea' : 'input', Object.assign({ class: 'bt-in' + (area ? ' ad-ta' : '') }, attrs || {})); el.value = a[key] || ''; el.addEventListener('input', function () { a[key] = el.value; }); return h('label', { class: 'ad-field' }, [label, el]); };
        var who = h('select', { class: 'bt-in' }, [['all', 'Everyone'], ['private', '1:1 clients'], ['self_paced', 'Self-paced']].map(function (o) { return h('option', { value: o[0], text: o[1], selected: (a.who || 'all') === o[0] ? 'selected' : null }); }));
        who.addEventListener('change', function () { a.who = who.value; });
        list.appendChild(h('div', { class: 'ad-card rm-i' }, [
          f('title', 'Heading', { placeholder: 'From Sav' }), f('text', 'Message', { rows: '3', placeholder: 'Group call this Thursday at 7pm AEST!' }, true),
          h('div', { class: 'ad-form' }, [f('link', 'Link (optional)', { placeholder: 'https://…' }), f('cta', 'Button text', { placeholder: 'Open' }), f('until', 'Show until (optional)', { type: 'date' }), h('label', { class: 'ad-field' }, ['Who sees it', who])]),
          h('button', { type: 'button', class: 'ad-del', text: 'Remove', onclick: function () { A.splice(i, 1); draw(); } })
        ]));
      });
    };
    draw();
    return h('section', { class: 'ad-sec' }, [
      h('div', { class: 'ad-card' }, [h('h2', { class: 'ad-h2', text: 'Open loops on the home page' }),
        h('p', { class: 'ad-text', text: 'The app already nudges students automatically when:' }),
        h('div', { class: 'ad-chips' }, ['a new week opens', 'they haven’t been in for 3+ days', 'journal questions are waiting from lessons they’ve watched', 'intentions aren’t set', '1:1 set-up steps are unfinished'].map(function (t) { return h('span', { class: 'ad-chip on', text: t }); })),
        h('p', { class: 'ad-text', text: 'Add your own announcements here. Students can tick them off once they’ve seen them.' })]),
      list,
      h('div', { class: 'ad-topbtns' }, [
        h('button', { type: 'button', class: 'bt-btn ghost', text: '+ Add an announcement', onclick: function () { A.push({ id: Date.now().toString(36), title: 'From Sav', text: '', link: '', cta: '', until: '', who: 'all' }); draw(); } }),
        h('button', { type: 'button', class: 'bt-btn lime', text: 'Save reminders', onclick: function () {
          var clean = A.filter(function (a) { return String(a.text || '').trim(); });
          sb.from('app_settings').upsert({ key: 'announcements', value: { items: clean }, updated_at: new Date().toISOString() }).then(function (r) { msg.textContent = r.error ? 'Couldn’t save: ' + r.error.message : 'Saved ✓'; if (!r.error) S.settings.announcements = { items: clean }; });
        } })
      ]), msg
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
        var ex = S.clients.filter(function (c) { return c.email.toLowerCase() === e; })[0];
        var p = ex ? sb.from('profiles').update({ tier: tier.value, full_name: name.value.trim() || ex.full_name }).eq('id', ex.id) : Promise.resolve();
        return p.then(function () { return load(); }).then(function () { S.tab = 'invite'; page(); });
      });
    } });
    var copy = function (txt) { return h('button', { class: 'ad-copy', text: 'Copy', onclick: function (ev) { var b = ev.target; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () {}); } }); };
    return h('section', { class: 'ad-sec' }, [
      h('div', { class: 'ad-card' }, [
        h('h2', { class: 'ad-h2', text: 'Add a client' }),
        h('p', { class: 'ad-text', text: 'Add their email, then send them their link. When they log in with that email they land in the right version automatically.' }),
        h('div', { class: 'ad-form' }, [h('label', null, ['Email', email]), h('label', null, ['Name', name]), h('label', null, ['Access', tier]), add]), msg
      ]),
      h('div', { class: 'ad-linkcards' }, [
        h('div', { class: 'ad-linkcard pink' }, [h('b', { text: '1:1 clients’ link' }), h('code', { text: location.origin + '/1to1' }), copy(location.origin + '/1to1')]),
        h('div', { class: 'ad-linkcard lime' }, [h('b', { text: 'Self-paced link' }), h('code', { text: location.origin + '/course' }), copy(location.origin + '/course')])
      ]),
      h('p', { class: 'ad-muted', text: 'Anyone who logs in without being added here gets self-paced access. You can upgrade them on their client page.' }),
      h('h3', { class: 'ad-h3', text: 'Added (' + S.invites.length + ')' }),
      h('div', { class: 'ad-grid' }, S.invites.map(function (i) {
        var joined = S.clients.some(function (c) { return c.email.toLowerCase() === i.email; });
        return h('div', { class: 'ad-client static' }, [h('div', { class: 'ad-cn' }, [h('span', { class: 'ad-av ' + i.tier, text: initials(i) }), h('div', { class: 'ad-cn-t' }, [h('span', { class: 'ad-name', text: i.full_name || i.email }), h('span', { class: 'ad-muted', text: i.full_name ? i.email : '' })]), h('span', { class: 'ad-badge ' + i.tier, text: i.tier === 'private' ? '1:1' : 'Self-paced' })]),
          h('span', { class: 'ad-meta' }, [h('span', { class: 'ad-live' + (joined ? ' on' : '') }), joined ? 'Has logged in' : 'Hasn’t logged in yet'])]);
      }))
    ]);
  }

  // phone notifications need a matching pair of keys. Made here, in your browser: copy them straight into Netlify.
  function vapidCard() {
    var out = h('div', { class: 'ad-vapid' }), b64u = function (buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
    var row = function (name, val) { var i = h('input', { class: 'bt-in sm', readonly: 'readonly', value: val, 'aria-label': name }); return h('div', { class: 'ad-field' }, [h('b', { text: name }), h('div', { class: 'ad-ct-inline' }, [i, h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Copy', onclick: function (e) { var btn = e.currentTarget, ok = false; i.focus(); i.select(); try { ok = document.execCommand('copy'); } catch (x) {} var done = function (y) { btn.textContent = y ? 'Copied ✓' : 'Select it and press ⌘C'; }; if (ok) done(true); else if (navigator.clipboard) navigator.clipboard.writeText(val).then(function () { done(true); }, function () { done(false); }); else done(false); } })])]); };
    var btn = h('button', { class: 'bt-btn sm', type: 'button', text: 'Make my notification keys', onclick: function () {
      if (!(window.crypto && crypto.subtle)) { out.textContent = 'This browser can’t make keys. Try Chrome or Safari on your laptop.'; return; }
      crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']).then(function (kp) {
        return Promise.all([crypto.subtle.exportKey('raw', kp.publicKey), crypto.subtle.exportKey('jwk', kp.privateKey)]);
      }).then(function (k) {
        out.innerHTML = '';
        out.appendChild(h('p', { class: 'ad-muted', text: 'Add both in Netlify → Site configuration → Environment variables, exactly as named. Keep the private one secret: don’t share it or paste it anywhere else. You only need to do this once (making new keys later means everyone turns notifications on again).' }));
        out.appendChild(row('VAPID_PUBLIC_KEY', b64u(k[0])));
        out.appendChild(row('VAPID_PRIVATE_KEY', k[1].d));
        btn.hidden = true;
      });
    } });
    return h('div', { class: 'ad-card' }, [h('h3', { class: 'ad-h3', text: 'Phone notifications setup' }), h('p', { class: 'ad-muted', text: 'One-time setup. Tap the button, then copy the two keys into Netlify.' }), btn, out]);
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
      vapidCard(),
      h('p', { class: 'ad-text', text: 'Paste YouTube, Vimeo, Bunny or Loom links and they play inside the app. Changes show for everyone next time they open it.' }),
      h('div', { class: 'ad-grid' }, groups),
      h('button', { class: 'bt-btn lime big', text: 'Save settings', onclick: function () {
        sb.from('app_settings').upsert({ key: 'props', value: props, updated_at: new Date().toISOString() }).then(function (r) { msg.textContent = r.error ? 'Couldn’t save: ' + r.error.message : 'Saved ✓'; if (!r.error) S.settings.props = props; });
      } }), msg
    ]);
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
        gate.hidden = true; S.me = s.user.id; return load().then(page);
      });
    });
  }
  boot();
})();
