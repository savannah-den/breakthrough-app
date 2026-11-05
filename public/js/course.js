/* The in-app Breakthrough course, profile, home reminders and the avatar in the header.
   - Course content (weeks, lessons, Vimeo links, descriptions, journal prompts, resources,
     transcripts) comes from app_settings "course", which Sav edits in the coach dashboard.
     Until she saves one, the outline from the self-paced companion is used (course-data.js).
   - Self-paced: each lesson unlocks when the one before it is finished (no drip).
   - Journal answers share storage with the Journal tab (cmn-companion → j[lessonId_questionIndex]).
   - Progress lives in localStorage "bt-course" and syncs to the account like everything else. */
(function () {
  'use strict';
  var APP = null, h = null, DAY = 86400000;
  var K = { notes: 'bt-notes', jlog: 'bt-jlog', wins: 'bt-wins', prog: 'bt-course', prof: 'bt-profile', comp: 'cmn-companion', one: 'cmn-1to1-dashboard', rep: 'cmn-rep-results', dis: 'bt-dismissed' };

  function rd(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function tx(v) { return String(v == null ? '' : v).trim(); }
  function fmt(d) { return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* Hand-drawn look for every logo/illustration (same wobble as the What If and Breaking Out logos) */
  function handDefs() {
    if (document.getElementById('bt-hand-defs') || !document.body) return;
    var d = document.createElement('div'); d.id = 'bt-hand-defs'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' +
      '<filter id="bt-hand-s" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="41"/><feDisplacementMap in="SourceGraphic" scale="1.7"/></filter>' +
      '<filter id="bt-hand" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="41"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>' +
      '<filter id="bt-hand-b" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="17"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>' +
      '<filter id="bt-hand-l" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="63"/><feDisplacementMap in="SourceGraphic" scale="3.4"/></filter>' +
      '</defs></svg>';
    document.body.appendChild(d);
  }
  function handify(svg, id) { if (!svg || svg.indexOf('bt-hand') >= 0) return svg; handDefs(); var i = svg.indexOf('>', svg.indexOf('<svg')) + 1, j = svg.lastIndexOf('</svg>'); if (i <= 0 || j < 0) return svg; return svg.slice(0, i) + '<g filter="url(#' + (id || 'bt-hand') + ')">' + svg.slice(i, j) + '</g>' + svg.slice(j); }
  window.BT_HAND = { defs: handDefs, wrap: handify };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handDefs); else handDefs();
  function playground() { return !!window.BT_DEMO || (window.BT_CONFIG || {}).supabaseUrl === 'playground'; }

  /* ---------------- course content ---------------- */
  function fromDefault() { var d = window.BT_COURSE_DEFAULT; return JSON.parse(JSON.stringify(d && d.weeks ? d : { weeks: [] })); }
  var DEF = null;
  function course() {
    var c = APP && APP.state.settings.course;
    if (c && c.weeks && c.weeks.length) { if (!c.__patched && window.BT_PATCH_COURSE) { window.BT_PATCH_COURSE(c); c.__patched = 1; } return c; }
    return DEF || (DEF = fromDefault());
  }
  function allLessons() {
    var out = [];
    course().weeks.forEach(function (w) { (w.lessons || []).forEach(function (l) { out.push({ w: w, l: l }); }); });
    return out;
  }
  function findLesson(id) { return allLessons().filter(function (x) { return x.l.id === id; })[0] || null; }
  function resource(id) { return (window.BT_RESOURCES || []).filter(function (r) { return r.id === id; })[0] || null; }

  /* ---------------- unlocking ----------------
     No drip: a lesson opens as soon as every earlier lesson is finished (bonus/optional ones don't count),
     so she goes at her own pace.
     Sav can open weeks early per student in the coach dashboard. */
  function startDate() {
    var p = APP && APP.state.profile, d = p && p.program_start ? new Date(p.program_start + 'T00:00:00') : p && p.created_at ? new Date(p.created_at) : null;
    if (d && !isNaN(d)) d.setHours(0, 0, 0, 0);
    if (!d || isNaN(d)) { d = new Date(); d.setHours(0, 0, 0, 0); }
    return d;
  }
  function opensOn(n) { return new Date(startDate().getTime() + Math.max(0, n - 1) * 7 * DAY); }
  // Sav's own admin login (not 'view as' or the new-client trial): everything open
  // playground "new client" journeys: Sav sees exactly what a client sees, locks and all
  function asClient() { var d = window.BT_DEMO; return !!(d && (d.fresh || d.skip || d.asClient)); }
  function peek() { return !!(window.BT_DEMO && window.BT_DEMO.peek) || !!(APP && APP.state && APP.state.isAdmin && !asClient()); }
  function override() { if ((window.BT_DEMO && window.BT_DEMO.unlock) || (APP && APP.state && APP.state.isAdmin && !asClient())) return 'all'; /* playground: everything unlocked */ var uid = APP && APP.state.user && APP.state.user.id; return ((APP && APP.state.settings.unlocks) || {})[uid]; }
  function bypass(week) { var ov = override(); return ov === 'all' || (typeof ov === 'number' && week <= ov); }
  function dripped(week) { return true; } // no drip: everything opens at her own pace, in order
  // 1:1 clients: Sav opens each week herself from the coach dashboard (Week 1 to start), so they can't run ahead of what she's built
  function oneCap() {
    if (!APP || APP.state.tier !== 'private') return null;
    if (peek()) return null;
    var ov = override(); return ov === 'all' ? null : typeof ov === 'number' ? ov : 1;
  }
  // Self-paced: a new week every 7 days from their start, but never past the week Sav has opened for her 1:1 clients
  // (app setting "spCap": Week 1 until she opens Week 2 for a 1:1 client). Sav can still open more for one person from the coach dashboard.
  function timeWeek() { return 1 + Math.floor((Date.now() - startDate().getTime()) / (7 * DAY)); }
  function spCapSetting() { var v = Number(APP && APP.state.settings.spCap); return v >= 1 ? v : 1; }
  function selfCap() {
    if (!APP || APP.state.tier === 'private' || peek()) return null;
    var ov = override(); if (ov === 'all') return null;
    var cap = Math.min(timeWeek(), spCapSetting());
    return typeof ov === 'number' ? Math.max(cap, ov) : cap;
  }
  function heldWhy(week) {
    if (APP && APP.state.tier === 'private') return 'Sav opens Week ' + week + ' for you when you’re ready';
    return week > spCapSetting() || week <= timeWeek() ? 'Opening soon. You’ll get a notification and an email the moment it’s ready' : 'Opens ' + fmt(opensOn(week));
  }
  function locks() {
    var p = prog(), info = { lessons: {}, weeks: {} }, blocked = null, prevW = null;
    course().weeks.forEach(function (w) {
      var ls = w.lessons || [], dr = dripped(w.week), cap = oneCap(); if (cap == null) cap = selfCap(); var held = cap != null && w.week > cap;
      var wOpen = dr && !held && ((cap == null && bypass(w.week)) || !blocked);
      var after = prevW ? (prevW.week === 0 ? 'the Introduction' : 'Week ' + prevW.week) : '';
      info.weeks[w.week] = { open: wOpen, why: held ? heldWhy(w.week) : !dr ? 'Opens ' + fmt(opensOn(w.week)) : !wOpen ? (after && blocked.w !== w ? 'Unlocks when you finish ' + after : 'Unlocks when you finish “' + blocked.l.title + '”') : '' };
      if (ls.length) prevW = w;
      ls.forEach(function (l) {
        var open = dr && !held && ((cap == null && bypass(w.week)) || !blocked || ((l.res || [])[0] === 'intent' && w.week === 0)); // Setting Intentions is never locked
        info.lessons[l.id] = { open: open, why: held ? heldWhy(w.week) : !dr ? 'Opens ' + fmt(opensOn(w.week)) : !open ? 'Finish “' + blocked.l.title + '” first' : '' };
        if (!blocked && !p.done[l.id] && !l.optional && !isActivityCard(l) && !/^embodiment/i.test(l.title || '')) blocked = { w: w, l: l }; // activities never block
      });
    });
    return info;
  }
  function lessonOpen(id) { var x = locks().lessons[id]; return !!(x && x.open); }
  function lessonWhy(id) { var x = locks().lessons[id]; return x ? x.why : ''; }
  function isOpen(week) { var x = locks().weeks[week]; return !!(x && x.open); }
  function unlockedWeek() {
    var lw = locks().weeks, max = 0;
    Object.keys(lw).forEach(function (k) { if (lw[k].open) max = Math.max(max, +k); });
    return max;
  }
  function unlockText(n) { var x = locks().weeks[n]; return !x ? '' : x.open ? 'Open now' : x.why; }

  /* ---------------- progress ---------------- */
  function prog() { var p = rd(K.prog) || {}; p.done = p.done || {}; p.pct = p.pct || {}; p.pos = p.pos || {}; return p; }
  function saveProg(fn) { var p = prog(); fn(p); wr(K.prog, p); return p; }
  function openLessons() { var L = locks().lessons; return allLessons().filter(function (x) { return L[x.l.id] && L[x.l.id].open; }); }
  // activities she's moved past (a later lesson is done) but hasn't done yet
  function skippedActs() {
    var all = allLessons(), p = prog(), lastDone = -1;
    all.forEach(function (x, i) { if (p.done[x.l.id]) lastDone = i; });
    return all.filter(function (x, i) { return i < lastDone && isActivityCard(x.l) && !p.done[x.l.id] && lessonOpen(x.l.id); });
  }
  function upNext() {
    var list = openLessons(), p = prog(), skip = {};
    skippedActs().forEach(function (x) { skip[x.l.id] = 1; });
    list = list.filter(function (x) { return !skip[x.l.id]; });
    if (!list.length) return null;
    if (p.last) {
      var i = list.map(function (x) { return x.l.id; }).indexOf(p.last);
      if (i >= 0 && !p.done[p.last]) return list[i];
    }
    return list.filter(function (x) { return !p.done[x.l.id] && !x.l.optional; })[0] || list.filter(function (x) { return !p.done[x.l.id]; })[0] || null;
  }
  function stats() {
    var all = allLessons(), p = prog();
    var done = all.filter(function (x) { return p.done[x.l.id]; }).length;
    return { total: all.length, done: done, open: openLessons().length, pct: all.length ? Math.round(100 * done / all.length) : 0 };
  }

  /* ---------------- journal (shared with the Journal tab) ---------------- */
  function comp() { return rd(K.comp) || {}; }
  function setJournal(key, val) { var d = comp(); d.j = Object.assign({}, d.j || {}); d.j[key] = val; wr(K.comp, d); }
  function journalFor(J) {
    // the Journal tab uses this shape: [{ week, title, res, soon, lessons: [{ id, t, tip, qs, res, notes }] }]
    return course().weeks.map(function (w) {
      var ls = (w.lessons || []).map(function (l) { return { id: l.id, t: l.title, tip: l.tip || '', qs: l.prompts || [], res: (l.res || [])[0], notes: !!l.notes }; });
      var o = { week: w.week, title: w.title, res: w.res || [], lessons: ls };
      if (!ls.length) o.soon = true;
      return o;
    });
  }

  function logJournal(key, val) {
    if (!tx(val)) return;
    var jl = rd(K.jlog) || {}, e = jl[key], now = Date.now();
    if (!e) jl[key] = { first: val, firstAt: now, at: now };
    else { e.at = now; if (!e.first) { e.first = val; e.firstAt = now; } }
    wr(K.jlog, jl);
  }
  var jWatch = false;
  function watchJournal() {
    if (jWatch) return; jWatch = true;
    var proto = Storage.prototype, prev = proto.setItem;
    proto.setItem = function (k, v) {
      var before = null;
      if (this === window.localStorage && k === K.comp) before = (comp().j) || {};
      prev.call(this, k, v);
      if (before) { var after = {}; try { after = (JSON.parse(v) || {}).j || {}; } catch (e) {} Object.keys(after).forEach(function (key) { if (after[key] !== before[key]) logJournal(key, after[key]); }); }
    };
  }

  /* ---------------- search: lesson transcripts + descriptions ---------------- */
  function search(q) {
    var words = tx(q).toLowerCase().split(/[^a-z0-9’']+/).filter(function (w) { return w.length > 3; });
    if (!words.length) return [];
    var hits = [];
    openLessons().forEach(function (x) {
      var hay = (x.l.title + ' ' + (x.l.desc || '') + ' ' + (x.l.transcript || '')).toLowerCase(), score = 0, first = -1;
      words.forEach(function (w) { var i = hay.indexOf(w); if (i >= 0) { score++; if (first < 0 || i < first) first = i; } });
      if (score && (score >= Math.min(2, words.length))) {
        var src = (x.l.transcript || x.l.desc || '').replace(/\s+/g, ' '), at = Math.max(0, src.toLowerCase().indexOf(words.filter(function (w) { return src.toLowerCase().indexOf(w) >= 0; })[0] || '') - 60);
        var snip = src ? (at > 0 ? '…' : '') + src.slice(at, at + 180).trim() + '…' : '';
        hits.push({ score: score, e: { id: 'tr-' + x.l.id, label: 'From the course: ' + x.l.title, line: snip || ('Week ' + x.w.week + ' · ' + x.w.title), watch: [x.l.id], res: x.l.res || [] } });
      }
    });
    return hits.sort(function (a, b) { return b.score - a.score; }).slice(0, 3).map(function (x) { return x.e; });
  }

  /* ---------------- the search bubble: "find anything" ----------------
     Floating magnifying glass. Type where you're stuck or how you're feeling and it points you to
     the right place: your next video, your notebook, a tool, a lesson, or how to get help. */
  var FIND_INTENTS = [
    { re: /(lost|up to|where am i|where was i|next (video|lesson)|what('?s| is) next|which (video|lesson)|carry on|keep going|continue)/, go: function () { var nx = upNext(); return nx ? { t: 'You’re up to: ' + nx.l.title, s: (nx.w.week === 0 ? 'Introduction' : 'Week ' + nx.w.week + ' · ' + nx.w.title) + '. Tap to go straight there.', href: lessonHref(nx.l), cta: 'Take me there →' } : { t: 'You’re all caught up', s: 'Nothing waiting right now. Have a look at your course.', href: '#Course', cta: 'Open my course →' }; } },
    { re: /(notebook|journal|entr(y|ies)|what i wrote|my answers|questions? under)/, go: function () { return { t: 'Your Becoming Notebook', s: 'Every entry from every lesson lives in My Book → Becoming Notebook. You can edit them there too.', href: '#Book', cta: 'Open my notebook →', before: function () { bookState.tab = 'journal'; bookState.day = ''; bookState.q = ''; } }; } },
    { re: /(reps|tick|daily (list|check)|today'?s)/, go: function () { return { t: 'Today’s reps', s: 'Your daily ticks live on Home, in Today’s reps.', href: '#Dashboard', cta: 'Go to Home →' }; } },
    { re: /(calendar|progress|streak|how far|achievement|milestone)/, go: function () { return { t: 'Your progress', s: 'My Book has your calendar, streaks and every milestone, dated.', href: '#Book', cta: 'Open My Book →' }; } },
    { re: /(dose|dopamine|happy hormone)/, go: function () { return { t: 'Your daily DOSE', s: 'Your DOSE plan, your menu, and “Get more dopamine”.', href: '#Dose', cta: 'Open DOSE →' }; } },
    { re: /(zoom|call|session|appointment|book (a|my) call)/, go: function () { return APP.state.tier === 'private' ? { t: 'Your calls with Sav', s: 'Your call times and Zoom link are in your profile. Zoom works best on a laptop.', href: '#Profile', cta: 'Open my calls →' } : { t: 'Want to work with Sav 1:1?', s: 'Email savannah@colourmeneurospicy.com.au and ask about the next 1:1 or live round.', href: 'mailto:savannah@colourmeneurospicy.com.au', cta: 'Email Sav →' }; } },
    { re: /(photo|name|profile|password|log ?out|sign ?out|email address|terms|privacy|agreement|contract)/, go: function () { return { t: 'Your profile', s: 'Your photo, name, reminders, terms and your agreement all live in your profile.', href: '#Profile', cta: 'Open my profile →' }; } },
    { re: /(notification|remind|alert|ping)/, go: function () { return { t: 'Reminders', s: 'Turn on a daily reminder in your profile, under Notifications. On iPhone, add the app to your Home Screen first.', href: '#Profile', cta: 'Set up reminders →' }; } },
    { re: /(tour|how (does|do) (this|the app)|show me around|how it works|confus)/, go: function () { return { t: 'Take the app tour', s: 'A walk through every page and how it all connects.', tour: true, cta: 'Start the tour →' }; } },
    { re: /(video (won'?t|not|doesn'?t)|can'?t (play|watch|hear)|no sound|buffer|black screen|loading)/, go: function () { return { t: 'Video not playing?', s: 'Check you’re online, then close the app fully and open it again. Still stuck? Try it on a laptop, or message Sav and tell her which lesson.', href: 'https://wa.me/' + String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, ''), cta: 'Message Sav →' }; } },
    { re: /(lost (my|all)|disappear|gone|not sav|didn'?t save|missing|deleted)/, go: function () { return { t: 'Something missing?', s: 'Everything saves to your account. Make sure you’re logged in with the same email, then pull down to refresh. Still missing? Message Sav.', href: 'https://wa.me/' + String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, ''), cta: 'Message Sav →' }; } },
    { re: /(home ?screen|install|app icon|add to)/, go: function () { return { t: 'Add the app to your Home Screen', s: 'iPhone, in Safari: tap the three lines left of the web address, then Share, scroll down, and tap Add to Home Screen.', href: '#Setup-1', cta: 'Show me the steps →' }; } },
    { re: /(help|stuck|talk to|contact|message sav|ask sav|question for sav)/, go: function () { return { t: 'Ask Sav', s: 'Can’t find it here? Send Sav a message.', href: 'https://wa.me/' + String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, ''), cta: 'Message Sav →' }; } }
  ];
  var CRISIS = /(suicid|kill myself|end it all|self[- ]?harm|hurt myself|don'?t want to (live|be here)|want to die)/;
  function findSheet() {
    if (!APP) return;
    var old = document.getElementById('bt-find'); if (old) { old.remove(); return; }
    var close = function () { var m = document.getElementById('bt-find'); if (m) m.remove(); document.body.classList.remove('bt-finding'); };
    var input = h('input', { class: 'bt-in bt-find-in', id: 'bt-find-q', type: 'search', placeholder: 'Try “what video am I up to?” or “I’m overwhelmed”', 'aria-label': 'What are you looking for?', autocomplete: 'off' });
    var out = h('div', { class: 'bt-find-out', 'aria-live': 'polite' });
    function link(r) {
      var a = h('a', { class: 'bt-find-r' + (r.big ? ' big' : ''), href: r.href || '#', onclick: function (e) { if (r.before) r.before(); if (r.tour) { e.preventDefault(); close(); goHref('#Dashboard'); setTimeout(appTour, 700); return; } if (/^https?:|^mailto:/.test(r.href || '')) { close(); return; } e.preventDefault(); close(); goHref(r.href); } }, [r.kind ? h('span', { class: 'bt-find-kind ' + r.kind, 'aria-label': r.kind === 'video' ? 'Video' : 'Activity' }, r.kind === 'act' && r.emb ? [emblem(r.emb)] : [h('span', { 'aria-hidden': 'true', text: r.kind === 'video' ? '▶' : '✎' }), h('small', { text: r.kind === 'video' ? 'Video' : 'Activity' })]) : null, h('span', { class: 'bt-find-rt' }, [h('b', { text: r.t }), r.s ? h('span', { text: r.s }) : null]), h('span', { class: 'bt-find-go', 'aria-hidden': 'true', text: r.cta ? '' : '→' }), r.cta ? h('span', { class: 'bt-find-cta', text: r.cta }) : null]);
      if (/^https?:/.test(r.href || '')) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    }
    function group(title, rows) { if (!rows.length) return; out.appendChild(h('span', { class: 'bt-find-h', text: title })); rows.forEach(function (r) { out.appendChild(link(r)); }); }
    function chips() {
      out.appendChild(h('span', { class: 'bt-find-h', text: 'Try one of these' }));
      out.appendChild(h('div', { class: 'bt-find-chips' }, ['What video am I up to?', 'Where are my notebook entries?', 'I’m overwhelmed', 'I can’t sleep', 'My video won’t play', 'How does this app work?'].map(function (c) { return h('button', { class: 'bt-find-chip', type: 'button', text: c, onclick: function () { input.value = c; run(); } }); })));
    }
    function run() {
      var q = tx(input.value).toLowerCase().replace(/[’‘]/g, "'"); out.innerHTML = '';
      if (!q) { chips(); return; }
      if (CRISIS.test(q)) { out.appendChild(h('div', { class: 'bt-find-care' }, [h('b', { text: 'You don’t have to hold this on your own.' }), h('span', { text: 'If you’re in danger right now, call 000. You can talk to someone any time at Lifeline on 13 11 14, or Beyond Blue on 1300 22 4636. Then let Sav know how you’re going.' }), h('a', { class: 'bt-btn lime', href: 'tel:131114', text: 'Call Lifeline 13 11 14' })])); return; }
      try { var pfm = proofForFeeling(q); if (pfm) out.appendChild(pfm); } catch (e) {}
      var quick = FIND_INTENTS.filter(function (x) { return x.re.test(q); }).slice(0, 2).map(function (x) { var r = x.go(); r.big = true; return r; });
      group('Here you go', quick);
      // feelings + problems: what helps (tools, lessons, a tip)
      var STOP = ['what', 'video', 'videos', 'your', 'with', 'have', 'this', 'that', 'keep', 'feel', 'feeling', 'want', 'need', 'about', 'where', 'when', 'how', 'the', 'and', 'can', 'cant', "can't", 'dont', "don't", 'wont', "won't", 'just', 'really', 'some', 'from', 'into', 'like', 'lesson', 'lessons', 'app', 'help', 'find', 'does', 'work', 'am', 'are', 'my', 'me', 'i\'m', 'im'];
      var words = q.split(/[^a-z0-9']+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; });
      if (quick.length) words = words.filter(function (w) { return w.length > 5; });
      var kb = (window.BT_SEARCH_DB || []).map(function (e) { var sc = 0; (e.kw || []).forEach(function (k) { if (q.indexOf(k) >= 0) sc += k.length > 5 ? 3 : 2; }); words.forEach(function (w) { if ((e.label || '').toLowerCase().indexOf(w) >= 0) sc += 1; }); return { e: e, sc: sc }; }).filter(function (x) { return x.sc > 1; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 2);
      kb.forEach(function (x) {
        var e = x.e, rows = [];
        out.appendChild(h('div', { class: 'bt-find-kb' }, [h('b', { text: e.label }), h('span', { text: e.line }), e.tip ? h('span', { class: 'bt-find-tip', text: 'Right now: ' + e.tip }) : null]));
        (e.res || []).slice(0, 3).forEach(function (rid) { var r = resource(rid); if (!r) return; var op = !r.week || isOpen(r.week); rows.push(op ? { kind: 'act', emb: r.id, t: r.title, s: r.desc, href: resHref(r) } : { kind: 'act', emb: r.id, t: '🔒 ' + r.title, s: 'Opens in Week ' + r.week, href: '#Resources' }); });
        (e.watch || []).slice(0, 2).forEach(function (lid) { var f = findLesson(lid); if (!f) return; rows.push(lessonOpen(lid) ? { kind: 'video', t: 'Rewatch: ' + f.l.title, s: 'Week ' + f.w.week + ' · ' + f.w.title, href: lessonHref(f.l) } : { kind: 'video', t: '🔒 ' + f.l.title, s: lessonWhy(lid), href: '#Course' }); });
        rows.forEach(function (r) { out.appendChild(link(r)); });
      });
      // lessons and tools by name
      var ls = allLessons().filter(function (x) { var t = (x.l.title + ' ' + (x.l.desc || '')).toLowerCase(); return words.some(function (w) { return w.length > 3 && t.indexOf(w) >= 0; }); }).slice(0, 4).map(function (x) { var kd = isActivityCard(x.l) ? 'act' : 'video', em = kd === 'act' ? (x.l.res || [])[0] : null; return lessonOpen(x.l.id) ? { kind: kd, emb: em, t: x.l.title, s: x.w.week === 0 ? 'Introduction' : 'Week ' + x.w.week + ' · ' + x.w.title, href: lessonHref(x.l) } : { kind: kd, emb: em, t: '🔒 ' + x.l.title, s: lessonWhy(x.l.id), href: '#Course' }; });
      var rs = (window.BT_RESOURCES || []).filter(function (r) { var t = (r.title + ' ' + (r.desc || '')).toLowerCase(); return words.some(function (w) { return w.length > 3 && t.indexOf(w) >= 0; }); }).filter(function (r) { return !kb.some(function (x) { return (x.e.res || []).indexOf(r.id) >= 0; }); }).slice(0, 3).map(function (r) { var op = !r.week || isOpen(r.week); return op ? { kind: 'act', emb: r.id, t: r.title, s: r.desc, href: resHref(r) } : { kind: 'act', emb: r.id, t: '🔒 ' + r.title, s: 'Opens in Week ' + r.week, href: '#Resources' }; });
      group('In the course', ls); group('Tools', rs);
      // from inside the videos (transcripts)
      var tr = search(q).filter(function (e) { return !ls.some(function (l) { return e.watch && l.href === lessonHref(findLesson(e.watch[0]).l); }); }).map(function (e) { var f = findLesson(e.watch[0]); return { kind: 'video', t: e.label, s: e.line, href: lessonHref(f.l) }; });
      group('Mentioned in a video', tr);
      if (!out.children.length) { out.appendChild(h('p', { class: 'bt-find-none', text: 'Hmm, nothing for that yet. Try different words, or ask Sav.' })); out.appendChild(link({ t: 'Ask Sav', s: 'Send her a message.', href: 'https://wa.me/' + String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, ''), cta: 'Message Sav →' })); }
    }
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 180); });
    var box = h('div', { id: 'bt-find', class: 'bt-find', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Find anything', onclick: function (e) { if (e.target === box) close(); } }, [
      h('div', { class: 'bt-find-card' }, [
        h('div', { class: 'bt-find-top' }, [h('span', { class: 'bt-find-k', text: '🔎 Find anything' }), h('button', { class: 'bt-find-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close })]),
        h('b', { class: 'bt-find-t', text: 'What are you looking for?' }),
        h('span', { class: 'bt-find-s', text: 'Lost, stuck, or something’s going on for you? Type it how you’d say it.' }),
        input, out
      ])
    ]);
    document.body.appendChild(box); document.body.classList.add('bt-finding');
    run(); setTimeout(function () { input.focus(); }, 60);
  }

  /* ---------------- avatar + characters ---------------- */
  var CHARS = [
    { id: 'spark', name: 'Spark', bg: '#F1F9A6', fg: '#D3302B', draw: '<path class="cb" d="M32 8C33.6 22 42 30.4 56 32C42 33.6 33.6 42 32 56C30.4 42 22 33.6 8 32C22 30.4 30.4 22 32 8Z" fill="#D3302B"/>' },
    { id: 'flame', name: 'Flame', bg: '#F4C2F7', draw: '<path class="cf" d="M32 9C36 19 46 23 46 37C46 46 40 53 32 53C24 53 18 46 18 37C18 29 24 26 26 18C29 23 31 24 32 9Z" fill="#D3302B"/><path class="cf" d="M32 30C35 36 39 38 39 43C39 47.5 36 50 32 50C28 50 25 47.5 25 43C25 39 29 37 32 30Z" fill="#F28C3B"/>' },
    { id: 'ember', name: 'Ember', bg: '#4E0C08', draw: '<circle class="cg" cx="32" cy="34" r="20" fill="#F28C3B"/><circle cx="32" cy="34" r="13" fill="#F9B36B"/>' },
    { id: 'candle', name: 'Candle', bg: '#FFF4EE', draw: '<rect x="21" y="26" width="22" height="30" rx="6" fill="#F4C2F7" stroke="#4E0C08" stroke-width="2"/><path class="cf" d="M32 8C35 14 38 16 38 20C38 23.5 35.5 25 32 25C28.5 25 26 23.5 26 20C26 16 29 14 32 8Z" fill="#D3302B"/>' },
    { id: 'match', name: 'Match', bg: '#F1F9A6', draw: '<rect x="29" y="28" width="6" height="30" rx="3" fill="#C98A52"/><ellipse class="cb" cx="32" cy="22" rx="12" ry="14" fill="#D3302B"/>' },
    { id: 'sparkler', name: 'Sparkler', bg: '#74140E', draw: '<path d="M32 30L32 58" stroke="#A39A97" stroke-width="3" stroke-linecap="round"/><g class="cs" stroke="#F1F9A6" stroke-width="2.4" stroke-linecap="round"><path d="M32 6V14M32 38V46M12 26H20M44 26H52M18 12L23 17M46 12L41 17M18 40L23 35M46 40L41 35"/></g><circle cx="32" cy="26" r="10" fill="#F1F9A6"/>' },
    { id: 'moonglow', name: 'Moonglow', bg: '#2A0F0C', draw: '<g class="cb"><circle cx="32" cy="32" r="21" fill="#F1F9A6"/><circle cx="42" cy="24" r="16" fill="#2A0F0C"/></g>' },
    { id: 'northstar', name: 'North Star', bg: '#F4C2F7', draw: '<path class="cg" d="M32 4L36 26L58 32L36 38L32 60L28 38L6 32L28 26Z" fill="#4E0C08"/><circle cx="32" cy="32" r="9" fill="#F1F9A6"/>' }
  ];
  var FACE = { spark: [32, 32, '#1F1412'], flame: [32, 41, '#1F1412'], ember: [32, 34, '#4E0C08'], candle: [32, 40, '#4E0C08'], match: [32, 23, '#FFF4EE'], sparkler: [32, 27, '#4E0C08'], moonglow: [24, 39, '#2A0F0C'], northstar: [32, 32, '#4E0C08'] };
  function charSvg(id) {
    var c = CHARS.filter(function (x) { return x.id === id; })[0] || CHARS[0], f = FACE[c.id];
    var face = '<g class="cface"><circle cx="' + (f[0] - 4.5) + '" cy="' + (f[1] - 2) + '" r="1.9" fill="' + f[2] + '"/><circle cx="' + (f[0] + 4.5) + '" cy="' + (f[1] - 2) + '" r="1.9" fill="' + f[2] + '"/><path d="M' + (f[0] - 4) + ' ' + (f[1] + 2.5) + 'Q' + f[0] + ' ' + (f[1] + 6) + ' ' + (f[0] + 4) + ' ' + (f[1] + 2.5) + '" fill="none" stroke="' + f[2] + '" stroke-width="1.8" stroke-linecap="round"/></g>';
    return '<svg viewBox="0 0 64 64" class="bt-char" aria-hidden="true"><rect width="64" height="64" fill="' + c.bg + '"/><g filter="url(#bt-hand-s)">' + c.draw + face + '</g></svg>';
  }
  function profileData() { return rd(K.prof) || {}; }
  function avatarNode(cls) {
    var p = profileData(), el = h('span', { class: 'bt-av ' + (cls || '') });
    if (p.photo) el.appendChild(h('img', { src: p.photo, alt: '' }));
    else if (p.char) el.innerHTML = charSvg(p.char);
    else { var n = tx(APP.state.profile && APP.state.profile.full_name) || tx(APP.state.profile && APP.state.profile.email) || '?'; el.appendChild(h('span', { class: 'bt-av-i', text: n.charAt(0).toUpperCase() })); }
    return el;
  }
  /* Top navigation: always at the top of every page */
  var NAV = [['Home', '#Dashboard', /^(Dashboard|Setup|Intentions)/], ['Course', '#Course', /^(Course|Lesson)/], ['My Book', '#Book', /^(Book|Journal)/], ['Resources', '#Resources', /^Resources/]];
  // a skinny branding banner above the menu, so the name shows on every screenshot and screen recording
  // the app's logo: the North Star (also the home-screen icon). Used in the header, the footer and the log-in screen.
  var LOGO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCACAAIADASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAAAgMEBwEGCAAF/8QAMBAAAQMCBQMCBAcBAQAAAAAAAQACEQMhBAUGMUESUWEHcSKBkaETFDKxwdHwUnL/xAAaAQACAwEBAAAAAAAAAAAAAAACBAABAwYF/8QAJBEAAgICAgICAwEBAAAAAAAAAAECBAMRBSETMRJBFVFhInH/2gAMAwEAAhEDEQA/AOO2gdUHvyjDbAX+q8GmbbzseyNu4B5K8xs7KMTwbbZE1psPuiDQebjYdkYbcIGzaMQYtIRdIPG26MNA2I8WRdJ6do7odmqiBAmARK8W/FYzxfgpsfF0plLDVKnHyU02GseyOGhxAItwFgtDBN/opdTDOpgCI+ySGwItEKaaI8ehLmkC1ouhLYBtHiLJ5bHYDvKDp3tBU2A4iOmBf7HZBAtE2TnN+E7f0sO/TbbdEmZSiRy2Da0JZbtG0KQQBAFxuEt4AJ4HdGmYyiGGwJbbuEyI337BCAC2E1ohvFkDZtFGaYm3zTGgkARYoWi8xZNa2SO6E3jEwGgO90yBI8+ETW8XPsmNYItMlEkbKILKZLoNv2W0ZJlJrtiJ5XwsLS6qrWiCfdW9oLIHYzpa1kym6uH5y0MQh1sr7PMqOHBBbx7LVnUyHdNrK6te5C/BlzSzYKosTRLKxEd1LWH4T0ScOtnz+niP8EBbeRupLmgN2ullotcRxCUaF3EiuFoSyPhOx+6kkE33/dLcL2t5Q+jGUSO8WAOyB4gwd051htCW6xifZEmYSiE0SIO3ZNbMQWgjwgG3jZNAiDfeOyFmkEGwGQZi3Ka1s3Db/RAwRBifcKQ0G1j81aQxFGWtJFzMJoYeqI2XmNtEGFNwuEfUrBobM8LWK2Mwhsm5JgX18WwdJJ5hdRekOmxUr0+tlg3sqe0TpqpXxVN5YYldbemWRDB4MVjTi0Bepj1Vrzsy+kXbmsWFsqj1f02KeJqdNOxE2XL+dYN1DFOBbBld6+p2RfnMJ+MGTZck6201Uo4qo9jLT2UyatV4WY/aJUmsuFMqYtEx9iluZG0H2X0MVhnUqpERHyUIiCRAn9l5co6KnDRFIg82gpTxcWEKS4ACQISHsP8AgsmhaSEOF+3cSlujp34hOcCNpglKOxtPZRC8kE2I5kCQmNkxf6pTdpEqXhaYq1Ok3vzyq9h41sJjXOMDcKZSwr32b9Avv5RkLcQRO0DYKwsh0AMW5oawGfCdw1Zz9DsIL7K2wOTYiu8RTd2lWDprRFevXY59Ix7K4NOekVaoGO/BaB5Vq5F6Z0MH0GsBbgJ3xV6q+dmaQU7eHCu2aNonRLmuptbStyYV+6fytmFbQwtNvImPG6zlen/y1IU8NhSB/wBEQPqtny/LxhGl7yHVCItsAuZ5vmvyOqlRNY99v9/xHOchyHl6Xo1bUGVsxTa+Fe3kx/CoHW2iXOdUDqM7xZdT5hl4xYD2ENqARfYhavmunhiqZZicKf8A1Ej6q+E5r8fupbT8e+n+v4ycdyPh6ZwHqTRNehWe5tIkDwtAxuS4jDvLTTdbwu9c99MqGLDzRDb8EKqtR+kVakHP/BB5sum8Ve0vnWmmdHC3hyrpnJFbCvY+7YvdRHtLbOtHlXVn2gPyj3NczpVf5tkQoEgj2SOarOHsGcV9Glk9Ow2KUQemTAPdS8TSFJ5aPkopE7GNklrT0JZFo82J3UvDVRTqgjj7BQ2k9R3ATWRIPyur3pkxvRumVZ4MOR4AVhZBr8YN7S18RCpCnUc2C0Xm6m0sVVYbH7pvDanD0OQmvs67056wVqYYz8VpAjcq1sh9TcNjQ0Vi2TyCuBcFnVbDvb0VCOd1YOmdb1qFVjX1SfmnvJXtf5swTCnUw5l2jvvLM/GKpiphsU6N4mfstoy/MBigadQBtQCbbOXLWiNbFz6RFaRaRO6v7IcyZiRh8TTdNxN/quY5vhfx2rdRvxt9r9f1HO8hx/i7Xo2bMMwGFinTAdUIm+zVrGZ6gGFpuficU72mB9FjP80ZhWV8VUdyY/hUDrfW5a+oTWte0q+E4X8hu3bb8e+l+/8ApOP4/wAvb9G+Z96nYbBNcKJE9yVVWo/V+rUa9gqtjwqb1LritWrua2rYngrQMbneIr1CHVHeLrpllr1V8a0EjooVMOJdIsnPtf8A5x7yXgyq9zXPRiSSCI2Wv1sXUfckqJUeSJ53uEjmtTn7KnNfRjE1hVqOOwKiHciTPhNeemdh5hKeQLg/PslN7EpvZhhix3hMDgQAPsk9UWg7bd0bHAG6jRnFkmmbWv8AJNaQN5FuFFaYvaDe/Cc0gHwOFExiLJLSbSIvup2ExdSlVBBO6+ax1gDv3TGujnnbstIyGIT0W7ofU76OKZTdUi6659Ms9GNwIpF/Ei64FyXHuoYtp7FdS+kGpBTrs632IuvUxpWq860vtBW4LNhaLR9Ts+GDwpoB8Wk3XJGt9S1K2KqU21DElXB6v6k/ExFXpeYA4XL+c451bFvcXSZNyVeXVWvCtH6RKsFhwpEHE4l9SqSXXUN5JIJWC+5IIBSy64AvaV5TkDOewXk3ubd0o7conOiTuSlOPPVcWhZti8mCTYeO6Sbti31RumZ29uyAmd+VELyYDTED+UbJJi3lKYRvclG1x6QbQiaMoyHtIjZGHKO11+3lNBaN/qgaN4yHtcA4QeJhGCIglIBgxwOwRdUblRM1UifhKwp1QZkyri0Fn7sE1pD7gKkWVIeCNh81tWRZt+XE9UTwnKubxz2MwydaZYGvs/OLL3ufMjdVDia01XSRJ4X3c8zY4hsl8+y1d1Ql5M77QqtZvnPZJ5OtBdQaQexQuN4m4Sy9pNj7+EE73kJTYs5GXui+yXMOi4iFlxgb3SyQDCiRlKR5zjJJuUBLgPtJXi6RNv7S3Emw47o0jCUgQdpm45KNrvh/rhIafhkWtwja4k+d0TRjGQ5pLjFrHlGHAujv4SWkk7mfKKTAEnvuhaNoyHh1p3RdQiTx3SQQBIXg4ExCHRopjw4z4KbSxDqYkT+yihw4Mdws9Z2mTHAUXQayaJNXEOqi8n3KUXWH6bf7dLBm0wsdc7qNbI8mxnUb+O6wXfDJm3HZLLgG7AeVjrsBHupoByMuNwLC6AmCByvEx7+bIeom0Ce6JIzlIy5xB8wlH9MbEfNe6hFzZAXQZB2iyJIxlI//2Q==';
  window.BT_LOGO = LOGO;
  function brandStrip() { return h('div', { class: 'bt-brand', 'aria-hidden': 'true' }, [h('img', { class: 'bt-brand-logo', src: LOGO, alt: '' }), h('span', { class: 'bt-brand-n', text: 'Colour Me Neurospicy' })]); }
  // the footer on every page: logo, Instagram and email
  function ensureFooter() {
    if (document.getElementById('bt-foot')) return;
    var app = document.getElementById('app'); if (!app || !app.parentNode) return;
    var IG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
    var EM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/></svg>';
    var f = document.createElement('footer'); f.id = 'bt-foot'; f.className = 'bt-foot';
    f.innerHTML = '<img class="bt-foot-logo" src="' + LOGO + '" alt="Colour Me Neurospicy"><span class="bt-foot-n">Colour Me Neurospicy</span>' +
      '<div class="bt-foot-l"><a class="bt-foot-b" href="https://www.instagram.com/colour_me_neurospicy/" target="_blank" rel="noopener">' + IG + 'Instagram</a>' +
      '<a class="bt-foot-b" href="mailto:savannah@colourmeneurospicy.com.au">' + EM + 'Email Sav</a></div>' +
      '<span class="bt-foot-e">savannah@colourmeneurospicy.com.au</span>';
    app.parentNode.insertBefore(f, app.nextSibling);
  }
  function renderTopNav(route) {
    var key = String(route || '').replace('.dc.html', '');
    var old = document.getElementById('bt-top'); if (old) old.remove();
    var av = document.getElementById('bt-avbtn'); if (av) av.remove();
    var nav = h('nav', { id: 'bt-top', class: 'bt-top', 'aria-label': 'Main' }, [
      brandStrip(),
      h('div', { class: 'bt-top-in' }, NAV.map(function (n) {
        var on = n[2].test(key);
        return h('a', { class: 'bt-top-i' + (on ? ' on' : ''), href: n[1], 'aria-current': on ? 'page' : null, text: n[0] });
      }).concat([h('a', { class: 'bt-top-av' + (/^Profile/.test(key) ? ' on' : ''), href: '#Profile', 'aria-label': 'My profile' }, [avatarNode()])]))
    ]);
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.classList.add('bt-has-top');
  }


  /* ---------------- home: continue card + reminders ---------------- */
  function dismissed(id) { var d = rd(K.dis) || {}; return d[id] && (d[id] === 'forever' || Date.now() - d[id] < 3 * DAY); }
  function dismiss(id, forever) { var d = rd(K.dis) || {}; d[id] = forever ? 'forever' : Date.now(); wr(K.dis, d); }
  function reminders() {
    var out = [], p = prog(), d = comp(), uw = unlockedWeek(), c = course();
    // Sav's own announcements first
    ((APP.state.settings.announcements || {}).items || []).forEach(function (a) {
      if (!tx(a.text)) return;
      if (a.until && new Date(a.until + 'T23:59:59') < new Date()) return;
      if (a.who && a.who !== 'all' && a.who !== APP.state.tier) return;
      out.push({ id: 'a-' + a.id, kind: 'sav', title: a.title || 'From Sav', text: a.text, href: a.link || '', cta: a.link ? (a.cta || 'Open') : '', forever: true });
    });
    // a new week opened in the last 7 days and they haven't started it
    var nw = c.weeks.filter(function (w) { return w.week === uw && w.week >= 2 && (w.lessons || []).length; })[0];
    if (nw && !nw.lessons.some(function (l) { return p.done[l.id]; }))
      out.push({ id: 'week-' + nw.week, kind: 'new', title: 'Week ' + nw.week + ' is open', text: nw.title + '. Your new lessons and resources are ready.', href: lessonHref(nw.lessons[0]), cta: 'Start Week ' + nw.week });
    // been a while
    if (p.lastAt && Date.now() - p.lastAt > 3 * DAY && upNext()) {
      var days = Math.floor((Date.now() - p.lastAt) / DAY);
      out.push({ id: 'idle-' + new Date().toDateString(), kind: 'nudge', title: 'It’s been ' + days + ' days', text: 'Ten minutes today keeps the momentum going. Pick up where you left off.', href: lessonHref(upNext().l), cta: 'Keep going' });
    }
    // journal questions waiting from lessons they've finished
    var waiting = 0, firstW = null;
    allLessons().forEach(function (x) { if (!p.done[x.l.id]) return; (x.l.prompts || []).forEach(function (q, i) { if (!tx((d.j || {})[x.l.id + '_' + i])) { waiting++; if (!firstW) firstW = x.l.id; } }); });
    if (waiting) out.push({ id: 'journal-' + waiting, kind: 'journal', title: waiting + ' Becoming Notebook entr' + (waiting === 1 ? 'y' : 'ies') + ' waiting', text: 'From lessons you’ve watched. Writing it down is where the rewiring sticks.', href: '#Lesson-' + firstW, cta: 'Answer now' });
    // her daily DOSE plan
    if (window.BT_VAGAL) { try { var dsd = window.BT_VAGAL.doseData(), tdk = dayKey(Date.now()), dn0 = dsd.plan.filter(function (x) { return (dsd.days[tdk] || {})[x]; }).length; if (dsd.plan.length && dn0 < dsd.plan.length) out.push({ id: 'dose-' + tdk, kind: 'act', title: 'Today’s DOSE: ' + dn0 + ' of ' + dsd.plan.length, text: dn0 ? 'Nice start. One more little hit of the good stuff?' : 'Your daily plan is ready. Tick off just one to start.', href: '#Dose', cta: 'Open my DOSE plan' }); } catch (e) {} }
    // activities she skipped past: the doing is what creates the change
    var sk = skippedActs();
    if (sk.length) {
      var DOING = ['The doing creates the change, not the learning alone.', 'Knowing it is step one. Doing it is where the rewiring happens.', 'Watching is learning. Doing is changing.', 'Your brain changes when you practise, not when you just listen.'];
      var r0 = resource(sk[0].l.res[0]);
      out.push({ id: 'acts-' + sk.map(function (x) { return x.l.id; }).join('.') + '-' + Math.floor(Date.now() / (3 * DAY)), kind: 'act', title: sk.length === 1 ? (r0 ? r0.title : sk[0].l.title) + ' is waiting for you' : sk.length + ' activities waiting for you', text: DOING[Math.floor(Date.now() / DAY) % DOING.length] + (sk.length > 1 ? ' Start with ' + (r0 ? r0.title : sk[0].l.title) + '.' : ''), href: lessonHref(sk[0].l), cta: 'Do it now' });
    }
    // intentions
    if (!(tx(d.intention) && tx(d.nsToward))) out.push({ id: 'intent', kind: 'nudge', title: 'Set your intentions', text: 'Your North Star and your why become your lock screen.', href: '#Intentions', cta: 'Set my intentions' });
    // 1:1 setup is its own card at the top of the home page
    if (false) {
      var o = rd(K.one) || {}, rep = rd(K.rep);
      var left = [!o.homeSaved, !o.wa, !((rep && rep.ranks) || o.repDone) || !o.hd || !o.disc].filter(Boolean).length;
      if (left) out.push({ id: 'setup-' + left, kind: 'one', title: 'Finish your 1:1 setup', text: left + ' step' + (left === 1 ? '' : 's') + ' left before your first call.', href: '#OneOnOne', cta: 'Go to 1:1 setup' });
    }
    return out.filter(function (r) { return !dismissed(r.id); });
  }
  function continueCard() {
    var nx = upNext(), st = stats(), p = prog();
    if (!allLessons().length) return null;
    var card = h('section', { class: 'bt-cont' });
    if (nx) {
      var pct = p.done[nx.l.id] ? 100 : (p.pct[nx.l.id] || 0);
      card.appendChild(h('span', { class: 'bt-cont-k', text: pct > 0 ? 'Pick up where you left off' : (st.done ? 'Up next' : 'Start here') }));
      card.appendChild(h('span', { class: 'bt-cont-w', text: nx.w.week === 0 ? 'Introduction' : 'Week ' + nx.w.week + ' · ' + nx.w.title }));
      card.appendChild(h('b', { class: 'bt-cont-t', text: nx.l.title }));
      card.appendChild(h('div', { class: 'bt-bar' }, [h('span', { style: 'width:' + Math.max(pct, 3) + '%' })]));
      card.appendChild(h('div', { class: 'bt-cont-row' }, [
        h('a', { class: 'bt-btn lime', href: lessonHref(nx.l), text: isActivityCard(nx.l) && !tx(nx.l.video) ? 'Open ' + ((resource(nx.l.res[0]) || {}).title || 'the activity') : pct > 0 ? 'Keep watching' : 'Watch now' }),
        h('a', { class: 'bt-cont-all', href: '#Course', text: st.done + ' of ' + st.total + ' lessons done · See course' })
      ]));
    } else {
      var nextWeek = course().weeks.filter(function (w) { return !isOpen(w.week); })[0];
      card.appendChild(h('span', { class: 'bt-cont-k', text: 'You’re all caught up' }));
      card.appendChild(h('b', { class: 'bt-cont-t', text: nextWeek ? 'Week ' + nextWeek.week + ': ' + unlockText(nextWeek.week).replace(/^Opens/, 'opens') : 'You’ve finished every lesson. Proud of you.' }));
      card.appendChild(h('a', { class: 'bt-cont-all', href: '#Course', text: 'See the course' }));
    }
    return card;
  }
  function reminderList() {
    var rs = reminders();
    if (!rs.length) return null;
    return h('section', { class: 'bt-rem', 'aria-label': 'Open loops' }, [h('span', { class: 'bt-rem-k', text: 'Open loops' })].concat(rs.map(function (r) {
      var row = h('div', { class: 'bt-rem-i ' + r.kind }, [
        h('span', { class: 'bt-rem-dot', 'aria-hidden': 'true' }),
        h('div', { class: 'bt-rem-b' }, [h('b', { text: r.title }), h('span', { text: r.text }),
          r.href ? h('a', { class: 'bt-rem-cta', href: r.href, target: /^https?:/.test(r.href) ? '_blank' : null, rel: 'noopener', text: r.cta + ' →' }) : null]),
        h('button', { class: 'bt-rem-x', type: 'button', 'aria-label': 'Dismiss', text: '×', onclick: function () { dismiss(r.id, r.forever); row.remove(); } })
      ]);
      return row;
    })));
  }
  /* 1:1 clients: the full start-here steps from their 1:1 page sit at the top of home.
     Once everything's done it tucks away into a small button they can reopen. */
  var oneInst = null;
  function oneSetupDone() {
    var o = rd(K.one) || {}, rep = rd(K.rep);
    return !!(o.homeSaved && o.wa && ((rep && rep.ranks) || o.repDone || o.repImg) && o.hd && o.disc);
  }
  function mountOne(box) {
    var v = APP.views && APP.views['OneOnOne.dc.html'], tpl = v && document.getElementById('t-' + v.slug);
    if (!v || !tpl) return false;
    if (oneInst) { oneInst._dead = true; oneInst = null; }
    var root = h('div', { id: 'v-' + v.slug, class: 'bt-embed-one' });
    box.appendChild(root);
    var inst = new v.cls(Object.assign({}, APP.viewProps('OneOnOne.dc.html'), { embed: true }));
    inst._root = root; inst._tpl = Array.prototype.slice.call(tpl.content.childNodes);
    inst._render(); if (inst.componentDidMount) inst.componentDidMount();
    oneInst = inst;
    return true;
  }
  function oneStart(slot, startPage) {
    if (APP.state.tier !== 'private' && !startPage) return;
    var box = h('section', { class: 'bt-onebox' });
    slot.appendChild(box);
    var compact = function () {
      if (oneInst) { oneInst._dead = true; oneInst = null; }
      box.innerHTML = ''; box.className = 'bt-onebox mini';
      box.appendChild(h('button', { class: 'bt-one-mini', type: 'button', onclick: expand }, [icon('tick', 'bt-one-ic'), h('span', null, [h('b', { text: 'Your 1:1 setup is done' }), h('span', { text: 'Tap to reopen your start-here steps' })]), h('span', { class: 'bt-one-open', text: 'Reopen' })]));
    };
    var expand = function () {
      box.innerHTML = ''; box.className = 'bt-onebox';
      box.appendChild(h('div', { class: 'bt-onebox-h' }, [h('span', { class: 'bt-cont-k', text: 'Start here · your 1:1' }), h('b', { class: 'bt-cont-t', text: 'Before our first call' })]));
      if (!mountOne(box)) { box.appendChild(h('a', { class: 'bt-btn', href: '#OneOnOne', text: 'Open my 1:1 setup' })); return; }
      var tuck = h('button', { class: 'bt-btn ghost bt-one-tuck', type: 'button', text: 'All done, tuck this away', onclick: compact });
      box.appendChild(tuck);
      var sync = function () { tuck.hidden = !oneSetupDone(); };
      sync(); box.addEventListener('click', function () { setTimeout(sync, 300); }); box.addEventListener('change', function () { setTimeout(sync, 600); });
    };
    if (oneSetupDone()) compact(); else expand();
  }
  function waButton() {
    if (APP.state.tier !== 'private') return null;
    var o = rd(K.one) || {}; if (!o.wa) return null;
    var num = String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, '');
    if (!num) return null;
    var a = h('a', { class: 'bt-wa', href: 'https://wa.me/' + num, target: '_blank', rel: 'noopener' });
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    a.appendChild(h('span', { text: 'Message Savannah on WhatsApp' }));
    return a;
  }
  /* 1:1 calls with Sav: booked dates + each call's own Zoom link (copied from Sav's calendar invite) */
  function callInfo() {
    var call = ((APP.state.contract || {}).terms || {}).call || {}, cut = Date.now() - 75 * 60000;
    var list = (call.sessions && call.sessions.length ? call.sessions : (call.upcoming || []).map(function (t) { return { start: t }; }))
      .filter(function (x) { return x && x.start && new Date(x.end || x.start).getTime() + (x.end ? 0 : 3600000) > cut; })
      .sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); })
      .map(function (x) { return { start: x.start, end: x.end, zoom: x.zoom || call.zoom || '' }; });
    return { list: list, zoom: call.zoom || '', times: call.times || '' };
  }
  function callWhen(t) {
    var tz0 = (window.BT_TIME && BT_TIME.tz()) || undefined, d = new Date(t);
    return { day: d.toLocaleDateString('en-AU', { timeZone: tz0, weekday: 'long', day: 'numeric', month: 'long' }), time: d.toLocaleTimeString('en-AU', { timeZone: tz0, hour: 'numeric', minute: '2-digit' }) };
  }
  function zoomBtn(url, big) { return url ? h('a', { class: 'bt-btn ' + (big ? 'lime' : 'lime sm') + ' bt-zoom', href: url, target: '_blank', rel: 'noopener', text: '🎥 Join on Zoom' }) : null; }
  // Home: your next call, with the Zoom button right there
  function nextCallCard() {
    if (APP.state.tier !== 'private') return null;
    var ci = callInfo(), nx = ci.list[0]; if (!nx) return null;
    var w = callWhen(nx.start), ms = new Date(nx.start).getTime() - Date.now(), live = ms < 15 * 60000;
    var when = live ? (ms > 0 ? 'Starting in ' + Math.max(1, Math.round(ms / 60000)) + ' min' : 'On now') : ms < 864e5 && w.day === callWhen(Date.now()).day ? 'Today' : w.day;
    return h('section', { class: 'bt-nextcall' + (live ? ' live' : '') }, [
      h('span', { class: 'bt-cont-k', text: 'Your next call with Sav' }),
      h('div', { class: 'bt-nextcall-row' }, [h('div', null, [h('b', { class: 'bt-nextcall-d', text: when }), h('span', { class: 'bt-nextcall-t', text: w.time + ' your time' })]),
        nx.zoom ? zoomBtn(nx.zoom, true) : h('span', { class: 'bt-sub small', text: 'Your Zoom link will show up here.' })])
    ]);
  }
  function fillHomeTop(slot) {
    slot.innerHTML = '';
    var wa = waButton(); if (wa) slot.appendChild(wa);
    try { var nc = nextCallCard(); if (nc) slot.appendChild(nc); } catch (e) {}
    try { var pc = pushCard(); if (pc) slot.appendChild(pc); } catch (e) {}
    // once the 1:1 setup is done it's tucked away (the tests and agreement live in the profile)
    if (APP.state.tier === 'private' && !oneSetupDone()) oneStart(slot);
    var c = continueCard(), r = reminderList();
    var pages = 0; try { pages = bookEntries().length; } catch (e) {}
    var bk = h('a', { class: 'bt-bookln', href: '#Book' }, [icon('star', 'bt-bookln-ic'), h('span', null, [h('b', { text: 'Your Becoming Book' }), h('span', { text: 'Your notebook + ' + pages + ' page' + (pages === 1 ? '' : 's') + ' of your story' })]), h('span', { class: 'bt-bookln-go', text: 'Open →' })]);
    if (c) slot.appendChild(c);
    if (window.BT_VAGAL && window.BT_VAGAL.repsCard) { try { slot.appendChild(window.BT_VAGAL.repsCard()); } catch (e) {} }
    var tw = thisWeek(); if (tw) slot.appendChild(tw);
    try { slot.appendChild(notesBox({ home: true })); } catch (e) {}
    slot.appendChild(proofHome());
    // (the Becoming Book link card was removed from Home: it's in the top nav as My Book)
    if (r) slot.appendChild(r);
  }

  /* ---------------- wins = proof (shared with Breaking Out's proof portfolio) ---------------- */
  var PD = 'program-decoder-v1', MEMK = 'bt-memories';
  function pdData() { var d = rd(PD); return d && typeof d === 'object' ? d : {}; }
  function evidence() { return (pdData().evidence || []).slice(); }
  function evAt(e) { return parseDate(Number(e.id)) || parseDate(e.date) || null; }
  function addEvidence(text, extra) {
    var d = pdData(), now = Date.now();
    var e = Object.assign({ id: String(now), date: new Date(now).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), text: text, photo: null, belief: null, win: true }, extra || {});
    d.evidence = [e].concat(d.evidence || []); wr(PD, d); return e;
  }
  function removeEvidence(id) { var d = pdData(); d.evidence = (d.evidence || []).filter(function (x) { return String(x.id) !== String(id); }); wr(PD, d); }
  function migrateWins() {
    var old = rd(K.wins); if (!old || !(old.items || []).length) return;
    var d = pdData(), have = {}; (d.evidence || []).forEach(function (x) { have[x.id] = 1; });
    old.items.forEach(function (w) { var id = String(w.at || Date.now()); if (have[id]) return; d.evidence = (d.evidence || []).concat([{ id: id, date: new Date(w.at || Date.now()).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), text: w.text, photo: null, belief: null, win: true }]); });
    d.evidence.sort(function (a, b) { return Number(b.id) - Number(a.id); });
    wr(PD, d); wr(K.wins, { items: [], moved: true });
  }
  function backfillProof() {
    var d = pdData(), ch = false;
    (d.evidence || []).forEach(function (e) { if (e.win && !e.belief && !(e.beliefs && e.beliefs.length)) { var ab = autoBeliefs(e.text, e.spark || 'win', e.proves || []); e.beliefs = ab.beliefs; e.belief = ab.beliefs[0] || null; e.proves = ab.proves; ch = true; } });
    if (ch) wr(PD, d);
  }
  function proofOpen() { try { return isOpen(2); } catch (e) { return false; } }
  function openProof() { if (location.hash === '#Proof') APP.reload(); else goHref('#Proof'); }
  var T = window.BT_TIME || { key: function (t) { var d = new Date(t == null ? Date.now() : t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }, wallKey: function (d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }, now: Date.now, today: function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; } };
  function dayKey(t) { return T.key(t); }
  function wallKey(d) { return T.wallKey(d); }
  function winStreak() {
    var days = {}; evidence().forEach(function (e) { if (e.win) { var a = evAt(e); if (a) days[dayKey(a)] = 1; } });
    var keys = Object.keys(days).map(function (k) { var p = k.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).getTime(); }).sort(function (a, b) { return a - b; });
    var best = 0, run = 0, prev = null;
    keys.forEach(function (t) { run = prev != null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
    var cur = 0, d = T.today();
    if (!days[wallKey(d)]) d.setDate(d.getDate() - 1);
    while (days[wallKey(d)]) { cur++; d.setDate(d.getDate() - 1); }
    return { current: cur, best: best, today: !!days[dayKey(Date.now())] };
  }
  function sparkleBurst(el) {
    var b = h('span', { class: 'bt-burst', 'aria-hidden': 'true' });
    for (var i = 0; i < 12; i++) { var x = h('i'); x.style.setProperty('--a', (i * 30) + 'deg'); x.style.background = ['#F1F9A6', '#F4C2F7', '#F28C3B'][i % 3]; b.appendChild(x); }
    el.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1000);
  }
  var MEMQ = [
    'Look how far you’ve come. Have you grown even more since then?',
    'Is this still true for you? Has it grown into something bigger?',
    'What would you say to the you who wrote this?',
    'What’s the next layer of proof sitting on top of this one?',
    'How does this feel now, looking back?'
  ];
  function memoryWin() {
    var m = rd(MEMK) || {}, seen = m.seen || {}, now = Date.now();
    if (m.last && now - m.last < 2 * DAY) return null;
    var pool = evidence().filter(function (e) { var a = evAt(e); return a && now - a > 3 * DAY && !e.builds && (!seen[e.id] || now - seen[e.id] > 21 * DAY); });
    if (!pool.length) return null;
    var dayN = Math.floor(now / DAY), pick = pool[dayN % pool.length];
    return { e: pick, q: MEMQ[(dayN + String(pick.id).length) % MEMQ.length] };
  }
  function memSeen(id) { var m = rd(MEMK) || {}; m.seen = m.seen || {}; m.seen[id] = Date.now(); m.last = Date.now(); wr(MEMK, m); }
  function agoText(t) { var d = Math.round((Date.now() - t) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 14 ? d + ' days ago' : d < 60 ? Math.round(d / 7) + ' weeks ago' : Math.round(d / 30) + ' months ago'; }
  function streakPill(st, light) {
    if (!st.current) return null;
    return h('span', { class: 'bt-streak' + (light ? ' light' : '') }, [h('span', { class: 'bt-streak-f', 'aria-hidden': 'true', text: '✦' }), st.current + '-day win streak' + (st.best > st.current ? ' · best ' + st.best : '')]);
  }
  function winList(items, light) {
    return h('ul', { class: 'bt-wins-list' + (light ? ' light' : '') }, items.map(function (e) {
      var a = evAt(e);
      return h('li', { class: 'bt-wins-i' }, [h('span', { class: 'bt-wins-d', text: a ? new Date(a).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '' }), h('span', { class: 'bt-wins-g', 'aria-hidden': 'true', text: (SPARK[e.spark] || SPARK.win)[1] }), h('span', { class: 'bt-wins-x', text: e.text }), e.builds ? h('span', { class: 'bt-wins-s', text: '↑ built on an earlier win' }) : null]);
    }));
  }
  var SPARK = { win: ['Win', '✦'], ach: ['Achievement', '★'], joy: ['Sparked joy', '♥'], proof: ['Proof', '✓'], sparkle: ['Sparkle of life', '✧'] };
  /* Limiting beliefs (same list and keywords as Breaking Out of Your Box) and the new truth each piece of proof backs up */
  var BELIEF_PID = {"I'm not good enough":'notgood',"I'm too much":'toomuch',"I'm not enough":'notenough',"I'm broken":'broken','Something is wrong with me':'broken',"I'm lazy":'lazy',"I'm a failure":'messup',"I'm behind everyone else":'notenough','I always get it wrong':'messup',"I can't trust myself":'canttrust',"I don't belong":'dontbelong',"I don't fit in":'dontbelong',"I'm different in a bad way":'different',"I'm difficult":'toomuch',"I'm a burden":'needs',"I'm hard to love":'love','I ruin everything':'messup',"I'll never reach my potential":'potential',"I'm not capable":'capable',"I can't cope":'cope',
    "If people knew the real me, they wouldn't like me":'realme',"If I disappoint people, they'll leave me":'disappoint','Love has to be earned':'love','I have to keep everyone happy':'keephappy',"I'm responsible for other people's feelings":'responsible','Conflict is dangerous':'conflict','My needs are too much':'needs','I need to be useful to be loved':'love','I have to prove my worth':'prove','People always leave':'leave',"I can't rely on anyone":'onlytrust','I can only trust myself':'onlytrust','I have to do everything myself':'everything','Asking for help is weakness':'strong',"I'll be rejected if I speak up":'speakup',"If I set boundaries people won't like me":'disappoint',
    "If I rest, I'm lazy":'rest','My worth comes from what I achieve':'worth','I have to work hard to succeed':'workhard','I must be productive to be worthy':'worth','I have to earn rest':'rest','I have to prove myself':'prove',"If I'm not exceptional, I'm worthless":'worth',"If I'm not improving, I'm failing":'notenough','If I slow down, everything will fall apart':'slowdown','Success must be difficult':'workhard',"Easy means I'm cheating":'workhard','I can never do enough':'notenough','I should be further ahead':'notenough','Other people are doing better than me':'notgood',
    'I have to get it right the first time':'rightfirst','Mistakes are dangerous':'mistake',"If I make a mistake, I'll be rejected":'mistake',"Failure means I'm not good enough":'notgood','I need certainty before I act':'certainty','I must avoid looking stupid':'mistake','I should already know how to do this':'rightfirst',"I can't let people see me struggle":'strong',"If I try and fail, it'll prove something is wrong with me":'messup',"If I don't do it perfectly, there's no point doing it":'rightfirst',
    "If I'm seen, I'll be judged":'seen','Being successful will make people reject me':'seen',"It's safer to stay small":'seen','Standing out is dangerous':'different','Attention is unsafe':'seen','People are always judging me':'seen',"I shouldn't take up space":'toomuch','I need to shrink myself to be accepted':'toomuch',"My opinions don't matter":'opinions','Other people are more qualified than me':'notgood',
    "The world isn't safe":'unsafe',"People can't be trusted":'onlytrust','I need to stay in control':'slowdown','If I let go, everything will fall apart':'slowdown','I have to stay prepared':'relaxing','I need to expect the worst':'worst','Relaxing is dangerous':'relaxing',"I can't let my guard down":'relaxing','Being vulnerable is risky':'strong','If I stop worrying, something bad will happen':'relaxing'};
  BELIEF_PID["I'm not smart"] = 'smart'; BELIEF_PID["I'm stupid"] = 'smart'; BELIEF_PID["I'm dumb"] = 'smart'; BELIEF_PID["I'm not worthy"] = 'worth';
  var BELIEF_KEYS = {notgood:['good enough','compliment','proud','praise','nailed','did well','win','pb','personal best','best','first place','won'],notenough:['enough','compliment','proud','achieved','progress','win','pb','personal best','finished'],toomuch:['excited','passion','loud','laughed','enthusias','too much','myself'],lazy:['finished','completed','got through','started','ticked off','done','ran','run','gym','workout','walk','trained','pb'],rest:['rest','relax','nap','day off','slept','slow','break'],relaxing:['relax','calm','peace','still','switched off'],slowdown:['slow','delegat','let go','day off','break',"didn't check"],worth:['day off','just because','enjoyed','rest','without achieving'],workhard:['easy','easily','effortless','flowed'],needs:['asked for','needed','support','help'],strong:['help','asked','cried','vulnerable','support','struggl'],everything:['delegat','asked','help','someone else','handed'],onlytrust:['trusted','relied','someone else','delegat','help'],disappoint:['said no','boundar','no to','cancel','disappoint'],keephappy:['said no','boundar','upset','my needs','for me'],responsible:['their feelings',"didn't fix",'let them','boundar'],conflict:['conflict','argument','disagree','hard conversation','told them'],speakup:['spoke up','speak up','shared my','told','voice','opinion'],opinions:['opinion','idea','shared my','listened','agreed'],seen:['posted','post','visible','video','live','seen','presented','shared'],mistake:['mistake','wrong','messed up','error','forgot'],rightfirst:['first try','tried','attempt','practi','beginner','messy','learn'],certainty:['decided','decision','took the step','before i was ready','leap'],canttrust:['trusted myself','gut','instinct','backed myself','decided','figured'],messup:['fixed','solved','sorted','went well','worked','figured','pb','personal best','nailed'],broken:['understood','handled','coped','proud'],realme:['real me','authentic','opened up','vulnerable','myself'],different:['different','weird','special interest','unmasked','interest'],dontbelong:['belong','friend','connected','community','invited','group','team'],love:['loved','love','hug','cared','kind message','partner','mum','husband','friend'],prove:["didn't explain",'just because','no proof'],potential:['progress','grew','learned','achieved','step','pb','personal best','goal'],capable:['figured','handled','learned','managed','did it','capable','pb','personal best','ran','finished'],cope:['coped','handled','got through','managed','calm'],leave:['stayed','checked in','reached out','still here','friend'],unsafe:['new','tried','went out','left the house','travel','change','somewhere'],worst:['went well','good news','turned out','better than','fine']};
  BELIEF_KEYS.smart = ['learned', 'figured out', 'figured it out', 'worked out', 'solved', 'understood', 'smart', 'clever', 'idea', 'studied', 'passed', 'exam', 'degree', 'fixed', 'taught', 'explained', 'research', 'qualification', 'certificate'];
  BELIEF_KEYS.worth = BELIEF_KEYS.worth.concat(['deserve', 'treated myself', 'boundar', 'said no', 'looked after myself', 'chose me', 'worthy']);
  BELIEF_KEYS.notgood = BELIEF_KEYS.notgood.concat(['feedback', 'great job', 'well done', 'thanked', 'recognised', 'promoted', 'chosen']);
  var TRUTHS = [
    ['I am smart', ['smart']],
    ['I am good enough', ['notgood']], ['I am enough', ['notenough']], ['I am loved', ['love', 'leave']], ['I am capable', ['capable', 'cope', 'potential']],
    ['I can trust myself', ['canttrust', 'messup']], ['I belong', ['dontbelong', 'different']], ['I am safe to be seen', ['seen']], ['My needs matter', ['needs', 'keephappy', 'responsible']],
    ['I am worthy as I am', ['worth', 'prove', 'broken']], ['Rest is safe', ['rest', 'relaxing', 'slowdown']], ['I show up for myself', ['lazy']], ['Mistakes help me grow', ['mistake', 'rightfirst', 'certainty']],
    ['My voice matters', ['opinions', 'speakup', 'conflict']], ['I can take up space', ['toomuch', 'realme']], ['I can ask for help', ['strong', 'everything', 'onlytrust']],
    ['Success can be easy', ['workhard']], ['Good things happen for me', ['worst', 'unsafe']], ['I can say no', ['disappoint']]
  ];
  var TYPE_PIDS = { win: ['notgood', 'notenough', 'capable', 'lazy'], ach: ['notgood', 'notenough', 'capable', 'potential', 'messup', 'worth'], joy: ['worst', 'worth', 'rest'], proof: [] };
  function pidsOf(truths) { var out = {}; TRUTHS.forEach(function (t) { if (truths.indexOf(t[0]) >= 0) t[1].forEach(function (p) { out[p] = 1; }); }); return out; }
  function autoBeliefs(text, type, truths) {
    var low = ' ' + String(text || '').toLowerCase() + ' ', pids = {};
    (TYPE_PIDS[type] || []).forEach(function (p) { pids[p] = 1; });
    Object.keys(BELIEF_KEYS).forEach(function (p) { if (BELIEF_KEYS[p].some(function (k) { return low.indexOf(k) >= 0; })) pids[p] = 1; });
    Object.assign(pids, pidsOf(truths || []));
    var beliefs = Object.keys(BELIEF_PID).filter(function (b) { return pids[BELIEF_PID[b]]; });
    var proves = TRUTHS.filter(function (t) { return t[1].some(function (p) { return pids[p]; }); }).map(function (t) { return t[0]; });
    (truths || []).forEach(function (t) { if (proves.indexOf(t) < 0) proves.push(t); });
    return { beliefs: beliefs, proves: proves };
  }
  var LEVELS = [[0, 'New spark', 'Add a win today to light your first spark.'], [3, 'Sparkler', 'Three days of finding the good. Your RAS is catching on.'], [7, 'Streaker', 'A whole week. This is what rewiring looks like.'], [17, 'Mega streaker', 'Seventeen days straight. You’re a proof-collecting machine.'], [30, 'Supernova', 'A month of daily proof. Absolute legend.'], [60, 'Glow icon', 'Sixty days. Finding the good is just who you are now.'], [100, 'Living proof', 'One hundred days. You ARE the proof.']];
  function levelOf(n) { var cur = LEVELS[0], next = null; LEVELS.forEach(function (l, i) { if (n >= l[0]) { cur = l; next = LEVELS[i + 1] || null; } }); return { cur: cur, next: next }; }
  var JAR = '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="1" y="1" width="118" height="118" rx="29" fill="#FFFFFF" stroke="#4E0C08" stroke-width="2"/>' +
    '<path d="M38 40 Q36 50 32 58 Q26 72 28 92 Q30 104 44 106 L76 106 Q90 104 92 92 Q94 72 88 58 Q84 50 82 40 Z" fill="#FBE6FC" stroke="#4E0C08" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<rect x="34" y="28" width="52" height="13" rx="5" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.6"/>' +
    '<path d="M40 70 Q60 64 80 70" fill="none" stroke="#4E0C08" stroke-width="1.6" opacity=".35"/>' +
    '<g class="jar-s"><path transform="translate(42 76) scale(.75)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.4" stroke-linejoin="round"/></g>' +
    '<g class="jar-s s2"><path transform="translate(62 84) scale(.6)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F28C3B" stroke="#4E0C08" stroke-width="2.8" stroke-linejoin="round"/></g>' +
    '<g class="jar-s s3"><path transform="translate(60 56) scale(.55)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F4C2F7" stroke="#4E0C08" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<circle cx="50" cy="94" r="3" fill="#D3302B" stroke="#4E0C08" stroke-width="1"/><circle cx="76" cy="74" r="2.6" fill="#F1F9A6" stroke="#4E0C08" stroke-width="1"/>' +
    '<g class="jar-s s2"><path transform="translate(84 10) scale(.8)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.4" stroke-linejoin="round"/></g></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="currentColor" stroke="#4E0C08" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var COUNT_CHEERS = { 1: ['Your first piece of proof!', 'That’s your RAS getting its first lesson in finding the good. Come back tomorrow and give it another.'], 5: ['5 pieces of proof!', 'Your brain is starting to notice. Keep feeding it.'], 10: ['10 pieces of proof!', 'Ten times you caught yourself doing life well. That’s a pattern now, not a fluke.'], 25: ['25 pieces of proof!', 'Your portfolio is getting heavy, and the old story is getting lighter.'], 50: ['50 pieces of proof!', 'Fifty. Read back through them on a hard day. This is who you are.'], 100: ['100 pieces of proof!', 'One hundred. You’ve rewired what your brain looks for. I’m so proud of you.'] };
  var STREAK_CHEERS = {}; LEVELS.slice(1).forEach(function (l) { STREAK_CHEERS[l[0]] = ['You’re a ' + l[1] + '!', l[2]]; });
  function cheerProof(after) {
    var m = rd(MEMK) || {}, done = m.cel || {}, n = evidence().filter(function (e) { return e.win; }).length, st = winStreak(), c = null, k = '';
    if (STREAK_CHEERS[st.current] && !done['s' + st.current + '_' + dayKey(Date.now())]) { c = STREAK_CHEERS[st.current]; k = 's' + st.current + '_' + dayKey(Date.now()); }
    else if (COUNT_CHEERS[n] && !done['c' + n]) { c = COUNT_CHEERS[n]; k = 'c' + n; }
    if (!c) return false;
    done[k] = Date.now(); m.cel = done; wr(MEMK, m);
    setTimeout(function () { party(c[0], c[1], 'Hell yes', after); }, 700);
    return true;
  }
  var proofType = 'win', proofSel = {}, proofDraft = '';
  function proofSuggest(text, custom) {
    var low = String(text || '').toLowerCase(), out = autoBeliefs(text, 'proof', []).proves.slice(0, 6);
    (custom || []).forEach(function (c) { var w = c.toLowerCase().replace(/^i am |^i'm |^i /, '').split(' ').filter(function (x) { return x.length > 3; }); if (w.some(function (x) { return low.indexOf(x.slice(0, 5)) >= 0; }) && out.indexOf(c) < 0) out.push(c); });
    if (!out.length) out = ['I am good enough', 'I am capable', 'I am worthy as I am'];
    return out;
  }
  function streakCal(st) {
    var days = {}; evidence().forEach(function (e) { if (e.win) { var a = evAt(e); if (a) days[dayKey(a)] = (days[dayKey(a)] || 0) + 1; } });
    var t0 = T.today(); var start = new Date(t0); start.setDate(start.getDate() - 13);
    var grid = h('div', { class: 'bt-sc', role: 'list', 'aria-label': 'Your last 14 days' });
    for (var i = 0; i < 14; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i); var k = wallKey(d), n = days[k] || 0, today = i === 13;
      grid.appendChild(h('span', { class: 'bt-sc-d' + (n ? ' on' : '') + (today ? ' today' : ''), role: 'listitem', 'aria-label': d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }) + (n ? ': ' + n + ' piece' + (n === 1 ? '' : 's') + ' of proof' : today ? ': not yet' : ': none') }, [
        h('span', { class: 'bt-sc-w', 'aria-hidden': 'true', text: d.toLocaleDateString('en-AU', { weekday: 'narrow' }) }),
        h('span', { class: 'bt-sc-c', 'aria-hidden': 'true', text: n ? '✦' : today ? '+' : String(d.getDate()) })]));
    }
    var lv = levelOf(st.current), nx = lv.next;
    var pct = nx ? Math.round((st.current - lv.cur[0]) / (nx[0] - lv.cur[0]) * 100) : 100;
    return h('div', { class: 'bt-sc-wrap' }, [
      h('div', { class: 'bt-sc-top' }, [
        h('span', { class: 'bt-lv' }, [h('span', { 'aria-hidden': 'true', text: '✦' }), lv.cur[1]]),
        h('span', { class: 'bt-sc-n' }, [h('b', { text: String(st.current) }), ' day streak' + (st.best > st.current ? ' · best ' + st.best : '')])]),
      grid,
      nx ? h('div', { class: 'bt-lv-next' }, [h('div', { class: 'bt-lv-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': 'Progress to ' + nx[1] }, [h('span', { style: 'width:' + pct + '%' })]),
        h('span', { text: (nx[0] - st.current) + ' more day' + (nx[0] - st.current === 1 ? '' : 's') + ' in a row and you’re a ' + nx[1] + (st.today ? '' : '. Keep it alive today!') })]) : null
    ]);
  }
  /* ---------------- proof portfolio art: the scales tipping toward the good folders ---------------- */
  function proofScaleSvg(opt) {
    // Proof portfolio art: a folder already full of stars, and the magnifying glass out looking for more to add
    opt = opt || {};
    var anim = !!opt.anim, icon = !!opt.icon, INK = '#1F1412';
    function star(cx, cy, r, fill, cls) { var p = ''; for (var k = 0; k < 10; k++) { var a = Math.PI / 5 * k - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; p += (k ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="' + p + 'Z" fill="' + (fill || '#F1F9A6') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>'; }
    function spark(x, y, r, cls) { return '<path class="' + (cls || '') + '" d="M' + x + ' ' + (y - r) + 'c' + (r * .12) + ' ' + (r * .62) + ' ' + (r * .38) + ' ' + (r * .88) + ' ' + r + ' ' + r + 'c-' + (r * .62) + ' ' + (r * .12) + '-' + (r * .88) + ' ' + (r * .38) + '-' + r + ' ' + r + 'c-' + (r * .12) + '-' + (r * .62) + '-' + (r * .38) + '-' + (r * .88) + '-' + r + '-' + r + 'c' + (r * .62) + '-' + (r * .12) + ' ' + (r * .88) + '-' + (r * .38) + ' ' + r + '-' + r + 'z" fill="#F1F9A6" stroke="' + INK + '" stroke-width="1.2"/>'; }
    var bg = icon ? '<rect width="200" height="170" rx="34" fill="#FBE6FC"/>' : '<rect width="200" height="170" rx="22" fill="#FBE6FC"/>';
    // folder back, stars spilling out the top, papers, front pocket with a tick
    var folder =
      '<path d="M22 66v-8a4 4 0 0 1 4-4h26l8 8h52a4 4 0 0 1 4 4v80H22z" fill="#E9A6EE" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<rect x="34" y="60" width="66" height="44" rx="3" fill="#FFFDF5" stroke="' + INK + '" stroke-width="1.8" transform="rotate(-6 67 82)"/>' +
      '<path d="M44 72h34M44 80h26" stroke="#E6C3BC" stroke-width="3" stroke-linecap="round" transform="rotate(-6 67 82)"/>' +
      star(40, 66, 11, '#F1F9A6') + star(62, 56, 13, '#E4F27A') + star(88, 62, 10, '#F1F9A6') + star(104, 72, 8, '#F28C3B') + star(74, 74, 9, '#F1F9A6') +
      '<path d="M18 84h102l-6 66H24z" fill="#F4C2F7" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M26 92h86" stroke="#FFF4EE" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '<circle cx="69" cy="118" r="13" fill="#4E0C08" stroke="' + INK + '" stroke-width="1.8"/><path d="M62 118l5 5 9-10" fill="none" stroke="#F1F9A6" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
    // the found star that flies from the lens into the folder (hero only)
    var found = anim ? '<g class="pa-found">' + star(150, 66, 9, '#F1F9A6') + '</g>' : '';
    var glass = '<g class="pa-glass"><path d="M164 92l20 20" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/><path d="M164 92l20 20" stroke="#4E0C08" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="150" cy="66" r="28" fill="#FFFFFF" fill-opacity=".72" stroke="' + INK + '" stroke-width="4"/><circle cx="150" cy="66" r="23.5" fill="none" stroke="#F4C2F7" stroke-width="2.4"/>' +
      '<path d="M136 56a18 18 0 0 1 10-8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>' + (anim ? '' : spark(150, 66, 10)) + '</g>';
    var around = spark(126, 22, 6, 'ps-tw') + spark(186, 40, 5, 'ps-tw t2') + spark(176, 140, 6, 'ps-tw t3') + (icon ? '' : spark(132, 150, 4.5, 'ps-tw t2') + spark(14, 30, 5, 'ps-tw t3'));
    return '<svg class="ps-svg pa' + (anim ? ' ps-anim' : '') + '" viewBox="0 0 200 170" aria-hidden="true">' + bg + '<g filter="url(#bt-hand)">' + around + folder + glass + found + '</g></svg>';
  }
  /* ---------------- share a piece of proof: a branded JPEG for Instagram, saving, or WhatsApp (1:1) ---------------- */
  var IG = '@colour_me_neurospicy';
  function wrapLines(ctx, text, maxW) { var words = String(text).split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function proofImage(text, spark, photo) {
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var ready = (document.fonts && document.fonts.load) ? Promise.all(['700 80px "Playfair Display"', 'italic 600 60px "Playfair Display"', '600 40px Poppins', '40px "Patrick Hand SC"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    var imgP = photo ? new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = photo; }) : Promise.resolve(null);
    return Promise.all([ready, imgP]).then(function (rr) { var pic = rr[1];
      var g = x.createRadialGradient(W / 2, 380, 60, W / 2, 600, 1000); g.addColorStop(0, '#7A1712'); g.addColorStop(1, '#2A0F0C'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      // sparkles
      function spk(cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy - r); x.bezierCurveTo(cx + r * .12, cy - r * .38, cx + r * .38, cy - r * .12, cx + r, cy); x.bezierCurveTo(cx + r * .38, cy + r * .12, cx + r * .12, cy + r * .38, cx, cy + r); x.bezierCurveTo(cx - r * .12, cy + r * .38, cx - r * .38, cy + r * .12, cx - r, cy); x.bezierCurveTo(cx - r * .38, cy - r * .12, cx - r * .12, cy - r * .38, cx, cy - r); x.fill(); }
      [[120, 150, 34, '#F1F9A6'], [960, 210, 26, '#F4C2F7'], [910, 1080, 40, '#F1F9A6'], [150, 1010, 22, '#F4C2F7'], [540, 120, 18, '#FFFDF5'], [990, 640, 16, '#F1F9A6'], [80, 620, 14, '#FFFDF5']].forEach(function (s) { spk(s[0], s[1], s[2], s[3]); });
      var label = { win: 'A WIN', ach: 'AN ACHIEVEMENT', joy: 'THIS SPARKED JOY', proof: 'NEW PROOF' }[spark] || 'NEW PROOF';
      x.textAlign = 'center'; x.fillStyle = '#F4C2F7'; x.font = '44px "Patrick Hand SC", "Comic Sans MS", cursive'; x.fillText('Proof I’m becoming her', W / 2, 300);
      // card
      var cx = 110, cw = W - 220, cy = 360, ch = 640; x.fillStyle = '#1F1412'; roundRect(x, cx + 14, cy + 14, cw, ch, 48); x.fill(); x.fillStyle = '#F1F9A6'; roundRect(x, cx, cy, cw, ch, 48); x.fill(); x.lineWidth = 5; x.strokeStyle = '#1F1412'; x.stroke();
      x.fillStyle = '#4E0C08'; roundRect(x, W / 2 - 190, cy - 34, 380, 68, 34); x.fill(); x.fillStyle = '#F1F9A6'; x.font = '600 32px Poppins, sans-serif'; x.fillText(label, W / 2, cy + 12);
      var tTop = cy, tH = ch;
      if (pic) { var px = cx + 40, py = cy + 64, pw = cw - 80, phh = 300, sc = Math.max(pw / pic.width, phh / pic.height), sw = pw / sc, shh = phh / sc; x.save(); roundRect(x, px, py, pw, phh, 28); x.clip(); x.drawImage(pic, (pic.width - sw) / 2, (pic.height - shh) / 2, sw, shh, px, py, pw, phh); x.restore(); x.lineWidth = 4; x.strokeStyle = '#1F1412'; roundRect(x, px, py, pw, phh, 28); x.stroke(); tTop = py + phh; tH = cy + ch - tTop; }
      var size = pic ? 56 : 76, lines; x.fillStyle = '#1F1412';
      do { x.font = 'italic 600 ' + size + 'px "Playfair Display", Georgia, serif'; lines = wrapLines(x, '“' + text + '”', cw - 120); size -= 4; } while (lines.length * size * 1.3 > tH - (pic ? 60 : 140) && size > 28);
      var lh = (size + 4) * 1.28, ty = tTop + tH / 2 - (lines.length - 1) * lh / 2 + size / 3;
      lines.forEach(function (l, i) { x.fillText(l, W / 2, ty + i * lh); });
      x.fillStyle = '#FFF4EE'; x.font = '700 50px "Playfair Display", Georgia, serif'; x.fillText(IG, W / 2, 1140);
      x.fillStyle = '#F6D6CF'; x.font = '30px Poppins, sans-serif'; x.fillText('The Neurodivergent Breakthrough Program', W / 2, 1195);
      return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, url: c.toDataURL('image/jpeg', 0.92) }); }, 'image/jpeg', 0.92); });
    });
  }
  function roundRect(x, X, Y, w, hh, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + hh, r); x.arcTo(X + w, Y + hh, X, Y + hh, r); x.arcTo(X, Y + hh, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function shareProof(text, spark, note, photo) {
    var old = document.getElementById('bt-share'); if (old) old.remove();
    var img = h('img', { class: 'bt-share-img', alt: 'Your proof as an image' }), file = null;
    var msg = h('p', { class: 'bt-msg', role: 'status' });
    function save() { if (!file) return; var a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = 'my-proof.jpg'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); msg.textContent = 'Saved. Share it to your story or a post, and tag ' + IG + '!'; }
    function shareFile(extra) { if (!file) return; var data = { files: [file], text: (extra || '') }; if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share(data).then(function () { msg.textContent = 'Shared! Sav will love this.'; }, function () {}); save(); return null; }
    var isOne = APP.state.tier === 'private';
    var waNum = String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, '');
    var btns = h('div', { class: 'bt-share-btns' }, [
      h('button', { class: 'bt-btn lime', type: 'button', onclick: function () { shareFile('Proof I’m becoming her ✨ ' + IG); } }, [h('span', { 'aria-hidden': 'true', text: '📸 ' }), 'Share to Instagram']),
      h('button', { class: 'bt-btn', type: 'button', onclick: save }, [h('span', { 'aria-hidden': 'true', text: '⬇ ' }), 'Save the image']),
      isOne ? h('button', { class: 'bt-btn wa', type: 'button', onclick: function () { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: 'Look what I did!' }).catch(function () {}); } else { save(); setTimeout(function () { window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent('Look what I did! (image saved to my phone) “' + text + '”'), '_blank'); }, 400); } } }, [h('span', { 'aria-hidden': 'true', text: '💬 ' }), 'Send on WhatsApp']) : null
    ]);
    var ov = h('div', { id: 'bt-share', class: 'bt-share', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bt-share-h' }, [h('div', { class: 'bt-share-in' }, [
      h('button', { class: 'bt-share-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: function () { ov.remove(); } }),
      h('p', { class: 'bt-wel-k', text: note || 'Added to your proof portfolio' }),
      h('h2', { id: 'bt-share-h', class: 'bt-share-h', text: 'Share your proof?' }),
      img, btns, msg,
      h('p', { class: 'bt-share-tag' }, ['Sharing online? Tag ', h('b', { text: IG }), ' so Sav can celebrate you 💛'])
    ])]);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    proofImage(text, spark, photo).then(function (r) { img.src = r.url; try { file = new File([r.blob], 'my-proof.jpg', { type: 'image/jpeg' }); } catch (e) { file = r.blob; } });
  }
  var proofPhoto = '';
  function proofLocked() { return !(prog().done[PROOF_LESSON] || peek()); }
  function proofHome(full, force) {
    if (!force && proofLocked()) {
      var f = findLesson(PROOF_LESSON), lk = h('section', { class: 'bt-proof simple locked', 'aria-label': 'Proof portfolio, locked' });
      var ic = h('span', { class: 'bt-proof-jar bt-ps-ic' }); ic.innerHTML = proofScaleSvg({ icon: true });
      lk.appendChild(h('div', { class: 'bt-proof-in' }, [h('div', { class: 'bt-proof-top' }, [ic, h('div', { class: 'bt-proof-tt' }, [h('span', { class: 'bt-wins-k', text: '🔒 Opens soon' }), h('h2', { class: 'bt-wins-h', text: 'Your proof portfolio' })])]),
        h('p', { class: 'bt-wins-t', text: 'This opens after ' + (f ? (f.w.week ? 'Week ' + f.w.week + ': ' : '') + f.l.title.replace(/^Lesson \d+:\s*/, '“') + '”' : 'the Proof Portfolio lesson') + '. It’ll make so much more sense once you’ve watched it.' })]));
      return lk;
    }
    var box = h('section', { class: 'bt-proof simple', 'aria-labelledby': 'bt-proof-h' });
    var glints = h('span', { class: 'bt-glints', 'aria-hidden': 'true' });
    [0, 1, 2].forEach(function (i) { var x = h('span', { class: 'bt-glint g' + i }); x.innerHTML = STAR; glints.appendChild(x); });
    var inner = h('div', { class: 'bt-proof-in' });
    box.appendChild(inner); box.appendChild(glints);
    function draw() {
      inner.innerHTML = '';
      var ev = evidence(), wins = ev.filter(function (e) { return e.win; }), st = winStreak(), pd = pdData(), custom = pd.customProves || [];
      var jar = h('span', { class: 'bt-proof-jar bt-ps-ic' }); jar.innerHTML = proofScaleSvg({ icon: true });
      inner.appendChild(h('div', { class: 'bt-proof-top' }, [jar, h('div', { class: 'bt-proof-tt' }, [
        h('span', { class: 'bt-wins-k', text: 'Train your brain to find the good' }),
        h('h2', { id: 'bt-proof-h', class: 'bt-wins-h', text: 'Add proof to your proof portfolio' })])]));
      inner.appendChild(h('p', { class: 'bt-wins-t', text: 'One win a day trains your brain to find the good. Tiny counts.' }));
      if (full) inner.appendChild(streakCal(st));
      else if (st.current) inner.appendChild(h('span', { class: 'bt-proof-streak' }, [h('span', { 'aria-hidden': 'true', text: '🔥 ' }), st.current + ' day streak' + (st.today ? '' : ' · add one today to keep it going')]));
      var chips = h('div', { class: 'bt-proof-chips', role: 'radiogroup', 'aria-label': 'What kind is it?' }, ['win', 'ach', 'joy', 'proof'].map(function (k) {
        return h('button', { class: 'bt-proof-chip' + (proofType === k ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': proofType === k ? 'true' : 'false', onclick: function () { proofType = k; draw(); var i = document.getElementById('bt-win-in'); if (i) i.focus(); } }, [h('span', { 'aria-hidden': 'true', text: SPARK[k][1] }), SPARK[k][0]]);
      }));
      inner.appendChild(chips);
      var ph = { win: 'Today I…', ach: 'I achieved…', joy: 'This made me smile…', proof: 'This happened…' }[proofType];
      var inp = h('input', { class: 'bt-in', id: 'bt-win-in', placeholder: ph, 'aria-label': SPARK[proofType][0] });
      var add = function () {
        var v = tx(inp.value); if (!v) return;
        var truths = proofType === 'proof' ? Object.keys(proofSel).filter(function (k) { return proofSel[k]; }) : [];
        if (proofType === 'proof' && !truths.length) truths = proofSuggest(v, pdData().customProves || []).slice(0, 3);
        var ab = autoBeliefs(v, proofType, truths);
        var newE = addEvidence(v, { spark: proofType, beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves, photo: proofPhoto || null }); var vPhoto = proofPhoto; proofPhoto = '';
        var flipped = matchesMine(newE); aiMatch(newE, function () { if (location.hash === '#Proof') APP.reload(); });
        try { var pf = lessonForRes('proof'); if (pf && lessonOpen(pf.l.id) && !prog().done[pf.l.id]) markDone(pf.l.id, true); } catch (e) {}
        proofSel = {}; proofDraft = ''; sparkleBurst(box);
        var vText = v, vType = proofType, shareNow = function () { shareProof(vText, vType, (ab.beliefs.length ?  'Proof against ' + ab.beliefs.length + ' old belief' + (ab.beliefs.length === 1 ? '' : 's') + '. Look at you!' : ''), vPhoto); }; if (flipped.length) { flipMoment(flipped, function () { if (location.hash === '#Proof') APP.reload(); setTimeout(shareNow, 300); }); } else if (!cheerProof(shareNow)) setTimeout(shareNow, 500); else if (0) APP.toast(ab.beliefs.length ? 'Proof against ' + ab.beliefs.length + ' old belief' + (ab.beliefs.length === 1 ? '' : 's') + '. Look at you!' : 'Added to your proof portfolio. Look at you!');
        setTimeout(draw, 650);
      };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
      inp.value = proofDraft;
      var phIn = h('input', { type: 'file', accept: 'image/*', class: 'bt-file', id: 'bt-proof-ph', onchange: function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; resizeImage(f, 900).then(function (u) { proofPhoto = u; draw(); }, function () { APP.toast('Couldn’t read that photo. Try another one.'); }); } });
      var phSlot = proofPhoto ? h('div', { class: 'bt-proof-ph has' }, [h('img', { src: proofPhoto, alt: 'Your photo for this proof' }), h('button', { class: 'bt-proof-phx', type: 'button', 'aria-label': 'Remove photo', text: '✕', onclick: function () { proofPhoto = ''; draw(); } })])
        : h('label', { class: 'bt-proof-ph', for: 'bt-proof-ph' }, [h('span', { 'aria-hidden': 'true', text: '＋' }), h('span', { text: 'Add a photo' }), phIn]);
      inner.appendChild(h('div', { class: 'bt-proof-entry' }, [h('div', { class: 'bt-proof-entry-l' }, [inp, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add proof', onclick: add })]), phSlot]));
      if (proofType === 'proof') {
        // suggestions come from what she wrote, not a giant list
        var tbox = h('div', { class: 'bt-truths' }), tT = null;
        var own = h('input', { class: 'bt-in sm', id: 'bt-own', placeholder: 'Something else: I am…', 'aria-label': 'Add your own' });
        var addOwn = function () { var v = tx(own.value); if (!v) return; var d = pdData(); d.customProves = (d.customProves || []).filter(function (x) { return x !== v; }).concat([v]); wr(PD, d); proofSel[v] = true; own.value = ''; drawTruths(); };
        own.addEventListener('keydown', function (e) { if (e.key === 'Enter') addOwn(); });
        var drawTruths = function () {
          tbox.innerHTML = '';
          var v = tx(inp.value);
          if (!v) { tbox.appendChild(h('span', { class: 'bt-truths-k', text: 'Type what happened and I’ll show you what it proves.' })); return; }
          var sug = proofSuggest(v, pdData().customProves || []);
          Object.keys(proofSel).forEach(function (k) { if (proofSel[k] && sug.indexOf(k) < 0) sug.push(k); });
          tbox.appendChild(h('span', { class: 'bt-truths-k', text: 'This is proof that… (tap what fits)' }));
          tbox.appendChild(h('div', { class: 'bt-truths-l' }, sug.map(function (t) { return h('button', { class: 'bt-truth' + (proofSel[t] ? ' on' : ''), type: 'button', 'aria-pressed': proofSel[t] ? 'true' : 'false', text: t, onclick: function () { proofSel[t] = !proofSel[t]; drawTruths(); } }); })));
          tbox.appendChild(h('div', { class: 'bt-wins-row' }, [own, h('button', { class: 'bt-btn ghost', type: 'button', text: '+ Add', onclick: addOwn })]));
        };
        inp.addEventListener('input', function () { proofDraft = inp.value; clearTimeout(tT); tT = setTimeout(drawTruths, 350); });
        drawTruths();
        inner.appendChild(tbox);
      } else inp.addEventListener('input', function () { proofDraft = inp.value; });
      var mem = full ? memoryWin() : null;
      if (mem) {
        var a = evAt(mem.e), more = h('input', { class: 'bt-in', id: 'bt-mem-in', placeholder: 'Since then I’ve…', 'aria-label': 'Add more proof on top of this' });
        var stack = function () { var v = tx(more.value); if (!v) return; var ab = autoBeliefs(v + ' ' + mem.e.text, mem.e.spark || 'win', mem.e.proves || []); addEvidence(v, { builds: mem.e.id, spark: mem.e.spark || 'win', beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves }); memSeen(mem.e.id); sparkleBurst(box); if (!cheerProof()) APP.toast('Stacked. That’s more proof.'); setTimeout(draw, 650); };
        more.addEventListener('keydown', function (e) { if (e.key === 'Enter') stack(); });
        var form = h('div', { class: 'bt-wins-row', hidden: true }, [more, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add', onclick: stack })]);
        inner.appendChild(h('div', { class: 'bt-mem' }, [
          h('span', { class: 'bt-mem-k', text: 'A memory from ' + agoText(a) }),
          h('p', { class: 'bt-mem-w', text: '“' + mem.e.text + '”' }),
          h('p', { class: 'bt-mem-q', text: mem.q }),
          h('div', { class: 'bt-mem-acts' }, [
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Add more proof', onclick: function () { form.hidden = false; more.focus(); } }),
            h('button', { class: 'bt-btn ghost', type: 'button', text: 'Still proud ✓', onclick: function () { memSeen(mem.e.id); APP.toast('Proud of you too.'); draw(); } })
          ]), form
        ]));
      }
      if (full && wins.length) inner.appendChild(winList(wins.slice(0, 3)));
      inner.appendChild(h('div', { class: 'bt-wins-foot' }, [
        h('span', { class: 'bt-wins-s', text: wins.length + ' piece' + (wins.length === 1 ? '' : 's') + ' of proof' }),
        h('button', { class: 'bt-wins-link', type: 'button', text: 'Open my proof portfolio →', onclick: openProof })
      ]));
    }
    draw();
    return box;
  }

  var PD_TEXT = {"self":["I'm not good enough","I'm too much","I'm not enough","I'm broken","Something is wrong with me","I'm lazy","I'm a failure","I'm behind everyone else","I always get it wrong","I can't trust myself","I don't belong","I don't fit in","I'm different in a bad way","I'm difficult","I'm a burden","I'm hard to love","I ruin everything","I'll never reach my potential","I'm not capable","I can't cope"],"rel":["If people knew the real me, they wouldn't like me","If I disappoint people, they'll leave me","Love has to be earned","I have to keep everyone happy","I'm responsible for other people's feelings","Conflict is dangerous","My needs are too much","I need to be useful to be loved","I have to prove my worth","People always leave","I can't rely on anyone","I can only trust myself","I have to do everything myself","Asking for help is weakness","I'll be rejected if I speak up","If I set boundaries people won't like me"],"ach":["If I rest, I'm lazy","My worth comes from what I achieve","I have to work hard to succeed","I must be productive to be worthy","I have to earn rest","I have to prove myself","If I'm not exceptional, I'm worthless","If I'm not improving, I'm failing","If I slow down, everything will fall apart","Success must be difficult","Easy means I'm cheating","I can never do enough","I should be further ahead","Other people are doing better than me"],"perf":["I have to get it right the first time","Mistakes are dangerous","If I make a mistake, I'll be rejected","Failure means I'm not good enough","I need certainty before I act","I must avoid looking stupid","I should already know how to do this","I can't let people see me struggle","If I try and fail, it'll prove something is wrong with me","If I don't do it perfectly, there's no point doing it"],"vis":["If I'm seen, I'll be judged","Being successful will make people reject me","It's safer to stay small","Standing out is dangerous","Attention is unsafe","People are always judging me","I shouldn't take up space","I need to shrink myself to be accepted","My opinions don't matter","Other people are more qualified than me"],"safe":["The world isn't safe","People can't be trusted","I need to stay in control","If I let go, everything will fall apart","I have to stay prepared","I need to expect the worst","Relaxing is dangerous","I can't let my guard down","Being vulnerable is risky","If I stop worrying, something bad will happen"]}; // Breaking Out of Your Box belief list (same order as its audit), so ticked keys map to words
  /* ---------------- Proof Portfolio: its own page, connected to My Book and Breaking Out of Your Box ----------------
     Every piece of proof is checked against her old beliefs. When it disproves one, the belief gets crossed out
     and the new truth written over it. The search (magnifying glass) brings that proof back when she feels it. */
  var EXTRA_BELIEFS = ["I'm not smart", "I'm not worthy", "I'm not good enough", "I'm not enough", "I'm not capable", "I'm a failure"];
  var FEEL_PID = [[/(dumb|stupid|idiot|not smart|thick|clueless|slow learner)/, 'smart', 'dumb'], [/(not good enough|useless|rubbish|hopeless|crap at|suck at|not good at)/, 'notgood', 'not good enough'],
    [/(worthless|not worthy|unworthy|don'?t deserve)/, 'worth', 'not worthy'], [/(failure|failed|fail at|messed up|stuffed up|screwed up)/, 'messup', 'like a failure'], [/(lazy|unmotivated|can'?t get started)/, 'lazy', 'lazy'],
    [/(too much|annoying|too loud|too intense)/, 'toomuch', 'too much'], [/(don'?t belong|left out|don'?t fit|outsider)/, 'dontbelong', 'like you don’t belong'], [/(not enough|behind everyone|behind)/, 'notenough', 'not enough'],
    [/(incapable|can'?t do (it|anything)|not capable)/, 'capable', 'not capable'], [/(can'?t trust myself|bad decision)/, 'canttrust', 'like you can’t trust yourself'], [/(unlovable|hard to love|nobody loves)/, 'love', 'unlovable']];
  function pidForText(b) {
    var p = BELIEF_PID[b]; if (p) return p;
    var low = String(b || '').toLowerCase().replace(/[’‘]/g, "'");
    for (var i = 0; i < FEEL_PID.length; i++) if (FEEL_PID[i][0].test(low)) return FEEL_PID[i][1];
    return null;
  }
  function truthFor(b) {
    var own = (pdData().ownBeliefs || []).filter(function (x) { return x.b === b; })[0]; if (own && own.t) return own.t;
    var pid = pidForText(b), t = pid && TRUTHS.filter(function (x) { return x[1].indexOf(pid) >= 0; })[0]; if (t) return t[0];
    var low = String(b || '').replace(/[’‘]/g, "'"), m;
    if ((m = /^i'?m not (.+)$|^i am not (.+)$/i.exec(low))) return 'I am ' + (m[1] || m[2]);
    if ((m = /^i can'?t (.+)$/i.exec(low))) return 'I can ' + m[1];
    if ((m = /^i don'?t (.+)$/i.exec(low))) return 'I do ' + m[1];
    if ((m = /^i'?m (?:a |an )?(.+)$/i.exec(low))) return 'I’m not ' + m[1] + '. That was an old story.';
    return 'That’s not the whole truth';
  }
  // her beliefs: the ones she said are true (all the time / sometimes) in Breaking Out of Your Box, plus her own
  function myBeliefs() {
    var d = pdData(), t = d.ticked || {}, f = d.freq || {}, out = [];
    Object.keys(PD_TEXT).forEach(function (cid) { PD_TEXT[cid].forEach(function (b, i) { var k = cid + '-' + i; if ((t[k] || f[k] === 'all' || f[k] === 'some') && f[k] !== 'never' && out.indexOf(b) < 0) out.push(b); }); });
    (d.ownBeliefs || []).forEach(function (x) { if (out.indexOf(x.b) < 0) out.push(x.b); });
    return out;
  }
  // what a piece of proof really speaks to: the words she used, the truths she picked, the beliefs she linked it to
  function evPids(e) {
    var p = {}, low = ' ' + String(e.text || '').toLowerCase() + ' ';
    Object.keys(BELIEF_KEYS).forEach(function (k) { if (BELIEF_KEYS[k].some(function (w) { return low.indexOf(w) >= 0; })) p[k] = 1; });
    if (e.spark === 'proof' || e.disprove) Object.assign(p, pidsOf(e.proves || []));
    (e.mine || []).forEach(function (b) { var x = pidForText(b); if (x) p[x] = 1; });
    var x2 = pidForText(e.text); if (x2) p[x2] = 1;
    return p;
  }
  function proofFor(b) { var pid = pidForText(b); return evidence().filter(function (e) { return (e.mine || []).indexOf(b) >= 0 || (pid && evPids(e)[pid]); }); }
  function matchesMine(e) { var pids = evPids(e); return myBeliefs().filter(function (b) { var pid = pidForText(b); return (e.mine || []).indexOf(b) >= 0 || (pid && pids[pid]); }); }
  // smarter matching on the live app: ask the AI which of her beliefs this proof disproves
  function aiMatch(e, done) {
    var mine = myBeliefs(); if (!mine.length || !window.claude || !APP.live) return;
    window.claude.use('sample').then(function (ai) {
      if (!ai) return;
      return ai.json('A coaching client wrote this as proof against her old limiting beliefs: "' + e.text + '". Her limiting beliefs: ' + JSON.stringify(mine) + '. Which of these beliefs does this genuinely disprove or chip away at? Reply only with JSON: {"beliefs": [exact belief strings from the list]}', {}).then(function (r) {
        var got = ((r || {}).beliefs || []).filter(function (b) { return mine.indexOf(b) >= 0; }); if (!got.length) return;
        var d = pdData(); (d.evidence || []).forEach(function (x) { if (String(x.id) === String(e.id)) x.mine = Array.from(new Set((x.mine || []).concat(got))); }); wr(PD, d);
        if (done) done(got);
      });
    }).catch(function () {});
  }
  function flipEl(b, big) {
    var w = h('div', { class: 'bt-flip' + (big ? ' big' : '') }, [h('span', { class: 'bt-flip-old' }, [h('s', { text: b })]), h('span', { class: 'bt-flip-new', text: truthFor(b) })]);
    return w;
  }
  // the moment proof lands: old belief crossed out, the truth written over it
  function flipMoment(list, after) {
    var close = function () { m.remove(); if (after) after(); };
    var m = h('div', { class: 'bt-flipm', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Your proof just tipped the scales' }, [h('div', { class: 'bt-flipm-c' }, [
      h('span', { class: 'bt-wel-k', text: 'Your proof just tipped the scales' }),
      h('div', { class: 'bt-flipm-l' }, list.slice(0, 3).map(function (b, i) { var f = flipEl(b, true); f.style.animationDelay = (i * 0.35) + 's'; return f; })),
      h('p', { class: 'bt-sub', text: 'Every piece of proof is a vote for the new truth. Your brain is keeping count.' }),
      h('button', { class: 'bt-btn lime', type: 'button', text: 'Hell yes', onclick: close })])]);
    document.body.appendChild(m);
  }
  function whenLabel(w) { if (!w) return ''; var m = /^(\d{4})-(\d{2})$/.exec(w); return m ? new Date(+m[1], +m[2] - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : String(w); }
  function whenSort(e) { var w = e.when; if (w) { var m = /^(\d{4})(?:-(\d{2}))?/.exec(w); if (m) return Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, 1); } return evAt(e) || 0; }

  function ProofView(root) {
    root.appendChild(pageHead('Resource · Week 2', 'Your proof portfolio', 'Training your brain to find the good, on purpose.'));
    var wrap = h('div', { class: 'bt-wrap bt-pp' }, [back('Home', '#Dashboard')]);
    root.appendChild(wrap);
    var seen = rd('bt-pp-seen');
    // why
    var why = h('details', { class: 'bt-card2 bt-pp-why', open: seen ? null : 'open' }, [h('summary', null, [h('h2', { text: 'Why we collect proof' })]),
      h('p', { text: 'Your brain has a negativity bias. It’s wired to notice what went wrong, because back in the day, missing a threat could kill you. Missing a win never did. So the bad stuff sticks like velcro and the good stuff slides off like teflon.' }),
      h('p', { text: 'Then there’s confirmation bias. Once you believe something, like “I’m not good enough”, your brain goes looking for evidence that it’s true. And it always finds some, because it’s ignoring everything that says otherwise.' }),
      h('p', { text: 'That’s where your reticular activating system (your RAS) comes in. It’s the filter that decides what you notice out of the millions of things happening around you. Right now it’s been trained to find proof for your old beliefs.' }),
      h('p', null, [h('b', { text: 'This portfolio retrains it. ' }), 'Every time you write down a win, a compliment, a thing you nailed, you’re teaching your RAS to look for the good stuff instead. And every piece is evidence that the old belief is outdated and simply not true. Enough proof, and the scales tip.']),
      h('p', { class: 'bt-sub', text: 'Tiny counts. One a day is plenty.' })]);
    why.addEventListener('toggle', function () { wr('bt-pp-seen', 1); });
    wrap.appendChild(why);
    if (proofLocked()) { var f0 = findLesson(PROOF_LESSON); wrap.appendChild(h('div', { class: 'bt-card2' }, [h('p', { text: 'Your proof portfolio opens after the Proof Portfolio lesson.' }), f0 ? h('a', { class: 'bt-btn lime', href: lessonHref(f0.l), text: 'Go to the lesson →' }) : null])); return; }
    wr('bt-pp-seen', 1);
    wrap.appendChild(proofHome(true, true));

    var flips = h('section', { class: 'bt-card2 bt-pp-flips', id: 'pp-flips' }), dis = h('section', { class: 'bt-card2 bt-pp-dis', id: 'pp-disprove' }), tl = h('section', { class: 'bt-card2 bt-pp-tl', id: 'pp-timeline' });
    wrap.appendChild(flips); wrap.appendChild(dis); wrap.appendChild(tl);
    wrap.appendChild(h('div', { class: 'bt-row bt-pp-links' }, [h('a', { class: 'bt-btn ghost', href: '#Book', text: 'My Becoming Book' }), h('a', { class: 'bt-btn ghost', href: '#BreakingOut', onclick: function (e) { e.preventDefault(); APP.go('BreakingOut.dc.html'); }, text: 'Breaking Out of Your Box' })]));

    var openB = {}, disB = null, rows = [{ t: '', w: '' }, { t: '', w: '' }, { t: '', w: '' }];
    function drawFlips() {
      flips.innerHTML = '';
      var mine = myBeliefs();
      flips.appendChild(h('h2', { text: 'Your old beliefs, flipped' }));
      if (!mine.length) flips.appendChild(h('p', { class: 'bt-sub', text: 'When you do Breaking Out of Your Box (after the Beliefs video), the beliefs you find show up here. Every piece of proof you add gets matched to them automatically. You can also add one now.' }));
      else flips.appendChild(h('p', { class: 'bt-sub', text: 'The more proof against a belief, the more it tips. Tap one to see your proof.' }));
      var list = h('div', { class: 'bt-pp-fl' });
      mine.forEach(function (b) {
        var pr = proofFor(b), n = pr.length, tilt = Math.min(n, 10);
        var card = h('div', { class: 'bt-pp-b' + (n ? ' has' : '') + (openB[b] ? ' open' : ''), style: '--tilt:' + tilt });
        card.appendChild(h('button', { class: 'bt-pp-bh', type: 'button', 'aria-expanded': openB[b] ? 'true' : 'false', onclick: function () { openB[b] = !openB[b]; drawFlips(); } }, [
          n ? flipEl(b) : h('div', { class: 'bt-flip none' }, [h('span', { class: 'bt-flip-old', text: b }), h('span', { class: 'bt-flip-wait', text: 'No proof against this yet' })]),
          h('span', { class: 'bt-pp-n' }, [h('b', { text: String(n) }), n === 1 ? ' piece of proof' : ' pieces of proof'])]));
        if (openB[b]) {
          card.appendChild(n ? winList(pr.slice(0, 20)) : h('p', { class: 'bt-sub', text: 'Start with the Disprove It list below.' }));
          card.appendChild(h('button', { class: 'bt-wins-link', type: 'button', text: 'Disprove this one →', onclick: function () { disB = b; drawDis(); dis.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }));
        }
        list.appendChild(card);
      });
      flips.appendChild(list);
      var ownIn = h('input', { class: 'bt-in sm', placeholder: 'Another belief, e.g. I’m not smart', 'aria-label': 'Add a belief of your own' });
      var addOwn = function () { var v = tx(ownIn.value); if (!v) return; var d = pdData(); d.ownBeliefs = (d.ownBeliefs || []).filter(function (x) { return x.b !== v; }).concat([{ b: v, t: '' }]); wr(PD, d); ownIn.value = ''; drawFlips(); drawDis(); };
      ownIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') addOwn(); });
      flips.appendChild(h('div', { class: 'bt-wins-row' }, [ownIn, h('button', { class: 'bt-btn ghost', type: 'button', text: '+ Add', onclick: addOwn })]));
    }
    function drawDis() {
      dis.innerHTML = '';
      var mine = myBeliefs(), opts = mine.length ? mine : EXTRA_BELIEFS;
      if (!disB || opts.indexOf(disB) < 0) disB = opts[0];
      dis.appendChild(h('span', { class: 'bt-wins-k', text: 'Activity · Disprove it' }));
      dis.appendChild(h('h2', { text: 'Every reason it isn’t true' }));
      dis.appendChild(h('p', { class: 'bt-sub', text: 'Pick a belief. Then write down every example you have that proves it wrong. Every compliment, every thing you finished, every time you figured it out. Go back as far as you like: school, work, friendships, motherhood. Get them all out of your head.' }));
      dis.appendChild(h('div', { class: 'bt-truths-l', role: 'radiogroup', 'aria-label': 'Which belief?' }, opts.map(function (b) { return h('button', { class: 'bt-truth' + (b === disB ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': b === disB ? 'true' : 'false', text: b, onclick: function () { disB = b; drawDis(); } }); })));
      dis.appendChild(flipEl(disB, true));
      var listEl = h('div', { class: 'bt-pp-rows' });
      rows.forEach(function (r, i) {
        var t = h('input', { class: 'bt-in', value: r.t, placeholder: i === 0 ? 'e.g. My boss said my project was the best she’d seen' : 'Another one…', 'aria-label': 'Proof ' + (i + 1) });
        var w = h('input', { class: 'bt-in sm bt-pp-when', value: r.w, placeholder: 'When? e.g. 2019', 'aria-label': 'When was this? (optional)' });
        t.addEventListener('input', function () { r.t = t.value; }); w.addEventListener('input', function () { r.w = w.value; });
        listEl.appendChild(h('div', { class: 'bt-pp-row' }, [h('span', { class: 'bt-pp-i', text: String(i + 1) }), t, w]));
      });
      dis.appendChild(listEl);
      dis.appendChild(h('div', { class: 'bt-row' }, [
        h('button', { class: 'bt-btn ghost', type: 'button', text: '+ Another', onclick: function () { rows.push({ t: '', w: '' }); drawDis(); var ins = dis.querySelectorAll('.bt-pp-row .bt-in:not(.bt-pp-when)'); if (ins.length) ins[ins.length - 1].focus(); } }),
        h('button', { class: 'bt-btn lime', type: 'button', text: 'Add these to my proof', onclick: function () {
          var good = rows.filter(function (r) { return tx(r.t); }); if (!good.length) return;
          var truth = truthFor(disB), base = Date.now();
          good.forEach(function (r, i) {
            var yr = /^\s*(\d{4})\s*$/.exec(r.w), when = yr ? yr[1] : tx(r.w) || null;
            var ab = autoBeliefs(r.t, 'proof', [truth]);
            var d = pdData(), id = String(base - i);
            d.evidence = [{ id: id, date: new Date(base).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), text: tx(r.t), photo: null, win: true, spark: when ? 'ach' : 'proof', beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves, mine: [disB], when: when, disprove: disB }].concat(d.evidence || []);
            wr(PD, d);
          });
          try { var pf = lessonForRes('proof'); if (pf && lessonOpen(pf.l.id) && !prog().done[pf.l.id]) markDone(pf.l.id, true); } catch (e) {}
          var b = disB; rows = [{ t: '', w: '' }, { t: '', w: '' }, { t: '', w: '' }];
          openB[b] = true; drawFlips(); drawDis(); drawTl();
          flipMoment([b], function () { flips.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        } })]));
    }
    function drawTl() {
      tl.innerHTML = '';
      var items = evidence().filter(function (e) { return e.spark === 'ach' || e.when; }).sort(function (a, b) { return whenSort(a) - whenSort(b); });
      tl.appendChild(h('span', { class: 'bt-wins-k', text: 'Your achievement timeline' }));
      tl.appendChild(h('h2', { text: 'Look how far you’ve come' }));
      tl.appendChild(h('p', { class: 'bt-sub', text: 'Every achievement in your portfolio, in order. Add to it any time, big or small, recent or years ago.' }));
      var t = h('input', { class: 'bt-in', placeholder: 'I achieved…', 'aria-label': 'An achievement' }), w = h('input', { class: 'bt-in sm bt-pp-when', placeholder: 'When? e.g. 2021', 'aria-label': 'When (optional)' });
      var add = function () { var v = tx(t.value); if (!v) return; var yr = /^\s*(\d{4})\s*$/.exec(w.value), ab = autoBeliefs(v, 'ach', []); var e = addEvidence(v, { spark: 'ach', beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves, when: yr ? yr[1] : tx(w.value) || null }); drawTl(); drawFlips(); var mm = matchesMine(e); if (mm.length) flipMoment(mm); aiMatch(e, function () { drawFlips(); }); };
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
      tl.appendChild(h('div', { class: 'bt-pp-row add' }, [t, w, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add', onclick: add })]));
      if (!items.length) { tl.appendChild(h('p', { class: 'bt-sub', text: 'Nothing here yet. Your first achievement goes here.' })); return; }
      tl.appendChild(h('ol', { class: 'bt-tl' }, items.map(function (e) {
        var a = evAt(e), lab = e.when ? whenLabel(e.when) : a ? new Date(a).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : '';
        return h('li', { class: 'bt-tl-i' }, [h('span', { class: 'bt-tl-d', text: lab }), h('span', { class: 'bt-tl-dot', 'aria-hidden': 'true', text: '★' }), h('div', { class: 'bt-tl-b' }, [h('p', { text: e.text }), (e.mine || []).length ? h('span', { class: 'bt-tl-p', text: 'Proof: ' + truthFor(e.mine[0]) }) : null])]);
      })));
    }
    drawFlips(); drawDis(); drawTl();
    try { var fe = sessionStorage.getItem('bt-pp-focus'); if (fe) { sessionStorage.removeItem('bt-pp-focus'); setTimeout(function () { var el = document.getElementById(fe); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400); } } catch (e) {}
  }
  // the magnifying glass: "I feel dumb" -> your proof that you're smart
  function proofForFeeling(q) {
    var hit = null; FEEL_PID.forEach(function (f) { if (!hit && f[0].test(q)) hit = f; }); if (!hit) return null;
    var pid = hit[1], truth = (TRUTHS.filter(function (t) { return t[1].indexOf(pid) >= 0; })[0] || ['That’s not the whole truth'])[0];
    var pr = evidence().filter(function (e) { return evPids(e)[pid]; }).slice(0, 4);
    var box = h('div', { class: 'bt-find-proof' }, [h('span', { class: 'bt-find-h', text: 'Feeling ' + hit[2] + '? Your proof says otherwise' }),
      h('div', { class: 'bt-flip big' }, [h('span', { class: 'bt-flip-old' }, [h('s', { text: 'I’m ' + hit[2].replace(/^like /, '') })]), h('span', { class: 'bt-flip-new', text: truth })])]);
    if (pr.length) box.appendChild(winList(pr)); else box.appendChild(h('p', { class: 'bt-sub', text: 'No proof saved for this one yet. Let’s find some: think of one time it wasn’t true.' }));
    box.appendChild(h('a', { class: 'bt-btn lime sm', href: '#Proof', text: pr.length ? 'See all my proof →' : 'Add proof →', onclick: function () { var m = document.getElementById('bt-find'); if (m) m.remove(); document.body.classList.remove('bt-finding'); } }));
    return box;
  }

  /* ---------------- coming back from an activity ----------------
     Remember where an activity was opened from: the course (Done takes her straight back to that page)
     or Resources (Done takes her back there). Anywhere else, the activity's own buttons apply. */
  var RETK = 'bt-return', curRoute = '';
  function retGet(resId) {
    var r = rd(RETK); if (!r || !r.at || Date.now() - r.at > 6 * 3600000) return null;
    if (resId && r.res && r.res !== resId) return null;
    return r;
  }
  function retKind(r) { return !r ? '' : /^#(Course|Lesson-)/.test(r.from) ? 'course' : /^#Resources/.test(r.from) ? 'res' : ''; }
  function resForHref(href) {
    href = String(href || '').replace(/^(\.\.\/)?app\.html/, '').replace(/^\//, '');
    return (window.BT_RESOURCES || []).filter(function (r) { var x = resHref(r).replace(/^\//, ''); return x && x !== '#' && (href === x || href === x.replace(/^\.\.\//, '')); })[0] || null;
  }
  function watchReturns() {
    window.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      var r = resForHref(a.getAttribute('href')); if (!r) return;
      var from = '#' + String(curRoute || 'Dashboard').replace('.dc.html', '');
      if (/^#(Course|Lesson-|Resources)/.test(from)) wr(RETK, { from: from, res: r.id, at: Date.now(), y: window.scrollY || 0 }); else wr(RETK, null);
    }, true);
  }
  function lessonForRes(resId) { var hit = null, any = null; allLessons().forEach(function (x) { if ((x.l.res || [])[0] !== resId) return; if (!any) any = x; if (!hit && isActivityCard(x.l)) hit = x; }); return hit || any; }
  function nextAfter(id) {
    var all = allLessons(), i = -1; all.forEach(function (x, k) { if (x.l.id === id) i = k; });
    for (var k = i + 1; k < all.length; k++) { var l = all[k].l; if (lessonOpen(l.id) && !prog().done[l.id]) return l; }
    return null;
  }
  function goHref(href) {
    if (href.charAt(0) === '#') { if (location.hash === href) APP.reload(); else location.hash = href; return; }
    if (/\.dc\.html$/.test(href)) { APP.go(href); return; }
    if (window.parent !== window && window.parent.BT_OPEN) window.parent.BT_OPEN(href.replace(/^\//, '')); else location.href = href;
  }
  function doneLabel(resId, dflt) { var r = retGet(resId), k = retKind(r); return k === 'course' ? 'Done · back to the course →' : k === 'res' ? 'Done, back to resources' : dflt; }
  function backLabel(resId, dflt) { var k = retKind(retGet(resId)); return k === 'course' ? '← Back to the course' : k === 'res' ? '← Back to resources' : dflt; }
  // returns true when it took her somewhere
  // "I am ready to change my world": tick the set-up activity off, move straight on to Setting Intentions,
  // with a little pop-up on the way (closes with the ✕, a tap anywhere, or by itself after 5 seconds)
  function setupReady() {
    var f = lessonForRes('setup'); if (f && !prog().done[f.l.id]) markDone(f.l.id, true);
    wr(RETK, null);
    goHref('#Intentions');
    setTimeout(function () {
      var old = document.getElementById('bt-next-pop'); if (old) old.remove();
      var box, close = function () { if (box && box.parentNode) box.remove(); document.removeEventListener('pointerdown', close, true); };
      box = h('div', { id: 'bt-next-pop', class: 'bt-party bt-next-pop', role: 'dialog', 'aria-label': 'Next step' }, [
        h('div', { class: 'bt-party-card bt-vdone-card' }, [
          h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕' }),
          h('span', { class: 'bt-vdone-ic', 'aria-hidden': 'true', text: '✨' }),
          h('h2', { text: 'You’re set up for success' }),
          h('p', { text: 'Ticked off for you. Next up: Setting Intentions, where you write your North Star and your why.' }),
          h('span', { class: 'bt-next-pop-bar', 'aria-hidden': 'true' })
        ])
      ]);
      document.body.appendChild(box);
      setTimeout(function () { document.addEventListener('pointerdown', close, true); }, 50);
      setTimeout(close, 5000);
      try { window.scrollTo(0, 0); } catch (e) {}
    }, 350);
  }
  function activityDone(resId) {
    var r = retGet(resId), k = retKind(r), f = lessonForRes(resId);
    if (f && lessonOpen(f.l.id) && !prog().done[f.l.id]) { markDone(f.l.id, true); setTimeout(celebrate, 600); }
    wr(RETK, null);
    if (k === 'course') {
      // back to the course page, scrolled to what's next, so she can see where she's at and keep going
      var nx = f ? nextAfter(f.l.id) : null;
      try { sessionStorage.setItem('bt-scrollto', nx ? lessonHref(nx) : (f ? lessonHref(f.l) : '')); } catch (e) {}
      goHref('#Course');
      return true;
    }
    if (k === 'res') { goHref('#Resources'); return true; }
    return false;
  }
  function activityBack(resId) {
    var r = retGet(resId), k = retKind(r);
    if (k === 'course' || k === 'res') { wr(RETK, null); if (k === 'course') { var f0 = lessonForRes(resId); try { sessionStorage.setItem('bt-scrollto', f0 ? lessonHref(f0.l) : ''); } catch (e) {} goHref('#Course'); } else goHref(r.from); return true; }
    return false;
  }
  // a little bar at the top of in-app activities (Breaking Out, STAR) when she came from the course or Resources
  var RET_ROUTES = { 'BreakingOut.dc.html': 'box', 'StarHome.dc.html': 'star', Vagal: 'vagal', Breathe: 'breathe', Dose: 'dose', Pause: 'pause', Move: 'move', Proof: 'proof' };
  function retStrip(resId) {
    var k = retKind(retGet(resId)); if (!k) return null;
    return h('div', { class: 'bt-ret', role: 'navigation', 'aria-label': 'Back to where you were' }, [
      h('button', { class: 'bt-ret-b', type: 'button', text: backLabel(resId, '← Back'), onclick: function () { activityBack(resId); } }),
      h('button', { class: 'bt-btn lime bt-ret-d', type: 'button', text: k === 'course' ? 'Done · back to the course' : 'Done', onclick: function () { activityDone(resId); } })
    ]);
  }
  function ActDoneView(root, resId) {
    root.appendChild(h('div', { class: 'bt-wrap' }, [h('p', { class: 'bt-sub', text: 'Saving your progress…' })]));
    setTimeout(function () { if (!activityDone(resId)) goHref('#Dashboard'); }, 30);
  }

  /* ---------------- embodiment: the weekly practice ----------------
     Each week ends with an embodiment practice. It runs for 7 days from the day she finishes the
     week's last lesson, and keeps going until she starts the next week if that takes longer.
     If she moved on without doing it, its 7 days start from the day she first fills in its card. */
  var EMBK = 'bt-embody';
  function isEmbody(l) { return /^embodiment/i.test(l.title || ''); }
  function embodyLogFirst(l) {
    if ((l.res || [])[0] === 'vagal' && window.BT_VAGAL) return window.BT_VAGAL.firstLog();
    var d = ((rd(EMBK) || {})[l.id] || {}).days || {}, ks = Object.keys(d).filter(function (k) { return d[k]; });
    return ks.length ? Math.min.apply(null, ks.map(function (k) { var p = k.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).getTime(); })) : null;
  }
  function embodyDay(l, key) {
    if ((l.res || [])[0] === 'vagal' && window.BT_VAGAL) { var st = window.BT_VAGAL.todayStatus(key); return { parts: [['D', st.dose || st.doseN > 0], ['B', st.breathe], ['P', st.pause], ['M', st.move]], any: !!(st.doseN || st.breathe || st.pause || st.move) }; }
    var d = ((rd(EMBK) || {})[l.id] || {}).days || {}; return { parts: null, any: !!d[key] };
  }
  function embodyNow() {
    var p = prog(), doneAt = p.doneAt || {}, ws = course().weeks, best = null;
    ws.forEach(function (w, wi) {
      (w.lessons || []).forEach(function (l) {
        if (!isEmbody(l)) return;
        var core = (w.lessons || []).filter(function (x) { return !isEmbody(x) && !x.optional && !isActivityCard(x); });
        var last = core[core.length - 1], start = last && p.done[last.id] ? (doneAt[last.id] || null) : null;
        var nw = ws[wi + 1], first = nw && (nw.lessons || [])[0], nextStart = first && p.done[first.id] ? (doneAt[first.id] || Date.now()) : (first && p.last === first.id ? p.lastAt : null);
        var from = null;
        if (start && (!nextStart || nextStart >= start + 7 * DAY)) from = start;
        else if (start && nextStart && nextStart < start + 7 * DAY) { var fl = embodyLogFirst(l); from = fl && fl >= start ? fl : (Date.now() < start + 7 * DAY ? start : null); }
        if (!from) return;
        var day0 = new Date(from); day0.setHours(0, 0, 0, 0);
        var until = Math.max(day0.getTime() + 7 * DAY, nextStart && nextStart > from ? nextStart : 0);
        var active = Date.now() < day0.getTime() + 7 * DAY || (!nextStart && Date.now() >= from) || Date.now() < until;
        if (active && (!best || from > best.from)) best = { l: l, w: w, from: day0.getTime(), dayN: Math.floor((Date.now() - day0.getTime()) / DAY) + 1 };
      });
    });
    return best;
  }
  function weekStrip(l, from) {
    var t0 = T.today();
    var start = from ? new Date(Math.max(from, t0.getTime() - 6 * DAY)) : new Date(t0.getTime() - ((t0.getDay() + 6) % 7) * DAY);
    var row = h('div', { class: 'bt-wkcal', role: 'list' });
    for (var i = 0; i < 7; i++) {
      (function (i) {
        var d = new Date(start); d.setDate(start.getDate() + i); var k = wallKey(d), today = k === dayKey(Date.now()), fut = d.getTime() > T.now();
        var st = l ? embodyDay(l, k) : { parts: null, any: false };
        var kids = [h('span', { class: 'bt-wkcal-w', text: d.toLocaleDateString('en-AU', { weekday: 'short' }) }), h('b', { text: String(d.getDate()) })];
        if (st.parts) kids.push(h('span', { class: 'bt-wkcal-p', 'aria-hidden': 'true' }, st.parts.map(function (x) { return h('i', { class: x[1] ? 'on' : '', text: x[0] }); })));
        else kids.push(h('span', { class: 'bt-wkcal-t', 'aria-hidden': 'true', text: st.any ? '✓' : fut ? '' : '·' }));
        var label = d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) + (st.parts ? ': ' + st.parts.filter(function (x) { return x[1]; }).map(function (x) { return { D: 'DOSE', B: 'Breathe', P: 'Pause', M: 'Move' }[x[0]]; }).join(', ') : st.any ? ': done' : '');
        var cls = 'bt-wkcal-d' + (st.any ? ' on' : '') + (today ? ' today' : '') + (fut ? ' fut' : '');
        if (l && !st.parts && !fut) row.appendChild(h('button', { class: cls, type: 'button', role: 'listitem', 'aria-pressed': st.any ? 'true' : 'false', 'aria-label': label + '. Tap to tick it off', onclick: function () { var all = rd(EMBK) || {}, e = all[l.id] = all[l.id] || { days: {} }; e.days[k] = !e.days[k]; wr(EMBK, all); var slot = document.querySelector('.bt-thisweek'); if (slot) slot.replaceWith(thisWeek()); } }, kids));
        else if (l && st.parts && !fut) row.appendChild(h('a', { class: cls, href: '#Vagal', role: 'listitem', 'aria-label': label }, kids));
        else row.appendChild(h('span', { class: cls, role: 'listitem', 'aria-label': label }, kids));
      })(i);
    }
    return row;
  }
  function thisWeek() {
    var e = embodyNow();
    if (!e) return null;
    var name = e.l.title.replace(/^embodiment:\s*/i, ''), over = e.dayN > 7;
    var r = resource((e.l.res || [])[0]);
    return h('section', { class: 'bt-thisweek bt-tw-emb', 'aria-label': 'This week’s embodiment exercise' }, [
      h('div', { class: 'bt-tw-band' }, [
        h('span', { class: 'bt-embc-bolt bt-tw-bolt', 'aria-hidden': 'true', text: '⚡' }),
        h('div', { class: 'bt-tw-bt' }, [
          h('div', { class: 'bt-tw-chips' }, [h('span', { class: 'bt-embc-k', text: 'Take action · Embodiment' }), h('span', { class: 'bt-embc-day', text: over ? 'Day ' + e.dayN : 'Day ' + e.dayN + ' of 7' })]),
          h('span', { class: 'bt-tw-k', text: 'This week’s embodiment exercise' }),
          h('h2', { class: 'bt-tw-t', text: name }),
          r && r.parts ? h('span', { class: 'bt-embc-parts' }, r.parts.slice(0, 4).map(function (pid) { var pr = resource(pid); return pr ? h('span', { class: 'bt-embc-p' }, [emblem(pid), h('span', { text: pr.title })]) : null; })) : null
        ])
      ]),
      h('p', { class: 'bt-tw-s', text: over ? 'Keep it going until you start Week ' + (e.w.week + 1) + '. The doing creates the change.' : (e.l.res || [])[0] === 'vagal' ? 'Your four daily practices: DOSE, Breathe, Pause, Move. Tap a day to see it.' : 'Tick off each day you do it.' }),
      weekStrip(e.l, e.from),
      h('a', { class: 'bt-btn lime bt-tw-go', href: lessonHref(e.l), text: '⚡ Do today’s ' + name + ' →' })
    ]);
  }
  function embodyCard(l, li, dn) {
    var name = l.title.replace(/^embodiment:\s*/i, ''), r = resource((l.res || [])[0]), e = embodyNow(), cur = e && e.l.id === l.id;
    var card = li.open ? h('a', { class: 'bt-embc' + (dn ? ' done' : '') + (cur ? ' cur' : ''), href: lessonHref(l) }) : h('div', { class: 'bt-embc lock' });
    card.appendChild(h('span', { class: 'bt-embc-bolt', 'aria-hidden': 'true', text: '⚡' }));
    card.appendChild(h('div', { class: 'bt-embc-top' }, [h('span', { class: 'bt-embc-k', text: 'Take action · Embodiment' }), cur ? h('span', { class: 'bt-embc-day', text: e.dayN > 7 ? 'Day ' + e.dayN : 'Day ' + e.dayN + ' of 7' }) : null, li.open ? null : icon('lock', 'bt-embc-lock')]));
    card.appendChild(h('b', { class: 'bt-embc-t', text: name }));
    card.appendChild(h('span', { class: 'bt-embc-d', text: li.open ? 'Learning is step one. This is the doing: the part that moves the needle the most.' : li.why }));
    if (r && r.parts) card.appendChild(h('span', { class: 'bt-embc-parts' }, r.parts.slice(0, 4).map(function (pid) { var pr = resource(pid); return pr ? h('span', { class: 'bt-embc-p' }, [emblem(pid), h('span', { text: pr.title })]) : null; })));
    if (li.open) card.appendChild(h('span', { class: 'bt-embc-go', text: dn ? '✓ Keep it going →' : 'Start doing →' }));
    if (li.open) {
      var tick = h('button', { class: 'bt-act-tick' + (dn ? ' on' : ''), type: 'button', 'aria-pressed': dn ? 'true' : 'false', 'aria-label': dn ? 'Done' : 'Mark as done', onclick: function (ev) { ev.preventDefault(); ev.stopPropagation(); markDone(l.id, !prog().done[l.id]); var y = window.scrollY; APP.reload(); window.scrollTo(0, y); setTimeout(celebrate, 300); } });
      tick.appendChild(icon('tick')); tick.appendChild(h('span', { text: dn ? 'Done' : 'Done?' }));
      card.appendChild(tick);
    }
    return card;
  }

  var mo = null;
  function watchSlots() {
    if (mo) return;
    var host = document.getElementById('app');
    var scan = function () {
      host.querySelectorAll('[data-slot="home-top"]').forEach(function (el) { if (!el.__filled) { el.__filled = true; fillHomeTop(el); } });
      host.querySelectorAll('[data-slot="act-video"]').forEach(function (el) { if (!el.__filled) { el.__filled = true; var f = findLesson(el.getAttribute('data-lesson')); if (f && (tx(f.l.video) || tx(f.l.vimeo))) { el.appendChild(videoBlock(f.l, f.l.id)); if (tx(f.l.desc)) el.appendChild(h('p', { class: 'bt-act-desc', text: f.l.desc })); } } });
      host.querySelectorAll('[data-slot="proof-scale"]').forEach(function (el) { if (!el.__ps) { el.__ps = 1; el.innerHTML = proofScaleSvg({ anim: true }); } });
      host.querySelectorAll('section.rs-vagal:not(.lock)').forEach(function (el) { if (!el.querySelector('.bt-vparts')) el.appendChild(vagalParts()); });
      host.querySelectorAll('section.rs-breathe').forEach(function (el) { if (!el.querySelector('.bt-alsoin')) { var rr = el.querySelector('.rrow'); if (rr) rr.insertBefore(h('span', { class: 'bt-alsoin' }, ['⚡ Part of your Vagal Tone Workout']), rr.firstChild); } });
      host.querySelectorAll('[data-slot="emb"]').forEach(function (el) { var id = el.getAttribute('data-res'); if (el.__res !== id) { el.__res = id; el.innerHTML = ''; el.appendChild(emblem(id)); } });
    };
    mo = new MutationObserver(scan); mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-res'] }); scan(); return;
    mo = new MutationObserver(scan); mo.observe(host, { childList: true, subtree: true }); scan();
  }

  /* ---------------- native views ---------------- */
  function pageHead(kicker, title, sub) {
    return h('header', { class: 'bt-ph' }, [
      h('span', { class: 'bt-ph-k', text: kicker }), h('h1', { class: 'bt-ph-t', text: title }), sub ? h('p', { class: 'bt-ph-s', text: sub }) : null,
      h('span', { class: 'bt-ph-wave', 'aria-hidden': 'true' })
    ]);
  }
  function waves(root) { root.querySelectorAll('.bt-ph-wave').forEach(function (s) { s.innerHTML = '<svg viewBox="0 0 400 30" preserveAspectRatio="none"><path d="M0 15 Q 25 0 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15 T 350 15 T 400 15" fill="none" stroke="#F1F9A6" stroke-width="2.5" stroke-linecap="round"/></svg>'; }); }
  var ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="currentColor"/></svg>'
  };
  function icon(name, cls) { var s = h('span', { class: 'bt-ic ' + (cls || ''), 'aria-hidden': 'true' }); s.innerHTML = ICONS[name]; return s; }
  function back(label, hash) { return h('a', { class: 'bt-back', href: hash, text: '← ' + label }); }

  /* ---------------- progress journey + celebrations ---------------- */
  var CHEERS = [
    [0, 'Your journey starts here', 'Every lesson you finish lights up the path.'],
    [1, 'You’ve lit the spark', 'The hardest part is starting, and you’ve started.'],
    [25, 'Look at you go', 'You’re building the habit of showing up for yourself.'],
    [50, 'Over halfway there', 'Half the program done. Your brain is literally rewiring.'],
    [75, 'The finish line’s in sight', 'Keep going, future you is cheering.'],
    [100, 'You did the damn thing', 'Every single lesson. I’m so proud of you.']
  ];
  function journey() {
    var p = prog(), L = locks(), weeks = course().weeks, st = stats();
    var pct = st.total ? Math.round(100 * st.done / st.total) : 0;
    var cheer = CHEERS.filter(function (c) { return pct >= c[0] && (c[0] > 0 || st.done === 0); }).pop() || CHEERS[0];
    if (st.done > 0 && pct < 25) cheer = CHEERS[1];
    var cur = upNext(), curWeek = cur ? cur.w.week : null;
    var nodes = weeks.map(function (w) {
      var ls = w.lessons || [], done = ls.filter(function (l) { return p.done[l.id]; }).length;
      var state = ls.length && done === ls.length ? 'done' : w.week === curWeek ? 'here' : (L.weeks[w.week] && L.weeks[w.week].open && done) ? 'here' : (L.weeks[w.week] || {}).open ? 'open' : 'lock';
      return { w: w, state: state, frac: ls.length ? done / ls.length : 0 };
    });
    var weeksDone = nodes.filter(function (n) { return n.state === 'done'; }).length;
    // winding path, one stop per week
    var gap = 86, W = 40 + gap * (nodes.length - 1) + 40, H = 150, pts = nodes.map(function (n, i) { return [40 + i * gap, i % 2 ? 98 : 52]; });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2; d += ' C' + mx + ' ' + a[1] + ' ' + mx + ' ' + b[1] + ' ' + b[0] + ' ' + b[1]; }
    var lastDone = -1; nodes.forEach(function (n, i) { if (n.state === 'done') lastDone = i; });
    var hereIdx = nodes.map(function (n) { return n.state; }).indexOf('here');
    var reach = hereIdx >= 0 ? hereIdx : lastDone;
    var svg = '<svg class="bt-jy-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Your progress through the program: ' + weeksDone + ' of ' + nodes.length + ' parts finished">';
    svg += '<path d="' + d + '" fill="none" stroke="rgba(246,214,207,.25)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 10"/>';
    if (reach > 0) { var dd = 'M' + pts[0][0] + ' ' + pts[0][1]; for (var k = 1; k <= reach; k++) { var a2 = pts[k - 1], b2 = pts[k], m2 = (a2[0] + b2[0]) / 2; dd += ' C' + m2 + ' ' + a2[1] + ' ' + m2 + ' ' + b2[1] + ' ' + b2[0] + ' ' + b2[1]; } svg += '<path class="bt-jy-lit" d="' + dd + '" fill="none" stroke="#F1F9A6" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 8"/>'; }
    nodes.forEach(function (n, i) {
      var x = pts[i][0], y = pts[i][1], lab = n.w.week === 0 ? 'Intro' : 'Wk ' + n.w.week, ly = i % 2 ? y + 34 : y - 26;
      svg += '<g class="bt-jy-n ' + n.state + '" style="animation-delay:' + (i * 0.08) + 's">';
      if (n.state === 'here') svg += '<circle class="bt-jy-glow" cx="' + x + '" cy="' + y + '" r="24" fill="#F4C2F7" opacity=".35"/>';
      if (n.state === 'here' && n.frac > 0) { var r = 21, c = 2 * Math.PI * r; svg += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="#F1F9A6" stroke-width="3" stroke-dasharray="' + (c * n.frac).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + x + ' ' + y + ')"/>'; }
      svg += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="' + (n.state === 'done' ? '#3E9B4F' : n.state === 'here' ? '#F4C2F7' : n.state === 'open' ? '#FFF4EE' : '#74140E') + '" stroke="' + (n.state === 'lock' ? 'rgba(232,185,174,.5)' : '#1F1412') + '" stroke-width="2"/>';
      if (n.state === 'done') svg += '<path d="M' + (x - 7) + ' ' + y + 'l5 5 9-10" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      else if (n.state === 'lock') svg += '<rect x="' + (x - 5.5) + '" y="' + (y - 1) + '" width="11" height="8" rx="2" fill="#E8B9AE"/><path d="M' + (x - 3.5) + ' ' + (y - 1) + 'v-2.5a3.5 3.5 0 0 1 7 0V' + (y - 1) + '" fill="none" stroke="#E8B9AE" stroke-width="1.8"/>';
      else svg += '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="15" fill="#4E0C08">' + (n.w.week === 0 ? '★' : n.w.week) + '</text>';
      svg += '<text x="' + x + '" y="' + ly + '" text-anchor="middle" font-family="Poppins, sans-serif" font-size="11" font-weight="600" fill="' + (n.state === 'lock' ? 'rgba(246,214,207,.55)' : '#F6D6CF') + '">' + lab + '</text>';
      if (n.state === 'here') svg += '<g class="bt-jy-you"><path d="M' + x + ' ' + (y - 50) + 'C' + (x + 1) + ' ' + (y - 43) + ' ' + (x + 5) + ' ' + (y - 39) + ' ' + (x + 11) + ' ' + (y - 38) + 'C' + (x + 5) + ' ' + (y - 37) + ' ' + (x + 1) + ' ' + (y - 33) + ' ' + x + ' ' + (y - 26) + 'C' + (x - 1) + ' ' + (y - 33) + ' ' + (x - 5) + ' ' + (y - 37) + ' ' + (x - 11) + ' ' + (y - 38) + 'C' + (x - 5) + ' ' + (y - 39) + ' ' + (x - 1) + ' ' + (y - 43) + ' ' + x + ' ' + (y - 50) + 'Z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.2"/></g>';
      svg += '</g>';
    });
    svg += '</svg>';
    var map = h('div', { class: 'bt-jy-map' }); map.innerHTML = svg;
    var ring = h('div', { class: 'bt-jy-ring', style: '--p:' + pct }, [h('b', { text: pct + '%' }), h('span', { text: 'done' })]);
    var box = h('section', { class: 'bt-jy' }, [
      h('div', { class: 'bt-jy-top' }, [ring, h('div', { class: 'bt-jy-txt' }, [
        h('span', { class: 'bt-jy-k', text: 'Your Breakthrough journey' }),
        h('b', { class: 'bt-jy-t', text: cheer[1] }),
        h('span', { class: 'bt-jy-s', text: cheer[2] })
      ])]),
      map,
      h('div', { class: 'bt-jy-stats' }, [
        h('div', null, [h('b', { text: String(st.done) }), h('span', { text: 'lessons done' })]),
        h('div', null, [h('b', { text: String(weeksDone) }), h('span', { text: weeksDone === 1 ? 'part complete' : 'parts complete' })]),
        h('div', null, [h('b', { text: String(Object.keys((comp().j) || {}).filter(function (k) { return tx(comp().j[k]); }).length) }), h('span', { text: 'notebook entries' })])
      ])
    ]);
    setTimeout(function () { var here = map.querySelector('.bt-jy-n.here'); if (here && map.scrollWidth > map.clientWidth) { var bb = here.getBBox(); map.scrollLeft = Math.max(0, bb.x - map.clientWidth / 2 + 20); } }, 60);
    return box;
  }
  // a party the first time each week (and the whole program) is finished
  function celebrate() {
    var p = prog(), seen = p.cheered || {}, fresh = null;
    course().weeks.forEach(function (w) { var ls = w.lessons || []; if (ls.length && ls.every(function (l) { return p.done[l.id]; }) && !seen[w.week]) fresh = w; });
    var st = stats(), all = st.total && st.done === st.total && !seen.all;
    if (!fresh && !all) return;
    saveProg(function (q) { q.cheered = q.cheered || {}; if (fresh) q.cheered[fresh.week] = Date.now(); if (all) q.cheered.all = Date.now(); });
    var title = all ? 'You finished the whole program!' : (fresh.week === 0 ? 'Introduction complete!' : 'Week ' + fresh.week + ' complete!');
    var msg = all ? 'Every lesson, every question, every bit of showing up. Take a second and let that land. I’m so proud of you.' : (fresh.week === 0 ? 'You’ve set your intentions and set yourself up for success. Now the real work begins.' : 'That’s a whole week of showing up for yourself. Give yourself the credit, you earned it.');
    if (!all && fresh.week === 0 && !(isSelf() && startedBefore())) { readyForCall(); return; }
    party(title, msg, 'Hell yes');
  }
  // 1:1: the introduction is done, so they're ready for the first call. Two ways forward.
  function readyForCall() {
    if (document.getElementById('bt-tour')) { setTimeout(readyForCall, 900); return; }
    var bg = h('div', { class: 'bt-party', role: 'dialog', 'aria-label': 'You’re ready for your first call' });
    var conf = h('div', { class: 'bt-confetti', 'aria-hidden': 'true' }), cols = ['#F1F9A6', '#F4C2F7', '#F28C3B', '#D3302B', '#FFF4EE', '#3E9B4F'];
    for (var i = 0; i < 70; i++) conf.appendChild(h('i', { style: 'left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.8).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's' }));
    var close = function () { bg.remove(); };
    var wk1 = (course().weeks.filter(function (w) { return w.week === 1; })[0] || {}).lessons || [];
    var card = h('div', { class: 'bt-party-card bt-ready-card' }, [
      h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close }),
      icon('star', 'bt-party-star'),
      h('b', { text: isSelf() ? 'You’re all set up. Week 1 is open!' : 'Great! You’re ready for your first call with Sav' }),
      h('p', { text: isSelf() ? (isOpen(2) ? 'Week 2 is open for you too. You’ll get a notification and an email each time a new week opens.' : 'Each lesson unlocks once you’ve finished the one before it. Week 2 is opening soon, and you’ll get a notification and an email the moment it’s ready.') : 'You can either wait, or get ahead on your Week 1 lessons.' }),
      h('p', { class: 'bt-ready-q' }, [h('span', { text: 'If you want to change…' }), h('span', { text: 'When do we take action? ' }), h('strong', { text: 'NOW.' })]),
      h('div', { class: 'bt-ready-btns' }, [
        h('button', { class: 'bt-btn lime', type: 'button', text: 'Start Week 1 →', onclick: function () { close(); goHref(wk1[0] ? lessonHref(wk1[0]) : '#Course'); } }),
        h('button', { class: 'bt-btn ghost', type: 'button', text: 'Take a tour of the app', onclick: function () { close(); goHref('#Dashboard'); setTimeout(appTour, 700); } })
      ])
    ]);
    bg.appendChild(conf); bg.appendChild(card);
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.body.appendChild(bg);
  }
  function party(title, msg, btn, onClose) {
    if (document.getElementById('bt-tour')) { setTimeout(function () { party(title, msg, btn, onClose); }, 900); return; }
    var done0 = false, closeIt = function () { bg.remove(); if (!done0 && onClose) { done0 = true; setTimeout(onClose, 250); } };
    var bg = h('div', { class: 'bt-party', role: 'dialog', 'aria-label': title });
    var conf = h('div', { class: 'bt-confetti', 'aria-hidden': 'true' });
    var cols = ['#F1F9A6', '#F4C2F7', '#F28C3B', '#D3302B', '#FFF4EE', '#3E9B4F'];
    for (var i = 0; i < 70; i++) conf.appendChild(h('i', { style: 'left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.8).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;transform:rotate(' + Math.round(Math.random() * 360) + 'deg)' }));
    var card = h('div', { class: 'bt-party-card' }, [icon('star', 'bt-party-star'), h('b', { text: title }), h('p', { text: msg }),
      h('button', { class: 'bt-btn lime', type: 'button', text: btn || 'Hell yes', onclick: function () { closeIt(); } })]);
    bg.appendChild(conf); bg.appendChild(card);
    bg.addEventListener('click', function (e) { if (e.target === bg) closeIt(); });
    document.body.appendChild(bg);
  }

  function CourseView(root) {
    var st = stats(), p = prog(), L = locks();
    root.appendChild(pageHead('Breakthrough', 'Your course', st.done + ' of ' + st.total + ' lessons done'));
    var wrap = h('div', { class: 'bt-wrap' }, [back('Home', '#Dashboard'), journey()]);
    setTimeout(celebrate, 500);
    var cc = continueCard(); if (cc) wrap.appendChild(cc);
    wrap.appendChild(h('p', { class: 'bt-course-note', text: paceNote() }));
    course().weeks.forEach(function (w) {
      var wl = L.weeks[w.week] || {}, open = !!wl.open, ls = w.lessons || [];
      var done = ls.filter(function (l) { return p.done[l.id]; }).length;
      var current = ls.some(function (l) { return L.lessons[l.id] && L.lessons[l.id].open && !p.done[l.id]; });
      var box = h('details', { class: 'bt-wk' + (open ? '' : ' lock'), open: current ? 'open' : null }, [
        h('summary', null, [
          w.week === 0 ? icon('star', 'bt-wk-n') : h('span', { class: 'bt-wk-n', text: String(w.week) }),
          h('span', { class: 'bt-wk-t' }, [h('b', { text: w.week === 0 ? w.title : 'Week ' + w.week + (w.title && w.title !== 'Coming soon' ? ' · ' + w.title : '') }),
            h('span', { text: !open ? wl.why + (ls.length ? '' : ' · lessons coming soon') : !ls.length ? 'Lessons coming soon' : done + ' of ' + ls.length + ' done' })]),
          !open ? icon('lock', 'bt-wk-lock') : ls.length && done === ls.length ? icon('tick', 'bt-wk-done') : h('span', { class: 'bt-wk-ring', style: '--p:' + (ls.length ? Math.round(100 * done / ls.length) : 0), 'aria-hidden': 'true' })
        ])
      ]);
      var list = h('div', { class: 'bt-ls' });
      var inline = {}, upId = (upNext() || { l: {} }).l.id;
      ls.forEach(function (l) {
        var li = L.lessons[l.id] || {}, dn = !!p.done[l.id], pc = dn ? 100 : (p.pct[l.id] || 0);
        if (isEmbody(l)) { var ec = embodyCard(l, li, dn); if ((l.res || [])[0]) inline[l.res[0]] = 1; list.appendChild(ec); return; }
        if (isActivityCard(l)) { var ac = activityCard(l, li, dn); if (ac) { inline[l.res[0]] = 1; list.appendChild(ac); return; } }
        var row = li.open ? h('a', { class: 'bt-l' + (dn ? ' done' : '') + (!dn && l.id === upId ? ' cur' : ''), href: '#Lesson-' + l.id }) : h('div', { class: 'bt-l lock' });
        if (li.open && !dn && l.id === upId) row.setAttribute('aria-label', 'You’re up to: ' + l.title);
        row.appendChild(icon(!li.open ? 'lock' : dn ? 'tick' : 'play', 'bt-l-ic'));
        row.appendChild(h('span', { class: 'bt-l-t' }, [h('span', { text: l.title + (l.optional ? ' (optional)' : '') }),
          !li.open ? h('span', { class: 'bt-l-why', text: li.why }) : null,
          pc > 0 && !dn ? h('span', { class: 'bt-bar sm' }, [h('span', { style: 'width:' + pc + '%' })]) : null]));
        var tt = timeTag(l); if (tt) row.appendChild(tt);
        list.appendChild(row);
      });
      var wres = (w.res || []).filter(function (id) { return !inline[id]; }).map(resource).filter(Boolean);
      if (wres.length) list.appendChild(h('div', { class: 'bt-wk-res' }, [h('span', { text: w.week === 0 ? 'Start-here resources' : 'This week’s resources' })].concat(wres.map(function (r) { return resChip(r, open); }))));
      if (!ls.length && !wres.length) list.appendChild(h('p', { class: 'bt-l-why', style: 'padding:4px 10px 0', text: 'Lessons for this week are on their way.' }));
      box.appendChild(list);
      wrap.appendChild(box);
    });
    root.appendChild(wrap); waves(root);
  }
  /* little logo for each app tool, so activity cards are easy to spot */
  var EMBLEM = {
    vagal: '<path d="M8 40c6-10 10-10 16 0s10 10 16 0 10-10 16 0" fill="none" stroke="#1F1412" stroke-width="3" stroke-linecap="round"/><path class="em-beat" d="M32 30c-8-6-10-9.5-8-13 1.8-2.8 5.6-2.3 8 1.2 2.4-3.5 6.2-4 8-1.2 2 3.5 0 7-8 13z" fill="#D3302B" stroke="#1F1412" stroke-width="1.5"/>',
    breathe: '<circle class="em-breathe" cx="32" cy="32" r="14" fill="#BFD7F2" stroke="#1F1412" stroke-width="2.5"/><circle cx="32" cy="32" r="23" fill="none" stroke="#1F1412" stroke-width="1.8" stroke-dasharray="3 5"/><circle cx="32" cy="9" r="4" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.8"/>',
    dose: '<rect x="8" y="14" width="22" height="16" rx="5" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.2"/><rect x="34" y="14" width="22" height="16" rx="5" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.2"/><rect x="8" y="34" width="22" height="16" rx="5" fill="#FFD9A8" stroke="#1F1412" stroke-width="2.2"/><rect x="34" y="34" width="22" height="16" rx="5" fill="#BFE3D0" stroke="#1F1412" stroke-width="2.2"/><g font-family="Poppins,sans-serif" font-weight="700" font-size="11" fill="#1F1412" text-anchor="middle"><text x="19" y="26">D</text><text x="45" y="26">O</text><text x="19" y="46">S</text><text x="45" y="46">E</text></g>',
    pause: '<path class="em-steam" d="M24 18c-3-4 3-6 0-10M32 18c-3-4 3-6 0-10M40 18c-3-4 3-6 0-10" fill="none" stroke="#A8231F" stroke-width="2" stroke-linecap="round"/><path d="M12 24h36v14a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 28h3a6 6 0 0 1 0 12h-4" fill="none" stroke="#1F1412" stroke-width="2.5"/><ellipse cx="30" cy="57" rx="20" ry="3" fill="#1F1412" opacity=".15"/><circle cx="30" cy="37" r="9.5" fill="#4E0C08"/><rect x="26.2" y="32.5" width="2.8" height="9" rx="1.1" fill="#F1F9A6"/><rect x="31" y="32.5" width="2.8" height="9" rx="1.1" fill="#F1F9A6"/>',
    move: '<circle cx="36" cy="12" r="5" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.2"/><path d="M34 19l-6 14 8 6-4 14M28 33l-10 4M34 22l10 8 8-2M36 39l10 8" fill="none" stroke="#1F1412" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path class="em-twinkle" d="M12 14c.6 4 2.4 5.8 6 6.4-3.6.6-5.4 2.4-6 6.4-.6-4-2.4-5.8-6-6.4 3.6-.6 5.4-2.4 6-6.4z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.4"/>',
    proof: '<path d="M8 26v-4a2 2 0 0 1 2-2h10l3 3h17a2 2 0 0 1 2 2v31H8z" fill="#E9A6EE" stroke="#1F1412" stroke-width="2" stroke-linejoin="round"/><path class="em-twinkle" d="M16 18l2 4 4 .5-3 2.8.8 4.2-3.8-2-3.8 2 .8-4.2-3-2.8 4-.5z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.2"/><path d="M28 16l1.6 3.3 3.6.4-2.6 2.4.7 3.6-3.3-1.8-3.3 1.8.7-3.6-2.6-2.4 3.6-.4z" fill="#E4F27A" stroke="#1F1412" stroke-width="1.2"/><path d="M6 32h38l-2 24H8z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2" stroke-linejoin="round"/><path d="M50 42l9 9" stroke="#4E0C08" stroke-width="6" stroke-linecap="round"/><circle cx="44" cy="34" r="11" fill="#FFFFFF" stroke="#1F1412" stroke-width="2.6"/><path d="M44 28c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1"/>',
    whatif: '<circle cx="32" cy="30" r="17" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.5"/><circle cx="18" cy="50" r="4" fill="#F4C2F7" stroke="#1F1412" stroke-width="2"/><circle cx="11" cy="57" r="2.5" fill="#F4C2F7" stroke="#1F1412" stroke-width="1.6"/><text x="32" y="38" text-anchor="middle" font-family="Playfair Display,Georgia,serif" font-weight="700" font-size="22" fill="#4E0C08">?</text>',
    box: '<rect x="14" y="28" width="36" height="26" rx="3" fill="#E8B9AE" stroke="#1F1412" stroke-width="2.5"/><path d="M14 28l-6-10M50 28l6-10" stroke="#1F1412" stroke-width="2.5" stroke-linecap="round"/><g class="em-burst"><path d="M32 6v10M22 10l4 8M42 10l-4 8" stroke="#D3302B" stroke-width="2.5" stroke-linecap="round"/></g>',
    ub: '<path d="M6 46h52" stroke="#1F1412" stroke-width="3" stroke-linecap="round"/><path d="M10 46C18 24 46 24 54 46" fill="none" stroke="#D3302B" stroke-width="3.5"/><path d="M18 46V36M26 46V31M32 46V30M38 46V31M46 46V36" stroke="#1F1412" stroke-width="2"/>',
    rewind: '<circle cx="32" cy="32" r="22" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.5"/><g class="em-spin"><path d="M31 22l-11 10 11 10zM45 22l-11 10 11 10z" fill="#4E0C08"/></g>',
    comehome: '<path d="M12 32L32 14l20 18v20H12z" fill="#FFD9A8" stroke="#1F1412" stroke-width="2.5" stroke-linejoin="round"/><path class="em-beat" d="M32 46c-7-5-9-8-7-11 1.6-2.4 5-2 7 1 2-3 5.4-3.4 7-1 2 3 0 6-7 11z" fill="#D3302B"/>',
    blueprint: '<rect x="10" y="12" width="44" height="40" rx="4" fill="#BFD7F2" stroke="#1F1412" stroke-width="2.5"/><path d="M10 24h44M10 36h44M24 12v40M40 12v40" stroke="#FFFFFF" stroke-width="1.4"/><path class="em-beat" d="M32 42c-7-5-9-8-7-11 1.6-2.4 5-2 7 1 2-3 5.4-3.4 7-1 2 3 0 6-7 11z" fill="#D3302B"/>',
    setup: '<rect x="14" y="10" width="36" height="46" rx="5" fill="#FFF4EE" stroke="#1F1412" stroke-width="2.5"/><path d="M21 24l3 3 6-6M21 37l3 3 6-6" stroke="#3E9B4F" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 25h10M34 38h10" stroke="#1F1412" stroke-width="2.2" stroke-linecap="round"/><path class="em-twinkle" d="M50 6c.5 4 2.5 6 6 6.5-3.5.5-5.5 2.5-6 6.5-.5-4-2.5-6-6-6.5 3.5-.5 5.5-2.5 6-6.5z" fill="#D3302B"/>',
    intent: '<path d="M3 50q4-3 8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#6E7FB0" stroke-width="1.6" stroke-linecap="round"/><path d="M13 54V20M17 54V20M29 54V20M33 54V20" stroke="#BF4630" stroke-width="2.4" stroke-linecap="round"/><path d="M12.5 23h5M12.5 31h5M28.5 23h5M28.5 31h5" stroke="#BF4630" stroke-width="1.8"/><path d="M3 41Q9 33 15 20Q23 40 31 20Q36 31 44 41" fill="none" stroke="#1F1412" stroke-width="1.8" stroke-linecap="round"/><path d="M7 41v-3M11 41v-8M19 41v-14M23 41v-8M27 41v-14M35 41v-9M39 41v-4" stroke="#1F1412" stroke-width=".9"/><path d="M3 42H47" stroke="#1F1412" stroke-width="3.2" stroke-linecap="round"/><path d="M54 42V27" stroke="#1F1412" stroke-width="2"/><rect x="41" y="12" width="22" height="15" rx="3" fill="#1F1412"/><g class="em-neon"><rect x="41" y="12" width="22" height="15" rx="3" fill="none" stroke="#FF5FCB" stroke-width="1.2" opacity=".55"/><text x="52" y="23" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="700" font-size="8" fill="#FFD6F4" stroke="#FF5FCB" stroke-width=".5">WHY</text></g><path class="em-twinkle" d="M58 4c.4 2.6 1.6 3.8 4 4.2-2.4.4-3.6 1.6-4 4.2-.4-2.6-1.6-3.8-4-4.2 2.4-.4 3.6-1.6 4-4.2z" fill="#F1F9A6" stroke="#1F1412" stroke-width=".8"/>',

    star: '<path class="em-twinkle" d="M32 8l6.5 14.5L54 24l-11.5 10.5L46 50l-14-8-14 8 3.5-15.5L10 24l15.5-1.5z" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.5" stroke-linejoin="round"/>'
  };
  function emblem(id) { var e = document.createElement('span'); e.className = 'bt-emb'; e.setAttribute('aria-hidden', 'true'); handDefs(); e.innerHTML = '<svg viewBox="0 0 64 64"><g filter="url(#bt-hand-s)">' + (EMBLEM[id] || EMBLEM.intent) + '</g></svg>'; return e; }
  var IN_PAGE = { intent: 1, setup: 1 };
  var PROOF_LESSON = 'w2l3';
  function lessonHref(l) {
    if ((l.res || []).length && IN_PAGE[l.res[0]]) { var ri = resource(l.res[0]); if (ri) return resHref(ri); }
    if ((l.res || []).length && !tx(l.video) && !tx(l.vimeo)) { var r = resource(l.res[0]); if (r) return resHref(r); }
    // activities and embodiments always open the activity itself, never an in-between lesson page
    if ((l.res || []).length && /^(activity|embodiment)/i.test(l.title || '')) { var ra = resource(l.res[0]); if (ra) return resHref(ra); }
    return '#Lesson-' + l.id;
  }
  // video length on the right of each lesson, so they know if it fits in right now (from Vimeo: Sync with Vimeo fills l.mins)
  function lessonMins(l) {
    if (l.mins) return { m: l.mins, sample: false };
    if (playground() && (tx(l.vimeo) || tx(l.video) || l.n != null)) { var h2 = 0; String(l.id || '').split('').forEach(function (c) { h2 = (h2 * 31 + c.charCodeAt(0)) % 997; }); return { m: 4 + h2 % 14, sample: true }; }
    return null;
  }
  function timeTag(l) {
    var t = lessonMins(l); if (!t) return null;
    return h('span', { class: 'bt-l-time' + (t.sample ? ' sample' : ''), title: t.sample ? 'Sample time: the real one comes from Vimeo' : 'Video length', 'aria-label': t.m + ' minute video', text: t.m + ' min' });
  }
  function isActivityCard(l) { return (l.res || []).length && ((!tx(l.video) && !tx(l.vimeo)) || /^(activity|embodiment)/i.test(l.title)); }
  function activityCard(l, li, dn) {
    var r = resource(l.res[0]); if (!r) return null;
    var hasVid = tx(l.video) || tx(l.vimeo);
    var card = li.open ? h('a', { class: 'bt-act' + (dn ? ' done' : ''), href: lessonHref(l), style: '--cv:' + (r.cover || '#FFF4EE') }) : h('div', { class: 'bt-act lock', style: '--cv:' + (r.cover || '#FFF4EE') });
    card.appendChild(h('span', { class: 'bt-act-art' }, [emblem(r.id)]));
    card.appendChild(h('span', { class: 'bt-act-b' }, [
      h('span', { class: 'bt-act-k', text: r.id === 'setup' ? 'Mini Course · ' + ((suCourse().time || '2 hours') + ' to complete lessons + videos') : l.title.replace(/:.*/, '') + (r.id === 'intent' && APP && APP.state.tier === 'private' ? ' · Must do before your first 1:1 call' : '') }),
      h('b', { text: r.title }),
      h('span', { class: 'bt-act-d', text: li.open ? (hasVid && !IN_PAGE[r.id] && lessonHref(l).indexOf('#Lesson-') === 0 ? 'Watch the video, then open ' + r.title + '.' : (r.desc || '')) : li.why }),
      li.open && !dn && skippedActs().some(function (x) { return x.l.id === l.id; }) ? h('span', { class: 'bt-act-wait', text: 'Keep coming back to this one. The doing creates the change.' }) : null
    ]));
    if (hasVid) { var at = timeTag(l), ab = card.querySelector('.bt-act-b'); if (at && ab) { at.className += ' on-card'; ab.appendChild(at); } }
    if (r.parts && r.parts.length && li.open) { var wrapP = h('div', { class: 'bt-act-group' }); setTimeout(function () { if (card.parentNode && !card.__grouped) { card.__grouped = true; card.parentNode.insertBefore(wrapP, card); wrapP.appendChild(card); wrapP.appendChild(h('div', { class: 'bt-act-parts' }, r.parts.map(function (pid) { var pr = resource(pid); if (!pr) return null; var op = pr.week <= 1 || isOpen(pr.week); return op ? h('a', { class: 'bt-act-part', href: resHref(pr) }, [emblem(pid), h('span', { text: pr.title })]) : h('span', { class: 'bt-act-part lock' }, [emblem(pid), h('span', { text: pr.title + ' · Week ' + pr.week })]); }))); } }, 0); }
    if (li.open) {
      var tick = h('button', { class: 'bt-act-tick' + (dn ? ' on' : ''), type: 'button', 'aria-pressed': dn ? 'true' : 'false', 'aria-label': dn ? 'Done' : 'Mark as done', title: dn ? 'Done' : 'Mark as done', onclick: function (e) {
        e.preventDefault(); e.stopPropagation(); markDone(l.id, !prog().done[l.id]); var y = window.scrollY; APP.reload(); window.scrollTo(0, y); setTimeout(celebrate, 300);
      } });
      tick.appendChild(icon('tick'));
      tick.appendChild(h('span', { text: dn ? 'Done' : 'Done?' }));
      card.appendChild(tick);
    } else card.appendChild(icon('lock', 'bt-act-lock'));
    return card;
  }
  var VP_LINE = { dose: 'Your daily happy hormones', breathe: 'Calm in a few breaths', pause: 'Little pockets of slow', move: 'Shake it out' };
  function vagalParts() {
    return h('div', { class: 'bt-vparts', role: 'list', 'aria-label': 'Inside the Vagal Tone Workout' }, ['dose', 'breathe', 'pause', 'move'].map(function (id) {
      var r = resource(id); if (!r) return null;
      return h('a', { class: 'bt-vp bt-vp-' + id, href: resHref(r), role: 'listitem' }, [emblem(id), h('span', { class: 'bt-vp-t' }, [h('b', { text: r.title }), h('span', { text: VP_LINE[id] })]), h('span', { class: 'bt-vp-go', 'aria-hidden': 'true', text: '→' })]);
    }));
  }
  function resHref(r) { return r.id === 'intent' ? '#Intentions' : (r.href || '#'); }
  function resChip(r, open) { return open === false ? h('span', { class: 'bt-chip lock' }, [icon('lock'), r.title]) : h('a', { class: 'bt-chip', href: resHref(r), text: r.title + ' →' }); }

  function vimeoEmbed(u) {
    var m, url; if (!tx(u)) return null;
    try { url = new URL(tx(u)); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\./, '');
    if (host === 'player.vimeo.com' && (m = url.pathname.match(/\/video\/(\d+)/))) return 'https://player.vimeo.com/video/' + m[1] + (url.searchParams.get('h') ? '?h=' + url.searchParams.get('h') + '&' : '?');
    if (/vimeo\.com$/.test(host) && (m = url.pathname.match(/^\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|video\/)?(\d+)(?:\/(\w+))?/))) return 'https://player.vimeo.com/video/' + m[1] + (m[2] ? '?h=' + m[2] + '&' : '?');
    var other = APP.embedUrl(tx(u)); return other ? other + (other.indexOf('?') >= 0 ? '&' : '?') : null;
  }
  var vimeoListener = null;
  function trackVimeo(iframe, id) {
    if (vimeoListener) window.removeEventListener('message', vimeoListener);
    var lastSave = 0, post = function (msg) { try { iframe.contentWindow.postMessage(JSON.stringify(msg), 'https://player.vimeo.com'); } catch (e) {} };
    vimeoListener = function (e) {
      if (e.origin !== 'https://player.vimeo.com' || e.source !== iframe.contentWindow) return;
      var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
      if (!d) return;
      if (d.event === 'ready') {
        ['timeupdate', 'ended'].forEach(function (ev) { post({ method: 'addEventListener', value: ev }); });
        var pos = prog().pos[id]; if (pos && pos > 5 && !prog().done[id]) post({ method: 'setCurrentTime', value: pos - 3 });
      }
      if (d.event === 'timeupdate' && d.data && Date.now() - lastSave > 4000) {
        lastSave = Date.now();
        var pct = Math.round(100 * (d.data.percent || 0));
        saveProg(function (p) { p.pct[id] = Math.max(p.pct[id] || 0, pct); p.pos[id] = d.data.seconds; p.last = id; p.lastAt = Date.now(); }); if (pct >= 95) videoFinished(id);
      }
      if (d.event === 'ended') videoFinished(id);
    };
    window.addEventListener('message', vimeoListener);
  }

  function videoBlock(l, id) {
    var src = vimeoEmbed(l.vimeo);
    if (src && !playground()) {
      var ifr = h('iframe', { src: src + 'title=0&byline=0&portrait=0&dnt=1&api=1&player_id=bt', allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media', allowfullscreen: 'true', title: l.title });
      if (/player\.vimeo\.com/.test(src)) trackVimeo(ifr, id);
      return h('div', { class: 'bt-video' }, [ifr]);
    }
    if (tx(l.video) && playground()) return h('div', { class: 'bt-video empty' }, [h('div', { class: 'bt-video-ph' }, [icon('play', 'bt-play'), h('span', { text: 'The video plays here in the real app.' })])]);
    if (tx(l.video) && /\.(mp4|m4v|mov|webm)(\?|$)/i.test(l.video)) {
      // placeholder until the Vimeo link is in: the lesson's existing video file
      var v = h('video', { controls: 'true', playsinline: 'true', preload: 'metadata', src: tx(l.video), title: l.title });
      var lastSave = 0;
      v.addEventListener('loadedmetadata', function () { var pos = prog().pos[id]; if (pos && pos > 5 && !prog().done[id] && pos < v.duration - 5) v.currentTime = pos - 3; });
      v.addEventListener('timeupdate', function () {
        if (Date.now() - lastSave < 4000 || !v.duration) return; lastSave = Date.now();
        var pct = Math.round(100 * v.currentTime / v.duration);
        saveProg(function (p) { p.pct[id] = Math.max(p.pct[id] || 0, pct); p.pos[id] = v.currentTime; p.last = id; p.lastAt = Date.now(); }); if (pct >= 95) videoFinished(id);
      });
      v.addEventListener('ended', function () { videoFinished(id); });
      v.addEventListener('error', function () { var ph = v.parentNode; if (ph) { ph.className = 'bt-video empty'; ph.innerHTML = ''; ph.appendChild(h('div', { class: 'bt-video-ph' }, [icon('play', 'bt-play'), h('span', { text: 'This video can’t play here yet. It’ll be swapped for the Vimeo version soon.' })])); } });
      return h('div', { class: 'bt-video' }, [v]);
    }
    return h('div', { class: 'bt-video empty' }, [h('div', { class: 'bt-video-ph' }, [
      icon('play', 'bt-play'),
      h('span', { text: src ? 'The video plays here in the real app.' : (l.res && l.res.length && !l.video ? 'This one’s an activity. Open it below.' : 'Video coming soon.') }),
      src && playground() ? h('a', { href: tx(l.vimeo), target: '_blank', rel: 'noopener', text: 'Open it on Vimeo' }) : null
    ])]);
  }
  // when they reach the end of a lesson video: a pop-up to mark it as done (once per visit)
  var finishedShown = {};
  function videoFinished(id) {
    if (finishedShown[id] || prog().done[id] || !findLesson(id) || document.getElementById('bt-vdone')) return;
    finishedShown[id] = true;
    var close = function () { var m = document.getElementById('bt-vdone'); if (m) m.remove(); };
    var box = h('div', { id: 'bt-vdone', class: 'bt-party', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Video finished', onclick: function (e) { if (e.target === box) close(); } }, [
      h('div', { class: 'bt-party-card bt-vdone-card' }, [
        h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close }),
        h('span', { class: 'bt-vdone-ic', 'aria-hidden': 'true', text: '🎉' }),
        h('h2', { text: 'That’s the video done!' }),
        h('p', { text: 'Mark it as done to unlock what’s next.' }),
        h('button', { class: 'bt-btn lime', type: 'button', text: 'Mark as done ✓', onclick: function () { close(); var b = document.getElementById('bt-done'); if (b && !prog().done[id]) b.click(); else markDone(id, true); } })
      ])
    ]);
    document.body.appendChild(box);
  }
  var onDone = null;
  function markDone(id, now) {
    saveProg(function (q) { q.done[id] = now; q.doneAt = q.doneAt || {}; if (now) { q.pct[id] = 100; q.doneAt[id] = q.doneAt[id] || Date.now(); } else delete q.doneAt[id]; });
    if (onDone) onDone(now);
  }

  function LessonView(root, id) {
    var f = findLesson(id);
    if (!f) { root.appendChild(pageHead('Course', 'Lesson not found')); root.appendChild(h('div', { class: 'bt-wrap' }, [back('Course', '#Course')])); waves(root); return; }
    var w = f.w, l = f.l, open = lessonOpen(id);
    var list = allLessons(), idx = list.map(function (x) { return x.l.id; }).indexOf(id), next = list[idx + 1], prev = list[idx - 1];
    var wrap = h('div', { class: 'bt-wrap bt-lesson' }, [back('Course', '#Course')]);
    var lt = lessonMins(l); wrap.appendChild(h('span', { class: 'bt-les-k', text: (w.week === 0 ? 'Introduction' : 'Week ' + w.week + ' · ' + w.title) + (lt ? ' · ' + lt.m + ' min video' : '') }));
    wrap.appendChild(h('h1', { class: 'bt-les-t', text: l.title }));
    if (!open) {
      wrap.appendChild(h('div', { class: 'bt-locked' }, [icon('lock'), h('b', { text: lessonWhy(id) }), h('span', { text: paceNote() }),
        upNext() ? h('a', { class: 'bt-btn lime', href: lessonHref(upNext().l), text: 'Go to ' + upNext().l.title }) : null]));
      root.appendChild(wrap); return;
    }
    saveProg(function (p) { p.last = id; p.lastAt = Date.now(); });
    var direct = lessonHref(l);
    if (direct.indexOf('#Lesson-') !== 0) { setTimeout(function () { if (direct.charAt(0) === '#') location.hash = direct; else if (window.parent !== window && window.parent.BT_OPEN) window.parent.BT_OPEN(direct.replace(/^\//, '')); else location.href = direct; }, 0); return; }
    wrap.appendChild(videoBlock(l, id));
    var p = prog(), nextSlot = h('span', { class: 'bt-next-slot' });
    var drawNext = function () {
      nextSlot.innerHTML = '';
      if (next && lessonOpen(next.l.id)) nextSlot.appendChild(h('a', { class: 'bt-btn', href: lessonHref(next.l), text: 'Next lesson →' }));
      else if (next && !prog().done[id] && !l.optional) nextSlot.appendChild(h('span', { class: 'bt-next-hint', text: 'Mark this as done to unlock the next lesson.' }));
      else if (next) nextSlot.appendChild(h('span', { class: 'bt-next-hint', text: 'Next: ' + next.l.title + ' · ' + lessonWhy(next.l.id) }));
    };
    var doneBtn = h('button', { id: 'bt-done', class: 'bt-btn ' + (p.done[id] ? 'ghost' : 'lime'), type: 'button', text: p.done[id] ? '✓ Done' : 'Mark as done', onclick: function () {
      if (prog().done[id]) { markDone(id, false); return; }
      saveNotebook();
      if (notebookEmpty()) nbNudge('top', function () { markDone(id, true); }); else markDone(id, true);
    } });
    onDone = function (now) {
      doneBtn.textContent = now ? '✓ Done' : 'Mark as done'; doneBtn.className = 'bt-btn ' + (now ? 'ghost' : 'lime'); drawNext();
      if (now && next && lessonOpen(next.l.id) && !leaving) APP.toast('Nice work. Unlocked: ' + next.l.title);
      if (now && !leaving) setTimeout(celebrate, 300);
    };
    drawNext();
    wrap.appendChild(h('div', { class: 'bt-les-actions' }, [doneBtn, nextSlot]));
    if (tx(l.desc) || tx(l.tip)) wrap.appendChild(h('div', { class: 'bt-desc' }, [h('p', { text: tx(l.desc) || tx(l.tip) })]));
    if (id === PROOF_LESSON) { wrap.appendChild(proofHome(false, true)); wrap.appendChild(h('a', { class: 'bt-btn ghost', href: '#Proof', text: 'Explore the proof part of your Becoming Book →' })); }
    var lres = (l.res || []).map(resource).filter(Boolean);
    // a lesson followed by an activity: show that activity here too, so they know what's coming
    var nextAct = next && isActivityCard(next.l) && !lres.length ? resource(next.l.res[0]) : null;
    if (lres.length) wrap.appendChild(h('section', { class: 'bt-lres' }, [h('h2', { text: lres.length > 1 ? 'Open the activities' : 'Open the activity' })].concat(lres.map(function (r) {
      return h('a', { class: 'bt-rcard', href: resHref(r), style: 'background:' + (r.cover || '#FFF4EE') }, [h('b', { text: r.title + ' →' }), h('span', { text: r.desc || '' })]);
    }))));
    else if (nextAct) wrap.appendChild(h('section', { class: 'bt-lres' }, [h('h2', { text: 'Your activity after this lesson' }), h('p', { class: 'bt-jr-s', text: 'Do your Becoming Notebook entry first, tap Done, and I’ll take you straight to it.' }),
      h('a', { class: 'bt-rcard', href: resHref(nextAct), style: 'background:' + (nextAct.cover || '#FFF4EE'), onclick: function () { if (!prog().done[id]) { leaving = true; saveNotebook(); markDone(id, true); } } }, [h('b', { text: nextAct.title + ' →' }), h('span', { text: nextAct.desc || '' })])]));
    // any lesson about DOSE / the happy chemicals: a way back to her saved DOSE page
    if (window.BT_VAGAL && !(l.res || []).some(function (r) { return r === 'dose'; }) && /\bDOSE\b|neurotransmitter|dopamine|oxytocin|serotonin|endorphin/i.test(l.title + ' ' + (l.desc || '') + ' ' + (l.tip || '')) && !(nextAct && nextAct.id === 'dose')) {
      try { var ddv = window.BT_VAGAL.doseData(); wrap.appendChild(h('a', { class: 'bt-dose-ln', href: '#Dose' }, [emblem('dose'), h('span', null, [h('b', { text: ddv.plan.length ? 'My DOSE menu + daily plan' : 'Your DOSE activity' }), h('span', { text: ddv.plan.length ? 'Everything you picked is saved here' : 'Build your menu of happy-chemical hits' })]), h('span', { 'aria-hidden': 'true', text: '→' })])); } catch (e) {}
    }
    // Becoming Notebook entry (same answers as the Becoming Notebook in My Book)
    var prompts = l.prompts || [], j = comp().j || {}, boxes = [];
    function saveNotebook() { boxes.forEach(function (b) { if ((comp().j || {})[b[0]] !== b[1].value) setJournal(b[0], b[1].value); }); }
    function notebookEmpty() { return prompts.length > 0 && boxes.some(function (b) { return /_\d+$/.test(b[0]) && !tx(b[1].value); }); }
    function goOn() {
      leaving = true; saveNotebook();
      if (!prog().done[id]) markDone(id, true);
      var nx = nextAfter(id), act = nx && isActivityCard(nx);
      try { sessionStorage.setItem('bt-scrollto', nx ? lessonHref(nx) : lessonHref(l)); if (act) sessionStorage.setItem('bt-scrollto-act', '1'); } catch (e) {}
      var pd = profileData(), wrote = prompts.length && boxes.some(function (b) { return tx(b[1].value); });
      if (wrote && !pd.nbTour) { pd.nbTour = Date.now(); wr(K.prof, pd); notebookTour(id, function () { setTimeout(celebrate, 400); goHref('#Course'); }); return; }
      goHref('#Course'); setTimeout(celebrate, 600);
    }
    function nbNudge(kind, later) {
      var old = document.getElementById('bt-nbn'); if (old) old.remove();
      var close = function () { var m = document.getElementById('bt-nbn'); if (m) m.remove(); };
      document.body.appendChild(h('div', { id: 'bt-nbn', class: 'bt-party', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Your Becoming Notebook entry' }, [
        h('div', { class: 'bt-party-card bt-vdone-card' }, [
          h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close }),
          h('span', { class: 'bt-vdone-ic', 'aria-hidden': 'true', text: '✎' }),
          h('h2', { text: kind === 'top' ? 'Don’t forget your Becoming Notebook entry' : 'You haven’t filled in your Becoming Notebook entry' }),
          h('p', { text: 'Writing it down is where the rewiring sticks. It only takes a couple of minutes.' }),
          h('div', { class: 'bt-row bt-nbn-btns' }, [
            h('button', { class: 'bt-btn ghost', type: 'button', text: 'Remind me later', onclick: function () { close(); later(); } }),
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Do it now', onclick: function () { close(); var jb = document.querySelector('.bt-jr'); if (jb) { jb.scrollIntoView({ behavior: 'smooth', block: 'start' }); var empty = boxes.filter(function (b) { return !tx(b[1].value); })[0]; setTimeout(function () { (empty ? empty[1] : boxes[0][1]).focus({ preventScroll: true }); }, 500); jb.classList.add('bt-here'); setTimeout(function () { jb.classList.remove('bt-here'); }, 2600); } } })
          ])
        ])
      ]));
    }
    var leaving = false;
    if (prompts.length || l.notes) {
      var jbox = h('section', { class: 'bt-jr' }, [h('span', { class: 'bt-jr-k', text: '✎ Becoming Notebook' }), h('h2', { text: 'Your Becoming Notebook entry' }), h('p', { class: 'bt-jr-s', text: 'Type straight in. It saves as you go and lives in your Becoming Notebook in My Book, so you can look back and see who you’re becoming.' })]);
      prompts.forEach(function (q, i) {
        var key = id + '_' + i, ta = h('textarea', { id: 'jq-' + key, rows: '4', placeholder: 'Write whatever comes up…' });
        ta.value = j[key] || ''; boxes.push([key, ta]);
        var t; ta.addEventListener('input', function () { clearTimeout(t); var v = ta.value; t = setTimeout(function () { setJournal(key, v); }, 400); });
        ta.addEventListener('blur', function () { setJournal(key, ta.value); });
        jbox.appendChild(h('label', { class: 'bt-q', for: 'jq-' + key }, [h('b', { text: q[0] }), q[1] ? h('span', { class: 'bt-q-n', text: q[1] }) : null]));
        jbox.appendChild(ta);
      });
      if (l.notes) {
        var nk = id + '_n', nt = h('textarea', { id: 'jq-' + nk, rows: '4', placeholder: 'Notes from this lesson…' }); nt.value = j[nk] || ''; boxes.push([nk, nt]);
        nt.addEventListener('input', function () { setJournal(nk, nt.value); });
        jbox.appendChild(h('label', { class: 'bt-q', for: 'jq-' + nk }, [h('b', { text: 'My notes' })])); jbox.appendChild(nt);
      }
      wrap.appendChild(jbox);
    }
    wrap.appendChild(notesBox({ lesson: id }));
    // a plain Done at the bottom: notebook entry → Done → on to what's next (the activity card, if there is one)
    wrap.appendChild(h('div', { class: 'bt-les-end' }, [h('button', { class: 'bt-btn lime bt-les-done', type: 'button', text: 'Done', onclick: function (e) {
      saveNotebook(); sparkleBurst(e.currentTarget);
      if (notebookEmpty()) nbNudge('done', goOn); else goOn();
    } })]));
    wrap.appendChild(h('div', { class: 'bt-les-nav' }, [
      prev ? h('a', { href: lessonHref(prev.l), text: '← ' + prev.l.title }) : h('span'),
      next && lessonOpen(next.l.id) ? h('a', { href: lessonHref(next.l), text: next.l.title + ' →' }) : null
    ]));
    root.appendChild(wrap);
  }

  /* Routes that show the home view on a particular tab or page (#Journal, #Resources, #Setup, #Intentions) */
  /* ---------------- Mini course: Set yourself up for success ----------------
     9 short lessons (Intro + Steps 1–8), one video each, with that step's activity under the video.
     Built so it can also run on its own later as a free mini course: its lessons live in course().mini.setup
     (videos set in the coach dashboard), and progress is kept in the companion data (cmn-companion .su). */
  var SU_LESSON = 'i3'; // its card in the Breakthrough course
  function suDef() { var D = window.BT_COURSE_DEFAULT || {}; return JSON.parse(JSON.stringify((D.mini && D.mini.setup) || { title: 'Set yourself up for success', lessons: [] })); }
  function suCourse() {
    var c = course(), m = c.mini && c.mini.setup, d = suDef();
    if (!m || !(m.lessons || []).length) return d;
    // keep the built-in titles/text, take her video links from the saved course
    var byId = {}; m.lessons.forEach(function (l) { byId[l.id] = l; });
    d.lessons.forEach(function (l) { var s2 = byId[l.id]; if (s2) { if (tx(s2.vimeo)) l.vimeo = s2.vimeo; if (s2.mins) l.mins = s2.mins; if (tx(s2.title)) l.title = s2.title; if (s2.desc != null && tx(s2.desc)) l.desc = s2.desc; } });
    return d;
  }
  var suInst = null;
  function suDone() { return Object.assign({}, comp().su || {}); }
  function suStats() { var L = suCourse().lessons, d = suDone(), n = L.filter(function (l) { return d[l.n]; }).length; return { done: n, total: L.length, all: L.length > 0 && n === L.length }; }
  function suMark(n, on) {
    var d = suDone(); if (on) d[n] = d[n] || Date.now(); else delete d[n];
    var patch = { su: d };
    if (n >= 1 && n <= 5) { var old = Object.assign({}, comp().done || {}); if (on) old[n] = true; else delete old[n]; patch.done = old; }
    if (suInst && !suInst._dead) suInst.save(patch); else { var c = comp(); Object.keys(patch).forEach(function (k) { c[k] = patch[k]; }); wr(K.comp, c); }
    var st = suStats();
    if (st.all && findLesson(SU_LESSON) && !prog().done[SU_LESSON]) saveProg(function (q) { q.done[SU_LESSON] = true; q.pct[SU_LESSON] = 100; q.doneAt = q.doneAt || {}; q.doneAt[SU_LESSON] = q.doneAt[SU_LESSON] || Date.now(); });
    return st;
  }
  function suBar(st) {
    return h('div', { class: 'bt-su-prog' }, [
      h('div', { class: 'bt-su-prog-t' }, [h('span', { text: st.all ? 'Mini course complete' : 'Your progress' }), h('b', { text: st.done + ' of ' + st.total + ' done' })]),
      h('div', { class: 'bt-su-segs', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(st.total), 'aria-valuenow': String(st.done), 'aria-label': st.done + ' of ' + st.total + ' lessons done' },
        suCourse().lessons.map(function (l) { return h('span', { class: suDone()[l.n] ? 'on' : '' }); }))
    ]);
  }
  function suIntentCard(st) {
    var r = resource('intent') || { title: 'Setting Intentions', desc: '' };
    return h('a', { class: 'bt-act bt-su-next' + (st.all ? ' ready' : ''), href: '#Intentions', style: '--cv:#F1F9A6' }, [
      h('span', { class: 'bt-act-art' }, [emblem('intent')]),
      h('span', { class: 'bt-act-b' }, [h('span', { class: 'bt-act-k', text: st.all ? 'Up next · your first activity' : 'When you’ve finished · try this next' }), h('b', { text: 'Try the Setting Intentions activity' }),
        h('span', { class: 'bt-act-d', text: 'Anchor into why you signed up: write your North Star and your why, and turn them into your lock screen.' })]),
      h('span', { class: 'bt-su-go', 'aria-hidden': 'true', text: '→' })
    ]);
  }
  function SetupView(root, arg) {
    if (arg !== '' && arg != null && !isNaN(+arg)) return SetupLessonView(root, +arg);
    var M = suCourse(), st = suStats(), d = suDone(), up = M.lessons.filter(function (l) { return !d[l.n]; })[0];
    root.appendChild(pageHead('Mini Course' + (M.time ? ' · ' + M.time + ' to complete' : ''), M.title, M.lessons.length + ' short videos · do each step as you go'));
    var wrap = h('div', { class: 'bt-wrap bt-su' }, [back('Course', '#Course'), suBar(st)]);
    if (st.all) wrap.appendChild(h('div', { class: 'bt-su-done' }, [h('span', { class: 'bt-su-done-ic', 'aria-hidden': 'true', text: '🎉' }), h('div', null, [h('b', { text: 'You’re set up for success!' }), h('span', { text: 'Come back to any lesson whenever you’ve been avoiding the course or you’ve lapsed.' })])]));
    else if (up) wrap.appendChild(h('a', { class: 'bt-btn lime bt-su-cont', href: '#Setup-' + up.n, text: (st.done ? 'Keep going: ' : 'Start: ') + up.title + ' →' }));
    wrap.appendChild(h('p', { class: 'bt-course-note', text: M.intro || 'As I go through each step, pause the video and actually do the thing. The activity for each step is right under its video.' }));
    var box = h('section', { class: 'bt-wk bt-su-list', 'aria-label': 'Lessons' });
    var list = h('div', { class: 'bt-ls' });
    M.lessons.forEach(function (l) {
      var dn = !!d[l.n], cur = up && up.n === l.n, pc = dn ? 100 : (prog().pct['su' + l.n] || 0);
      var row = h('a', { class: 'bt-l' + (dn ? ' done' : '') + (cur ? ' cur' : ''), href: '#Setup-' + l.n });
      if (cur) row.setAttribute('aria-label', 'You’re up to: ' + l.title);
      row.appendChild(icon(dn ? 'tick' : 'play', 'bt-l-ic'));
      row.appendChild(h('span', { class: 'bt-l-t' }, [h('span', { text: l.title }), h('span', { class: 'bt-l-mins', text: l.sub }),
        pc > 0 && !dn ? h('span', { class: 'bt-bar sm' }, [h('span', { style: 'width:' + pc + '%' })]) : null]));
      var tt = timeTag(l); if (tt) row.appendChild(tt);
      list.appendChild(row);
    });
    box.appendChild(list); wrap.appendChild(box);
    wrap.appendChild(suIntentCard(st));
    root.appendChild(wrap); waves(root);
    if (st.all) setTimeout(celebrate, 400);
  }
  function SetupLessonView(root, n) {
    var M = suCourse(), L = M.lessons, i = L.map(function (l) { return l.n; }).indexOf(n), l = L[i];
    if (!l) { goHref('#Setup'); return; }
    var next = L[i + 1], prev = L[i - 1], id = 'su' + n;
    saveProg(function (p) { p.suLast = n; });
    var wrap = h('div', { class: 'bt-wrap bt-lesson bt-su' }, [back('All lessons', '#Setup')]);
    var barSlot = h('div'); barSlot.appendChild(suBar(suStats())); wrap.appendChild(barSlot);
    var slt = lessonMins(l); wrap.appendChild(h('span', { class: 'bt-les-k', text: M.title + ' · ' + (i + 1) + ' of ' + L.length + (slt ? ' · ' + slt.m + ' min video' : '') }));
    wrap.appendChild(h('h1', { class: 'bt-les-t', text: l.title }));
    wrap.appendChild(videoBlock(l, id));
    if (tx(l.desc)) wrap.appendChild(h('div', { class: 'bt-desc' }, [h('p', { text: tx(l.desc) })]));
    // this step's activity, straight from the set-up page
    var act = h('div', { class: 'bt-su-act' }); wrap.appendChild(act);
    var v = APP.views && APP.views['Dashboard.dc.html'], tpl = v && document.getElementById('t-' + v.slug);
    if (v && tpl) {
      var vroot = h('div', { id: 'v-' + v.slug, class: 'bt-su-embed' }); act.appendChild(vroot);
      window.BT_START_VIEW = 'setup'; window.BT_START_TAB = 'home';
      var inst = new v.cls(Object.assign({}, APP.viewProps('Dashboard.dc.html'), { embed: true, setupStep: n }));
      inst._root = vroot; inst._tpl = Array.prototype.slice.call(tpl.content.childNodes); inst._render(); if (inst.componentDidMount) inst.componentDidMount();
      suInst = inst;
    }
    var nextSlot = h('span', { class: 'bt-next-slot' });
    var doneBtn = h('button', { class: 'bt-btn', type: 'button' });
    var draw = function () {
      var dn = !!suDone()[n];
      doneBtn.textContent = dn ? '✓ Done' : (next ? 'Done, next lesson →' : 'Done, finish the mini course →'); doneBtn.className = 'bt-btn ' + (dn ? 'ghost' : 'lime');
      nextSlot.innerHTML = '';
      if (dn && next) nextSlot.appendChild(h('a', { class: 'bt-btn', href: '#Setup-' + next.n, text: 'Next: ' + next.title + ' →' }));
      else if (dn && !next) nextSlot.appendChild(h('a', { class: 'bt-btn', href: '#Setup', text: 'Back to all lessons' }));
      barSlot.innerHTML = ''; barSlot.appendChild(suBar(suStats()));
    };
    doneBtn.addEventListener('click', function () {
      if (suDone()[n]) { suMark(n, false); draw(); return; }
      var st = suMark(n, true);
      if (st.all) { goHref('#Setup'); return; }
      if (next) { APP.toast('Nice work. Up next: ' + next.title); goHref('#Setup-' + next.n); } else { goHref('#Setup'); }
    });
    draw();
    wrap.appendChild(h('div', { class: 'bt-les-actions bt-su-actions' }, [doneBtn, nextSlot]));
    if (!next) wrap.appendChild(suIntentCard(suStats()));
    root.appendChild(wrap);
  }
  // "I am ready to change my world" inside lesson 8: that lesson's done
  function suReady() { var st = suMark(8, true); goHref('#Setup'); return st; }

  function homeOn(tab, view) { return { view: 'Dashboard.dc.html', before: function () { window.BT_START_TAB = tab || null; window.BT_START_VIEW = view || null; } }; }

  /* ---------------- The Becoming Book ----------------
     Her whole journey, dated: milestones, activities she saved, journal answers, wins, proof she's
     collected, and "before vs now" where her answers have changed. */
  var KINDS = {
    milestone: ['Milestone', '#6B1510', 'star'], activity: ['Activity', '#F4C2F7', 'tick'], journal: ['Notebook entry', '#FFF4EE', 'play'],
    win: ['Wins & joy', '#E4F27A', 'star'], proof: ['Proof', '#E4F27A', 'tick'], vagal: ['Vagal tone', '#BFE3D0', 'play'], change: ['Before & now', '#F28C3B', 'star'], note: ['My note', '#F1F9A6', 'play']
  };
  function parseDate(v) { if (!v) return null; var n = typeof v === 'number' ? v : Date.parse(v); return isNaN(n) ? null : n; }
  /* ---------------- My notes: sticky notes on any lesson, on Home, and in the Becoming Book ----------------
     Stored in bt-notes: { list: [{ id, at, edited, lesson, title, text }] }. Each note is a page in the Becoming Book. */
  var NOTE_COLS = ['#F1F9A6', '#F4C2F7', '#FFD9C2', '#CDEFC0', '#D8E8FA'];
  function notesAll() { var d = rd(K.notes) || {}; return Array.isArray(d.list) ? d.list : []; }
  function notesSave(list) { wr(K.notes, { list: list }); }
  function noteUpsert(n) { var list = notesAll(), i = -1; list.forEach(function (x, k) { if (x.id === n.id) i = k; }); if (i >= 0) list[i] = n; else list.push(n); notesSave(list); }
  function noteRemove(id) { notesSave(notesAll().filter(function (x) { return x.id !== id; })); }
  function noteWhere(n) { var f = n.lesson ? findLesson(n.lesson) : null; return f ? (f.w.week === 0 ? 'Introduction' : 'Week ' + f.w.week) + ' · ' + f.l.title : ''; }
  function noteColour(n) { var x = 0; String(n.id).split('').forEach(function (c) { x = (x * 31 + c.charCodeAt(0)) % 997; }); return NOTE_COLS[x % NOTE_COLS.length]; }
  function noteDate(t) { return new Date(t).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  // one sticky note, with Edit (and Remove) right on it
  function stickyNote(n, onChange, showWhere) {
    var c = h('article', { class: 'bt-sticky', style: '--nc:' + noteColour(n) + ';--rot:' + ((parseInt(String(n.id).slice(-2), 10) || 0) % 5 - 2) + 'deg' });
    function view() {
      c.innerHTML = ''; c.classList.remove('editing');
      c.appendChild(h('span', { class: 'bt-sticky-pin', 'aria-hidden': 'true' }));
      c.appendChild(h('span', { class: 'bt-sticky-d', text: noteDate(n.at) + (n.edited ? ' · edited' : '') }));
      if (tx(n.title)) c.appendChild(h('b', { class: 'bt-sticky-t', text: n.title }));
      c.appendChild(h('p', { class: 'bt-sticky-x', text: n.text }));
      // where it was written: a link straight back to that video (or activity)
      var fw = showWhere && n.lesson ? findLesson(n.lesson) : null;
      if (fw) { var act = isActivityCard(fw.l); c.appendChild(h('a', { class: 'bt-sticky-w', href: act ? lessonHref(fw.l) : '#Lesson-' + fw.l.id }, [h('span', { class: 'bt-sticky-wi', 'aria-hidden': 'true', text: act ? '◆' : '▶' }), h('span', { text: (act ? 'Activity: ' : 'Watch again: ') + fw.l.title + ' · ' + (fw.w.week === 0 ? 'Introduction' : 'Week ' + fw.w.week) + ' →' })])); }
      var rm = h('button', { class: 'bt-sticky-b rm', type: 'button', text: 'Remove', onclick: function () { if (!rm.dataset.sure) { rm.dataset.sure = 1; rm.textContent = 'Tap again to remove'; return; } noteRemove(n.id); if (onChange) onChange(); } });
      c.appendChild(h('div', { class: 'bt-sticky-acts' }, [h('button', { class: 'bt-sticky-b', type: 'button', text: 'Edit ✎', onclick: edit }), rm]));
    }
    function edit() {
      c.innerHTML = ''; c.classList.add('editing');
      var ti = h('input', { class: 'bt-in bt-note-ti', type: 'text', maxlength: '80', placeholder: 'Title', 'aria-label': 'Note title', value: n.title || '' });
      var ta = h('textarea', { class: 'bt-in bt-note-ta', rows: '4', 'aria-label': 'Your note' }); ta.value = n.text || '';
      c.appendChild(ti); c.appendChild(ta);
      c.appendChild(h('div', { class: 'bt-sticky-acts' }, [
        h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Save', onclick: function () { var v = tx(ta.value); if (!v) { ta.focus(); return; } n = Object.assign({}, n, { title: tx(ti.value), text: v, edited: Date.now() }); noteUpsert(n); APP.toast('Note saved. It’s in your Becoming Book too.'); view(); if (onChange) onChange(); } }),
        h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Cancel', onclick: view })
      ]));
      setTimeout(function () { ta.focus(); }, 30);
    }
    view();
    return c;
  }
  // the "add a note" box: on a lesson (opts.lesson), on Home (opts.home, folded up) and in the Becoming Book (opts.book)
  function notesBox(opts) {
    opts = opts || {};
    var sec = h('section', { class: 'bt-notes' + (opts.home ? ' home' : '') + (opts.book ? ' book' : '') });
    var wall = h('div', { class: 'bt-sticky-wall' });
    function mine() { var l = notesAll(); if (opts.lesson) l = l.filter(function (x) { return x.lesson === opts.lesson; }); return l.sort(function (a, b) { return b.at - a.at; }); }
    function drawWall(fresh) {
      wall.innerHTML = '';
      var l = mine(); if (opts.home) l = l.slice(0, 3); if (opts.book) l = [];
      l.forEach(function (n) { var st = stickyNote(n, function () { drawWall(); if (opts.onChange) opts.onChange(); }, !opts.lesson); if (fresh && n.id === fresh) st.classList.add('new'); wall.appendChild(st); });
      if (opts.home && notesAll().length > 3) wall.appendChild(h('a', { class: 'bt-sticky-more', href: '#Book', onclick: function () { bookState.tab = 'note'; bookState.q = ''; bookState.day = ''; }, text: 'All ' + notesAll().length + ' notes in my Becoming Book →' }));
    }
    var ti = h('input', { class: 'bt-in bt-note-ti', type: 'text', maxlength: '80', placeholder: opts.lesson ? 'Title (e.g. the big lightbulb moment)' : 'Title', 'aria-label': 'Note title' });
    var ta = h('textarea', { class: 'bt-in bt-note-ta', rows: '3', placeholder: 'Write anything you want to remember…', 'aria-label': 'Your note' });
    var post = h('button', { class: 'bt-btn lime', type: 'button', text: 'Post note', onclick: function (e) {
      var v = tx(ta.value); if (!v) { ta.focus(); APP.toast('Write your note first ✎'); return; }
      var n = { id: String(Date.now()), at: Date.now(), lesson: opts.lesson || '', title: tx(ti.value) || (opts.lesson && findLesson(opts.lesson) ? findLesson(opts.lesson).l.title : 'A note to self'), text: v };
      noteUpsert(n); ti.value = ''; ta.value = ''; try { sparkleBurst(e.currentTarget); } catch (x) {}
      APP.toast(opts.book ? 'Posted! It’s in your Becoming Book.' : 'Posted! It’s in your Becoming Book too.');
      drawWall(n.id); if (opts.onChange) opts.onChange();
      if (opts.home) { form.hidden = true; open.textContent = '+ Add a note'; }
    } });
    var form = h('div', { class: 'bt-note-form' }, [ti, ta, h('div', { class: 'bt-row' }, [post])]);
    var head = h('div', { class: 'bt-notes-h' }, [h('span', { class: 'bt-jr-k', text: '✎ My notes' }), h('h2', { text: opts.lesson ? 'Notes on this lesson' : opts.book ? 'Add a note to your book' : 'Jot something down' }),
      h('p', { class: 'bt-jr-s', text: opts.lesson ? 'Anything you want to remember. Post it and it sticks here, dated, and goes in your Becoming Book. Add as many as you like.' : 'A thought, a lightbulb moment, something to bring to your next call. It goes straight into your Becoming Book.' })]);
    if (opts.home) {
      // a little sticky note with a pencil, so the box is easy to spot on Home
      var art = h('span', { class: 'bt-notes-art', 'aria-hidden': 'true' });
      art.innerHTML = '<svg viewBox="0 0 96 96"><g class="nt-pad"><path d="M18 20 h56 v44 l-14 14 h-42 z" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.5" stroke-linejoin="round"/><path d="M74 64 h-14 v14" fill="#E4EC86" stroke="#1F1412" stroke-width="2.5" stroke-linejoin="round"/>'
        + '<rect x="34" y="12" width="26" height="12" rx="2" fill="#F4C2F7" opacity=".9" transform="rotate(-6 47 18)"/>'
        + '<path class="nt-l1" d="M28 38 h34" stroke="#B5281E" stroke-width="2.5" stroke-linecap="round"/><path class="nt-l2" d="M28 48 h28" stroke="#B5281E" stroke-width="2.5" stroke-linecap="round"/><path class="nt-l3" d="M28 58 h18" stroke="#B5281E" stroke-width="2.5" stroke-linecap="round"/></g>'
        + '<g class="nt-pen"><path d="M70 30 l14 -14 l6 6 l-14 14 z" fill="#E8338A" stroke="#1F1412" stroke-width="2" stroke-linejoin="round"/><path d="M70 30 l-4 10 l10 -4 z" fill="#FFE3C2" stroke="#1F1412" stroke-width="2" stroke-linejoin="round"/></g></svg>';
      head.insertBefore(art, head.firstChild); head.classList.add('has-art');
    }
    sec.appendChild(head);
    if (opts.home) {
      form.hidden = true;
      var open = h('button', { class: 'bt-btn ghost bt-note-open', type: 'button', text: '+ Add a note', onclick: function () { form.hidden = !form.hidden; open.textContent = form.hidden ? '+ Add a note' : 'Close'; if (!form.hidden) setTimeout(function () { ti.focus(); }, 30); } });
      sec.appendChild(open);
    }
    sec.appendChild(form); sec.appendChild(wall);
    drawWall();
    return sec;
  }
  function bookEntries() {
    var out = [], p = prog(), doneAt = p.doneAt || {}, cheered = p.cheered || {};
    var push = function (e) { out.push(e); };
    push({ kind: 'milestone', at: startDate().getTime(), title: 'You started your Breakthrough', text: 'Day one. The decision that changes everything.' });
    course().weeks.forEach(function (w) {
      var ls = w.lessons || []; if (!ls.length || !ls.every(function (l) { return p.done[l.id]; })) return;
      var at = Math.max.apply(null, ls.map(function (l) { return doneAt[l.id] || 0; })) || (typeof cheered[w.week] === 'number' ? cheered[w.week] : null);
      push({ kind: 'milestone', at: at || null, title: (w.week === 0 ? 'Introduction' : 'Week ' + w.week + ': ' + w.title) + ' complete', text: ls.length + ' lessons done.' });
    });
    var st = stats(); if (st.total && st.done === st.total) push({ kind: 'milestone', at: typeof cheered.all === 'number' ? cheered.all : null, title: 'You finished the whole program', text: 'Every lesson. Every question. You did it.' });
    if (APP.state.tier === 'private') {
      var one = rd(K.one) || {}, rep = rd(K.rep);
      if (rep && rep.ranks) push({ kind: 'milestone', at: parseDate(rep.date), title: 'Representational System Test done', text: 'You learned how your brain takes things in.', href: '#RepTest' });
      if (one.hd && one.hd.type !== 'skip') push({ kind: 'milestone', at: parseDate(one.hd.date), title: 'Human Design chart added', img: one.hd.type === 'image' ? one.hd.data : '' });
      if (one.disc) push({ kind: 'milestone', at: parseDate(one.disc.date), title: 'DISC profile added', img: one.disc.type === 'image' ? one.disc.data : '' });
    }
    if (window.BT_VAGAL && window.BT_VAGAL.bookEntries) { try { window.BT_VAGAL.bookEntries().forEach(push); } catch (e) {} }
    if (window.BT_SAVES) window.BT_SAVES.list().forEach(function (x) { push({ kind: 'activity', at: x.at, title: x.title, text: ((window.BT_SAVES.tools[x.tool] || {}).name || ''), item: x, img: x.img || '', res: { 'what-if-workout': 'whatif', 'rewind': 'rewind', 'coming-home': 'comehome', 'emotional-blueprint': 'blueprint', 'breaking-out': 'box' }[x.tool] || '' }); });
    notesAll().forEach(function (n) { push({ kind: 'note', at: n.at, title: tx(n.title) || 'A note to self', text: n.text, sub: noteWhere(n), note: n }); });
    var j = comp().j || {}, jl = rd(K.jlog) || {}, idx = {};
    allLessons().forEach(function (x) { idx[x.l.id] = x; });
    Object.keys(j).forEach(function (key) {
      var val = tx(j[key]); if (!val) return;
      var m = /^(.*)_(\d+|n)$/.exec(key); if (!m) return;
      var f = idx[m[1]], q = m[2] === 'n' ? 'My notes' : f && f.l.prompts && f.l.prompts[+m[2]] ? f.l.prompts[+m[2]][0] : 'Becoming Notebook entry';
      var log = jl[key] || {};
      push({ kind: 'journal', key: key, at: log.at || null, title: q, text: val, sub: f ? f.l.title : '', lesson: f ? f.l.id : '' });
      if (log.first && tx(log.first) !== val && log.firstAt) push({ kind: 'change', key: key, at: log.at || null, title: q, before: log.first, beforeAt: log.firstAt, text: val, sub: f ? f.l.title : '' });
    });
    var evIdx = {}; evidence().forEach(function (e) { evIdx[e.id] = e; });
    evidence().forEach(function (e) {
      var base = e.builds && evIdx[e.builds], ba = base && evAt(base);
      push({ kind: e.win ? 'win' : 'proof', spark: e.spark || 'win', at: evAt(e), title: e.text, img: e.photo || '', id: e.id,
        sub: base ? 'More proof on top of your win from ' + (ba ? new Date(ba).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'before') : (e.proves || []).length ? 'Proof that ' + e.proves.slice(0, 3).join(', ') + (e.proves.length > 3 ? ' +' + (e.proves.length - 3) + ' more' : '') + ((e.beliefs || []).length > 1 ? ' · busts ' + e.beliefs.length + ' old beliefs' : '') : e.belief ? 'Proof against: ' + String(e.belief).replace(/[-_]+/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }) : e.win ? (SPARK[e.spark] || SPARK.win)[0] + ((e.proves || []).length ? ' · proof that ' + e.proves.slice(0, 3).join(', ') + (e.proves.length > 3 ? ' +' + (e.proves.length - 3) : '') : '') : 'Proof portfolio' });
    });
    return out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }
  function setJournal(key, val) { var c = comp(); c.j = c.j || {}; c.j[key] = val; wr(K.comp, c); }
  function journalEditor(key, val, onDone) {
    var ta = h('textarea', { class: 'bt-in bk-ta', rows: '4', 'aria-label': 'Your answer' }); ta.value = val || '';
    return h('div', { class: 'bk-edit' }, [ta, h('div', { class: 'bt-row' }, [
      h('button', { class: 'bt-btn lime', type: 'button', text: 'Save', onclick: function () { var v = tx(ta.value); setJournal(key, v); APP.toast('Saved to your Becoming Notebook. It’s under the lesson too.'); onDone(); } }),
      val ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Cancel', onclick: function () { onDone(true); } }) : null])]);
  }
  function waitingPrompts() {
    var j = comp().j || {}, out = [];
    openLessons().forEach(function (x) { (x.l.prompts || []).forEach(function (p, i) { var k = x.l.id + '_' + i; if (!tx(j[k])) out.push({ key: k, q: p[0], lesson: x.l }); }); });
    return out;
  }
  var bookState = { tab: 'all', q: '', day: '', month: null, range: 'all', from: '', to: '' };
  /* ---------------- app tour: first time in, before the start-here steps ---------------- */
  // A short, calm tour: just the four places they'll use. Nothing that won't make sense yet.
  function tourSteps() {
    var one = APP.state.tier === 'private', first = tx((APP.state.profile || {}).full_name).split(' ')[0];
    var reps = 'Today’s reps: the key to rewiring. One tap each day for your DOSE, breathwork, a pause, moving your body, water and a win. Each part switches on as you do its activity in Week 1, and every tick lands in My Book as evidence you’re growing.';
    var steps = [
      { route: '#Dashboard', title: 'Nice work' + (first ? ', ' + first : '') + '!', text: (one ? 'You’ve finished the Introduction. ' : 'You’ve done the start-here bit. ') + 'Now a proper look around: every page, each part of it, and how it all connects. About two minutes.', photo: true },
      { route: '#Dashboard', sel: '#bt-top .bt-top-in', title: 'Your menu', text: 'Four places: Home, Course, My Book and Resources. Your profile is the circle on the right. It’s always at the top, wherever you are.' },
      { route: '#Dashboard', sel: '#app header', title: 'Home', text: 'Home is your daily base. Open the app, start here. Let’s scroll down and see what’s on it.' },
      { route: '#Dashboard', sel: '.bt-onebox', title: 'Your 1:1 bits', text: 'Anything to do with our 1:1 work shows up here first.' },
      { route: '#Dashboard', sel: '.bt-cont', title: 'Your next step', text: 'Your next lesson always sits right here, so you never have to hunt for your place. Tap it and it takes you straight into that lesson in the Course.' },
      { route: '#Dashboard', sel: '.rp', title: 'Today’s reps', text: reps },
      { route: '#Dashboard', sel: '.bt-proof', title: 'Your proof portfolio', text: 'Opens in Week 2. Proof that you’re changing (wins, joy, things you did differently) goes in here and builds up in My Book.' },
      { route: '#Dashboard', sel: '.bt-rem', title: 'Open loops', text: 'Gentle nudges for anything you started and didn’t finish: a notebook entry waiting, an activity to come back to. Tap one and it takes you there. Swipe it away with the ✕.' },
      { route: '#Dashboard', sel: '#bt-top a[href="#Course"]', title: 'Next: your Course', text: 'This is where all the lessons live. Let’s go.' },
      { route: '#Course', sel: '.bt-jy', title: 'Your learning journey', text: 'Where you are, where you’re heading, and how far you’ve come. It fills up as you tick lessons off.' },
      { route: '#Course', sel: '#app .bt-cont', title: 'Pick up where you left off', text: 'The same next step you saw on Home. Home and Course always point at the same place.' },
      { route: '#Course', pick: function () { var c = document.querySelector('#app .bt-l.cur'), d = c && c.closest('details.bt-wk'); d = d || document.querySelector('details.bt-wk:not(.lock)'); if (d && !d.open) d.open = true; return d; }, title: 'Your weeks', text: 'Every lesson, in order. The videos are the lessons. The coloured cards with a little drawing are activities: that’s where you do the work, and they live in Resources too. Your current lesson has the pulsing red play button.' },
      { route: '#Course', sel: 'details.bt-wk.lock', title: 'What’s still to come', text: one ? 'Each new week opens for you as we go. You’ll get a little celebration when it does.' : 'Each lesson opens when you finish the one before, and the weeks open as you go.' },
      { route: '#Course', sel: '#bt-top a[href="#Book"]', title: 'Next: My Book', text: 'Your Becoming Book. This is where everything you do ends up.' },
      { route: '#Book', sel: '.bt-bkh', title: 'Your Becoming Book', text: 'The story of who you’re becoming, written as you go. You don’t have to add anything here yourself: it fills up from everything else.' },
      { route: '#Book', sel: '.bk-cal', title: 'Your calendar', text: 'Every day you show up gets marked. Tap a day to see exactly what you did.' },
      { route: '#Book', sel: '.bk-tabs', title: 'Find anything', text: 'Filter it: your Becoming Notebook entries (the questions under each lesson), wins, proof, your daily reps, saved activities and milestones.' },
      { route: '#Book', sel: '.bk-pages', title: 'Every page, dated', text: 'Newest first. Change your mind about a notebook entry? Edit it here, and it changes under the lesson too.' },
      { route: '#Book', sel: '#bt-top a[href="#Resources"]', title: 'Next: Resources', text: 'Your toolbox.' },
      { route: '#Resources', sel: '.srch', title: 'What’s going on for you?', text: 'Not sure what you need? Type how you’re feeling (or tap one) and it points you to the tool that helps.' },
      { route: '#Resources', sel: '#app section.rs', title: 'Every tool you unlock', text: 'Each activity from the Course lives here too, so you can come back to it any time, not just during the lesson. Locked ones open as you reach them.' },
      { route: '#Resources', sel: '#bt-top .bt-top-av', title: 'Last stop: your profile', text: 'Tap the circle any time.' },
      { route: '#Profile', sel: '.bt-pro-av', title: 'Your profile', text: 'Your photo (or character) and name.' },
      { route: '#Profile', find: ['section.bt-card2', /Notifications/], title: 'Reminders', text: 'Turn on a daily reminder to your phone, at the time that suits you.' },
      { route: '#Profile', sel: '.bt-calls', title: 'Your calls with me', text: 'Your call times and Zoom link live here. Zoom works best on a laptop: log in to the app on your computer and open the link from there.' },
      { route: '#Profile', find: ['section.bt-card2', /app tour/i], title: 'This tour lives here', text: 'Want to see it again? It’s right here.' }
    ];
    if (one) steps.push({ route: '#Course', title: 'Want to start Week 1?', text: 'Everything’s unlocked now. You don’t need to start Week 1 before our first call, but you can if you’d like a head start. Totally up to you.', last: true, cta: 'Yes, start Week 1 →', alt: 'Not yet, I’ll wait for our call' });
    else steps.push({ route: '#Course', title: 'That’s it!', text: 'Now you know where everything lives and how it connects. Let’s start your next lesson.', last: true });
    return steps;
  }
  function appTour() {
    runTour(tourSteps(), {
      kicker: 'How it works', id: 'app',
      finish: function () { var d = profileData(); d.tourDone = Date.now(); wr(K.prof, d); },
      skip: function () { if (location.hash !== '#Course') goHref('#Course'); else APP.reload(); },
      last: function (st) { var nx = upNext(); if (st.alt) { var w1 = allLessons().filter(function (x) { return x.w.week === 1; })[0]; if (w1) nx = w1; } try { if (nx) sessionStorage.setItem('bt-scrollto', lessonHref(nx.l)); } catch (x) {} if (location.hash === '#Course') APP.reload(); else goHref('#Course'); },
      alt: function () { goHref('#Dashboard'); }
    });
  }
  // the tour engine: one step at a time, it goes to the page, scrolls to the part and lights it up
  // step: { route, sel | find:[sel, /text/], title, text, photo, before(), last, cta, alt, noSkip }
  function tourTarget(st) {
    if (st.pick) return st.pick();
    if (st.find) { var all = document.querySelectorAll(st.find[0]); for (var i = 0; i < all.length; i++) if (st.find[1].test(all[i].textContent)) return all[i]; return null; }
    return st.sel ? document.querySelector(st.sel) : null;
  }
  function runTour(steps, o) {
    o = o || {};
    if (document.getElementById('bt-tour')) return;
    var ask0 = document.getElementById('bt-tourask'); if (ask0) ask0.remove();
    var i = 0, back = false, ov = h('div', { id: 'bt-tour', class: 'bt-tour', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.label || 'How the app works' });
    var spot = h('div', { class: 'bt-tour-spot', 'aria-hidden': 'true' }), scrim = h('div', { class: 'bt-tour-scrim', 'aria-hidden': 'true' }), card = h('div', { class: 'bt-tour-card' });
    ov.appendChild(scrim); ov.appendChild(spot); ov.appendChild(card); document.body.appendChild(ov);
    document.body.classList.add('bt-touring');
    function finish() { if (o.finish) o.finish(); ov.remove(); document.body.classList.remove('bt-touring'); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); }
    function target(st) { var el = tourTarget(st); if (!el) return null; var r = el.getBoundingClientRect(); return r.width && r.height ? el : null; }
    function place() {
      var st = steps[i], el = target(st);
      if (!el) { spot.hidden = true; scrim.hidden = false; card.className = 'bt-tour-card mid'; card.style.top = ''; card.style.bottom = ''; return; }
      var r = el.getBoundingClientRect(), pad = 6, vh = window.innerHeight, chh = card.offsetHeight || 230;
      var top = Math.max(r.top - pad, 4), bot = Math.min(r.bottom + pad, vh - 4);
      spot.hidden = false; scrim.hidden = true;
      spot.style.left = (r.left - pad) + 'px'; spot.style.top = top + 'px'; spot.style.width = (r.width + pad * 2) + 'px'; spot.style.height = Math.max(20, bot - top) + 'px';
      var fitsBelow = vh - bot - 16 >= chh, fitsAbove = top - 16 >= chh;
      if (fitsBelow) { card.className = 'bt-tour-card below'; card.style.top = (bot + 14) + 'px'; card.style.bottom = ''; }
      else if (fitsAbove) { card.className = 'bt-tour-card above'; card.style.bottom = (vh - top + 14) + 'px'; card.style.top = ''; }
      else { card.className = 'bt-tour-card pinned'; card.style.top = ''; card.style.bottom = '12px'; }
      var ax = Math.max(24, Math.min(r.left + r.width / 2, window.innerWidth - 24));
      card.style.setProperty('--ax', ax + 'px');
    }
    function draw() {
      var st = steps[i]; card.innerHTML = '';
      if (st.before && !st._ran) { st._ran = true; st.before(); if (location.hash === st.route) { spot.hidden = true; APP.reload(); setTimeout(draw, 450); return; } }
      if (st.route && location.hash.split('?')[0] !== st.route && !(st.route === '#Dashboard' && !location.hash)) {
        spot.hidden = true; scrim.hidden = false; location.hash = st.route; var tries = 0;
        (function waitFor() { if ((location.hash === st.route && (!(st.sel || st.find || st.pick) || tourTarget(st))) || tries++ > 20) { window.scrollTo(0, 0); draw(); } else setTimeout(waitFor, 150); })(); return;
      }
      // skip a step whose part isn't on this screen (e.g. 1:1-only bits)
      if ((st.sel || st.find || st.pick) && !target(st)) { if (back && i > 0) { i--; return draw(); } if (i < steps.length - 1) { i++; return draw(); } }
      back = false;
      var el = target(st);
      if (el) { var r0 = el.getBoundingClientRect(), topNav = document.getElementById('bt-top'), tn = topNav ? topNav.getBoundingClientRect().bottom : 0; if (!topNav || !topNav.contains(el)) { if (r0.height > window.innerHeight * 0.45) window.scrollBy({ top: r0.top - tn - 16, behavior: 'smooth' }); else window.scrollBy({ top: r0.top + r0.height / 2 - window.innerHeight * 0.38, behavior: 'smooth' }); } }
      if (st.photo) card.appendChild(h('img', { class: 'bt-tour-photo', src: (window.BT_DEMO ? '' : '/') + 'img/sav/jump.jpg', alt: 'Sav with her arms in the air' }));
      if (st.last) { var big = h('div', { class: 'bt-tour-done', 'aria-hidden': 'true' }); big.innerHTML = '<svg viewBox="0 0 120 120"><path d="M60 8C63 42 78 57 112 60C78 63 63 78 60 112C57 78 42 63 8 60C42 57 57 42 60 8Z" fill="#F1F9A6" stroke="#1F1412" stroke-width="3" stroke-linejoin="round"/></svg>'; card.appendChild(big); }
      var many = steps.length > 1;
      card.appendChild(h('div', { class: 'bt-tour-b' }, [
        h('span', { class: 'bt-tour-k', text: (o.kicker || 'How it works') + (many ? ' · ' + (i + 1) + ' of ' + steps.length : '') }),
        h('h2', { class: 'bt-tour-t', text: st.title }), h('p', { class: 'bt-tour-p', text: st.text }),
        many && steps.length <= 30 ? h('div', { class: 'bt-tour-dots', 'aria-hidden': 'true' }, steps.map(function (_, k) { return h('span', { class: k === i ? 'on' : k < i ? 'done' : '' }); })) : null,
        h('div', { class: 'bt-tour-btns' }, [
          i > 0 && !st.last ? h('button', { class: 'bt-tour-back', type: 'button', text: 'Back', onclick: function () { i--; back = true; draw(); } }) : null,
          o.noSkip && !st.alt ? null : h('button', { class: 'bt-tour-skip', type: 'button', text: st.last ? (st.alt || 'I’ll look around') : 'Skip tour', onclick: function () { finish(); if (st.alt && o.alt) o.alt(st); else if (o.skip) o.skip(st); } }),
          h('button', { class: 'bt-tour-next', type: 'button', text: st.last ? (st.cta || 'Take me to my next lesson →') : i === 0 && st.photo ? 'Show me around →' : (st.next || 'Next →'), onclick: function (e) {
            if (st.last) { sparkleBurst(e.currentTarget); finish(); if (o.last) o.last(st); return; }
            i++; draw(); } })
        ])
      ]));
      setTimeout(place, 60); setTimeout(place, 450); setTimeout(place, 800);
      var nb = card.querySelector('.bt-tour-next'); if (nb) nb.focus({ preventScroll: true });
    }
    window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
    draw();
  }
  // after their first Becoming Notebook entry: where the entries live, then back to the course
  function notebookTour(id, done) {
    var nx = nextAfter(id), journal = function () { bookState.tab = 'journal'; bookState.day = ''; bookState.q = ''; bookState.range = 'all'; };
    var all = function () { bookState.tab = 'all'; bookState.day = ''; bookState.q = ''; bookState.range = 'all'; };
    runTour([
      { route: '#Lesson-' + id, sel: '.bt-jr', title: 'Your first Becoming Notebook entry!', text: 'It saved itself as you typed. Let me show you where it lives, so you can look back on it any time.' },
      { route: '#Lesson-' + id, sel: '#bt-top a[href="#Book"]', title: 'Step 1: tap My Book', text: 'Everything you write lives in My Book, up here in the menu.', next: 'Tap My Book →' },
      { route: '#Book', sel: '.bt-bkh', before: all, title: 'This is your Becoming Book', text: 'The story of who you’re becoming. Your notebook entries, finished lessons, activities, wins and reps all land here by themselves, dated.' },
      { route: '#Book', sel: '.bk-cal', title: 'Step 2: your calendar', text: 'Every day you show up gets a mark. Tap a day to see only that day. Use the arrows to flick between months.' },
      { route: '#Book', sel: '.bk-tabs', title: 'Step 3: scroll down to the tabs', text: 'These sort your book: everything, proof, wins, your reps, activities, milestones. Swipe them sideways to see them all.' },
      { route: '#Book', pick: function () { var t = document.querySelector('.bk-tabs .bk-tab.on'); if (t && t.parentNode) { var row = t.parentNode; row.scrollLeft = Math.max(0, t.offsetLeft - 16); } return t; }, before: journal, title: 'Step 4: find your entries here', text: 'Tap Becoming Notebook and every entry from every lesson shows up, newest first.' },
      { route: '#Book', sel: '.bk-range', title: 'Step 5: narrow it down', text: 'Pick a time frame, like the last 7 days or this month, or choose your own dates.' },
      { route: '#Book', sel: '#bk-q', title: 'Step 6: search your book', text: 'Looking for something you wrote? Type a word and it finds it.' },
      { route: '#Book', pick: function () { return document.querySelector('.bk-pages .bk-e:not(.bk-w)') || document.querySelector('.bk-pages'); }, title: 'Step 7: read or edit', text: 'Here’s your entry. Tap Edit on any of them to change it, and it changes under the lesson too.' },
      { route: '#Book', title: 'Now, back to the course', text: nx ? 'Next up: ' + nx.title + '.' : 'Let’s see what’s next.', last: true, cta: nx && isActivityCard(nx) ? 'Take me to my activity →' : 'Watch the next video →' }
    ], { kicker: 'Your Becoming Notebook', label: 'Your Becoming Notebook', noSkip: true, last: function () { all(); done(); } });
  }

  // a short "why we're doing this" at the top of each resource, linking it back to the lesson it came from.
  // Open the first time; after that it folds away to one line they can tap open.
  function resIntro(resId) {
    var r = (window.BT_RESOURCES || []).filter(function (x) { return x.id === resId; })[0]; if (!r || !r.intro) return null;
    var key = 'bt-intro-' + resId, seen = null; try { seen = localStorage.getItem(key); } catch (e) {}
    var d = document.createElement('details'); d.className = 'bt-why'; if (!seen) d.open = true;
    d.innerHTML = '<summary><span class="bt-why-ic" aria-hidden="true">✦</span><span class="bt-why-s">Why we’re doing this</span><span class="bt-why-tg" aria-hidden="true"></span></summary><div class="bt-why-b"><span class="bt-why-k"></span><p></p></div>';
    d.querySelector('.bt-why-k').textContent = 'From ' + r.intro.from; d.querySelector('p').textContent = r.intro.text;
    if (!seen) try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
    return d;
  }
  var INTRO_ROUTES = { Breathe: 'breathe', Dose: 'dose', Pause: 'pause', Move: 'move', Proof: 'proof', 'BreakingOut.dc.html': 'box', 'StarHome.dc.html': 'star' };
  function addIntro(route) {
    var rid = INTRO_ROUTES[route], app = document.getElementById('app'); if (!rid || !app || app.querySelector('.bt-why')) return;
    var el = resIntro(rid); if (!el) return;
    var hero = app.querySelector('.vg-hero');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(el, hero.nextSibling);
    else { var w0 = app.querySelector('.bt-wrap') || app.firstElementChild; if (w0 && w0.parentNode === app && !w0.classList.contains('bt-wrap')) app.insertBefore(el, w0.nextSibling); else if (w0) w0.insertBefore(el, w0.firstChild); else app.appendChild(el); }
  }
  function startHereDone() {
    if (APP.state.tier === 'private') return (oneSetupDone() || !!profileData().startDone) && introDone();
    if (!needsStart() && introDone()) return true;
    var d = comp(), dn = d.done || {}; return !!(prog().done.i3 || [1, 2, 3, 4, 5].every(function (n) { return dn[n]; }));
  }
  function maybeTour(route) {
    if (document.getElementById('bt-tour')) return;
    if (window.BT_DEMO && window.BT_DEMO.tour && !window.__btTourForced && !needsWelcome() && !needsContract()) { window.__btTourForced = true; try { sessionStorage.setItem('bt-ns-ok', '1'); } catch (e) {} if (!/^Dashboard/.test(String(route || ''))) { goHref('#Dashboard'); return; } setTimeout(appTour, 900); return; }
    var old = document.getElementById('bt-tourask'); if (old) old.remove();
    var pd = profileData();
    if (!APP || APP.state.viewAs || needsWelcome() || needsContract() || pd.tourDone || pd.tourNo || !startHereDone()) return;
    if (!/^(Dashboard|Course|Book|Resources|Profile)$/.test(String(route || ''))) return;
    // no auto tour: just a little offer floating at the bottom (it also lives in the profile)
    document.body.appendChild(h('div', { id: 'bt-tourask', class: 'bt-tourask' }, [
      h('button', { class: 'bt-tourask-go', type: 'button', onclick: function () { var a = document.getElementById('bt-tourask'); if (a) a.remove(); if (!/^#Dashboard/.test(location.hash)) goHref('#Dashboard'); setTimeout(appTour, 700); } }, [h('span', { 'aria-hidden': 'true', text: '🧭' }), h('span', { text: 'Want a tour?' })]),
      h('button', { class: 'bt-tourask-x', type: 'button', 'aria-label': 'No thanks, hide this', text: '✕', onclick: function () { var d = profileData(); d.tourNo = Date.now(); wr(K.prof, d); var a = document.getElementById('bt-tourask'); if (a) a.remove(); APP.toast('No worries. The tour lives in your profile if you want it later.'); } })
    ]));
  }
  // Every time the app opens: her North Star + why, a tick, then "Let's do this"
  function nsSplash() {
    try { if (sessionStorage.getItem('bt-ns-ok')) return; } catch (e) {}
    if (document.getElementById('bt-ns')) return;
    var d = comp(), tow = tx(d.nsToward), why = tx(d.intention), away = tx(d.nsAway), an = tx(d.anchor);
    if (!tow && !why) return;
    var first = tx((APP.state.profile || {}).full_name).split(' ')[0];
    var go = h('button', { class: 'bt-btn lime bt-ns-go', type: 'button', disabled: true, text: 'Let’s do this →', onclick: function (e) {
      try { sessionStorage.setItem('bt-ns-ok', '1'); } catch (x) {}
      sparkleBurst(e.currentTarget); ov.classList.add('out'); document.body.classList.remove('bt-ns-on');
      setTimeout(function () { ov.remove(); }, 650);
    } });
    var tick = h('button', { class: 'bt-ns-tick', type: 'button', role: 'checkbox', 'aria-checked': 'false', onclick: function () { var on = tick.getAttribute('aria-checked') !== 'true'; tick.setAttribute('aria-checked', on ? 'true' : 'false'); tick.classList.toggle('on', on); go.disabled = !on; if (on) { sparkleBurst(tick); go.focus(); } } }, [h('span', { class: 'bt-ns-box', 'aria-hidden': 'true', text: '✓' }), h('span', { text: 'I’m choosing this today' })]);
    var star = h('div', { class: 'bt-ns-star', 'aria-hidden': 'true' }); handDefs(); star.innerHTML = '<svg viewBox="0 0 120 120" filter="url(#bt-hand)"><circle class="bt-ns-glow" cx="60" cy="60" r="50" fill="#F4C2F7" opacity=".25"/><g class="bt-ns-rays" stroke="#F1F9A6" stroke-width="3" stroke-linecap="round"><path d="M60 6v12M60 102v12M6 60h12M102 60h12M22 22l8 8M98 22l-8 8M22 98l8-8M98 98l-8-8"/></g><path class="bt-ns-st" d="M60 20C62 46 74 58 100 60C74 62 62 74 60 100C58 74 46 62 20 60C46 58 58 46 60 20Z" fill="#FFFDF5" stroke="#F4C2F7" stroke-width="3" stroke-linejoin="round"/></svg>';
    var ov = h('div', { id: 'bt-ns', class: 'bt-ns', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bt-ns-h' }, [
      h('div', { class: 'bt-ns-in' }, [
        star,
        h('p', { class: 'bt-ns-k', text: first ? 'Hey ' + first + ', before you dive in' : 'Before you dive in' }),
        an ? h('p', { class: 'bt-ns-an' }, [h('span', { text: 'My anchor word' }), h('b', { text: an })]) : null,
        tow ? h('div', { class: 'bt-ns-b' }, [h('span', { class: 'bt-ns-l', text: 'My North Star · who I’m becoming' }), h('h1', { id: 'bt-ns-h', class: 'bt-ns-t', text: tow })]) : null,
        away ? h('p', { class: 'bt-ns-away' }, [h('span', { text: 'Who I’m not anymore: ' }), h('s', { text: away })]) : null,
        why ? h('div', { class: 'bt-ns-b why' }, [h('span', { class: 'bt-ns-l', text: 'My why' }), tow ? h('p', { class: 'bt-ns-w', text: why }) : h('h1', { id: 'bt-ns-h', class: 'bt-ns-w', text: why })]) : null,
        tick, go
      ])
    ]);
    document.body.appendChild(ov); document.body.classList.add('bt-ns-on');
    setTimeout(function () { tick.focus(); }, 400);
  }
  // Becoming Book hero: a flat, front-on book. Dark and closed, it opens, pages flick past fast,
  // then it lights up: a big bright glow and a burst of stars pouring out.
  function bookHero() {
    var INK = '#1F1412';
    function lines(x, y) { var o = ''; for (var k = 0; k < 6; k++) o += 'M' + x + ' ' + (y + k * 11) + 'h' + (54 - (k % 3) * 9); return '<path d="' + o + '" stroke="#E6C3BC" stroke-width="2.4" stroke-linecap="round"/>'; }
    // right-hand page shape (gently curved top/bottom like an open book lying flat)
    var RP = 'M160 44 Q196 36 242 42 V134 Q196 128 160 136 Z', LP = 'M160 44 Q124 36 78 42 V134 Q124 128 160 136 Z';
    function flick(n) { return '<g class="bk2-f" style="animation-delay:' + (2.3 + n * 0.16).toFixed(2) + 's"><path d="' + RP + '" fill="' + (n % 2 ? '#FFFDF5' : '#FFF4EE') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></g>'; }
    function star(x, y, r, c) { var p = ''; for (var k = 0; k < 10; k++) { var a = Math.PI / 5 * k - Math.PI / 2, rr = k % 2 ? r * .45 : r; p += (k ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1); } return '<path d="' + p + 'Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.1" stroke-linejoin="round"/>'; }
    var burst = '', N = 16, cols = ['#F1F9A6', '#F4C2F7', '#FFFDF5', '#E4F27A', '#F28C3B'];
    for (var b = 0; b < N; b++) { var ang = -Math.PI + (Math.PI * 2) * b / N + (b % 2 ? .12 : -.08), dist = 70 + (b % 3) * 26, dx = Math.cos(ang) * dist * 1.5, dy = Math.sin(ang) * dist - 24;
      burst += '<g class="bk2-st" style="--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;animation-delay:' + (4.6 + (b % 8) * 0.22).toFixed(2) + 's">' + star(160, 96, 5 + (b % 3) * 2, cols[b % cols.length]) + '</g>'; }
    // front-on, low angle: the open book lies on a surface, page stacks curving up to the spine, loose pages flicking over
    var CV = '#4E0C08';
    var stackL = '<path d="M46 122 C78 100 128 102 158 128 L158 142 C128 120 80 116 42 136 Z" fill="#FFFDF5" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M44 130 C80 112 126 114 158 136M43 133.5 C80 116 127 117.5 158 139" fill="none" stroke="#D9CCC8" stroke-width="1.2"/>';
    var stackR = '<path d="M274 122 C242 100 192 102 162 128 L162 142 C192 120 240 116 278 136 Z" fill="#FFFDF5" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M276 130 C240 112 194 114 162 136M277 133.5 C240 116 193 117.5 162 139" fill="none" stroke="#D9CCC8" stroke-width="1.2"/>';
    var sheet = function (n) { return '<g class="bk3-sheet" style="animation-delay:' + (1.6 + n * 0.22).toFixed(2) + 's"><path d="M160 130 C152 106 142 80 120 58 C138 50 160 46 184 44 C184 72 174 102 160 130 Z" fill="' + (n % 2 ? '#FFFDF5' : '#FFF4EE') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M152 100 C150 88 147 76 141 64" stroke="#E6C3BC" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>'; };
    var sheets = ''; for (var n = 0; n < 12; n++) sheets += sheet(n);
    var svg = '<svg class="bkh2 bkh3" viewBox="24 18 272 154" aria-hidden="true">' +
      '<defs><radialGradient id="bk2G" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".25" stop-color="#FFFDF5"/><stop offset=".5" stop-color="#F1F9A6" stop-opacity=".85"/><stop offset="1" stop-color="#F4C2F7" stop-opacity="0"/></radialGradient></defs>' +
      '<rect class="bk2-bg" width="320" height="180"/>' +
      '<g class="bk2-night" fill="#F4C2F7"><circle cx="26" cy="26" r="1.4"/><circle cx="58" cy="160" r="1.1"/><circle cx="292" cy="34" r="1.3"/><circle cx="276" cy="166" r="1"/><circle cx="104" cy="16" r="1"/><circle cx="222" cy="12" r="1.2"/></g>' +
      '<circle class="bk2-glow" cx="160" cy="100" r="150" fill="url(#bk2G)"/><circle class="bk2-glow2" cx="160" cy="100" r="105" fill="url(#bk2G)"/>' +
      '<g class="bk2-rays" stroke="#F1F9A6" stroke-width="3.2" stroke-linecap="round"><path d="M160 30V10M112 36l-9-14M208 36l9-14M74 58l-15-8M246 58l15-8M56 96H36M264 96h20"/></g>' +
      '<g class="bk2-book" filter="url(#bt-hand-b)">' +
      '<ellipse cx="160" cy="152" rx="128" ry="7" fill="' + INK + '" opacity=".22"/>' +
      '<path class="bk3-cover" d="M34 138 L160 146 L286 138 L286 145 L160 153 L34 145 Z" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
      stackL + stackR +
      '<path d="M158 128 L160 146 L162 128" fill="#E6C3BC" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<g class="bk3-sheets">' + sheets + '</g>' +
      '</g>' + burst.replace(/160, 86/g, '160, 96') + '</svg>';
    handDefs();
    var el = h('div', { class: 'bt-bkh', 'aria-hidden': 'true' }); el.innerHTML = svg; return el;
  }
  function BookView(root) {
    var all = bookEntries();
    var count = function (k) { return all.filter(function (e) { return k === 'all' || e.kind === k || (k === 'proof' && e.kind === 'win'); }).length; };
    root.appendChild(pageHead('Your story so far', 'The Becoming Book', 'Started ' + startDate().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + all.length + ' pages'));
    var wrap = h('div', { class: 'bt-wrap bk' }, [back('Home', '#Dashboard'), h('p', { class: 'bt-bk-about', text: 'This is the story of who you’re becoming. Your Becoming Notebook entries, finished lessons and activities, wins and proof, workouts and milestones all land here by themselves, dated, so you can look back and see how far you’ve come.' }), bookHero()]);
    // calendar: symbols on the days she moved forward + win streaks
    var GLY = { milestone: '★', activity: '◆', journal: '✎', win: '✦', proof: '✓', change: '↻', vagal: '≈' };
    var byDay = {}; all.forEach(function (e) { if (!e.at) return; var k = dayKey(e.at); (byDay[k] = byDay[k] || {})[e.kind] = (byDay[k][e.kind] || 0) + 1; });
    var cal = h('section', { class: 'bk-cal', 'aria-label': 'Your progress calendar' });
    function drawCal() {
      cal.innerHTML = '';
      var st = winStreak(), now = new Date(T.now()), m0 = bookState.month || new Date(now.getFullYear(), now.getMonth(), 1).getTime(), md = new Date(m0);
      var go = function (n) { bookState.month = new Date(md.getFullYear(), md.getMonth() + n, 1).getTime(); drawCal(); };
      cal.appendChild(h('div', { class: 'bk-cal-top' }, [
        h('button', { class: 'bk-cal-nav', type: 'button', 'aria-label': 'Previous month', text: '‹', onclick: function () { go(-1); } }),
        h('b', { class: 'bk-cal-m', text: md.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) }),
        h('button', { class: 'bk-cal-nav', type: 'button', 'aria-label': 'Next month', text: '›', onclick: function () { go(1); } })
      ]));
      var vw = window.BT_VAGAL ? window.BT_VAGAL.streak() : { current: 0, best: 0 };
      cal.appendChild(h('div', { class: 'bk-streaks' }, [
        h('div', { class: 'bk-stk' + (st.current ? ' hot' : '') }, [h('b', { text: String(st.current) }), h('span', { text: 'day win streak' + (st.best > st.current ? ' · best ' + st.best : '') })]),
        h('div', { class: 'bk-stk' + (vw.current ? ' hot2' : '') }, [h('b', { text: String(vw.current) }), h('span', { text: 'day workout streak' + (vw.best > vw.current ? ' · best ' + vw.best : '') })]),
        h('div', { class: 'bk-stk' }, [h('b', { text: String(Object.keys(byDay).filter(function (k) { var p = k.split('-'); return +p[0] === md.getFullYear() && +p[1] === md.getMonth() + 1; }).length) }), h('span', { text: 'days you showed up this month' })])
      ]));
      var grid = h('div', { class: 'bk-grid', role: 'grid' });
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { grid.appendChild(h('span', { class: 'bk-dow', 'aria-hidden': 'true', text: d })); });
      var lead = (md.getDay() + 6) % 7, dim = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate();
      for (var i = 0; i < lead; i++) grid.appendChild(h('span', { class: 'bk-day blank' }));
      for (var d = 1; d <= dim; d++) {
        (function (d) {
          var t = new Date(md.getFullYear(), md.getMonth(), d).getTime(), k = wallKey(new Date(t)), has = byDay[k] || {}, kinds = Object.keys(has);
          var isToday = k === dayKey(Date.now()), sel = bookState.day === k;
          var label = new Date(t).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) + (kinds.length ? ': ' + kinds.map(function (x) { return has[x] + ' ' + KINDS[x][0].toLowerCase(); }).join(', ') : '');
          var cell = h('button', { class: 'bk-day' + (kinds.length ? ' on' : '') + (has.win ? ' win' : '') + (isToday ? ' today' : '') + (sel ? ' sel' : ''), type: 'button', 'aria-label': label, 'aria-pressed': sel ? 'true' : 'false', disabled: t > Date.now() ? 'disabled' : null,
            onclick: function () { bookState.day = sel ? '' : k; drawCal(); draw(); if (!sel) setTimeout(function () { var dp = document.querySelector('.bk-daypanel'); if (dp) dp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); } }, [h('span', { class: 'bk-dn', text: String(d) }),
            h('span', { class: 'bk-sy', 'aria-hidden': 'true' }, Object.keys(GLY).filter(function (x) { return has[x]; }).map(function (x) { return h('i', { class: 'k-' + x, style: '--kc:' + KINDS[x][1], text: GLY[x] }); }))]);
          grid.appendChild(cell);
        })(d);
      }
      cal.appendChild(grid);
      cal.appendChild(h('div', { class: 'bk-key', 'aria-label': 'Key' }, Object.keys(GLY).map(function (x) { return h('span', null, [h('i', { class: 'k-' + x, style: '--kc:' + KINDS[x][1], 'aria-hidden': 'true', text: GLY[x] }), KINDS[x][0]]); })));
      if (bookState.day) {
        var p = bookState.day.split('-'), dt = new Date(+p[0], p[1] - 1, +p[2]), mine = all.filter(function (e) { return e.at && dayKey(e.at) === bookState.day; });
        var panel = h('div', { class: 'bk-daypanel' }, [h('div', { class: 'bk-dp-top' }, [h('b', { text: dt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) }), h('button', { class: 'bk-cal-clear', type: 'button', text: '× Close', onclick: function () { bookState.day = ''; drawCal(); draw(); } })])]);
        if (mine.length) { panel.appendChild(h('span', { class: 'bk-dp-k', text: 'What you did' })); var dl = h('div', { class: 'bk-dp-list' }); mine.forEach(function (e) { dl.appendChild(card(e)); }); panel.appendChild(dl); }
        else panel.appendChild(h('p', { class: 'bk-dp-none', text: 'Nothing in your book for this day yet.' }));
        if (window.BT_VAGAL && window.BT_VAGAL.workoutCard) panel.appendChild(window.BT_VAGAL.workoutCard(bookState.day, function () { setTimeout(function () { APP.reload(); }, 400); }));
        cal.appendChild(panel);
      }
    }
    drawCal();
    wrap.appendChild(cal);
    // add proof: the same card as on Home
    wrap.appendChild(proofHome());
    // tabs + search
    var tabs = [['all', 'Everything'], ['proof', 'Proof portfolio'], ['win', 'Wins & joy'], ['journal', 'Becoming Notebook'], ['note', 'My notes'], ['vagal', 'Vagal tone'], ['activity', 'Activities'], ['milestone', 'Milestones'], ['change', 'Before & now']];
    var list = h('div', { class: 'bk-pages' });
    var search = h('input', { class: 'bt-in bk-search', type: 'search', id: 'bk-q', placeholder: 'Search your book', value: bookState.q, 'aria-label': 'Search your book' });
    var tabRow = h('div', { class: 'bk-tabs', role: 'tablist' }, tabs.map(function (t) {
      return h('button', { class: 'bk-tab' + (bookState.tab === t[0] ? ' on' : ''), type: 'button', role: 'tab', 'aria-selected': bookState.tab === t[0] ? 'true' : 'false', onclick: function () { bookState.tab = t[0]; tabRow.querySelectorAll('.bk-tab').forEach(function (b, i) { b.classList.toggle('on', tabs[i][0] === t[0]); }); draw(); } },
        [t[1], h('span', { class: 'bk-n', text: String(count(t[0])) })]);
    }));
    search.addEventListener('input', function () { bookState.q = search.value; draw(); });
    var RANGES = [['all', 'All time'], ['week', 'Last 7 days'], ['month', 'This month'], ['30', 'Last 30 days'], ['custom', 'Pick dates']];
    var rangeBox = h('div', { class: 'bk-range' });
    function drawRange() {
      rangeBox.innerHTML = '';
      rangeBox.appendChild(h('div', { class: 'bk-range-l', role: 'radiogroup', 'aria-label': 'Dates' }, RANGES.map(function (r) { var on = bookState.range === r[0]; return h('button', { class: 'bk-rg' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', text: r[1], onclick: function () { bookState.range = r[0]; drawRange(); draw(); } }); })));
      if (bookState.range === 'custom') {
        var f = h('input', { class: 'bt-in bk-date-in', type: 'date', value: bookState.from, 'aria-label': 'From' }), t = h('input', { class: 'bt-in bk-date-in', type: 'date', value: bookState.to, 'aria-label': 'To' });
        f.addEventListener('change', function () { bookState.from = f.value; draw(); }); t.addEventListener('change', function () { bookState.to = t.value; draw(); });
        rangeBox.appendChild(h('div', { class: 'bk-range-c' }, [h('label', null, ['From ', f]), h('label', null, ['To ', t])]));
      }
    }
    drawRange();
    wrap.appendChild(notesBox({ book: true, onChange: function () { APP.reload(); } }));
    wrap.appendChild(tabRow); wrap.appendChild(rangeBox); wrap.appendChild(search); wrap.appendChild(list);
    function card(e) {
      if (e.kind === 'note' && e.note) { var nw = h('div', { class: 'bk-e note' }); var d0 = new Date(e.at); nw.appendChild(h('div', { class: 'bk-date' }, [h('b', { text: String(d0.getDate()) }), h('span', { text: d0.toLocaleDateString('en-AU', { weekday: 'short' }) })])); nw.appendChild(stickyNote(e.note, function () { APP.reload(); }, true)); return nw; }
      var k = KINDS[e.kind];
      var c = h('article', { class: 'bk-e ' + e.kind, style: '--kc:' + k[1] });
      var d = e.at ? new Date(e.at) : null;
      c.appendChild(h('div', { class: 'bk-date' }, d ? [h('b', { text: String(d.getDate()) }), h('span', { text: d.toLocaleDateString('en-AU', { weekday: 'short' }) })] : [h('span', { text: 'Earlier' })]));
      var body = h('div', { class: 'bk-body' }, [h('span', { class: 'bk-tag' }, [icon(k[2]), e.kind === 'win' ? (SPARK[e.spark] || SPARK.win)[0] : k[0]]), h('b', { class: 'bk-t', text: e.title }), e.sub ? h('span', { class: 'bk-sub', text: e.sub }) : null]);
      if (e.kind === 'change') {
        body.appendChild(h('div', { class: 'bk-bn' }, [
          h('div', { class: 'bk-before' }, [h('span', { text: 'Before · ' + new Date(e.beforeAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) }), h('p', { text: e.before })]),
          h('div', { class: 'bk-now' }, [h('span', { text: 'Now' }), h('p', { text: e.text })])
        ]));
      } else if (e.badges) {
        body.appendChild(h('div', { class: 'bk-badges', role: 'list', 'aria-label': 'What you did' }, e.badges.map(function (b) {
          var ic = b.id === 'water' ? h('span', { class: 'bk-bdg-em txt', text: '💧' }) : b.id === 'win' ? h('span', { class: 'bk-bdg-em txt', text: '✦' }) : h('span', { class: 'bk-bdg-em' }, [emblem(b.id)]);
          return h('span', { class: 'bk-bdg ' + b.id, role: 'listitem', title: b.name + (b.detail ? ': ' + b.detail : '') }, [ic, h('b', { text: b.name }), b.detail ? h('span', { text: b.detail }) : null]);
        })));
      } else if (e.text && e.kind !== 'activity') body.appendChild(h('p', { class: 'bk-text', text: e.text }));
      else if (e.text) body.appendChild(h('span', { class: 'bk-sub', text: e.text }));
      if (e.img && e.item) body.appendChild(h('button', { class: 'bk-shotbtn', type: 'button', 'aria-label': 'Open ' + e.title, onclick: function () { window.BT_SAVES.open(e.item, function () { APP.reload(); }); } }, [h('img', { class: 'bk-shot', src: e.img, alt: e.title + ', as saved' })]));
      else if (e.img) body.appendChild(h('img', { class: 'bk-img', src: e.img, alt: '' }));
      if (e.item) body.appendChild(h('button', { class: 'bk-open', type: 'button', text: 'Open it →', onclick: function () { window.BT_SAVES.open(e.item, function () { APP.reload(); }); } }));
      if (e.href) body.appendChild(h('a', { class: 'bk-open', href: e.href, text: 'Open it →' }));
      if ((e.kind === 'journal' || e.kind === 'change') && e.key) { var eb = h('button', { class: 'bk-open', type: 'button', text: 'Edit ✎', onclick: function () { eb.replaceWith(journalEditor(e.key, e.text, function (cancel) { if (cancel) draw(); else APP.reload(); })); } }); body.appendChild(eb); }
      if (e.kind === 'win' || e.kind === 'proof') { var del = h('button', { class: 'bk-del', type: 'button', text: 'Remove', onclick: function () { if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'Tap again to remove'; return; } removeEvidence(e.id); APP.reload(); } }); body.appendChild(del); }
      if (e.res) { var lg = h('span', { class: 'bk-logo', title: (resource(e.res) || {}).title || '' }, [emblem(e.res)]); c.classList.add('has-logo'); body.appendChild(lg); }
      if (e.href && e.kind === 'vagal') c.classList.add('vagal');
      c.appendChild(body);
      return c;
    }
    function draw() {
      list.innerHTML = '';
      var q = tx(bookState.q).toLowerCase();
      var rf = 0, rt = Infinity, n0 = T.today();
      if (bookState.range === 'week') rf = n0.getTime() - 6 * DAY; else if (bookState.range === 'month') rf = new Date(n0.getFullYear(), n0.getMonth(), 1).getTime(); else if (bookState.range === '30') rf = n0.getTime() - 29 * DAY;
      else if (bookState.range === 'custom') { if (bookState.from) rf = new Date(bookState.from + 'T00:00:00').getTime(); if (bookState.to) rt = new Date(bookState.to + 'T23:59:59').getTime(); }
      var items = all.filter(function (e) { return (bookState.range === 'all' || (e.at && e.at >= rf && e.at <= rt)) && (bookState.tab === 'all' || e.kind === bookState.tab || (bookState.tab === 'proof' && e.kind === 'win') || (bookState.day && false)) && true && (!q || [e.title, e.text, e.sub, e.before].join(' ').toLowerCase().indexOf(q) >= 0); });
      if (bookState.tab === 'journal' && !q && !bookState.day) { var wp = waitingPrompts(); if (wp.length) { var wbox = h('section', { class: 'bk-wait' }, [h('h2', { class: 'bk-month', text: 'Waiting for you' }), h('p', { class: 'bk-sub', text: 'Prompts from lessons you’ve opened. Answer here or under the video, they stay in sync.' })]); wp.slice(0, 3).forEach(function (w) { wbox.appendChild(h('article', { class: 'bk-e journal bk-w', style: '--kc:#FFF4EE' }, [h('div', { class: 'bk-body' }, [h('span', { class: 'bk-sub', text: w.lesson.title }), h('b', { class: 'bk-t', text: w.q }), journalEditor(w.key, '', function () { APP.reload(); })])])); }); if (wp.length > 3) wbox.appendChild(h('p', { class: 'bk-sub', text: '+ ' + (wp.length - 3) + ' more waiting' })); list.appendChild(wbox); } }
      if (!items.length) { if (bookState.tab === 'journal' && list.querySelector('.bk-wait')) return; list.appendChild(h('p', { class: 'bk-empty', text: q ? 'Nothing matches that yet.' : bookState.tab === 'change' ? 'When you go back and rewrite a notebook entry, the old and new versions show up here side by side.' : 'This part of your book is still blank. It fills up as you go.' })); return; }
      var month = '';
      items.forEach(function (e, i) {
        var m = e.at ? new Date(e.at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : 'Earlier';
        if (m !== month) { month = m; list.appendChild(h('h2', { class: 'bk-month', text: m })); }
        var c = card(e); c.style.animationDelay = Math.min(i, 12) * 40 + 'ms'; list.appendChild(c);
      });
    }
    draw();
    root.appendChild(wrap); waves(root);
  }

  /* ---------------- first sign-in: the welcome series (name, email, phone, country, timezone, photo) ---------------- */
  var CC = 'AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR BN BG BF BI KH CM CA CV KY CF TD CL CN CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NC NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW WS SM SA SN RS SC SL SG SK SI SB SO ZA ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN VI YE ZM ZW'.split(' ');
  var CZ = {
    AU: 'Australia/Sydney Australia/Melbourne Australia/Brisbane Australia/Adelaide Australia/Darwin Australia/Perth Australia/Hobart Australia/Broken_Hill Australia/Lord_Howe Australia/Eucla',
    NZ: 'Pacific/Auckland Pacific/Chatham', GB: 'Europe/London', IE: 'Europe/Dublin',
    US: 'America/New_York America/Chicago America/Denver America/Phoenix America/Los_Angeles America/Anchorage Pacific/Honolulu America/Detroit America/Boise',
    CA: 'America/Toronto America/Vancouver America/Edmonton America/Winnipeg America/Regina America/Halifax America/St_Johns',
    ZA: 'Africa/Johannesburg', SG: 'Asia/Singapore', IN: 'Asia/Kolkata', PH: 'Asia/Manila', ID: 'Asia/Jakarta Asia/Makassar Asia/Jayapura', MY: 'Asia/Kuala_Lumpur', HK: 'Asia/Hong_Kong',
    JP: 'Asia/Tokyo', KR: 'Asia/Seoul', CN: 'Asia/Shanghai', TH: 'Asia/Bangkok', VN: 'Asia/Ho_Chi_Minh', AE: 'Asia/Dubai', IL: 'Asia/Jerusalem', FJ: 'Pacific/Fiji',
    DE: 'Europe/Berlin', FR: 'Europe/Paris', NL: 'Europe/Amsterdam', BE: 'Europe/Brussels', ES: 'Europe/Madrid Atlantic/Canary', PT: 'Europe/Lisbon Atlantic/Azores', IT: 'Europe/Rome', CH: 'Europe/Zurich', AT: 'Europe/Vienna',
    SE: 'Europe/Stockholm', NO: 'Europe/Oslo', DK: 'Europe/Copenhagen', FI: 'Europe/Helsinki', PL: 'Europe/Warsaw', GR: 'Europe/Athens',
    MX: 'America/Mexico_City America/Cancun America/Tijuana America/Monterrey', BR: 'America/Sao_Paulo America/Manaus America/Fortaleza America/Recife', AR: 'America/Argentina/Buenos_Aires',
    NG: 'Africa/Lagos', KE: 'Africa/Nairobi'
  };
  function allZones() { try { return Intl.supportedValuesOf('timeZone'); } catch (e) { return [].concat.apply([], Object.keys(CZ).map(function (k) { return CZ[k].split(' '); })); } }
  function countryName(c) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) || c; } catch (e) { return c; } }
  function countryForZone(z) { var hit = ''; Object.keys(CZ).forEach(function (c) { if (!hit && CZ[c].split(' ').indexOf(z) >= 0) hit = c; }); return hit; }
  function zoneLabel(z) {
    var city = z.split('/').pop().replace(/_/g, ' '), off = '';
    try { off = new Intl.DateTimeFormat('en-AU', { timeZone: z, timeZoneName: 'shortOffset' }).formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value.replace('GMT', 'UTC'); } catch (e) {}
    return city + (off ? ' (' + (off === 'UTC' ? 'UTC+0' : off) + ')' : '');
  }
  function zoneNow(z) { try { return new Date().toLocaleString('en-AU', { timeZone: z, weekday: 'long', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function needsWelcome() {
    if (!APP || !APP.state || !APP.state.user || APP.state.viewAs || (window.BT_DEMO && window.BT_DEMO.tour)) return false;
    if (APP.state.profile && APP.state.profile.is_admin && !playground()) return false;
    return !profileData().onboarded;
  }
  /* ---------------- coaching agreement: signed in the app before anything else opens ---------------- */
  function needsContract() {
    var c = APP && APP.state && APP.state.contract; if (APP && APP.state && APP.state.tier === 'private' && !(rd(K.one) || {}).homeSaved) return false;
    if (!APP || !APP.state || APP.state.viewAs || (window.BT_DEMO && window.BT_DEMO.tour) || (APP.state.isAdmin && !playground())) return false;
    if (c && c.status === 'sent') return true;
    // 1:1 clients can't go any further until their agreement is signed: if Sav hasn't sent it yet, they wait on the "on its way" page
    return APP.state.tier === 'private' && !(c && c.status === 'signed');
  }
  // check for a newly sent agreement (Sav may send it after they've opened the app)
  var ctChecked = 0;
  function refreshContract(force) {
    var S = APP && APP.state, sb = APP && APP.sb && APP.sb();
    if (!sb || !S || !S.user || S.viewAs || S.trial || S.tier !== 'private' || (S.contract && S.contract.status === 'signed')) return;
    if (!force && Date.now() - ctChecked < 45000) return; ctChecked = Date.now();
    sb.from('contracts').select('*').eq('user_id', S.user.id).maybeSingle().then(function (r) {
      var c = r && !r.error ? r.data : null, was = S.contract ? S.contract.status : 'none';
      if ((c ? c.status : 'none') === was) return;
      S.contract = c; if (needsContract() && !/^#Contract/.test(location.hash)) location.hash = '#Contract'; else if (/^#Contract/.test(location.hash)) location.reload();
    }, function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refreshContract(true); });
  // save the signed agreement as a real PDF file. (Printing doesn't work inside the home-screen app on iPhone,
  // so we draw it to a PDF here and hand it to the phone's Share sheet: Save to Files, email, etc.)
  function loadScript(src) { return new Promise(function (res, rej) { if (document.querySelector('script[src="' + src + '"]')) { res(); return; } var sc = document.createElement('script'); sc.src = src; sc.onload = function () { res(); }; sc.onerror = rej; document.head.appendChild(sc); }); }
  function contractPdf(ct) {
    var C = window.BT_CONTRACT; if (!C || !ct || !ct.signed) return;
    var nm = (ct.signed.client && (ct.signed.client.signedName || ct.signed.client.name)) || '';
    var file = 'Breakthrough coaching agreement' + (nm ? ' - ' + nm.replace(/[^\w .-]/g, '') : '') + '.pdf';
    var signedLine = 'Signed ' + new Date(ct.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + (nm ? ' by ' + nm : '');
    var cover = h('div', { class: 'bt-pdf-wait', role: 'status' }, [h('div', { class: 'bt-party-card bt-vdone-card' }, [h('span', { class: 'bt-vdone-ic', 'aria-hidden': 'true', text: '📄' }), h('h2', { text: 'Making your PDF…' }), h('p', { text: 'This takes a few seconds.' })])]);
    var box = h('div', { class: 'bt-pdf-ct' });
    box.appendChild(C.render(ct.signed.terms, ct.signed.client, { signed: { client: ct.signed.client, signed_at: ct.signed_at } }).node);
    document.body.appendChild(box); document.body.appendChild(cover);
    var done = function () { if (box.parentNode) box.remove(); if (cover.parentNode) cover.remove(); };
    // read the agreement as simple blocks: headings, "label: value" rows, ticked commitments, paragraphs
    var blocks = [];
    var tx2 = function (el) { return String(el.textContent || '').replace(/\s+/g, ' ').trim(); };
    (function walk(el) {
      Array.prototype.forEach.call(el.children, function (c) {
        var tag = c.tagName, cls = c.className && c.className.baseVal == null ? String(c.className) : '';
        if (/^(BUTTON|INPUT|SVG|IMG|SCRIPT|STYLE|SELECT|TEXTAREA)$/i.test(tag) || c.hidden || getComputedStyle(c).display === 'none') return;
        if (/^H1$/.test(tag)) { blocks.push({ t: 'h1', s: tx2(c) }); return; }
        if (/^H2$/.test(tag)) { blocks.push({ t: 'h2', s: tx2(c) }); return; }
        if (/^H[3-6]$/.test(tag)) { blocks.push({ t: 'h3', s: tx2(c) }); return; }
        if (/\b(ct-row|ct-f)\b/.test(cls) && c.children.length >= 2) { blocks.push({ t: 'kv', k: tx2(c.children[0]), v: tx2(c.children[c.children.length - 1]) }); return; }
        if (/\bct-opt\b/.test(cls)) { var ob = c.querySelector('b'), od = ob && ob.nextElementSibling, on0 = /\bon\b/.test(cls); blocks.push({ t: 'li', s: (on0 ? '[x] ' : '[  ] ') + (ob ? tx2(ob) : '') + (on0 && od ? ': ' + tx2(od) : '') }); return; }
        if (/\bct-note\b/.test(cls)) { blocks.push({ t: 'li', s: (/\bon\b/.test(cls) || (c.querySelector('input') || {}).checked ? '[x] ' : '[  ] ') + tx2(c).replace(/^✓\s*/, '') }); return; }
        if (/^(P|LI|DT|DD|LABEL|BLOCKQUOTE)$/.test(tag)) { var s0 = tx2(c); if (s0) blocks.push({ t: tag === 'LI' ? 'li' : 'p', s: s0, sub: /\bct-(sub|k)\b/.test(cls) }); return; }
        if (c.children.length) walk(c); else { var s1 = tx2(c); if (s1) blocks.push({ t: 'p', s: s1 }); }
      });
    })(box);
    var base = window.BT_DEMO ? 'js/vendor/' : '/js/vendor/';
    loadScript(base + 'pdf-lib.min.js').then(function () {
      var L = window.PDFLib, docP = L.PDFDocument.create();
      return docP.then(function (doc) {
        return Promise.all([doc.embedFont(L.StandardFonts.Helvetica), doc.embedFont(L.StandardFonts.HelveticaBold), doc.embedFont(L.StandardFonts.TimesRomanBold), doc.embedFont(L.StandardFonts.HelveticaOblique)]).then(function (F) {
          var reg = F[0], bold = F[1], serif = F[2], ital = F[3], W = 595.28, H = 841.89, M = 50, CW = W - M * 2;
          var MAROON = L.rgb(0.306, 0.047, 0.031), RED = L.rgb(0.659, 0.137, 0.122), INK = L.rgb(0.12, 0.08, 0.07), MUTED = L.rgb(0.42, 0.35, 0.34);
          var safe = function (t) { return String(t || '').replace(/[✓✔]\s*/g, '').replace(/[^\x20-\x7E\xA0-\xFF‘’“”–—•…€™]/g, ''); };
          var page, y, n = 0;
          function newPage() { page = doc.addPage([W, H]); n++; y = H - M;
            page.drawText('Colour Me Neurospicy', { x: M, y: H - 30, size: 9, font: bold, color: RED });
            page.drawText(safe(signedLine), { x: W - M - reg.widthOfTextAtSize(safe(signedLine), 8), y: H - 30, size: 8, font: reg, color: MUTED });
            y = H - M - 10; }
          function wrap(text, font, size, width) { var words = safe(text).split(' '), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (font.widthOfTextAtSize(t, size) > width && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
          function write(text, o) { var size = o.size || 10, lh = size * (o.lh || 1.45), lines = wrap(text, o.font || reg, size, CW - (o.indent || 0));
            if (o.before) y -= o.before; if (y - lh < M) newPage();
            lines.forEach(function (ln) { if (y - lh < M) newPage(); page.drawText(ln, { x: M + (o.indent || 0), y: y - size, size: size, font: o.font || reg, color: o.color || INK }); y -= lh; });
            if (o.after) y -= o.after; }
          newPage();
          blocks.forEach(function (b) {
            if (b.t === 'h1') write(b.s, { font: serif, size: 20, color: MAROON, after: 6 });
            else if (b.t === 'h2') write(b.s, { font: serif, size: 14, color: MAROON, before: 10, after: 2 });
            else if (b.t === 'h3') write(b.s, { font: bold, size: 10.5, before: 6 });
            else if (b.t === 'kv') { write(b.k + ':', { font: bold, size: 9.5, color: MUTED, before: 2 }); write(b.v, { size: 10, indent: 10 }); }
            else if (b.t === 'li') write(b.s, { size: 10, indent: 6, before: 2 });
            else write(b.s, { size: b.sub ? 9 : 10, font: b.sub ? ital : reg, color: b.sub ? MUTED : INK, before: 3 });
          });
          write(signedLine + '. Signed electronically in the Breakthrough app.', { font: bold, size: 10, color: RED, before: 14 });
          doc.getPages().forEach(function (pg, i) { var t = 'Page ' + (i + 1) + ' of ' + n; pg.drawText(t, { x: W / 2 - reg.widthOfTextAtSize(t, 8) / 2, y: 24, size: 8, font: reg, color: MUTED }); });
          doc.setTitle('Breakthrough coaching agreement' + (nm ? ' - ' + nm : '')); doc.setAuthor('Colour Me Neurospicy');
          return doc.save();
        });
      });
    }).then(function (bytes) {
      done();
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var f = null; try { f = new File([blob], file, { type: 'application/pdf' }); } catch (e) {}
      var canShare = !!(f && navigator.canShare && navigator.canShare({ files: [f] }));
      var url = URL.createObjectURL(blob);
      var close = function () { var x = document.getElementById('bt-pdf-ready'); if (x) x.remove(); };
      document.body.appendChild(h('div', { id: 'bt-pdf-ready', class: 'bt-party', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Your PDF is ready' }, [h('div', { class: 'bt-party-card bt-vdone-card' }, [
        h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close }),
        h('span', { class: 'bt-vdone-ic', 'aria-hidden': 'true', text: '📄' }), h('h2', { text: 'Your PDF is ready' }),
        h('p', { text: 'Save it to your Files, email it to yourself, or keep it wherever you like. A copy also stays in your profile.' }),
        h('div', { class: 'bt-row bt-nbn-btns' }, [
          canShare ? h('button', { class: 'bt-btn lime', type: 'button', text: 'Save or share the PDF', onclick: function () { navigator.share({ files: [f], title: 'My coaching agreement' }).then(close, function () {}); } }) : null,
          h('a', { class: 'bt-btn ' + (canShare ? 'ghost' : 'lime'), href: url, download: file, target: '_blank', rel: 'noopener', text: canShare ? 'Open the PDF' : 'Download the PDF', onclick: function () { setTimeout(close, 400); } })
        ])
      ])]));
    }).catch(function () { done(); contractPrint(ct); });
  }
  // old way, kept as a fallback (computers): the device's print sheet, "Save as PDF"
  function contractPrint(ct) {
    var C = window.BT_CONTRACT; if (!C || !ct || !ct.signed) return;
    var old = document.querySelector('.bt-print-ct'); if (old) old.remove();
    var nm = (ct.signed.client && (ct.signed.client.signedName || ct.signed.client.name)) || '';
    var box = h('div', { class: 'bt-print-ct' }, [
      h('p', { class: 'bt-print-k', text: 'Signed ' + new Date(ct.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + (nm ? ' by ' + nm : '') })
    ]);
    box.appendChild(C.render(ct.signed.terms, ct.signed.client, { signed: { client: ct.signed.client, signed_at: ct.signed_at } }).node);
    document.body.appendChild(box);
    var title = document.title; document.title = 'Breakthrough coaching agreement' + (nm ? ' - ' + nm : '');
    document.body.classList.add('bt-printing');
    var fin = function () { document.body.classList.remove('bt-printing'); document.title = title; box.remove(); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin);
    setTimeout(function () { try { window.print(); } catch (e) { fin(); } }, 60);
  }
  function pdfBtn(ct, cls) { return h('button', { class: 'bt-btn ' + (cls || '') + ' bt-ct-pdf', type: 'button', text: '⬇ Download as PDF', onclick: function () { contractPdf(ct); } }); }
  function ContractView(root) {
    var C = window.BT_CONTRACT, ct = APP.state.contract, S = APP.state, sb = APP.sb();
    document.body.classList.toggle('bt-welcoming', needsContract());
    if (!C || !ct || ct.status === 'draft') {
      if (S.tier === 'private' && !S.viewAs) {
        refreshContract(true);
        // let Sav know (once) that this client is waiting for their agreement
        try { var pw = profileData(); if (!pw.ctPinged && window.BT_NOTIFY && !S.trial) { pw.ctPinged = Date.now(); wr(K.prof, pw); window.BT_NOTIFY('waiting'); } } catch (e) {}
        var poll = setInterval(function () { if (!document.body.contains(root)) { clearInterval(poll); return; } refreshContract(true); }, 20000);
        root.appendChild(h('div', { class: 'bt-wrap bt-ct' }, [h('section', { class: 'bt-card2 bt-wel-card' }, [
          h('p', { class: 'bt-wel-k', text: 'Step 2 · your agreement' }),
          h('h1', { class: 'bt-wel-h', text: 'Your agreement is on its way' }),
          h('p', { class: 'bt-sub', text: 'Sav is putting the finishing touches on your coaching agreement. It pops up right here as soon as she sends it, usually within a day. Once you’ve signed it, everything opens up.' }),
          h('p', { class: 'bt-sub', text: 'I’ve let Sav know you’re ready. You can close the app: it’ll be waiting for you next time you open it.' }),
          h('div', { class: 'bt-row' }, [
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Check again', onclick: function (e) { e.currentTarget.textContent = 'Checking…'; refreshContract(true); var b = e.currentTarget; setTimeout(function () { b.textContent = 'Check again'; APP.toast('Not here yet. It’ll pop up as soon as Sav sends it.'); }, 2500); } }),
            h('a', { class: 'bt-btn ghost', href: 'https://wa.me/' + String((APP.viewProps('OneOnOne.dc.html') || {}).whatsappNumber || '+61 438 400 622').replace(/[^0-9]/g, ''), target: '_blank', rel: 'noopener', text: 'Message Sav' })
          ])
        ])]));
        return;
      }
      root.appendChild(h('div', { class: 'bt-wrap' }, [h('p', { class: 'bt-sub', text: 'There’s no agreement on your account yet.' }), back('Home', '#Dashboard')])); return;
    }
    var wrap = h('div', { class: 'bt-wrap bt-ct' }); root.appendChild(wrap);
    if (ct.status === 'signed' && ct.signed) {
      wrap.appendChild(back('My profile', '#Profile'));
      wrap.appendChild(h('div', { class: 'bt-ct-badge' }, [h('span', { 'aria-hidden': 'true', text: '✓' }), h('div', null, [h('b', { text: 'Signed' }), h('span', { text: 'You signed this on ' + new Date(ct.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + '. This copy is saved to your account.' })])]));
      wrap.appendChild(h('div', { class: 'bt-ct-pdfrow' }, [pdfBtn(ct)]));
      wrap.appendChild(C.render(ct.signed.terms, ct.signed.client, { signed: ct.signed ? { client: ct.signed.client, signed_at: ct.signed_at } : null }).node);
      wrap.appendChild(h('div', { class: 'bt-ct-pdfrow' }, [pdfBtn(ct)]));
      return;
    }
    var prof = S.profile || {}, pd = profileData();
    wrap.appendChild(h('div', { class: 'bt-ct-intro' }, [
      h('p', { class: 'bt-wel-k', text: 'One last step before you dive in' }),
      h('h1', { class: 'bt-wel-h', text: 'Your coaching agreement' }),
      h('p', { class: 'bt-sub', text: 'Sav has filled in your package, so check it looks right and add your address. Then tick the coaching commitments, read the terms, choose your marketing preference and sign. Questions? Message Sav before you sign.' })
    ]));
    var doc = C.render(ct.terms, { name: prof.full_name || '', email: prof.email || '', phone: pd.phone || '', address: '' }, { form: true });
    wrap.appendChild(doc.node);
    var sigName = h('input', { class: 'bt-in', id: 'ct-signame', autocomplete: 'name', placeholder: 'Type your full name' });
    var agree = h('input', { type: 'checkbox', id: 'ct-agree' });
    var msg = h('p', { class: 'bt-msg', role: 'status' });
    var btn = h('button', { class: 'bt-btn lime bt-ct-go', type: 'button', text: 'I agree & sign', onclick: function (e) {
      var v = doc.read(), need = [['name', 'your name'], ['email', 'your email'], ['phone', 'your phone'], ['address', 'your address']].filter(function (x) { return !v[x[0]]; });
      if (need.length) { msg.textContent = 'Pop in ' + need.map(function (x) { return x[1]; }).join(', ') + ' at the top first.'; doc.focus(need[0][0]); return; }
      if (!v.notesAgreed) { msg.textContent = 'Tick ' + (v.notesLeft === 1 ? 'the last box' : 'all ' + v.notesLeft + ' boxes') + ' under “To get the most out of coaching” first.'; doc.focusNotes(); return; }
      if (!v.termsAgreed) { msg.textContent = 'Tick that you’ve read and agree to the terms and conditions.'; doc.focusTerms(); return; }
      if (!tx(sigName.value)) { msg.textContent = 'Type your full name to sign.'; sigName.focus(); return; }
      if (!agree.checked) { msg.textContent = 'Tick the box to say you agree.'; agree.focus(); return; }
      delete v.notesLeft; var sig = Object.assign({}, v, { signedName: tx(sigName.value), agreed: doc.agreeText, tz: (window.BT_TIME && BT_TIME.tz()) || '', ua: navigator.userAgent.slice(0, 160) });
      btn.disabled = true; btn.textContent = 'Signing…';
      // never leave them stuck on "Signing…": give the save 20 seconds, then let them try again
      var call = sb && !APP.state.trial ? sb.rpc('sign_my_contract', { sig: sig }) : Promise.resolve({ data: new Date().toISOString() });
      var slow = new Promise(function (res) { setTimeout(function () { res({ error: { message: 'it’s taking too long. Check your internet and tap again.', slow: true } }); }, 20000); });
      Promise.race([call, slow]).then(function (r) {
        if (r && r.error) {
          // already signed (e.g. the first tap went through but the screen didn't update)? treat it as done
          if (/No agreement waiting/i.test(r.error.message || '')) { refreshContract(true); setTimeout(function () { location.reload(); }, 1500); msg.textContent = 'Checking your agreement…'; return; }
          btn.disabled = false; btn.textContent = 'I agree & sign'; msg.textContent = 'That didn’t go through: ' + (r.error.message || 'try again in a minute.'); return;
        }
        var at = (r && r.data) || new Date().toISOString();
        S.contract = Object.assign({}, ct, { status: 'signed', signed_at: at, signed: { client: sig, terms: ct.terms } });
        if (window.BT_NOTIFY && !APP.state.trial) BT_NOTIFY('signed');
        if (pd.phone !== v.phone) { var d = profileData(); d.phone = v.phone; wr(K.prof, d); }
        try { sparkleBurst(btn); } catch (x) {} document.body.classList.remove('bt-welcoming');
        wrap.innerHTML = '';
        wrap.appendChild(h('section', { class: 'bt-card2 bt-wel-card bt-ct-done' }, [
          h('span', { class: 'bt-wel-art done', 'aria-hidden': 'true' }, [h('span', { class: 'bt-wel-spark', text: '✓' })]),
          h('p', { class: 'bt-wel-k', text: 'Signed and saved' }),
          h('h1', { class: 'bt-wel-h', text: 'Welcome to Breakthrough.' }),
          h('p', { class: 'bt-sub', text: 'Your signed agreement is saved to your account.' }),
          h('button', { class: 'bt-btn lime', type: 'button', text: APP.state.tier === 'private' ? 'Next step →' : 'Let’s do this →', onclick: function () { goHref('#Dashboard'); } }),
          h('div', { class: 'bt-ct-keep' }, [
            h('p', { class: 'bt-ct-keep-h', text: 'Want your own copy?' }),
            pdfBtn(S.contract),
            h('p', { class: 'bt-sub small', text: 'It saves as a PDF you can keep in your Files or email to yourself. A copy has also been added to your profile automatically, so you can view it in the app any time you like.' })
          ])
        ]));
        window.scrollTo(0, 0);
      }).catch(function () { btn.disabled = false; btn.textContent = 'I agree & sign'; msg.textContent = 'That didn’t go through. Check your internet and tap again.'; });
    } });
    wrap.appendChild(h('section', { class: 'bt-card2 bt-ct-sign' }, [
      h('h2', { text: 'Sign' }),
      h('label', { class: 'bt-f' }, [h('span', { text: 'Type your full name as your signature' }), sigName]),
      h('label', { class: 'bt-ct-check', for: 'ct-agree' }, [agree, h('span', { text: doc.agreeText })]),
      msg, btn,
      h('p', { class: 'bt-sub small', text: 'Tapping “I agree & sign” signs this agreement electronically. Your name, the date and time are saved with a copy of these exact terms.' })
    ]));
  }
  function paceNote() {
    if (!isSelf() || peek()) return 'Go at your own pace. Each lesson unlocks as soon as you finish the one before it.';
    return 'Each lesson unlocks as soon as you finish the one before it. New weeks open as they’re released, and you’ll get a notification and an email when your next one does.';
  }
  // the save-the-app step is shared with 1:1: make its words fit self-paced
  function selfWords(el) {
    if (!isSelf() || !el) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) n.nodeValue = n.nodeValue.replace(/our 1:1 time together/g, 'your Breakthrough course').replace(/My 1:1 Breakthrough/g, 'Breakthrough').replace(/\b1:1 Breakthrough\b/g, 'Breakthrough');
  }
  function isSelf() { return !!(APP && APP.state && APP.state.tier !== 'private'); }
  function startedBefore() { var p = prog(); return Object.keys(p.done).some(function (id) { return INTRO.indexOf(id) < 0; }); } // self-paced clients from before this flow
  function needsStart() {
    if (!APP || !APP.state || APP.state.viewAs || (window.BT_DEMO && window.BT_DEMO.tour)) return false;
    if (APP.state.isAdmin && !playground()) return false;
    var o = rd(K.one) || {};
    if (isSelf()) return !o.homeSaved && !profileData().startDone && !startedBefore();
    return !(o.homeSaved && o.wa && (testsDone() || profileData().startDone));
  }
  function testsDone() { var o = rd(K.one) || {}, rep = rd(K.rep); return !!(((rep && rep.ranks) || o.repDone || o.repImg) && o.hd && o.disc); }
  function contractStepDone() { var c = APP.state.contract; return !!(c && c.status === 'signed'); }
  var INTRO = ['i1', 'i3', 'i2'];
  function introDone() { var p = prog(); return INTRO.every(function (id) { return p.done[id] || !findLesson(id); }); }
  // 1:1: after the start steps, only the Course (intro lessons) is open until the intro is done
  function introStage() {
    if (!APP || !APP.state || APP.state.viewAs || (window.BT_DEMO && window.BT_DEMO.tour)) return false;
    if (APP.state.isAdmin && !playground()) return false;
    if (isSelf() && startedBefore()) return false;
    return !needsStart() && !introDone();
  }
  function introAllowed(route) { route = String(route || ''); return /^(Course|Setup|Intentions|ActDone|Back|Profile|NextTest|RepTest)/.test(route) || INTRO.some(function (id) { return route === 'Lesson-' + id; }); }
  function StartView(root) {
    var first = tx((APP.state.profile || {}).full_name).split(' ')[0];
    // the same welcome banner as Home inside the app
    root.appendChild(h('div', { class: 'bt-hero1' }, [
      h('div', { class: 'bt-hero1-img' }, [h('img', { src: (window.BT_DEMO ? '' : '/') + 'img/sav/jump.jpg', alt: '' }), h('span', { class: 'bt-hero1-chip' }, [h('span', { 'aria-hidden': 'true', text: '✦ ' }), 'Breakthrough']), h('span', { class: 'bt-hero1-tag', text: APP.tierLabel ? APP.tierLabel() : '1:1 client' }),
        h('div', { class: 'bt-hero1-t' }, [h('span', { class: 'bt-hero1-k', text: 'Your Breakthrough Companion' }), h('h1', { text: first ? 'Welcome, ' + first.charAt(0).toUpperCase() + first.slice(1) + '.' : 'Welcome, you’re in.' })])]),
      h('p', { class: 'bt-hero1-p', text: 'Life’s an experiment, so let’s f*ck around and find out who you can become when you change your thoughts, actually feel your feelings, and take action in line with your goals.' })
    ]));
    var wrap = h('div', { class: 'bt-wrap bt-start' }); root.appendChild(wrap);
    var o = rd(K.one) || {}, page = !o.homeSaved || isSelf() ? 'home' : !o.wa ? 'wa' : 'tests';
    wrap.appendChild(firstCallSteps());
    var slot = h('div', { class: 'bt-start-' + page + (isSelf() ? ' self' : '') }); wrap.appendChild(slot); oneStart(slot, true); selfWords(slot); setTimeout(function () { selfWords(slot); }, 300);
    // "Start here" sits under the tracker, just below the dotted line
    var head = { home: 'Step 1: save the app', wa: 'Step 3: join WhatsApp', tests: 'Step 4: your three tests' }[page];
    var ob = slot.querySelector('.bt-onebox'), introEl = h('div', { class: 'bt-ct-intro' }, [h('p', { class: 'bt-wel-k', text: 'Start here · ' + head }), h('h1', { class: 'bt-wel-h', text: isSelf() ? (first ? first + ', let’s' : 'Let’s') + ' get you set up' : (first ? first + ', let’s' : 'Let’s') + ' get you ready for our first call' }), h('p', { class: 'bt-sub', text: 'One quick step at a time. Everything else in the app opens up as you go.' })]);
    if (ob) ob.insertBefore(introEl, ob.firstChild); else slot.insertBefore(introEl, slot.firstChild);
    var msg = h('p', { class: 'bt-msg', role: 'status' });
    var next = function () { window.scrollTo(0, 0); APP.reload(); };
    var btn = h('button', { class: 'bt-btn lime bt-start-done', type: 'button', text: page === 'tests' ? 'Done, open my course →' : 'Done, next step →', onclick: function () {
      var o2 = rd(K.one) || {};
      if (page === 'home') { o2.homeSaved = true; wr(K.one, o2); if (isSelf()) { var d4 = profileData(); d4.startDone = Date.now(); wr(K.prof, d4); goHref('#Course'); return; } next(); return; }
      if (page === 'wa') { o2.wa = true; wr(K.one, o2); next(); return; }
      if (!testsDone()) { msg.textContent = 'Finish your three tests above first (or skip for now below).'; return; }
      var d2 = profileData(); d2.startDone = Date.now(); wr(K.prof, d2); goHref('#Course');
    } });
    // the step's own "Done" button moves straight on to the next page
    slot.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.s-home button.gc, .s-wa button.gc'); if (b) setTimeout(next, 250); });
    if (page !== 'tests') btn.hidden = true;
    wrap.appendChild(h('div', { class: 'bt-start-foot' }, [btn, msg,
      page === 'tests' ? h('button', { class: 'bt-start-skip', type: 'button', text: 'I’ll finish my tests later (before our call)', onclick: function () { var d3 = profileData(); d3.startDone = Date.now(); wr(K.prof, d3); goHref('#Course'); } }) : null]));
  }
  // "Before our first call": 6 steps (3 here, then the 3 Introduction pieces in the course)
  function firstCallSteps() {
    var o = rd(K.one) || {}, p = prog(), rep0 = rd(K.rep);
    if (isSelf()) {
      var ss = [['Save the app', !!(o.homeSaved || profileData().startDone)], ['Welcome module', introDone()]], nd = ss.filter(function (x) { return x[1]; }).length, cu = -1; ss.forEach(function (x, k) { if (cu < 0 && !x[1]) cu = k; });
      return h('div', { class: 'bt-fc self' }, [h('div', { class: 'bt-fc-top' }, [h('b', { text: 'Before you start' }), h('span', { text: nd + ' of ' + ss.length + ' done' })]),
        h('ol', { class: 'bt-fc-list' }, ss.map(function (x, k) { return h('li', { class: x[1] ? 'done' : k === cu ? 'cur' : '' }, [h('span', { class: 'bt-fc-n', text: x[1] ? '✓' : String(k + 1) }), h('span', { class: 'bt-fc-t', text: x[0] })]); }))]);
    }
    var steps = [['Save the app', !!o.homeSaved], ['Sign your agreement', contractStepDone() && !!o.homeSaved], ['Join WhatsApp', !!o.wa], ['Your 3 tests', testsDone() || !!profileData().startDone], ['Welcome module', introDone()]];
    var n = steps.filter(function (x) { return x[1]; }).length, cur = -1; steps.forEach(function (x, k) { if (cur < 0 && !x[1]) cur = k; });
    return h('div', { class: 'bt-fc' }, [h('div', { class: 'bt-fc-top' }, [h('b', { text: 'Before our first call' }), h('span', { text: n + ' of ' + steps.length + ' done' })]),
      h('ol', { class: 'bt-fc-list' }, steps.map(function (x, k) { return h('li', { class: x[1] ? 'done' : k === cur ? 'cur' : '' }, [h('span', { class: 'bt-fc-n', text: x[1] ? '✓' : String(k + 1) }), h('span', { class: 'bt-fc-t', text: x[0] })]); }))]);
  }
  // a small floating note pointing at something on the page (the tour, a bit at a time, as they go)
  function pointAt(el, title, text, opts) {
    opts = opts || {};
    var old = document.getElementById('bt-point'); if (old) old.remove();
    var tip = h('div', { id: 'bt-point', class: 'bt-point' + (el ? '' : ' free'), role: 'status' }, [h('b', { text: title }), h('span', { text: text }),
      h('button', { class: 'bt-point-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: function () { tip.remove(); if (opts.onClose) opts.onClose(); } })]);
    document.body.appendChild(tip);
    if (!el) return tip;
    if (opts.scroll !== false) el.scrollIntoView({ block: 'center' });
    function place() { if (!document.body.contains(el) || !document.body.contains(tip)) { tip.remove(); window.removeEventListener('scroll', place); return; } var r = el.getBoundingClientRect(); var above = r.top - tip.offsetHeight - 14 > 64; tip.classList.toggle('below', !above); tip.style.top = (above ? r.top - tip.offsetHeight - 14 : r.bottom + 14) + 'px'; tip.style.setProperty('--ax', Math.min(Math.max(40, r.left + Math.min(r.width / 2, 60)), window.innerWidth - 40) + 'px'); }
    el.classList.add('bt-here'); place(); setTimeout(place, 60); window.addEventListener('scroll', place, { passive: true });
    return tip;
  }
  function tipSeen(k) { return !!((profileData().tips || {})[k]); }
  function tipDone(k) { var d = profileData(); d.tips = d.tips || {}; d.tips[k] = Date.now(); wr(K.prof, d); }
  function asYouGo(route) {
    var old = document.getElementById('bt-point'); if (old && !/^Course/.test(route)) old.remove();
    if (!APP || APP.state.viewAs || document.getElementById('bt-tour')) return;
    var m = /^Lesson-(.+)$/.exec(route || '');
    if (m && !prog().done[m[1]] && (!tipSeen('markdone') || introStage())) {
      setTimeout(function () { var b = document.getElementById('bt-done'); if (!b) return;
        pointAt(b, 'Watched it? Tap “Mark as done”', 'You have to mark each lesson as done to move on to the next one.', { scroll: false });
        b.addEventListener('click', function () { tipDone('markdone'); var t = document.getElementById('bt-point'); if (t) t.remove(); }, { once: true }); }, 900);
    }
    if (/^(Setup|Intentions)/.test(route || '') && !tipSeen('act-' + route)) {
      setTimeout(function () { pointAt(null, 'This is an activity', 'Work through it, then tap “Done” at the end. It’ll take you back to your course, ready for what’s next.', { onClose: function () { tipDone('act-' + route); } }); }, 900);
    }
  }
  // during the Introduction: a floating note that points at what to do next on the Course page
  function pointNext() {
    var nx = upNext(); if (!nx) return;
    var el = document.querySelector('#app .bt-ls a[href="' + lessonHref(nx.l) + '"]') || document.querySelector('#app a[href="' + lessonHref(nx.l) + '"]'); if (!el) return;
    var firstOne = nx.l.id === 'i1';
    pointAt(el, firstOne ? 'Start here: watch this first 👇' : 'Next up 👇', firstOne ? 'Your welcome video. Then “Set yourself up for success” and “Setting Intentions”.' : nx.l.title.replace(/^Activity:\s*/, ''));
  }
  var wState = { step: 0 };
  // Terms of Use + Privacy (public/js/terms.js), shown in a pop-up
  function termsNode() { var T0 = window.BT_TERMS || { sections: [] }; return h('div', { class: 'bt-terms' }, T0.sections.map(function (x) { return h('div', null, [h('b', { text: x[0] }), h('p', { text: x[1] })]); })); }
  function showTerms() {
    var bg, close = function () { bg.remove(); };
    bg = h('div', { class: 'bt-party', role: 'dialog', 'aria-label': 'Terms of use and privacy' }, [h('div', { class: 'bt-party-card bt-terms-card' }, [
      h('button', { class: 'bt-vdone-x', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close }),
      h('b', { text: 'Terms of use + privacy' }), termsNode(),
      h('button', { class: 'bt-btn lime', type: 'button', text: 'Close', onclick: close })])]);
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.body.appendChild(bg);
  }
  /* ---------------- notifications on by default ----------------
     Phones only allow notifications after a tap on "Allow", so: the welcome step has them switched on, and its last
     button asks. If this phone can't do them yet (iPhone in Safari, not the home-screen app), a card on Home asks
     again once she opens the app from her home screen. Already allowed? It switches on quietly. */
  function pushAutoOn(fromTap) {
    var P = window.BT_PUSH; if (!P || !APP.live || APP.state.viewAs || APP.state.trial) return Promise.resolve(false);
    if (!P.supported()) return Promise.resolve(false);
    var hr = profileData().remindHour; hr = hr === undefined ? 19 : hr;
    return P.status().then(function (st) {
      if (st && st.on) return true;
      var perm = window.Notification ? Notification.permission : 'default';
      if (perm === 'denied') return false;
      if (perm !== 'granted' && !fromTap) return false;
      return P.on(APP.state.isAdmin ? null : (hr === null ? null : String(hr))).then(function () { return true; }, function () { return false; });
    }).catch(function () { return false; });
  }
  function pushCard() {
    var pd = profileData(), P = window.BT_PUSH;
    if (pd.pushWanted === false || pd.pushAsked || !P || !P.supported() || !APP.live || APP.state.viewAs) return null;
    var card = h('div', { class: 'bt-pushask' }, [h('span', { class: 'bt-pushask-i', 'aria-hidden': 'true', text: '🔔' }), h('div', { class: 'bt-pushask-t' }, [h('b', { text: 'Switch on your notifications' }), h('span', { text: APP.state.tier === 'private' ? 'So you get your call reminders and Zoom link. Tap, then Allow.' : 'Your kind daily nudge. Tap, then Allow.' })]),
      h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Turn on', onclick: function () { pushAutoOn(true).then(function (ok) { var d = profileData(); d.pushAsked = Date.now(); wr(K.prof, d); card.remove(); APP.toast(ok ? 'Notifications are on ✓' : 'No worries. You can switch them on any time in your profile.'); }); } }),
      h('button', { class: 'bt-pushask-x', type: 'button', 'aria-label': 'Not now', text: '✕', onclick: function () { var d = profileData(); d.pushAsked = Date.now(); wr(K.prof, d); card.remove(); } })]);
    window.BT_PUSH.status().then(function (st) { if (st && st.on) card.remove(); else pushAutoOn(false).then(function (ok) { if (ok) card.remove(); }); });
    return card;
  }
  function WelcomeView(root) {
    document.body.classList.add('bt-welcoming');
    var S = APP.state, prof = S.profile || {}, pd = profileData(), sb = APP.sb();
    var dz = T.tz && T.tz() || '', draft = wState.d || (wState.d = { name: prof.full_name || '', email: prof.email || '', phone: pd.phone || '', country: pd.country || countryForZone(dz) || '', tz: pd.tz || dz });
    var STEPS = ['You', 'Contact', 'Your time', 'Your photo', 'Ready'];
    var wrap = h('div', { class: 'bt-wrap bt-wel' });
    root.appendChild(wrap);
    function save(extra) { var d = profileData(); Object.assign(d, extra); wr(K.prof, d); }
    function draw() {
      wrap.innerHTML = '';
      var st = wState.step;
      wrap.appendChild(h('div', { class: 'bt-wel-dots', 'aria-label': 'Step ' + (st + 1) + ' of ' + STEPS.length }, STEPS.map(function (n, i) { return h('span', { class: 'bt-wel-dot' + (i < st ? ' done' : i === st ? ' on' : ''), title: n }); })));
      var msg = h('p', { class: 'bt-msg', role: 'status' });
      var body = h('section', { class: 'bt-card2 bt-wel-card' });
      wrap.appendChild(body);
      function nav(nextFn, label) {
        return h('div', { class: 'bt-wel-nav' }, [
          st > 0 && st < 4 ? h('button', { class: 'bt-btn ghost', type: 'button', text: '← Back', onclick: function () { wState.step--; draw(); } }) : h('span'),
          h('button', { class: 'bt-btn lime', type: 'button', text: label || 'Next →', onclick: nextFn })
        ]);
      }
      if (st === 0) {
        var nm = h('input', { class: 'bt-in', id: 'wl-name', value: draft.name, autocomplete: 'name', placeholder: 'First name is perfect' });
        body.appendChild(h('span', { class: 'bt-wel-art', 'aria-hidden': 'true' }, [h('span', { class: 'bt-wel-spark', text: '✦' })]));
        body.appendChild(h('p', { class: 'bt-wel-k', text: 'Welcome to your Breakthrough space' }));
        body.appendChild(h('h1', { class: 'bt-wel-h', text: 'Let’s set you up. It takes about a minute.' }));
        body.appendChild(h('p', { class: 'bt-sub', text: 'A few quick questions so your days, streaks and reminders all run on your time.' }));
        body.appendChild(field('What should we call you?', nm));
        var agree = h('input', { type: 'checkbox', id: 'wl-terms' }); agree.checked = !!profileData().termsAt;
        body.appendChild(h('label', { class: 'bt-ct-check bt-wel-terms', for: 'wl-terms' }, [agree, h('span', null, ['I agree to the ', h('a', { href: '#', text: 'terms of use and privacy policy', onclick: function (e) { e.preventDefault(); showTerms(); } }), '.'])]));
        body.appendChild(msg);
        body.appendChild(nav(function () {
          var v = tx(nm.value); if (!v) { msg.textContent = 'Pop your name in first.'; nm.focus(); return; }
          if (!agree.checked) { msg.textContent = 'Tick that you agree to the terms of use and privacy policy first.'; agree.focus(); return; }
          save({ termsAt: profileData().termsAt || Date.now(), termsV: (window.BT_TERMS || {}).version || '' });
          draft.name = v;
          (sb && !APP.state.trial ? sb.rpc('update_my_profile', { new_name: v }) : Promise.resolve({})).then(function () { S.profile = Object.assign({}, S.profile, { full_name: v }); });
          wState.step = 1; draw();
        }));
        setTimeout(function () { nm.focus(); }, 50);
      } else if (st === 1) {
        var em = h('input', { class: 'bt-in', id: 'wl-email', type: 'email', value: draft.email, autocomplete: 'email' });
        var ph = h('input', { class: 'bt-in', id: 'wl-phone', type: 'tel', value: draft.phone, autocomplete: 'tel', placeholder: 'e.g. 0412 345 678' });
        body.appendChild(h('p', { class: 'bt-wel-k', text: 'Step 2 · How to reach you' }));
        body.appendChild(h('h1', { class: 'bt-wel-h', text: 'Hey ' + draft.name.split(' ')[0] + '! Where can Sav reach you?' }));
        body.appendChild(field('Email', em));
        body.appendChild(field('Mobile number', ph));
        body.appendChild(h('p', { class: 'bt-sub', text: 'Only used for your coaching. Never shared.' }));
        body.appendChild(msg);
        body.appendChild(nav(function () {
          var e = tx(em.value).toLowerCase(), p = tx(ph.value);
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.textContent = 'That email doesn’t look quite right.'; em.focus(); return; }
          if (p && p.replace(/[^\d]/g, '').length < 8) { msg.textContent = 'That number looks a little short.'; ph.focus(); return; }
          if (e !== (prof.email || '').toLowerCase() && sb) sb.auth.updateUser({ email: e });
          draft.email = e; draft.phone = p; save({ phone: p });
          wState.step = 2; draw();
        }));
      } else if (st === 2) {
        var csel = h('select', { class: 'bt-in', id: 'wl-country', autocomplete: 'country' });
        csel.appendChild(h('option', { value: '', text: 'Pick your country' }));
        CC.map(function (c) { return [c, countryName(c)]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); }).forEach(function (c) { var o = h('option', { value: c[0], text: c[1] }); if (c[0] === draft.country) o.selected = true; csel.appendChild(o); });
        var zsel = h('select', { class: 'bt-in', id: 'wl-tz' });
        var clock = h('p', { class: 'bt-wel-clock', role: 'status' });
        function fillZones() {
          zsel.innerHTML = '';
          var list = CZ[csel.value] ? CZ[csel.value].split(' ') : allZones();
          if (list.indexOf(draft.tz) < 0 && CZ[csel.value]) draft.tz = list[0];
          list.forEach(function (z) { var o = h('option', { value: z, text: CZ[csel.value] ? zoneLabel(z) : z.replace(/_/g, ' ') + ' · ' + zoneLabel(z).replace(/^.*\(/, '(') }); if (z === draft.tz) o.selected = true; zsel.appendChild(o); });
          if (!zsel.value && list.length) zsel.value = list[0];
          tick();
        }
        function tick() { draft.tz = zsel.value; clock.innerHTML = ''; clock.appendChild(h('span', { text: '🕘 For you it’s ' })); clock.appendChild(h('b', { text: zoneNow(zsel.value) })); clock.appendChild(h('span', { text: '. Look right?' })); }
        csel.addEventListener('change', function () { draft.country = csel.value; fillZones(); });
        zsel.addEventListener('change', tick);
        body.appendChild(h('p', { class: 'bt-wel-k', text: 'Step 3 · Your time' }));
        body.appendChild(h('h1', { class: 'bt-wel-h', text: 'Where in the world are you?' }));
        body.appendChild(h('p', { class: 'bt-sub', text: 'Your day resets at midnight your time, so your streaks, daily reps and reminders line up with your actual day.' }));
        body.appendChild(field('Country', csel));
        body.appendChild(field('Timezone', zsel));
        body.appendChild(clock);
        body.appendChild(msg);
        fillZones();
        body.appendChild(nav(function () {
          if (!csel.value) { msg.textContent = 'Pick your country first.'; csel.focus(); return; }
          save({ country: csel.value, tz: zsel.value });
          wState.step = 3; draw();
        }));
      } else if (st === 3) {
        var big = avatarNode('big');
        var file = h('input', { type: 'file', accept: 'image/*', class: 'bt-file', id: 'wl-photo', onchange: function (e) {
          var f = e.target.files && e.target.files[0]; if (!f) return;
          e.target.value = ''; cropPhoto(f).then(function (url) { var d = profileData(); d.photo = url; delete d.char; wr(K.prof, d); draw(); }, function (er) { if (!er || er.message !== 'cancel') msg.textContent = 'Couldn’t read that photo. Try another one.'; });
        } });
        var chars = h('div', { class: 'bt-chars', role: 'list' }, CHARS.map(function (c) {
          var b = h('button', { type: 'button', class: 'bt-charbtn' + (pd.char === c.id && !pd.photo ? ' on' : ''), 'aria-label': c.name, title: c.name, onclick: function () { var d = profileData(); d.char = c.id; delete d.photo; wr(K.prof, d); pd = d; draw(); } });
          b.innerHTML = charSvg(c.id) + '<span>' + esc(c.name) + '</span>';
          return b;
        }));
        pd = profileData();
        body.appendChild(h('p', { class: 'bt-wel-k', text: 'Step 4 · Your face' }));
        body.appendChild(h('h1', { class: 'bt-wel-h', text: 'Add a profile picture' }));
        body.appendChild(h('div', { class: 'bt-wel-av' }, [big]));
        body.appendChild(h('div', { class: 'bt-row' }, [h('label', { class: 'bt-btn lime', for: 'wl-photo' }, ['Upload a photo', file])]));
        body.appendChild(h('p', { class: 'bt-sub', text: 'Or pick a character for where your spark’s at right now:' }));
        body.appendChild(chars);
        body.appendChild(msg);
        body.appendChild(nav(function () { wState.step = 4; draw(); }, pd.photo || pd.char ? 'Next →' : 'Skip for now →'));
      } else {
        body.appendChild(h('span', { class: 'bt-wel-art done', 'aria-hidden': 'true' }, [h('span', { class: 'bt-wel-spark', text: '✓' })]));
        body.appendChild(h('p', { class: 'bt-wel-k', text: 'You’re all set' }));
        body.appendChild(h('h1', { class: 'bt-wel-h', text: 'Welcome in, ' + draft.name.split(' ')[0] + '.' }));
        body.appendChild(h('ul', { class: 'bt-wel-list' }, [
          h('li', { text: 'Your day resets at midnight in ' + zoneLabel(draft.tz || T.tz()) + '.' }),
          h('li', { text: 'Your calendar, streaks and reminders all run on your time.' }),
          h('li', { text: 'Change any of this later in your profile.' })
        ]));
        // notifications: on by default (she can switch them off here or any time in her profile)
        if (wState.push == null) wState.push = true;
        var pushT = h('button', { class: 'bt-wel-push' + (wState.push ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': wState.push ? 'true' : 'false', onclick: function () { wState.push = !wState.push; draw(); } }, [
          h('span', { class: 'bt-wel-push-t' }, [h('b', { text: '🔔 Notifications' }), h('span', { text: APP.state.tier === 'private' ? 'Call reminders, a kind daily nudge and the odd cheer. Your phone will ask, tap Allow.' : 'A kind daily nudge and the odd cheer. Your phone will ask, tap Allow.' })]),
          h('span', { class: 'bt-wel-sw', 'aria-hidden': 'true' }, [h('i')])]);
        body.appendChild(pushT);
        body.appendChild(nav(function () {
          var want = !!wState.push;
          save({ onboarded: Date.now(), pushWanted: want, remindHour: profileData().remindHour === undefined ? 19 : profileData().remindHour });
          if (want) pushAutoOn(true);
          wState = { step: 0 }; document.body.classList.remove('bt-welcoming'); goHref('#Dashboard');
        }, 'Take me in →'));
      }
      try { window.scrollTo(0, 0); } catch (e) {}
    }
    draw();
    waves(root);
  }

  /* ---------------- profile ---------------- */
  var SYS = { V: ['Visual', '#F4C2F7'], A: ['Auditory', '#F1F9A6'], K: ['Kinesthetic', '#F28C3B'], Ad: ['Auditory digital', '#4E0C08'] };
  var REP_QS = [['K', 'A', 'V', 'Ad'], ['A', 'V', 'Ad', 'K'], ['V', 'K', 'Ad', 'A'], ['A', 'Ad', 'K', 'V'], ['A', 'Ad', 'K', 'V']];
  function resizeImage(file, max) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onerror = rej;
      r.onload = function () {
        var img = new Image();
        img.onerror = rej;
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.85));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  // pick a photo, then drag + zoom it into the circle before it's saved (square, 360px)
  function cropPhoto(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader(); r.onerror = rej;
      r.onload = function () {
        var img = new Image(); img.onerror = rej;
        img.onload = function () {
          var V = 280, base = Math.max(V / img.width, V / img.height), z = 1, x = 0, y = 0;
          var cv = h('canvas', { class: 'bt-crop-cv', width: String(V * 2), height: String(V * 2), 'aria-label': 'Drag to move your photo' });
          var ctx = cv.getContext('2d');
          var clamp = function () { var w = img.width * base * z, hh = img.height * base * z; x = Math.min(0, Math.max(V - w, x)); y = Math.min(0, Math.max(V - hh, y)); };
          var draw = function () { clamp(); ctx.clearRect(0, 0, V * 2, V * 2); ctx.drawImage(img, x * 2, y * 2, img.width * base * z * 2, img.height * base * z * 2); };
          x = (V - img.width * base) / 2; y = (V - img.height * base) / 2; draw();
          var drag = null;
          cv.addEventListener('pointerdown', function (e) { drag = { px: e.clientX, py: e.clientY, x: x, y: y }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
          cv.addEventListener('pointermove', function (e) { if (!drag) return; var k = V / cv.getBoundingClientRect().width; x = drag.x + (e.clientX - drag.px) * k; y = drag.y + (e.clientY - drag.py) * k; draw(); });
          var up = function () { drag = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
          var zoom = h('input', { type: 'range', min: '1', max: '4', step: '0.01', value: '1', class: 'bt-crop-z', 'aria-label': 'Zoom' });
          zoom.addEventListener('input', function () { var nz = Number(zoom.value), cx = V / 2, cy = V / 2; x = cx - (cx - x) * nz / z; y = cy - (cy - y) * nz / z; z = nz; draw(); });
          var bg, finish = function (ok) {
            bg.remove();
            if (!ok) { rej(new Error('cancel')); return; }
            var out = document.createElement('canvas'); out.width = 360; out.height = 360;
            out.getContext('2d').drawImage(cv, 0, 0, V * 2, V * 2, 0, 0, 360, 360);
            res(out.toDataURL('image/jpeg', 0.85));
          };
          bg = h('div', { class: 'bt-party bt-crop', role: 'dialog', 'aria-label': 'Crop your photo' }, [h('div', { class: 'bt-party-card bt-crop-card' }, [
            h('b', { text: 'Fit your photo' }), h('p', { text: 'Drag to move it, slide to zoom.' }),
            h('div', { class: 'bt-crop-frame' }, [cv]), h('div', { class: 'bt-crop-zrow' }, [h('span', { 'aria-hidden': 'true', text: '−' }), zoom, h('span', { 'aria-hidden': 'true', text: '+' })]),
            h('div', { class: 'bt-ready-btns' }, [h('button', { class: 'bt-btn lime', type: 'button', text: 'Use this photo', onclick: function () { finish(true); } }), h('button', { class: 'bt-btn ghost', type: 'button', text: 'Cancel', onclick: function () { finish(false); } })])
          ])]);
          document.body.appendChild(bg);
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function card(title, kids, cls) { return h('section', { class: 'bt-card2 ' + (cls || '') }, [title ? h('h2', { text: title }) : null].concat(kids)); }
  function field(label, input) { return h('label', { class: 'bt-f' }, [h('span', { text: label }), input]); }

  function ProfileView(root) {
    var S = APP.state, prof = S.profile || {}, pd = profileData(), sb = APP.sb();
    root.appendChild(pageHead(S.tier === 'private' ? '1:1 client' : 'Self-paced', 'Your profile'));
    var wrap = h('div', { class: 'bt-wrap' }, [back('Home', '#Dashboard')]);
    // avatar
    var big = avatarNode('big');
    var msgAv = h('p', { class: 'bt-msg', role: 'status' });
    var file = h('input', { type: 'file', accept: 'image/*', class: 'bt-file', id: 'bt-photo', onchange: function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      e.target.value = ''; cropPhoto(f).then(function (url) { var d = profileData(); d.photo = url; delete d.char; wr(K.prof, d); APP.reload(); }, function (er) { if (!er || er.message !== 'cancel') msgAv.textContent = 'Couldn’t read that photo. Try another one.'; });
    } });
    var chars = h('div', { class: 'bt-chars', role: 'list' }, CHARS.map(function (c) {
      var b = h('button', { type: 'button', class: 'bt-charbtn' + (pd.char === c.id && !pd.photo ? ' on' : ''), 'aria-label': c.name, title: c.name, onclick: function () { var d = profileData(); d.char = c.id; delete d.photo; wr(K.prof, d); APP.reload(); } });
      b.innerHTML = charSvg(c.id) + '<span>' + esc(c.name) + '</span>';
      return b;
    }));
    wrap.appendChild(card(null, [
      h('div', { class: 'bt-pro-top' }, [big, h('div', null, [h('b', { class: 'bt-pro-n', text: prof.full_name || 'Add your name below' }), h('span', { class: 'bt-pro-e', text: prof.email || '' })])]),
      h('div', { class: 'bt-row' }, [h('label', { class: 'bt-btn lime', for: 'bt-photo' }, ['Upload a photo', file]),
        pd.photo || pd.char ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Remove', onclick: function () { var d = profileData(); delete d.photo; delete d.char; wr(K.prof, d); APP.reload(); } }) : null]),
      msgAv,
      h('p', { class: 'bt-sub', text: 'Or pick a character for where your spark’s at right now:' }), chars
    ], 'bt-pro-av'));

    // details
    var name = h('input', { class: 'bt-in', id: 'pf-name', value: prof.full_name || '', autocomplete: 'name' });
    var email = h('input', { class: 'bt-in', id: 'pf-email', type: 'email', value: prof.email || '', autocomplete: 'email' });
    var pw1 = h('input', { class: 'bt-in', id: 'pf-pw', type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' });
    var pw2 = h('input', { class: 'bt-in', id: 'pf-pw2', type: 'password', autocomplete: 'new-password', placeholder: 'Type it again' });
    var m1 = h('p', { class: 'bt-msg', role: 'status' }), m2 = h('p', { class: 'bt-msg', role: 'status' }), m3 = h('p', { class: 'bt-msg', role: 'status' });
    wrap.appendChild(card('Your details', [
      field('Name', name),
      h('button', { class: 'bt-btn', type: 'button', text: 'Save name', onclick: function () {
        var v = tx(name.value); if (!v) { m1.textContent = 'Pop your name in first.'; return; }
        (sb && !APP.state.trial ? sb.rpc('update_my_profile', { new_name: v }) : Promise.resolve({})).then(function (r) {
          if (r && r.error) { m1.textContent = 'Couldn’t save that. Try again in a minute.'; return; }
          S.profile = Object.assign({}, S.profile, { full_name: v }); m1.textContent = 'Saved ✓';
        });
      } }), m1,
      field('Email', email),
      h('button', { class: 'bt-btn', type: 'button', text: 'Change email', onclick: function () {
        var v = tx(email.value).toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { m2.textContent = 'That email doesn’t look quite right.'; return; }
        if (v === (prof.email || '').toLowerCase()) { m2.textContent = 'That’s already your email.'; return; }
        (sb ? sb.auth.updateUser({ email: v }) : Promise.resolve({})).then(function (r) {
          m2.textContent = r && r.error ? 'Couldn’t change it: ' + (r.error.message || 'try again') : 'Check both inboxes. Tap the confirm link in each email and your new email is set.';
        });
      } }), m2,
      h('p', { class: 'bt-sub', text: 'Set a password if you’d rather not wait for an email code each time.' }),
      field('New password', pw1), field('Confirm password', pw2),
      h('button', { class: 'bt-btn', type: 'button', text: 'Save password', onclick: function () {
        if (pw1.value.length < 8) { m3.textContent = 'Make it at least 8 characters.'; return; }
        if (pw1.value !== pw2.value) { m3.textContent = 'Those two don’t match.'; return; }
        (sb ? sb.auth.updateUser({ password: pw1.value }) : Promise.resolve({})).then(function (r) {
          m3.textContent = r && r.error ? 'Couldn’t save it: ' + (r.error.message || 'try again') : 'Password saved ✓ Next time, tap “I’ve set a password” on the login screen.';
          pw1.value = ''; pw2.value = '';
        });
      } }), m3
    ]));

    // phone notifications: a gentle daily reminder at the time they pick (and for Sav, pings about wins + agreements)
    if (window.BT_PUSH && !S.viewAs && !S.trial) (function () {
      var coachMode = S.isAdmin && !window.BT_DEMO;
      var body = h('div', { class: 'bt-push' }), msg = h('p', { class: 'bt-sub small', role: 'status' });
      var hourSel = h('select', { class: 'bt-in sm', 'aria-label': 'Reminder time' }, [h('option', { value: '', text: 'No daily reminder' })].concat([7, 8, 9, 10, 12, 15, 17, 19, 20, 21].map(function (hr) { return h('option', { value: String(hr), text: 'Remind me at ' + (hr % 12 || 12) + (hr < 12 ? 'am' : 'pm') }); })));
      hourSel.value = profileData().remindHour === undefined ? '19' : String(profileData().remindHour || '');
      var draw = function (st) {
        body.innerHTML = '';
        if (!BT_PUSH.supported()) { body.appendChild(h('p', { class: 'bt-sub', text: 'This browser can’t do notifications. On an iPhone, add the app to your home screen first (Share → Add to Home Screen), then open it from there.' })); return; }
        if (!BT_PUSH.standalone() && /iPhone|iPad/.test(navigator.userAgent)) body.appendChild(h('p', { class: 'bt-sub small', text: 'On iPhone this only works from the app on your home screen, not in Safari.' }));
        body.appendChild(h('p', { class: 'bt-sub', text: coachMode ? 'A ping when a client adds a win, signs their agreement, or is waiting for you to send it.' : 'One kind reminder a day at most, at the time you pick: your Today’s reps, or a gentle nudge back to your course if it’s been a while. Nothing spammy, and nothing on days you’ve already done your reps.' }));
        if (!coachMode && S.tier === 'private') body.appendChild(h('p', { class: 'bt-sub small', text: '📅 Plus reminders for your calls with Savannah: the day before, 2 hours before and 15 minutes before. Tap one to jump straight into Zoom. You’ll get an email with your Zoom link at the same times.' }));
        if (!coachMode) body.appendChild(h('label', { class: 'bt-f' }, [h('span', { text: 'When' }), hourSel]));
        var on = st && st.on;
        body.appendChild(h('div', { class: 'bt-row' }, [
          h('button', { class: 'bt-btn ' + (on ? '' : 'lime'), type: 'button', text: on ? 'Save' : '🔔 Turn on notifications', onclick: function (e) {
            if (window.BT_DEMO) { msg.textContent = 'In the real app, your phone asks “Allow notifications?” here. Tap Allow and you’re set.'; return; }
            var b = e.currentTarget; b.disabled = true; msg.textContent = 'One sec…';
            var d = profileData(); d.remindHour = hourSel.value === '' ? null : Number(hourSel.value); wr(K.prof, d);
            BT_PUSH.on(coachMode ? null : hourSel.value).then(function () { msg.textContent = 'You’re all set ✓'; BT_PUSH.status().then(draw); }, function (err) { b.disabled = false; msg.textContent = (err && err.message) || 'That didn’t work. Try again in a minute.'; });
          } }),
          on ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Turn off', onclick: function () { BT_PUSH.off().then(function () { msg.textContent = 'Notifications are off on this phone.'; BT_PUSH.status().then(draw); }); } }) : null
        ]));
        body.appendChild(msg);
      };
      BT_PUSH.status().then(draw);
      wrap.appendChild(card('Notifications', [body]));
    })();
    wrap.appendChild(card('Terms + privacy', [h('p', { class: 'bt-sub', text: profileData().termsAt ? 'You agreed on ' + new Date(profileData().termsAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + '.' : 'How the app works and how your information is looked after.' }), h('button', { class: 'bt-btn ghost', type: 'button', text: 'Read the terms + privacy', onclick: showTerms })]));
    wrap.appendChild(card('The app tour', [h('p', { class: 'bt-sub', text: 'A walk through every page and how it all connects, any time you want it.' }), h('button', { class: 'bt-btn', type: 'button', text: 'Take the tour →', onclick: function () { goHref('#Dashboard'); setTimeout(appTour, 900); } })]));
    // 1:1 calls: times, Zoom link and booked dates (set by Sav in the coach dashboard)
    if (S.tier === 'private') {
      var ci = callInfo(), ups = ci.list.slice(0, 6);
      wrap.appendChild(card('Your calls with Sav', [
        ci.times ? h('p', { class: 'bt-calls-times', text: ci.times }) : null,
        ups.length ? h('ul', { class: 'bt-calls-list' }, ups.map(function (x) { var w = callWhen(x.start); return h('li', null, [h('div', null, [h('b', { text: w.day }), h('span', { text: w.time + ' your time' })]), zoomBtn(x.zoom)]); })) : h('p', { class: 'bt-sub', text: 'Your booked calls will show up here.' }),
        !ups.some(function (x) { return x.zoom; }) ? (ci.zoom ? zoomBtn(ci.zoom, true) : h('p', { class: 'bt-sub', text: 'Your Zoom link will show up here.' })) : null,
        h('p', { class: 'bt-calls-tip', text: '💻 Best on a laptop: log in to the app on your computer and open the Zoom link from there.' })
      ], 'bt-calls'));
    }
    // signed agreement
    if (S.contract && S.contract.status === 'signed') wrap.appendChild(card('Your coaching agreement', [h('p', { class: 'bt-sub', text: 'Signed ' + new Date(S.contract.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Your copy is saved here.' }), h('a', { class: 'bt-btn', href: '#Contract', text: 'View my agreement →' })]));
    // progress
    var st = stats(), uw = unlockedWeek();
    var maxWeek = course().weeks.reduce(function (m, w) { return Math.max(m, w.week); }, 1);
    var j = comp().j || {}, answered = Object.keys(j).filter(function (k) { return tx(j[k]); }).length;
    // (progress, proof and saved activities live in My Book, so the profile stays simple)

    // intentions
    var d = comp();
    var rows = [['Anchor word', d.anchor], ['Who I’m becoming', d.nsToward], ['Who I’m not anymore', d.nsAway], ['My why', d.intention]].filter(function (r) { return tx(r[1]); });
    wrap.appendChild(card('Your intentions', rows.length ? rows.map(function (r) { return h('div', { class: 'bt-int' }, [h('span', { text: r[0] }), h('p', { text: tx(r[1]) })]); }).concat([h('a', { class: 'bt-link2', href: '#Dashboard', text: 'Edit them under Resources › Intentions →' })])
      : [h('p', { class: 'bt-sub', text: 'You haven’t set these yet. Find Intentions under Resources on your home page.' }), h('a', { class: 'bt-btn lime', href: '#Dashboard', text: 'Go to Home' })]));

    // tests (1:1)
    if (S.tier === 'private') {
      var one = rd(K.one) || {}, rep = rd(K.rep), kids = [];
      if (rep && rep.ranks) {
        var t = { V: 0, A: 0, K: 0, Ad: 0 };
        REP_QS.forEach(function (q, qi) { q.forEach(function (sy, oi) { t[sy] += (rep.ranks[qi] && rep.ranks[qi][oi]) || 0; }); });
        var order = Object.keys(t).sort(function (a, b) { return t[b] - t[a]; });
        kids.push(h('div', { class: 'bt-test' }, [h('b', { text: 'Representational system' }), h('span', { class: 'bt-sub', text: 'You lead with ' + SYS[order[0]][0] }),
          h('div', { class: 'bt-repbars' }, order.map(function (k) { return h('div', { class: 'bt-rb' }, [h('span', { text: SYS[k][0] }), h('span', { class: 'bt-rb-tr' }, [h('span', { style: 'width:' + (5 * t[k]) + '%;background:' + SYS[k][1] })]), h('b', { text: t[k] + '/20' })]); })),
          h('a', { class: 'bt-link2', href: '#RepTest', text: 'See full results or retake it →' })]));
      } else kids.push(h('div', { class: 'bt-test off' }, [h('b', { text: 'Representational system' }), h('span', { class: 'bt-sub', text: 'Not done yet' }), h('a', { class: 'bt-btn lime', href: '#RepTest', text: 'Take the test' })]));
      var TLINK = { hd: ['https://www.myhumandesign.com/', 'Get my chart', 'Open My Human Design'], disc: ['https://www.123test.com/disc-personality-test/', 'Take the DISC test', 'Open the DISC test'] };
      [['hd', 'Human Design chart'], ['disc', 'DISC profile']].forEach(function (tdef) {
        var rec = one[tdef[0]], mm = h('p', { class: 'bt-msg', role: 'status' });
        var inp = h('input', { type: 'file', accept: 'image/*,application/pdf', class: 'bt-file', id: 'up-' + tdef[0], onchange: function (e) {
          var f = e.target.files && e.target.files[0]; if (!f) return;
          var date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
          var save = function (r) { var o = rd(K.one) || {}; o[tdef[0]] = r; wr(K.one, o); APP.reload(); };
          if (f.type === 'application/pdf') { if (f.size > 2500000) { mm.textContent = 'That PDF is too big. Try a screenshot instead.'; return; } var fr = new FileReader(); fr.onload = function () { save({ type: 'pdf', name: f.name, date: date, data: fr.result }); }; fr.readAsDataURL(f); return; }
          resizeImage(f, 1400).then(function (url) { save({ type: 'image', name: f.name, date: date, data: url }); }, function () { mm.textContent = 'Couldn’t read that file. Try a screenshot.'; });
        } });
        var has = rec && rec.data;
        kids.push(h('div', { class: 'bt-test' + (rec ? '' : ' off') }, [h('b', { text: tdef[1] }),
          h('span', { class: 'bt-sub', text: has ? 'Saved ' + (rec.date || '') : rec && rec.type === 'skip' ? 'No birth time yet' : rec ? 'Marked done, no copy saved' : 'Not uploaded yet' }),
          has && rec.type !== 'pdf' ? h('img', { class: 'bt-test-img', src: rec.data, alt: tdef[1] }) : null,
          has && rec.type === 'pdf' ? h('span', { class: 'bt-sub', text: 'PDF: ' + (rec.name || 'your file') }) : null,
          h('div', { class: 'bt-row' }, [h('a', { class: 'bt-btn ' + (has ? 'ghost' : 'lime'), href: TLINK[tdef[0]][0], target: '_blank', rel: 'noopener', text: (has ? TLINK[tdef[0]][2] : TLINK[tdef[0]][1]) + ' ↗' }),
            h('label', { class: 'bt-btn ghost', for: 'up-' + tdef[0] }, [has ? 'Replace' : 'Upload it here', inp])]), mm]));
      });
      var todo = !((rep && rep.ranks) || one.repDone || one.repImg) || !one.hd || one.hd.type === 'skip' || !one.disc;
      var tCard = card(todo ? 'To be completed' : 'Your tests', [h('p', { class: 'bt-sub', text: todo ? 'Your tests, ready whenever you are. The links stay here, so you can come back any time. Results save to your profile, so Savannah can see them too.' : 'Saved to your profile, so Savannah can see them too. The links stay here if you ever want to look again.' }), h('div', { class: 'bt-tests' }, kids)], todo ? 'bt-todo' : '');
      if (todo) wrap.insertBefore(tCard, wrap.children[1] || null); else wrap.appendChild(tCard);
    }

    wrap.appendChild(h('div', { class: 'bt-row' }, [
      h('button', { class: 'bt-btn ghost', type: 'button', text: 'Back up my answers', onclick: function () { APP.exportData(); } }),
      APP.live ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Log out', onclick: function () { APP.logout(); } }) : null
    ]));
    root.appendChild(wrap); waves(root);
  }

  // "Next test" from the Rep System Test: back to the start steps (or the profile) at the next test to do
  function NextTestView(root) {
    var o = rd(K.one) || {}, id = !o.hd ? 'test-hd' : !o.disc ? 'test-disc' : '';
    try { sessionStorage.setItem('bt-focus-el', id || 'tests'); } catch (e) {}
    setTimeout(function () { goHref(needsStart() ? '#Start' : '#Profile'); }, 0);
  }
  window.BT_NATIVE = { NextTest: NextTestView, Course: CourseView, Lesson: LessonView, Profile: ProfileView, Proof: ProofView, ActDone: ActDoneView, Back: function (root, resId) { setTimeout(function () { if (!activityBack(resId)) goHref('#Resources'); }, 30); }, Setup: SetupView, Intentions: homeOn('home', 'intent'), Journal: function (root) { bookState.tab = 'journal'; bookState.day = ''; BookView(root); }, Resources: homeOn('res'), Book: BookView, Welcome: WelcomeView, Contract: ContractView, Start: StartView };
  window.BT_COURSE = {
    init: function (app) { APP = app; h = app.h; try { migrateWins(); backfillProof(); } catch (e) {} watchSlots(); watchJournal(); watchReturns(); },
    ensureFooter: ensureFooter,
    afterShow: function (route) {
      ensureFooter();
      try { refreshContract(false); } catch (e) {}
      if (route !== 'Welcome' && route !== 'Start' && !(route === 'Contract' && needsContract())) document.body.classList.remove('bt-welcoming');
      document.body.classList.toggle('bt-intro', introStage());

      document.body.classList.toggle('bt-on-res', /^Resources/.test(route));
      if (/^Resources/.test(route)) { var appEl = document.getElementById('app'), first0 = appEl && appEl.querySelector('div'); if (first0 && !appEl.querySelector('.bt-ph.res')) { var rs0 = (window.BT_RESOURCES || []).filter(function (r) { return r.id !== 'dose' && r.id !== 'pause' && r.id !== 'move'; }), op0 = rs0.filter(function (r) { return !r.week || isOpen(r.week); }).length; var ph0 = pageHead('Every tool in one place', 'Resources', op0 + ' of ' + rs0.length + ' open · more unlock as you go'); ph0.classList.add('res'); appEl.insertBefore(ph0, appEl.firstChild); waves(appEl); } }
      var oldPt = document.getElementById('bt-point'); if (oldPt) oldPt.remove();
      try { asYouGo(route); } catch (e) {}
      if (introStage() && /^Course/.test(route)) { var host0 = document.querySelector('#app .bt-wrap'); if (host0 && !host0.querySelector('.bt-fc')) { host0.insertBefore(firstCallSteps(), host0.firstChild); } setTimeout(pointNext, 500); }
      if (route === 'Contract' && needsContract()) document.body.classList.add('bt-welcoming');
      if (route !== 'Welcome' && route !== 'Contract' && route !== 'Start' && !needsWelcome() && !needsContract() && !needsStart()) { try { nsSplash(); } catch (e) {} try { maybeTour(route); } catch (e) {} }
      renderTopNav(route); curRoute = route;
      var lockNav = function () {
        var starting = needsStart(), intro = introStage();
        if (document.getElementById('bt-tour') || (!starting && !intro)) return;
        document.querySelectorAll('#bt-top .bt-top-i, #bt-top .bt-top-av').forEach(function (a) {
          var href = a.getAttribute('href') || '', open = intro && (href === '#Course' || href === '#Profile');
          if (open) return;
          a.classList.add('locked'); a.removeAttribute('href'); a.setAttribute('role', 'link'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('title', 'Locked for now');
          if (a.classList.contains('bt-top-i')) a.appendChild(h('span', { class: 'bt-lock-ic', 'aria-hidden': 'true', text: '🔒' }));
          a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); APP.toast(starting ? 'This opens once your start steps are done.' : 'This opens after the welcome module.'); }, true);
        });
        var mb = document.querySelector('.bt-menubtn'); if (mb) mb.classList.add('bt-hide-lock');
      };
      lockNav();
      try { var st0 = sessionStorage.getItem('bt-scrollto'); if (st0 && /^Course/.test(route)) { sessionStorage.removeItem('bt-scrollto'); [120, 500].forEach(function (ms) { setTimeout(function () { var el = document.querySelector('#app details.bt-wk a[href="' + st0 + '"]') || document.querySelector('#app a[href="' + st0 + '"]'); if (el) { var dw = el.closest('details'); if (dw && !dw.open) dw.open = true; el.scrollIntoView({ block: 'center' }); el.classList.add('bt-here'); setTimeout(function () { el.classList.remove('bt-here'); }, 2600); if (ms === 500) { try { if (sessionStorage.getItem('bt-scrollto-act')) { sessionStorage.removeItem('bt-scrollto-act'); APP.toast('Your activity is next. Tap it to do it now.'); } } catch (x) {} } } }, ms); }); } } catch (e) {}
      try { var sb0 = JSON.parse(sessionStorage.getItem('bt-scrollback') || 'null'); if (sb0) { sessionStorage.removeItem('bt-scrollback'); if (sb0.route === route) [80, 400].forEach(function (ms) { setTimeout(function () { window.scrollTo(0, sb0.y); }, ms); }); } } catch (e) {}
      var oldR = document.getElementById('bt-ret'); if (oldR) oldR.remove();
      if (RET_ROUTES[route]) { var rs = retStrip(RET_ROUTES[route]); if (rs) { rs.id = 'bt-ret'; var host = document.getElementById('app'); if (host && host.parentNode) host.parentNode.insertBefore(rs, host); } }
      try { addIntro(route); } catch (e) {}
      // opened from the "Today's reps" notification: land on the reps card
      try { if (/[?&]go=reps/.test(location.search)) { sessionStorage.setItem('bt-go', 'reps'); history.replaceState(null, '', location.pathname + location.hash); } if (sessionStorage.getItem('bt-go') === 'reps' && /^Dashboard/.test(route)) { sessionStorage.removeItem('bt-go'); [300, 900].forEach(function (ms) { setTimeout(function () { var rp = document.querySelector('#app .rp'); if (rp) { rp.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); if (ms === 900) { rp.classList.add('bt-here'); setTimeout(function () { rp.classList.remove('bt-here'); }, 2600); } } }, ms); }); } } catch (e) {}
      try { var fe = sessionStorage.getItem('bt-focus-el'); if (fe && /^(Start|Profile)/.test(route)) { sessionStorage.removeItem('bt-focus-el'); [200, 700].forEach(function (ms) { setTimeout(function () { var el = (fe !== 'tests' && document.getElementById(fe)) || Array.prototype.filter.call(document.querySelectorAll('#app section'), function (x) { return /Your tests|three tests/i.test((x.querySelector('h2,h3') || {}).textContent || ''); })[0]; if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); if (ms === 700) { el.classList.add('bt-here'); setTimeout(function () { el.classList.remove('bt-here'); }, 2600); } } }, ms); }); } } catch (e) {}
      if (window.BT_SAVES) { if (route === 'BreakingOut.dc.html') window.BT_SAVES.mount('breaking-out', function () { APP.reload(); }); else window.BT_SAVES.unmount(); }
    },
    needsWelcome: function () { return APP ? needsWelcome() : false; },
    needsContract: function () { return APP ? needsContract() : false; },
    needsStart: function () { return APP ? needsStart() : false; },
    introBlocked: function (route) { return APP ? introStage() && !introAllowed(String(route).replace('.dc.html', '')) : false; },
    tour: function () { if (APP) appTour(); },
    runTour: function (steps, o) { if (APP) runTour(steps, o); },
    resIntro: resIntro,
    contractPdf: function (ct, hh) { if (!h && hh) h = hh; contractPdf(ct); },
    find: function () { findSheet(); },
    toCourseNext: function (resId) { if (!APP) return; var f = lessonForRes(resId); if (f && lessonOpen(f.l.id) && !prog().done[f.l.id]) markDone(f.l.id, true); wr(RETK, null); var nx = f ? nextAfter(f.l.id) : null; try { sessionStorage.setItem('bt-scrollto', nx ? lessonHref(nx) : (f ? lessonHref(f.l) : '')); if (nx && isActivityCard(nx)) sessionStorage.setItem('bt-scrollto-act', '1'); } catch (e) {} goHref('#Course'); setTimeout(celebrate, 700); },
    hasLibrary: function () { var c = APP && APP.state.contract; return !!(c && c.status === 'signed' && ((c.signed && c.signed.terms) || c.terms || {}).inclusions && ((c.signed && c.signed.terms) || c.terms).inclusions.library); },
    unlockedWeek: function () { return APP ? unlockedWeek() : 1; },
    weekComplete: function (n) { if (!APP) return true; var w = course().weeks.filter(function (x) { return x.week === n; })[0], p = prog(); return !!w && (w.lessons || []).filter(function (l) { return !l.optional; }).every(function (l) { return p.done[l.id]; }); },
    shareProof: function (t, s) { if (APP) shareProof(t, s || 'win'); },
    kit: function () { return { addWin: function (t) { var ab = autoBeliefs(t, 'win', []); setTimeout(function () { shareProof(t, 'win', 'Added to your proof portfolio'); }, 700); addEvidence(t, { spark: 'win', beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves }); return ab; }, winsOn: function (k) { return evidence().filter(function (e) { var a = evAt(e); return e.win && a && dayKey(a) === k; }); }, winStreak: winStreak, pageHead: pageHead, back: back, waves: waves, icon: icon, emblem: emblem, party: party, sparkleBurst: sparkleBurst, dayKey: dayKey, videoBlock: videoBlock, findLesson: findLesson, lessonForRes: lessonForRes, lessonOpen: lessonOpen, isOpen: isOpen, markDone: function (id) { if (lessonOpen(id) && !prog().done[id]) { markDone(id, true); return true; } return false; }, isDone: function (id) { return !!prog().done[id]; }, resource: resource, rd: rd, wr: wr, tx: tx, playground: playground }; },
    activityDone: function (r) { return APP ? activityDone(r) : false; }, setupReady: function () { if (APP) setupReady(); }, activityBack: function (r) { return APP ? activityBack(r) : false; },
    doneLabel: function (r, d) { return APP ? doneLabel(r, d) : d; }, backLabel: function (r, d) { return APP ? backLabel(r, d) : d; }, returnKind: function (r) { return retKind(retGet(r)); },
    suReady: suReady, suStats: suStats,
    allOpen: function () { return peek(); },
    weekOpen: function (n) { if (peek()) return true; return APP ? isOpen(n) : true; },
    unlockText: function (n) { return APP ? unlockText(n) : ''; },
    journal: function (J) { return APP ? journalFor(J) : J; },
    search: function (q) { return APP ? search(q) : []; },
    openProofPortfolio: function (focus) { try { if (focus) sessionStorage.setItem('bt-pp-focus', focus); } catch (e) {} goHref('#Proof'); },
    emblem: emblem, proofScale: proofScaleSvg, charSvg: charSvg, chars: CHARS, avatarHtml: function () { var p = profileData(); return p.photo ? '<img src="' + p.photo + '" alt="">' : p.char ? charSvg(p.char) : ''; }
  };
})();
