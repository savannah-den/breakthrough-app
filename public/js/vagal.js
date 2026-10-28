/* The Vagal Tone Workout: DOSE, Breathe, Pause and Move, plus Coming Home and the Emotional Blueprint.
   Native app pages: #Vagal (the series hub), #Breathe, #Dose, #Pause, #Move.
   Saved per person (synced like everything else): bt-breath, bt-dose, bt-pause, bt-move. */
(function () {
  'use strict';
  var K = { breath: 'bt-breath', dose: 'bt-dose', pause: 'bt-pause', move: 'bt-move' };
  var DAY = 86400000;
  var A, kit;
  function h() { return window.BT_APP.h.apply(null, arguments); }
  function boot() { A = window.BT_APP; if (!kit) kit = window.BT_COURSE.kit(); }
  function rd(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var T = window.BT_TIME || { key: function (t) { var d = new Date(t == null ? Date.now() : t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }, today: function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; } };
  function dk(t) { return T.key(t); }
  function wk(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function fromKey(k) { var p = k.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).getTime(); }
  function niceDay(t) { return new Date(t).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function toast(m) { A.toast(m); }
  function shell(root, kicker, title, sub) {
    root.appendChild(kit.pageHead(kicker, title, sub));
    var wrap = h('div', { class: 'bt-wrap vg' });
    root.appendChild(wrap); kit.waves(root);
    return wrap;
  }
  function sec(title, kids, cls) { return h('section', { class: 'vg-sec ' + (cls || '') }, [title ? h('h2', { class: 'vg-h', text: title }) : null].concat(kids || [])); }

  /* ====================================================================== page heroes: a little animated scene for each part */
  var HEROES = {
    dose: '<svg viewBox="0 0 360 170" role="img" aria-label="Four glowing chemical orbs, D, O, S and E, floating and bobbing"><defs>'
      + ['#5BAEB7', '#D9719F', '#F2A05A', '#F0604D'].map(function (c, i) { return '<radialGradient id="hg' + i + '" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="' + c + '"/><stop offset="1" stop-color="' + c + '" stop-opacity=".85"/></radialGradient>'; }).join('')
      + '</defs>' + ['D', 'O', 'S', 'E'].map(function (L, i) { var x = 52 + i * 85, c = ['#5BAEB7', '#D9719F', '#F2A05A', '#F0604D'][i]; return '<g class="hx-orb" style="animation-delay:-' + (i * 0.7) + 's"><circle cx="' + x + '" cy="82" r="40" fill="' + c + '" opacity=".18" class="hx-glow"/><circle cx="' + x + '" cy="82" r="28" fill="url(#hg' + i + ')" stroke="#1F1412" stroke-width="2"/><text x="' + x + '" y="92" text-anchor="middle" font-family="Patrick Hand SC,cursive" font-size="30" fill="#1F1412">' + L + '</text></g>'; }).join('')
      + '<path class="hx-tw" d="M300 20c.8 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.5"/><path class="hx-tw two" d="M30 130c.6 5 3 7 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F4C2F7" stroke="#1F1412" stroke-width="1.5"/></svg>',
    breathe: '<svg viewBox="0 0 360 170" role="img" aria-label="A soft circle slowly breathing in and out, with ripples and a wave"><path class="hx-wave" d="M0 140 Q 45 120 90 140 T 180 140 T 270 140 T 360 140 T 450 140" fill="none" stroke="#F4C2F7" stroke-width="3" opacity=".6"/>'
      + '<circle class="hx-ring r1" cx="180" cy="86" r="50" fill="none" stroke="#F1F9A6" stroke-width="2"/><circle class="hx-ring r2" cx="180" cy="86" r="50" fill="none" stroke="#F4C2F7" stroke-width="2"/>'
      + '<circle class="hx-lung" cx="180" cy="86" r="30" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.5"/><text class="hx-in" x="180" y="22" text-anchor="middle" font-family="Patrick Hand SC,cursive" font-size="20" fill="#F1F9A6">breathe in</text><text class="hx-out" x="180" y="22" text-anchor="middle" font-family="Patrick Hand SC,cursive" font-size="20" fill="#F1F9A6">breathe out</text></svg>',
    pause: '<svg viewBox="0 0 360 170" role="img" aria-label="A cup of tea steaming by a window while clouds and thoughts drift slowly past">'
      + '<rect x="190" y="18" width="150" height="110" rx="10" fill="#DCEFF7" stroke="#1F1412" stroke-width="2.5"/><path d="M265 18v110M190 73h150" stroke="#1F1412" stroke-width="2"/>'
      + '<g class="hx-cloud"><ellipse cx="220" cy="45" rx="18" ry="9" fill="#fff"/><ellipse cx="234" cy="40" rx="13" ry="9" fill="#fff"/></g><g class="hx-cloud two"><ellipse cx="290" cy="98" rx="20" ry="9" fill="#fff"/><ellipse cx="304" cy="93" rx="13" ry="9" fill="#fff"/></g>'
      + '<g class="hx-thought"><rect x="40" y="20" width="74" height="24" rx="12" fill="#FFF4EE" stroke="#C9B8B3"/><text x="77" y="36" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" fill="#6A5A57">to-do list</text></g><g class="hx-thought two"><rect x="20" y="58" width="66" height="24" rx="12" fill="#FFF4EE" stroke="#C9B8B3"/><text x="53" y="74" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" fill="#6A5A57">what if…</text></g>'
      + '<path d="M70 150h140" stroke="#1F1412" stroke-width="2" opacity=".3"/><path d="M110 106h46v24a16 16 0 0 1-16 16h-14a16 16 0 0 1-16-16z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.5"/><path d="M156 112h6a8 8 0 0 1 0 16h-6" fill="none" stroke="#1F1412" stroke-width="2.5"/>'
      + '<path class="hx-steam" d="M122 98c-5-7 5-11 0-18M133 98c-5-7 5-11 0-18M144 98c-5-7 5-11 0-18" fill="none" stroke="#A8231F" stroke-width="2.2" stroke-linecap="round"/></svg>',
    move: '<svg viewBox="0 0 360 170" role="img" aria-label="A little figure dancing in the sun with music notes and sparkles">'
      + '<g class="hx-sun"><circle cx="300" cy="40" r="18" fill="#FFD9A8" stroke="#1F1412" stroke-width="2"/><path d="M300 12v-6M300 74v-6M272 40h-6M334 40h-6M280 20l-4-4M320 60l4 4M280 60l-4 4M320 20l4-4" stroke="#F28C3B" stroke-width="3" stroke-linecap="round"/></g>'
      + '<g class="hx-note"><path d="M90 60v-24l14-4v24" fill="none" stroke="#4E0C08" stroke-width="2.5"/><circle cx="86" cy="60" r="5" fill="#4E0C08"/><circle cx="100" cy="56" r="5" fill="#4E0C08"/></g><g class="hx-note two"><path d="M250 100v-20" stroke="#D3302B" stroke-width="2.5"/><circle cx="246" cy="100" r="5" fill="#D3302B"/></g>'
      + '<g class="hx-dancer"><circle cx="180" cy="58" r="12" fill="#FFF4EE" stroke="#1F1412" stroke-width="2.5"/><path d="M174 60q6 6 12 0" fill="none" stroke="#1F1412" stroke-width="2" stroke-linecap="round"/><path d="M180 70v34M180 78l-18-16M180 78l18-16M180 104l-14 30M180 104l16 28" stroke="#1F1412" stroke-width="3.5" stroke-linecap="round"/></g>'
      + '<path d="M120 140h120" stroke="#1F1412" stroke-width="2.5" stroke-linecap="round" opacity=".35"/><path class="hx-tw" d="M60 110c.6 5 3 7 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.5"/></svg>',
    vagal: '<svg viewBox="0 0 360 170" role="img" aria-label="A watering can waters a thin, spindly little tree, and it grows big and strong">'
      + '<path d="M0 150 Q 90 140 180 148 T 360 146 V170 H0z" fill="#6FA35C" opacity=".9"/><path d="M20 152h320" stroke="#1F1412" stroke-width="2" opacity=".3"/>'
      + '<g class="hx-tree"><path class="hx-trunk" d="M206 150 C 204 128, 210 112, 205 92 M205 112 C 196 106, 190 100, 186 90 M206 104 C 214 98, 222 94, 228 86" fill="none" stroke="#7A4A2A" stroke-width="7" stroke-linecap="round"/>'
      + '<g class="hx-crown"><circle cx="205" cy="72" r="34" fill="#7CC48A" stroke="#1F1412" stroke-width="2.5"/><circle cx="178" cy="86" r="22" fill="#8FD19B" stroke="#1F1412" stroke-width="2.5"/><circle cx="232" cy="84" r="22" fill="#6BB97A" stroke="#1F1412" stroke-width="2.5"/><circle cx="196" cy="62" r="5" fill="#F4C2F7"/><circle cx="220" cy="70" r="5" fill="#F1F9A6"/><circle cx="186" cy="84" r="4" fill="#F28C3B"/></g>'
      + '<g class="hx-spindle"><path d="M205 150 C 204 138, 207 128, 205 116" fill="none" stroke="#7A4A2A" stroke-width="2.5" stroke-linecap="round"/><path d="M205 124 l-8 -6 M205 118 l7 -7" stroke="#7A4A2A" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="197" cy="117" rx="4" ry="2.5" fill="#8FD19B"/><ellipse cx="212" cy="110" rx="4" ry="2.5" fill="#8FD19B"/></g></g>'
      + '<g class="hx-can"><path d="M70 66 h40 v28 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.5"/><path d="M110 74 L 140 60" stroke="#1F1412" stroke-width="5" stroke-linecap="round"/><path d="M136 56 l10 -4 2 10 -10 2z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2"/><path d="M70 72 c -14 0 -14 22 0 22" fill="none" stroke="#1F1412" stroke-width="3"/></g>'
      + '<g class="hx-drops"><circle class="hx-drop" cx="150" cy="70" r="3" fill="#5AA9DB"/><circle class="hx-drop d2" cx="156" cy="72" r="2.5" fill="#5AA9DB"/><circle class="hx-drop d3" cx="146" cy="74" r="2.5" fill="#5AA9DB"/></g>'
      + '<text class="hx-cap" x="300" y="34" text-anchor="middle" font-family="Patrick Hand SC,cursive" font-size="16" fill="#F1F9A6">small reps,</text><text class="hx-cap" x="300" y="54" text-anchor="middle" font-family="Patrick Hand SC,cursive" font-size="16" fill="#F1F9A6">strong roots</text></svg>'
  };
  function hero(kind) { var d = h('div', { class: 'vg-hero hx-' + kind }); d.innerHTML = window.BT_HAND ? window.BT_HAND.wrap(HEROES[kind] || '', 'bt-hand-l') : (HEROES[kind] || ''); return d; }
  // the Vagal Tone Workout series menu, along the top of every page in it
  function seriesTabs(active) {
    var T = [['plan', 'My plan', '#Vagal', 'vagal'], ['dose', 'DOSE', '#Dose', 'dose'], ['breathe', 'Breathe', '#Breathe', 'breathe'], ['pause', 'Pause', '#Pause', 'pause'], ['move', 'Move', '#Move', 'move']];
    return h('nav', { class: 'vg-tabs', 'aria-label': 'Vagal Tone Workout' }, T.map(function (t) { var on = t[0] === active; return h('a', { class: 'vg-tab' + (on ? ' on' : ''), href: t[2], 'aria-current': on ? 'page' : null }, [kit.emblem(t[3]), h('span', { text: t[1] })]); }));
  }
  function chipRow(opts, cur, onPick, label) {
    return h('div', { class: 'vg-chips', role: 'radiogroup', 'aria-label': label }, opts.map(function (o) {
      var on = cur === o[0];
      return h('button', { class: 'vg-chip' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { onPick(o[0]); } }, [o[2] ? h('span', { 'aria-hidden': 'true', text: o[2] + ' ' }) : null, o[1]]);
    }));
  }
  function streakOf(daysObj) {
    var cur = 0, d = T.today();
    if (!daysObj[wk(d)]) d.setDate(d.getDate() - 1);
    while (daysObj[wk(d)]) { cur++; d.setDate(d.getDate() - 1); }
    var keys = Object.keys(daysObj).filter(function (k) { return daysObj[k]; }).map(fromKey).sort(function (a, b) { return a - b; }), best = 0, run = 0, prev = null;
    keys.forEach(function (t) { run = prev != null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
    return { current: cur, best: best };
  }
  // finishing a tool ticks its course activity (and the Vagal Tone Workout once all four have been tried)
  function tickLesson(resId) {
    try { var f = kit.lessonForRes(resId); if (f) kit.markDone(f.l.id); } catch (e) {}
    try {
      var all = ['dose', 'breathe', 'pause', 'move'].every(function (r) { return tried(r); });
      if (all) { var v = kit.lessonForRes('vagal'); if (v && kit.markDone(v.l.id)) setTimeout(function () { kit.party('Vagal Tone Workout unlocked!', 'You’ve tried all four daily practices: DOSE, Breathe, Pause and Move. Now it’s about the reps.', 'Hell yes'); }, 800); }
    } catch (e) {}
  }
  function tried(r) {
    try { var vd = (rd('bt-vwork') || {}).days || {}; if (Object.keys(vd).some(function (k) { return vd[k][r] && (vd[k][r].done || (r === 'dose' && ['D', 'O', 'S', 'E'].some(function (L) { return vd[k].dose[L]; }))); })) return true; } catch (e) {}
    if (r === 'breathe') return ((rd(K.breath) || {}).log || []).length > 0;
    var d = (rd(K[r]) || {}).days || {}; return Object.keys(d).some(function (k) { var v = d[k]; return v && (Array.isArray(v) ? v.length : typeof v === 'object' ? Object.keys(v).length : v); });
  }

  /* ====================================================================== audio: soothing sounds, made live (no files) */
  var AU = null;
  function audio() {
    if (AU) return AU;
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null;
    var ctx = new Ctx(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    var bufs = {};
    function buf(type) {
      if (bufs[type]) return bufs[type];
      var len = ctx.sampleRate * 6, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), last = 0, p = [0, 0, 0, 0, 0, 0, 0];
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else if (type === 'pink') { p[0] = 0.99886 * p[0] + w * 0.0555179; p[1] = 0.99332 * p[1] + w * 0.0750759; p[2] = 0.969 * p[2] + w * 0.153852; p[3] = 0.8665 * p[3] + w * 0.3104856; p[4] = 0.55 * p[4] + w * 0.5329522; p[5] = -0.7616 * p[5] - w * 0.016898; d[i] = (p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + w * 0.5362) * 0.11; p[6] = w * 0.115926; }
        else d[i] = w;
      }
      return (bufs[type] = b);
    }
    function src(type) { var s = ctx.createBufferSource(); s.buffer = buf(type); s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random() * 4); nodes.push(s); return s; }
    var nodes = [], timers = [];
    function every(ms, fn) { timers.push(setInterval(fn, ms)); }
    function later(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); }
    function stopAll() { nodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} }); nodes = []; timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }
    function chain(s, list, out) { var cur = s; list.forEach(function (n) { cur.connect(n); cur = n; }); cur.connect(out || master); return cur; }
    function filt(type, f, q) { var x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
    function gain(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
    // one wave: builds as it rises, crashes, then washes up the sand and hisses away
    function wave() {
      var t = ctx.currentTime, rise = 2.2 + Math.random() * 1.5, wash = 3.5 + Math.random() * 2;
      var low = src('brown'), lg = gain(0), lf = filt('lowpass', 300);
      chain(low, [lf, lg]);
      lg.gain.setValueAtTime(0.0001, t); lg.gain.linearRampToValueAtTime(0.9, t + rise); lg.gain.exponentialRampToValueAtTime(0.05, t + rise + wash);
      lf.frequency.setValueAtTime(250, t); lf.frequency.linearRampToValueAtTime(900, t + rise); lf.frequency.exponentialRampToValueAtTime(300, t + rise + wash);
      var hiss = src('pink'), hg = gain(0), hf = filt('highpass', 1500);
      chain(hiss, [hf, filt('lowpass', 7000), hg]);
      hg.gain.setValueAtTime(0.0001, t); hg.gain.linearRampToValueAtTime(0.02, t + rise * 0.8); hg.gain.linearRampToValueAtTime(0.32, t + rise + 0.25); hg.gain.exponentialRampToValueAtTime(0.004, t + rise + wash);
      [low, hiss].forEach(function (n) { n.stop(t + rise + wash + 0.5); });
    }
    function drip() { var t = ctx.currentTime, o = ctx.createOscillator(), g = gain(0), f0 = 900 + Math.random() * 1400; o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 0.09); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.16); }
    function bird() { var t = ctx.currentTime, o = ctx.createOscillator(), g = gain(0), f0 = 2300 + Math.random() * 1700, n = 2 + Math.floor(Math.random() * 3); o.type = 'sine'; g.gain.setValueAtTime(0, t);
      for (var i = 0; i < n; i++) { var s = t + i * 0.16; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.3), s + 0.07); o.frequency.exponentialRampToValueAtTime(f0 * 0.92, s + 0.13); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.045, s + 0.02); g.gain.linearRampToValueAtTime(0, s + 0.13); }
      o.connect(g); g.connect(master); o.start(t); o.stop(t + n * 0.16 + 0.1); }
    function gust(level) { var t = ctx.currentTime, d = 4 + Math.random() * 4, n = src('pink'), f = filt('bandpass', 500, 0.9), g = gain(0); chain(n, [f, g]); f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(700 + Math.random() * 500, t + d / 2); f.frequency.linearRampToValueAtTime(380, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + d * 0.45); g.gain.linearRampToValueAtTime(0, t + d); n.stop(t + d + 0.2); }
    function stream(level) { var n = src('pink'), f = filt('bandpass', 1800, 0.7), g = gain(level); chain(n, [f, g]); var o = ctx.createOscillator(), og = gain(400); o.frequency.value = 0.23; o.connect(og); og.connect(f.frequency); o.start(); nodes.push(o); var o2 = ctx.createOscillator(), og2 = gain(level * 0.3); o2.frequency.value = 0.37; o2.connect(og2); og2.connect(g.gain); o2.start(); nodes.push(o2); }
    var SOUNDS = {
      ocean: function () { var bed = src('brown'), bg = gain(0.12); chain(bed, [filt('lowpass', 400), bg]); wave(); var next = function () { later(5200 + Math.random() * 4500, function () { wave(); next(); }); }; next(); },
      rain: function () { var n = src('pink'), g = gain(0.55); chain(n, [filt('highpass', 500), filt('lowpass', 9000), g]); var n2 = src('brown'), g2 = gain(0.18); chain(n2, [filt('lowpass', 500), g2]); every(140, function () { if (Math.random() < 0.55) drip(); }); },
      forest: function () { stream(0.16); var air = src('pink'), ag = gain(0.05); chain(air, [filt('lowpass', 1200), ag]); every(650, function () { if (Math.random() < 0.35) drip(); }); every(1700, function () { if (Math.random() < 0.4) { bird(); if (Math.random() < 0.4) later(220, bird); } }); every(9000, function () { if (Math.random() < 0.45) gust(0.12); }); },
      wind: function () { var n = src('pink'), g = gain(0.1); chain(n, [filt('lowpass', 600), g]); gust(0.35); every(4500, function () { if (Math.random() < 0.7) gust(0.25 + Math.random() * 0.2); }); },
      stream: function () { stream(0.45); every(900, function () { if (Math.random() < 0.3) drip(); }); },
      music: function () {
        var notes = [[220, 277.18, 329.63, 415.3], [196, 246.94, 293.66, 369.99], [174.61, 220, 261.63, 329.63], [196, 246.94, 293.66, 392]], idx = 0, voice = [];
        var lp = filt('lowpass', 1200); lp.connect(master);
        var play = function () { var t = ctx.currentTime; voice.forEach(function (v) { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 3); v.o.stop(t + 3.2); }); voice = [];
          notes[idx % notes.length].forEach(function (f, i) { [0, 3].forEach(function (det) { var o = ctx.createOscillator(), g = gain(0); o.type = i === 0 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = det; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 3); o.connect(g); g.connect(lp); o.start(t); voice.push({ o: o, g: g }); nodes.push(o); }); }); idx++; };
        play(); every(9000, play);
      },
      brown: function () { var n = src('brown'), g = gain(0.7); chain(n, [g]); }
    };
    AU = {
      play: function (name) { stopAll(); if (ctx.state === 'suspended') ctx.resume(); if (!name || name === 'off' || !SOUNDS[name]) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); return; } SOUNDS[name](); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 2); },
      stop: function () { master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(stopAll, 1500); },
      chime: function (hi) { if (ctx.state === 'suspended') return; var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = hi ? 660 : 440; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 1.3); }
    };
    return AU;
  }
  var SOUND_OPTS = [['off', 'Silence', '·'], ['ocean', 'Ocean waves', '〰'], ['rain', 'Rain', '☂'], ['forest', 'Rainforest', '❦'], ['wind', 'Wind', '≋'], ['stream', 'Stream', '~'], ['music', 'Soft music', '♪'], ['brown', 'Brown noise', '◍']];

  /* ====================================================================== BREATHE */
  // steps: [label, seconds, kind] kind: in | hold | out | rest | top (top-up inhale)
  var PATTERNS = {
    coherent: { name: '5-minute daily breath', short: 'Daily 5', viz: 'wave', desc: 'Slow, even breaths in and out, no pauses. About 5.5 breaths a minute. Your daily vagal tone workout.', steps: [['Breathe in', 5.5, 'in'], ['Breathe out', 5.5, 'out']] },
    sigh: { name: 'Physiological sigh', short: 'Sigh', viz: 'ball', desc: 'Two inhales through the nose (a big one, then a little top-up), then a long, slow exhale through the mouth. The fastest way to take the edge off.', steps: [['Breathe in through your nose', 2.5, 'in'], ['Top it up, a little sip more', 1, 'top'], ['Long, slow sigh out through your mouth', 6.5, 'out'], ['Rest', 1.5, 'rest']] },
    box: { name: 'Box breathing', short: 'Box', viz: 'box', desc: 'In, hold, out, hold, all for the same count. Steadies a busy brain and helps you focus.', steps: [['Breathe in', 4, 'in'], ['Hold', 4, 'hold'], ['Breathe out', 4, 'out'], ['Hold', 4, 'rest']], adjustable: true },
    exhale: { name: 'Long exhale', short: '4 · 8', viz: 'wave', desc: 'Breathe out for twice as long as you breathe in. Longer exhales tell your body it’s safe to calm down.', steps: [['Breathe in', 4, 'in'], ['Breathe out slowly', 8, 'out']] },
    four78: { name: '4 · 7 · 8 breath', short: '4·7·8', viz: 'ball', desc: 'In for 4, hold for 7, out for 8. Brilliant for winding down and getting to sleep.', steps: [['Breathe in', 4, 'in'], ['Hold', 7, 'hold'], ['Breathe out', 8, 'out']] },
    triangle: { name: 'Triangle breath', short: 'Triangle', viz: 'ball', desc: 'In, hold, out, all for 4. A gentle reset when you need to feel steady.', steps: [['Breathe in', 4, 'in'], ['Hold', 4, 'hold'], ['Breathe out', 4, 'out']] }
  };
  var STATES = [
    { id: 'daily', label: 'Vagal tone workout', ic: '♡', p: 'coherent', mins: 5, what: 'Your daily 5. Do it once a day, ideally two or three times. Same time each day helps it stick: before coffee, after school drop-off, before bed.' },
    { id: 'panic', label: 'Panicking', ic: '⚡', p: 'sigh', mins: 1, what: 'Do 1 to 3 physiological sighs first. Then keep going with long exhales. Put your feet flat on the floor and name 5 things you can see. You’re safe. This will pass.' },
    { id: 'overthink', label: 'Overthinking', ic: '☁', p: 'box', mins: 3, what: 'Box breathing gives your brain a job. Follow the ball around the box. If thoughts pop up, let them ride past on the conveyor belt and come back to the count.' },
    { id: 'overwhelm', label: 'Overwhelmed', ic: '≋', p: 'exhale', mins: 3, what: 'Long exhales tell your nervous system it can stand down. Turn the noise down, phone face down, and give yourself these few minutes.' },
    { id: 'angry', label: 'Angry or hot', ic: '♨', p: 'sigh', mins: 2, what: 'Sigh it out before you say or do anything. Then move: shake out your hands, walk, stomp. Come back to the conversation when your breath is slow.' },
    { id: 'sleep', label: 'Can’t sleep', ic: '☾', p: 'four78', mins: 5, what: 'Lie down, screen away, and try 4 · 7 · 8. Let your body get heavy into the bed. If thoughts keep coming, jot them down first so your brain can let go.' },
    { id: 'focus', label: 'Need to focus', ic: '◎', p: 'box', mins: 2, what: 'Two minutes of box breathing before a task clears the static. Then pick ONE thing and start the smallest step.' },
    { id: 'flat', label: 'Flat or shut down', ic: '◌', p: 'coherent', mins: 3, what: 'Gentle, even breaths, then get some movement in: a walk outside, a song you love, sunshine on your face. Small and kind, not big and forced.' }
  ];
  var bs = { state: 'daily', p: 'coherent', mins: 5, sound: 'ocean', box: 4, chime: true, running: false };
  var raf = null, endTimer = null;
  function logBreath(entry) { var d = rd(K.breath) || { log: [] }; d.log = (d.log || []).concat([entry]); wr(K.breath, d); tickLesson('breathe'); }
  function stepsOf() { var P = PATTERNS[bs.p]; return P.adjustable ? P.steps.map(function (s) { return [s[0], bs.box, s[2]]; }) : P.steps; }
  var HELP = [
    { id: 'quick', q: 'Did something just happen and you need to calm down quickly?', ic: '⚡', p: 'sigh', mins: 1, why: 'The physiological sigh is the fastest way to take the edge off. Do 1 to 3, then let your breath settle with some long exhales.' },
    { id: 'reps', q: 'Want to put the reps in and build your vagal tone?', ic: '♡', p: 'coherent', mins: 5, why: 'Your daily 5. Slow, even breathing when you’re calm is what strengthens your vagal tone over time, so it’s ready when life gets loud.' },
    { id: 'sleep', q: 'Can’t sleep?', ic: '☾', p: 'four78', mins: 5, why: 'Lie down, screen away, and try 4 · 7 · 8. Let your body get heavy. If thoughts keep coming, jot them down first.' },
    { id: 'think', q: 'Overthinking?', ic: '☁', p: 'box', mins: 3, why: 'Box breathing gives your brain a job. Follow the ball around the box and let the thoughts ride past.' },
    { id: 'scan', q: 'Don’t know which to pick? Do a quick body scan.', ic: '◎', scan: true },
    { id: 'other', q: 'Something else', ic: '✎', other: true }
  ];
  var hs = { pick: null, heart: 3, breath: 'normal', tense: 3, other: '' };
  function scanAdvice() {
    if (hs.heart >= 7 || hs.breath === 'fast') return { p: 'sigh', mins: 2, why: 'Your body’s revved up right now. Start with 2 or 3 physiological sighs, then keep going with long exhales until your heart slows.' };
    if (hs.tense >= 6 || hs.heart >= 5) return { p: 'exhale', mins: 3, why: 'A bit wound up. Long exhales (out for twice as long as in) tell your nervous system it can stand down.' };
    if (hs.breath === 'held') return { p: 'box', mins: 3, why: 'You’re holding your breath a lot. Box breathing gives you a steady rhythm to follow.' };
    return { p: 'coherent', mins: 5, why: 'You’re fairly settled, which makes it the perfect time to build vagal tone. Do your daily 5.' };
  }
  function otherAdvice(t) {
    t = String(t || '').toLowerCase();
    var map = [[/panic|scared|shak|angry|anger|rage|fight|fright|shock/, 'quick'], [/sleep|bed|night|awake|wired/, 'sleep'], [/think|spiral|worry|anxious|anxiety|racing|focus|study|exam/, 'think'], [/tone|practi|daily|routine|habit/, 'reps']];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(t)) { var x = HELP.filter(function (h0) { return h0.id === map[i][1]; })[0]; return { p: x.p, mins: x.mins, why: x.why }; }
    return { p: 'exhale', mins: 3, why: 'When in doubt, long exhales are a lovely, gentle place to start. Notice how you feel after.' };
  }
  function Breathe(root) {
    boot();
    var wrap = shell(root, 'Vagal Tone Workout · Breathe', 'Breathe', 'Your breath is the remote control for your nervous system.');
    wrap.insertBefore(hero('breathe'), wrap.firstChild);
    wrap.appendChild(seriesTabs('breathe'));
    var res = kit.resource('breathe') || {}, toolSec;
    function useIt(p, mins, state) { bs.p = p; bs.mins = mins; bs.state = state || ''; drawTool(); setTimeout(function () { toolSec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }
    // 1. the two go-to breaths, each with its why and when
    var GO = [
      { tag: 'Build vagal tone', title: 'The 5-minute daily breath', p: 'coherent', mins: 5, v: (res.videos || [])[0],
        why: 'Think of it like the gym for your nervous system. Slow, even breathing (about 5 to 6 breaths a minute) tones your vagus nerve, the main brake pedal on your stress response. Do it when you’re calm, so it’s strong and ready when life gets loud.',
        when: [['☀', 'Every day'], ['◡', 'When you’re calm'], ['☕', 'With your morning coffee'], ['☾', 'Before bed'], ['⟳', '5 to 15 minutes']] },
      { tag: 'Physiological sigh', title: 'The physiological sigh', p: 'sigh', mins: 1, v: (res.videos || [])[1],
        why: 'Your body’s built-in reset. The double inhale pops open the tiny air sacs in your lungs and the long exhale offloads carbon dioxide and slows your heart. One to three sighs and you’ll feel the edge come off.',
        when: [['⚡', 'Panic'], ['♨', 'Anger'], ['≋', 'Overwhelm'], ['☏', 'Before a hard conversation'], ['!', 'After a fright']] }
    ];
    wrap.appendChild(h('div', { class: 'vg-gos' }, GO.map(function (g) {
      var l = g.v && g.v.lesson ? (kit.findLesson(g.v.lesson) || {}).l : (g.v ? { title: g.v.title, vimeo: g.v.vimeo || '', video: g.v.video || '' } : null);
      var has = l && (kit.tx(l.vimeo) || kit.tx(l.video));
      return h('section', { class: 'vg-go-c' }, [
        h('span', { class: 'vg-go-tag', text: g.tag }), h('h2', { class: 'vg-h', text: g.title }),
        has ? kit.videoBlock(l, l.id || '') : h('div', { class: 'bt-video empty' }, [h('div', { class: 'bt-video-ph' }, [h('span', { text: 'Video coming soon' })])]),
        h('p', { class: 'vg-go-why', text: g.why }),
        h('span', { class: 'vg-ml', text: 'When to use it' }),
        h('div', { class: 'vg-whens' }, g.when.map(function (w) { return h('span', { class: 'vg-when-b' }, [h('span', { class: 'vg-when-ic', 'aria-hidden': 'true', text: w[0] }), w[1]]); })),
        h('button', { class: 'bt-btn lime', type: 'button', text: 'Do it now →', onclick: function () { useIt(g.p, g.mins); } })
      ]);
    })));
    // 2. which one do I need?
    var helpSec = h('section', { class: 'vg-sec vg-help' }); wrap.appendChild(helpSec);
    function drawHelp() {
      helpSec.innerHTML = '';
      helpSec.appendChild(h('h2', { class: 'vg-h', text: 'Which breath do I need?' }));
      helpSec.appendChild(h('div', { class: 'vg-qs' }, HELP.map(function (x) { var on = hs.pick === x.id; return h('button', { class: 'vg-q' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function () { hs.pick = on ? null : x.id; drawHelp(); } }, [h('span', { class: 'vg-state-ic', 'aria-hidden': 'true', text: x.ic }), h('span', { text: x.q })]); })));
      var x = HELP.filter(function (y) { return y.id === hs.pick; })[0]; if (!x) return;
      var adv = x.p ? { p: x.p, mins: x.mins, why: x.why } : null, box = h('div', { class: 'vg-adv' });
      if (x.scan) {
        var scale = function (label, key, lo, hi) { return h('div', { class: 'vg-scale' }, [h('span', { class: 'vg-ml', text: label }), h('div', { class: 'vg-scale-r', role: 'radiogroup', 'aria-label': label }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { var on = hs[key] === n; return h('button', { class: 'vg-n' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', 'aria-label': String(n), style: '--h:' + (120 - n * 12), text: String(n), onclick: function () { hs[key] = n; drawHelp(); } }); })), h('div', { class: 'vg-scale-e' }, [h('span', { text: lo }), h('span', { text: hi })])]); };
        box.appendChild(h('p', { class: 'vg-sub', text: 'Close your eyes for a moment. Notice your heart, your breath and your body. No right answers.' }));
        box.appendChild(scale('My heart rate feels…', 'heart', '0 · slow and calm', '10 · racing'));
        box.appendChild(h('span', { class: 'vg-ml', text: 'My breathing is…' }));
        box.appendChild(chipRow([['slow', 'Slow and deep'], ['normal', 'Normal'], ['fast', 'Shallow and fast'], ['held', 'Holding it a lot']], hs.breath, function (v) { hs.breath = v; drawHelp(); }, 'Breathing'));
        box.appendChild(scale('Tension in my body', 'tense', '0 · soft', '10 · clenched'));
        adv = scanAdvice();
      }
      if (x.other) {
        var inp = h('input', { class: 'bt-in', id: 'vg-other', placeholder: 'What’s going on for you?', value: hs.other, 'aria-label': 'What’s going on for you?' });
        var t; inp.addEventListener('input', function () { hs.other = inp.value; clearTimeout(t); t = setTimeout(function () { drawHelp(); var i2 = document.getElementById('vg-other'); if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); } }, 700); });
        box.appendChild(inp);
        if (kit.tx(hs.other)) adv = otherAdvice(hs.other);
      }
      if (adv) box.appendChild(h('div', { class: 'vg-rec' }, [h('span', { class: 'vg-k', text: 'Try this' }), h('b', { text: PATTERNS[adv.p].name + ' · ' + adv.mins + ' min' }), h('p', { text: adv.why }), h('button', { class: 'bt-btn lime', type: 'button', text: 'Start this breath →', onclick: function () { useIt(adv.p, adv.mins, x.id); } })]));
      helpSec.appendChild(box);
    }
    drawHelp();
    // 3. the guide
    toolSec = h('section', { class: 'vg-tool', 'aria-label': 'Breathing guide' });
    wrap.appendChild(toolSec);
    function drawTool() {
      stopSession(true);
      toolSec.innerHTML = '';
      var P = PATTERNS[bs.p];
      toolSec.appendChild(h('div', { class: 'vg-tool-top' }, [h('div', null, [h('span', { class: 'vg-k', text: 'Breathing guide' }), h('h2', { class: 'vg-tool-t', text: P.name })]), h('span', { class: 'vg-tool-pat', text: stepsOf().map(function (s) { return Math.round(s[1] * 10) / 10; }).join(' · ') })]));
      toolSec.appendChild(h('p', { class: 'vg-tool-d', text: P.desc }));
      var cv = h('canvas', { class: 'vg-cv', width: '640', height: '400', role: 'img', 'aria-label': 'Breathing animation' });
      var cue = h('div', { class: 'vg-cue', 'aria-live': 'polite' }, [h('b', { text: 'Ready when you are' }), h('span', { text: 'Press start and follow the ball.' })]);
      toolSec.appendChild(h('div', { class: 'vg-stage' }, [cv, cue]));
      var timeEl = h('span', { class: 'vg-time', text: bs.mins ? bs.mins + ':00' : '∞' });
      var startBtn = h('button', { class: 'bt-btn lime vg-go', type: 'button', text: 'Start', onclick: function () { if (bs.running) stopSession(); else startSession(cv, cue, startBtn, timeEl); } });
      var bookBtn = h('button', { class: 'bt-btn ghost vg-bookbtn', type: 'button', text: '♥ Add to my book', onclick: function () { var el = sess && sess.t0 ? (performance.now() - sess.t0) / 1000 : 0; logBreath({ at: Date.now(), p: bs.p, mins: Math.max(1, Math.round(el / 60) || bs.mins || 1), state: bs.state }); kit.sparkleBurst(toolSec); toast('Added to your Becoming Book.'); } });
      toolSec.appendChild(h('div', { class: 'vg-ctrl' }, [startBtn, timeEl, bookBtn]));
      toolSec.appendChild(h('div', { class: 'vg-menu' }, [
        h('span', { class: 'vg-ml', text: 'Breath' }), chipRow(Object.keys(PATTERNS).map(function (k) { return [k, PATTERNS[k].short]; }), bs.p, function (v) { bs.p = v; drawTool(); }, 'Breath pattern'),
        P.adjustable ? h('span', { class: 'vg-ml', text: 'Count' }) : null,
        P.adjustable ? chipRow([[3, '3s'], [4, '4s'], [5, '5s'], [6, '6s']], bs.box, function (v) { bs.box = v; drawTool(); }, 'Seconds per side') : null,
        h('span', { class: 'vg-ml', text: 'Time' }), chipRow([[1, '1 min'], [3, '3 min'], [5, '5 min'], [10, '10 min'], [0, 'Open']], bs.mins, function (v) { bs.mins = v; drawTool(); }, 'How long'),
        h('span', { class: 'vg-ml', text: 'Sound' }), chipRow(SOUND_OPTS, bs.sound, function (v) { bs.sound = v; if (bs.running) { var au = audio(); if (au) au.play(v); } drawTool(); }, 'Background sound'),
        h('label', { class: 'vg-tog' }, [h('input', { type: 'checkbox', checked: bs.chime ? 'checked' : null, onchange: function (e) { bs.chime = e.target.checked; } }), ' Soft chime when the breath changes'])
      ]));
      toolSec.appendChild(h('p', { class: 'vg-tool-d', text: 'When you reach the end it’s added to your Becoming Book and ticked on today’s workout card automatically.' }));
      drawFrame(cv, 0, false);
    }
    drawTool();
    var log = (rd(K.breath) || {}).log || [], byDay = {};
    log.forEach(function (x) { byDay[dk(x.at)] = 1; });
    var st = streakOf(byDay);
    wrap.appendChild(h('p', { class: 'vg-sub', text: log.length ? 'You’ve done ' + log.length + ' breathing session' + (log.length === 1 ? '' : 's') + '. ' + (st.current ? st.current + '-day breathing streak.' : 'Do one today to start a streak.') : 'Every session you finish lands in your Becoming Book.' }));
    wrap.appendChild(completeBtn('breathe', ''));
    window.addEventListener('hashchange', function once() { stopSession(true); window.removeEventListener('hashchange', once); });
  }
  var sess = null;
  function startSession(cv, cue, btn, timeEl) {
    var au = audio(); if (au) au.play(bs.sound);
    bs.running = true; btn.textContent = 'Stop'; btn.classList.remove('lime');
    var steps = stepsOf(), cyc = steps.reduce(function (a, s) { return a + s[1]; }, 0), t0 = performance.now(), lastStep = -1, total = bs.mins * 60;
    sess = { t0: t0, cv: cv, btn: btn };
    function frame(now) {
      var el = (now - t0) / 1000;
      if (total && el >= total) { finish(el); return; }
      var tc = el % cyc, acc = 0, si = 0;
      for (; si < steps.length; si++) { if (tc < acc + steps[si][1]) break; acc += steps[si][1]; }
      if (si >= steps.length) si = steps.length - 1;
      var frac = (tc - acc) / steps[si][1];
      if (si !== lastStep) { lastStep = si; cue.innerHTML = ''; cue.appendChild(h('b', { text: steps[si][0] })); cue.appendChild(h('span', { text: Math.round(steps[si][1]) + ' seconds' })); if (bs.chime && au) au.chime(steps[si][2] === 'in' || steps[si][2] === 'top'); }
      var left = total ? Math.max(0, total - el) : el;
      timeEl.textContent = Math.floor(left / 60) + ':' + ('0' + Math.floor(left % 60)).slice(-2);
      drawFrame(cv, { steps: steps, si: si, frac: frac, tc: tc, cyc: cyc, el: el }, true);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    function finish(el) {
      stopSession(true);
      var mins = Math.max(1, Math.round(el / 60));
      logBreath({ at: Date.now(), p: bs.p, mins: mins, state: bs.state });
      cue.innerHTML = ''; cue.appendChild(h('b', { text: 'Beautiful. You did it.' })); cue.appendChild(h('span', { text: 'Notice how your body feels now. Added to your Becoming Book.' }));
      kit.sparkleBurst(cv.parentNode);
      btn.textContent = 'Go again'; btn.classList.add('lime');
    }
    sess.finish = function () { var el = (performance.now() - t0) / 1000; if (el >= 45) finish(el); else stopSession(); };
  }
  function stopSession(silent) {
    if (raf) cancelAnimationFrame(raf); raf = null;
    if (sess && !silent && sess.finish) { var f = sess.finish; sess.finish = null; f(); return; }
    if (sess && sess.btn && silent !== true) { sess.btn.textContent = 'Start'; sess.btn.classList.add('lime'); }
    sess = null; bs.running = false; if (AU) AU.stop();
  }
  function ease(x) { return 0.5 - Math.cos(Math.PI * x) / 2; }
  function drawFrame(cv, f, live) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, P = PATTERNS[bs.p];
    c.clearRect(0, 0, W, H);
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5A120D'); g.addColorStop(1, '#2A0806'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    var kind = f && f.steps ? f.steps[f.si][2] : 'in', frac = f ? f.frac : 0;
    // how full the lungs are, 0..1
    var lv = 0.15;
    if (f && f.steps) { lv = kind === 'in' ? ease(frac) * (P.steps.some(function (s) { return s[2] === 'top'; }) ? 0.85 : 1) : kind === 'top' ? 0.85 + 0.15 * ease(frac) : kind === 'hold' ? 1 : kind === 'out' ? 1 - ease(frac) : 0; }
    if (P.viz === 'box') {
      var s = Math.min(W, H) * 0.62, x0 = (W - s) / 2, y0 = (H - s) / 2;
      c.strokeStyle = 'rgba(241,249,166,.35)'; c.lineWidth = 6; c.lineJoin = 'round'; c.strokeRect(x0, y0, s, s);
      var labels = [['in', x0 - 14, y0 + s / 2, -Math.PI / 2], ['hold', x0 + s / 2, y0 - 18, 0], ['out', x0 + s + 14, y0 + s / 2, Math.PI / 2], ['hold', x0 + s / 2, y0 + s + 28, 0]];
      c.fillStyle = 'rgba(255,244,238,.55)'; c.font = '600 18px Poppins, sans-serif'; c.textAlign = 'center';
      labels.forEach(function (L) { c.save(); c.translate(L[1], L[2]); c.rotate(L[3]); c.fillText(L[0], 0, 0); c.restore(); });
      var si = f && f.steps ? f.si : 0, pr = f && f.steps ? frac : 0, bx, by;
      if (si === 0) { bx = x0; by = y0 + s - s * pr; } else if (si === 1) { bx = x0 + s * pr; by = y0; } else if (si === 2) { bx = x0 + s; by = y0 + s * pr; } else { bx = x0 + s - s * pr; by = y0 + s; }
      // trail
      c.strokeStyle = '#F1F9A6'; c.lineWidth = 6; c.beginPath();
      if (si === 0) { c.moveTo(x0, y0 + s); c.lineTo(bx, by); } else if (si === 1) { c.moveTo(x0, y0 + s); c.lineTo(x0, y0); c.lineTo(bx, by); } else if (si === 2) { c.moveTo(x0, y0 + s); c.lineTo(x0, y0); c.lineTo(x0 + s, y0); c.lineTo(bx, by); } else { c.moveTo(x0, y0 + s); c.lineTo(x0, y0); c.lineTo(x0 + s, y0); c.lineTo(x0 + s, y0 + s); c.lineTo(bx, by); }
      c.stroke();
      orb(c, bx, by, 16 + 10 * lv);
      c.globalAlpha = 0.18 + 0.25 * lv; c.fillStyle = '#F4C2F7'; c.beginPath(); c.arc(W / 2, H / 2, s * 0.12 + s * 0.22 * lv, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    } else if (P.viz === 'wave') {
      // a rollercoaster: up on the in, down on the out; the track scrolls past
      var amp = H * 0.28, mid = H / 2 + 10, cyc = f && f.cyc ? f.cyc : 11, tc = f && f.tc != null ? f.tc : 0, inLen = P.steps[0][1];
      var span = cyc * 1.6, pxPer = W / span, ballX = W * 0.35;
      function yAt(t) { t = ((t % cyc) + cyc) % cyc; if (t < inLen) return mid + amp - 2 * amp * ease(t / inLen); return mid - amp + 2 * amp * ease((t - inLen) / (cyc - inLen)); }
      c.lineWidth = 6; c.strokeStyle = 'rgba(241,249,166,.3)'; c.beginPath();
      for (var x = 0; x <= W; x += 4) { var t = tc + (x - ballX) / pxPer; var y = yAt(t); if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      c.strokeStyle = '#F1F9A6'; c.beginPath();
      for (var x2 = 0; x2 <= ballX; x2 += 4) { var t2 = tc + (x2 - ballX) / pxPer; var y2 = yAt(t2); if (x2 === 0) c.moveTo(x2, y2); else c.lineTo(x2, y2); }
      c.stroke();
      c.fillStyle = 'rgba(255,244,238,.5)'; c.font = '600 18px Poppins, sans-serif'; c.textAlign = 'left'; c.fillText('in ↑', 16, 32); c.fillText('out ↓', 16, H - 18);
      orb(c, ballX, yAt(tc), 18 + 8 * lv);
    } else {
      var r0 = Math.min(W, H) * 0.12, r1 = Math.min(W, H) * 0.4, rr = r0 + (r1 - r0) * lv;
      for (var i = 3; i >= 1; i--) { c.globalAlpha = 0.08 * i; c.fillStyle = '#F4C2F7'; c.beginPath(); c.arc(W / 2, H / 2, rr + i * 18, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1; c.strokeStyle = 'rgba(241,249,166,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, H / 2, r1, 0, Math.PI * 2); c.stroke();
      orb(c, W / 2, H / 2, rr);
    }
  }
  function orb(c, x, y, r) {
    var g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#FFFDE8'); g.addColorStop(0.55, '#F1F9A6'); g.addColorStop(1, '#D9E86A');
    c.shadowColor = 'rgba(241,249,166,.7)'; c.shadowBlur = 28; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
  }

  /* ====================================================================== DOSE */
  // [text, minutes, where (h home / o out / a anywhere), tags: q quick · n something new · f with a friend · p with my partner]
  var DOSE = {
    D: { name: 'Dopamine', tag: 'Motivation · Reward · Anticipation', nick: 'The “let’s go do the thing” chemical', col: '#F1F9A6', ic: '🎯',
      feels: 'OHHH YES!', why: 'Dopamine is what gets you up and moving toward things. It’s the spark of motivation, the buzz of a win and the excitement of something to look forward to.',
      learn: [['It helps with', ['Motivation', 'Reward', 'Interest', 'Pleasure', 'Anticipation', 'Learning', 'Movement']],
        ['Low dopamine can look like', ['Low motivation', 'Task paralysis', 'Getting bored easily', 'Seeking stimulation', 'Trouble starting tasks']],
        ['Healthy sources', ['Finishing a task you’ve been putting off', 'Exercise', 'Learning a new skill', 'Working toward a goal', 'Creative projects', 'Time in nature', 'Music you love', 'Healthy novelty and adventure']],
        ['The quick-fix way (watch for these)', ['Doom scrolling for hours', 'Constant notifications', 'Online shopping sprees', 'Highly processed food', 'Jumping between unfinished tasks', 'Chasing drama or chaos', 'Instant gratification all day long']]],
      quickfix: 'Give me another tiny reward, immediately.',
      items: [['Tick one small task off your list', 5, 'a', 'q'], ['Make your bed', 2, 'h', 'q'], ['Finish something you started', 20, 'a', ''], ['Learn one new thing (a podcast or short video)', 15, 'a', 'n'], ['Listen to a song you love, loud', 4, 'a', 'q'], ['Plan something fun to look forward to', 10, 'a', ''], ['Try a new recipe', 45, 'h', 'n'], ['Take a different route somewhere', 15, 'o', 'n'], ['Set a tiny goal for today and smash it', 5, 'a', 'q'], ['Tidy one drawer or one surface', 10, 'h', 'q'], ['Cold splash on your face', 1, 'a', 'q'], ['Write down three wins from today', 3, 'a', 'q'], ['Read 10 pages of a book', 15, 'a', ''], ['Work on a creative project', 30, 'a', ''], ['Visit a new cafe, park or shop', 45, 'o', 'n'], ['Wear something that makes you feel good', 10, 'h', 'q'], ['Do a puzzle, crossword or Wordle', 10, 'a', 'q'], ['Practise a hobby for 20 minutes', 20, 'a', ''], ['Water your plants or pot a new one', 10, 'h', ''], ['Make your favourite smoothie or breakfast', 10, 'h', 'q'], ['Add proof to your proof portfolio', 2, 'a', 'qb'], ['Watch your next Breakthrough lesson', 20, 'a', 'b'], ['Do a What If Workout on a worry', 15, 'a', 'b'], ['Book a class you’ve never tried', 5, 'a', 'n'], ['Plan a weekend adventure with a friend', 20, 'a', 'nf'], ['Try a new game or sport with your partner', 60, 'o', 'np'], ['Go to a market and try something new to eat', 60, 'o', 'n'], ['Rearrange a corner of your room', 30, 'h', 'n'], ['Start a 7-day mini challenge', 5, 'a', 'n']] },
    O: { name: 'Oxytocin', tag: 'Connection · Bonding · Safety', nick: 'The “I feel safe with you” chemical', col: '#F4C2F7', ic: '🫶',
      feels: 'I feel safe with you.', why: 'Oxytocin is your connection chemical. It builds trust and closeness, and tells your nervous system you’re safe and not alone.',
      learn: [['It helps with', ['Trust', 'Connection', 'Relationships', 'Feeling emotionally safe']],
        ['Sounds a bit like', ['A really long hug after a hard day', 'Cuddling your dog', 'Holding hands with someone you love', 'A conversation where you think “I feel really safe with this person”']],
        ['Healthy sources', ['Hugging someone you trust', 'Cuddling pets', 'Physical affection', 'Meaningful conversations', 'Laughing with friends', 'Eye contact and connection', 'Helping people', 'Time with loved ones']],
        ['The quick-fix way (watch for these)', ['Staying in toxic relationships because they feel familiar', 'Trauma bonding', 'Seeking validation through unhealthy attachment', 'Depending on one person’s attention', 'Ignoring boundaries to avoid losing connection']]],
      quickfix: 'I’ll do anything not to lose this connection.',
      items: [['Hug someone for 20 seconds', 1, 'a', 'q'], ['Cuddle your pet', 5, 'h', 'q'], ['Call or voice-note a friend', 10, 'a', 'f'], ['Send someone a kind message', 2, 'a', 'q'], ['Compliment a stranger', 1, 'o', 'qn'], ['Have a proper laugh with someone', 10, 'a', 'f'], ['Cook a meal for someone you love', 45, 'h', 'p'], ['Snuggle on the couch', 15, 'h', 'p'], ['Give or get a massage', 15, 'h', 'p'], ['Sex or intimacy with your partner', 30, 'h', 'p'], ['Make out like teenagers', 5, 'a', 'pq'], ['Do something kind with no credit', 10, 'a', ''], ['Meet a friend for a walk or coffee', 60, 'o', 'f'], ['Play a game with the kids', 20, 'h', ''], ['Write a thank-you note', 5, 'a', 'q'], ['Wrap yourself in a weighted blanket', 15, 'h', ''], ['Hand on heart, say something kind to yourself', 1, 'a', 'q'], ['Join a class, group or community thing', 60, 'o', 'nf'], ['Look through old photos that make you smile', 10, 'a', ''], ['Ask someone how they really are, and listen', 10, 'a', 'f'], ['Volunteer or help a neighbour', 60, 'o', 'n'], ['Body double with a friend (do tasks together)', 30, 'a', 'f'], ['Date night somewhere new', 120, 'o', 'pn'], ['Slow dance in the kitchen with your partner', 4, 'h', 'pq'], ['Have a deep-and-meaningful over dinner', 60, 'a', 'pf'], ['Host a games night', 120, 'h', 'fn'], ['Long eye-contact check-in with your partner', 2, 'h', 'pq'], ['Message your Breakthrough buddy (or Sav)', 5, 'a', 'qbf'], ['Coffee chat with your partner before the day starts', 10, 'h', 'pq'], ['Shower together and chat', 10, 'h', 'pq']] },
    S: { name: 'Serotonin', tag: 'The “life feels okay” chemical', nick: 'Steady, calm, content', col: '#FFD9A8', ic: '☀️',
      feels: 'Life feels steady and okay.', why: 'Serotonin helps regulate mood, sleep and appetite. It’s that calm, content feeling that things are okay. Sunshine, routine and gratitude feed it.',
      learn: [['It helps regulate', ['Mood', 'Emotional stability', 'Wellbeing', 'Sleep', 'Appetite']],
        ['Low serotonin can look like', ['Low mood', 'Irritability', 'Sleep difficulties', 'Emotional ups and downs']],
        ['Healthy sources', ['Sunlight', 'Regular movement', 'A sense of purpose', 'Achieving meaningful goals', 'Gratitude', 'Consistent sleep', 'Time in nature', 'Feeling respected and valued', 'Looking after your health']],
        ['The quick-fix way (watch for these)', ['Isolating and avoiding problems', 'Looking for outside validation for self-worth', 'Constant comparison', 'Relying only on achievements for happiness', 'Forcing positivity while ignoring emotions']]],
      quickfix: 'If they approve of me, then I’m okay.',
      items: [['Get morning sunlight on your face', 10, 'o', 'q'], ['Walk barefoot on grass or sand', 10, 'o', ''], ['Eat a proper meal, sitting down', 20, 'a', ''], ['Write three things you’re grateful for', 3, 'a', 'q'], ['Sit outside with a cuppa', 10, 'o', 'q'], ['Meditate or do a body scan', 10, 'a', ''], ['Go for a walk in nature', 30, 'o', ''], ['Open the curtains and let the light in', 1, 'h', 'q'], ['Do your 5-minute breath', 5, 'a', 'qb'], ['Have a protein-y breakfast', 15, 'h', ''], ['Stretch slowly', 10, 'a', ''], ['Swim in the ocean or a pool', 30, 'o', ''], ['Garden, or get your hands in some soil', 20, 'o', ''], ['Keep a simple routine today', 0, 'a', 'q'], ['Go to bed at a decent time', 0, 'h', ''], ['Remember a happy memory in detail', 5, 'a', 'q'], ['Sit by water: a beach, river or lake', 20, 'o', ''], ['Have a screen-free hour', 60, 'a', ''], ['Lie down and watch the clouds', 10, 'o', ''], ['Sip a warm drink slowly, no phone', 10, 'a', 'q'], ['Picnic in the park with a friend', 60, 'o', 'f'], ['Sunrise or sunset walk with your partner', 30, 'o', 'p'], ['Visit a botanic garden', 60, 'o', 'n'], ['Help someone with something they need', 30, 'a', 'f'], ['Watch the sunrise somewhere new', 30, 'o', 'n'], ['Read your North Star and your why', 2, 'a', 'qb'], ['Write in your Becoming Book', 10, 'a', 'b']] },
    E: { name: 'Endorphins', tag: 'Natural pain relief · Feel-good', nick: 'The “ahhh, I needed that” chemicals', col: '#BFE3D0', ic: '⚡',
      feels: 'Ahhhhh… I needed that.', why: 'Endorphins are your body’s natural pain relievers. They take the edge off and give you that lovely buzz after moving, laughing or pushing through something hard.',
      learn: [['They help with', ['Reducing pain', 'Pleasure', 'Relief', 'That “runner’s high” feeling']],
        ['Low endorphins can look like', ['Lower pain tolerance', 'Less enjoyment']],
        ['Healthy sources', ['Exercise', 'Laughing until your stomach hurts', 'Dancing', 'Singing', 'Accomplishing something hard', 'Spicy food', 'Massage', 'Sex and intimacy', 'Creative flow']],
        ['The quick-fix way (watch for these)', ['Over-exercising to the point of harm', 'Risk-taking just for the adrenaline', 'Using substances for emotional relief', 'Constantly pushing past healthy limits']]],
      quickfix: 'Push harder. More. Again.',
      items: [['Dance to three songs', 10, 'a', ''], ['Go for a run or a jog', 30, 'o', ''], ['Laugh at something silly (comedy you love)', 10, 'a', 'q'], ['Do a quick workout', 15, 'a', ''], ['Have a hot shower or bath', 20, 'h', ''], ['Sing loudly in the car or shower', 5, 'a', 'q'], ['Eat a little dark chocolate', 1, 'a', 'q'], ['Stretch or do some yoga', 20, 'a', ''], ['Swim laps', 30, 'o', ''], ['Have a sauna or a cold plunge', 20, 'o', 'n'], ['Shake your whole body out for one minute', 1, 'a', 'q'], ['Take the stairs', 5, 'o', 'q'], ['Have a good cry if it’s there', 10, 'a', ''], ['Smell something you love (oils, candles, flowers)', 2, 'a', 'q'], ['Go to a class: gym, pilates, boxing', 60, 'o', ''], ['Brisk walk with a hill in it', 20, 'o', ''], ['Skip, jump or bounce on a trampoline', 5, 'a', 'q'], ['Eat something a bit spicy', 10, 'a', ''], ['Play a sport or kick a ball around', 30, 'o', 'f'], ['Do 20 star jumps', 1, 'a', 'q'], ['Sex (yes, it counts)', 30, 'h', 'p'], ['Try a dance or boxing class with a friend', 60, 'o', 'nf'], ['Go rock climbing or bouldering', 90, 'o', 'n'], ['Workout outside with your partner', 30, 'o', 'p'], ['Karaoke night', 120, 'o', 'nf'], ['Shake it out, then a Coming Home check-in', 5, 'a', 'qb'], ['Follow an at-home dance class on YouTube', 30, 'h', 'n'], ['Dance class on YouTube with a friend', 30, 'h', 'f']] }
  };
  // more options, so every time group has at least 15 to choose from
  DOSE.D.items = DOSE.D.items.concat([
    ['Put on an outfit you love, just because', 5, 'h', 'q'], ['Do a 5-minute brain dump, then circle one thing to do', 5, 'a', 'q'],
    ['Cook a new-to-you breakfast', 20, 'h', 'n'], ['Declutter one bag of stuff', 20, 'h', ''], ['Learn 10 words in a new language', 15, 'a', 'n'], ['Sketch, paint or colour in', 20, 'a', ''], ['Walk a new street or trail', 30, 'o', 'n'], ['Batch-tick 3 small jobs back to back', 20, 'a', ''],
    ['Bake something from scratch', 60, 'h', ''], ['Start a new book', 45, 'a', 'n'], ['Take yourself on a solo date', 120, 'o', 'n'], ['Go to a museum or gallery', 120, 'o', 'n'], ['Do a big tidy and blast music', 60, 'h', ''], ['Learn a TikTok dance', 45, 'h', 'n'], ['Go thrifting or op shopping (with a budget)', 90, 'o', 'n'], ['Plant a veggie or herb garden', 90, 'o', 'n'], ['Finish a project you’ve put off', 60, 'a', ''], ['Do a day trip somewhere new', 240, 'o', 'nf'], ['Take a pottery, art or cooking class', 120, 'o', 'n'], ['Try a new hobby for an hour', 60, 'a', 'n']
  ]);
  DOSE.O.items = DOSE.O.items.concat([
    ['Tell someone what you love about them', 2, 'a', 'q'],
    ['Walk with a friend and talk', 30, 'o', 'f'], ['Cuddle up with a pet and a show', 30, 'h', ''], ['Write a letter to someone you love', 20, 'a', ''], ['Bath together and chat', 30, 'h', 'p'], ['FaceTime someone far away', 20, 'a', 'f'], ['Cook dinner together', 30, 'h', 'p'], ['Brush or plait someone’s hair (or let them do yours)', 15, 'h', ''], ['Give your partner a foot rub', 15, 'h', 'p'], ['Have a laugh at old videos together', 20, 'h', 'f'], ['Do a kind thing for a neighbour', 20, 'o', ''],
    ['Long lunch with a friend', 90, 'o', 'f'], ['Volunteer at an animal shelter', 120, 'o', 'n'], ['A slow morning in bed together', 60, 'h', 'p'], ['Family movie night, all snuggled up', 120, 'h', ''], ['Join a book club or community group', 90, 'o', 'nf'], ['Weekend away with your partner', 240, 'o', 'pn'], ['Beach day with friends', 180, 'o', 'f'], ['Play a board game together', 60, 'h', 'f'], ['Plan a surprise for someone', 45, 'a', '']
  ]);
  DOSE.S.items = DOSE.S.items.concat([
    ['Make your bed and open a window', 2, 'h', 'q'], ['Eat a piece of fruit outside', 5, 'o', 'q'],
    ['Yin or restorative yoga', 30, 'a', ''], ['Journal about one good thing', 15, 'a', ''], ['Slow walk with no phone', 20, 'o', ''], ['Make a nourishing lunch', 20, 'h', ''], ['Sit in the sun and read', 30, 'o', ''], ['Do a gentle body scan in bed', 15, 'h', ''], ['Tidy your space so it feels calm', 20, 'h', ''], ['Listen to an uplifting podcast outside', 30, 'o', ''],
    ['Spend a morning at the beach', 120, 'o', ''], ['Go for a long nature walk or hike', 90, 'o', ''], ['A slow Sunday with no plans', 240, 'h', ''], ['Do a digital detox evening', 180, 'h', 'n'], ['Meal prep healthy food for the week', 90, 'h', ''], ['Go camping or glamping', 240, 'o', 'n'], ['Garden for an afternoon', 120, 'o', ''], ['Float in a pool or the ocean', 60, 'o', ''], ['A massage or spa visit', 60, 'o', 'n'], ['Go to bed early, phone in another room', 60, 'h', ''], ['Picnic dinner at sunset', 90, 'o', 'p'], ['A long bath with a book', 45, 'h', ''], ['Visit a waterfall or lookout', 120, 'o', 'n']
  ]);
  DOSE.E.items = DOSE.E.items.concat([
    ['Do a 2-minute plank challenge', 2, 'a', 'q'], ['Dance to one song with the dog', 4, 'a', 'q'], ['Jump on the spot to a fast song', 3, 'a', 'q'], ['Belly laugh at a funny video', 5, 'a', 'q'],
    ['Bike ride around the block', 20, 'o', ''], ['A quick HIIT session', 20, 'a', ''], ['Hula hoop or skipping rope', 15, 'o', 'n'], ['Swim in the ocean', 30, 'o', ''],
    ['A long run or a fun run', 60, 'o', ''], ['A dance class (in person or online)', 60, 'a', 'n'], ['A full gym session', 60, 'o', ''], ['A hike with a big hill', 120, 'o', ''], ['Surf, paddleboard or kayak', 90, 'o', 'n'], ['Play a team sport', 60, 'o', 'f'], ['A long bike ride', 90, 'o', ''], ['Go to a trampoline park', 60, 'o', 'nf'], ['A massage', 60, 'o', ''], ['Sex and a long cuddle after', 45, 'h', 'p'], ['Comedy show with friends', 120, 'o', 'f'], ['Rollerskating or ice skating', 60, 'o', 'n']
  ]);
  // one activity that ticks several letters at once: the easy way to get your whole DOSE
  var COMBOS = [
    ['Sunshine dance party', 5, 'DOSE', 'All at once. Sav’s original.', ['Step outside into the morning light (S)', 'Put on a song you love, loud (D)', 'Dance like no one’s watching (E)', 'Grab the dog, your partner or the kids to dance with you (O)']],
    ['Coffee in the sun', 15, 'DOSE', 'One after the other, inside the coffee you’re already having.', ['Make your coffee and drink it outside in the sun (S)', 'Have a coffee chat with your partner or housemate (O)', 'Tick one small task off on the way back in (D)', '20 star jumps or a quick shake-out (E)']],
    ['Shower stack', 10, 'DOSE', 'Back to back, inside your shower.', ['Shower together and chat, or call someone on speaker after (O)', 'Finish with 30 seconds of cold water (D + E)', 'Open the curtains and stand in the light while you dry off (S)']],
    ['Walk and talk', 15, 'DOSE', 'All at once.', ['A 10-minute walk outside, morning light on your face (S + E)', 'Take a new route or a new podcast (D)', 'Walk with someone, or voice-note a friend as you go (O)']],
    ['Bed, beats and a hug', 5, 'DOSE', 'Back to back, before you leave the bedroom.', ['Make your bed with music on loud (D)', 'Dance while you do it (E)', 'Throw the curtains open (S)', 'Hug your person or your pet on the way out (O)']],
    ['Gratitude on the back step', 10, 'DSO', 'All at once. Add a stretch for the E.', ['Sit outside with your cuppa (S)', 'Write three wins or three things you’re grateful for (D)', 'Send one of them to someone you love (O)']]
  ];
  function doseId(L, i) { return L + i; }
  function doseItem(id) {
    if (id.charAt(0) === 'C') { var c = COMBOS[+id.slice(1)]; return c ? { L: c[2].charAt(0), letters: c[2], text: c[0], mins: c[1], where: 'a', tags: 'q', combo: true, steps: c[4] } : null; }
    if (id.charAt(0) === 'X') { var cu = (doseData().custom || [])[+id.slice(1)]; return cu ? { L: cu.letters.charAt(0), letters: cu.letters, text: cu.text, mins: 0, where: 'a', tags: '', custom: true } : null; }
    var L = id.charAt(0), it = DOSE[L] && DOSE[L].items[+id.slice(1)]; return it ? { L: L, letters: L, text: it[0], mins: it[1], where: it[2], tags: it[3] || '' } : null;
  }
  function doseData() { var d = rd(K.dose) || {}; d.plan = d.plan || []; d.days = d.days || {}; d.loves = d.loves || []; d.custom = d.custom || []; return d; }
  var ds = { tab: null, card: 0, time: 'any', where: 'a', who: 'me', fresh: false, letter: 'all', gen: null };
  var LETTER_ART = {
    D: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="16" y="16" width="88" height="88" rx="22" fill="#fff" stroke="#1F1412" stroke-width="3"/><path class="da-tick" d="M34 62 L52 80 L88 40" fill="none" stroke="#2F8F9A" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path class="da-spark" d="M98 12c.8 6 4 9.2 10 10-6 .8-9.2 4-10 10-.8-6-4-9.2-10-10 6-.8 9.2-4 10-10z" fill="#F1F9A6" stroke="#1F1412" stroke-width="2"/><path class="da-spark two" d="M18 92c.6 5 3 7.4 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2"/></svg>',
    O: '<svg viewBox="0 0 120 120" aria-hidden="true"><g class="da-beat"><path d="M48 92c-22-15-28-26-22-36 5-8 15-7 22 2 7-9 17-10 22-2 6 10 0 21-22 36z" fill="#F4C2F7" stroke="#1F1412" stroke-width="3"/></g><g class="da-beat two"><path d="M76 82c-18-12-23-21-18-29 4-6 12-6 18 1 6-7 14-7 18-1 5 8 0 17-18 29z" fill="#D3302B" stroke="#1F1412" stroke-width="3"/></g><path class="da-spark" d="M96 24c.6 5 3 7.4 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F1F9A6" stroke="#1F1412" stroke-width="2"/></svg>',
    S: '<svg viewBox="0 0 120 120" aria-hidden="true"><g class="da-spin"><path d="M60 8v16M60 96v16M8 60h16M96 60h16M23 23l11 11M86 86l11 11M23 97l11-11M86 34l11-11" stroke="#F28C3B" stroke-width="5" stroke-linecap="round"/></g><circle cx="60" cy="60" r="26" fill="#FFD9A8" stroke="#1F1412" stroke-width="3"/><path d="M50 62q10 9 20 0" fill="none" stroke="#1F1412" stroke-width="3" stroke-linecap="round"/><circle cx="51" cy="54" r="2.5" fill="#1F1412"/><circle cx="69" cy="54" r="2.5" fill="#1F1412"/></svg>',
    E: '<svg viewBox="0 0 120 120" aria-hidden="true"><g class="da-jump"><circle cx="60" cy="30" r="9" fill="#BFE3D0" stroke="#1F1412" stroke-width="3"/><path d="M60 40v28M60 48l-18-10M60 48l18-10M60 68l-14 22M60 68l14 22" stroke="#1F1412" stroke-width="4" stroke-linecap="round"/></g><path class="da-spark" d="M24 50c.8 6 4 9.2 10 10-6 .8-9.2 4-10 10-.8-6-4-9.2-10-10 6-.8 9.2-4 10-10z" fill="#F1F9A6" stroke="#1F1412" stroke-width="2"/><path class="da-spark two" d="M96 64c.6 5 3 7.4 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2"/><path d="M30 104h60" stroke="#1F1412" stroke-width="3" stroke-linecap="round" opacity=".4"/></svg>'
  };

  var DOSE_ANCHOR = { D: ['#5BAEB7', 'the reward chemical'], O: ['#D9719F', 'the love hormone'], S: ['#F2A05A', 'the mood stabiliser'], E: ['#F0604D', 'the pain killer'] };
  function doseAnchor(cur) { return h('div', { class: 'ds-anchor', 'aria-label': 'D for dopamine, the reward chemical. O for oxytocin, the love hormone. S for serotonin, the mood stabiliser. E for endorphins, the pain killer.' }, ['D', 'O', 'S', 'E'].map(function (L) { return h('span', { class: 'ds-an' + (cur === L ? ' on' : ''), style: '--a:' + DOSE_ANCHOR[L][0] }, [h('b', { text: L }), h('span', { class: 'ds-an-n', text: DOSE[L].name }), h('span', { class: 'ds-an-q', text: '“' + DOSE_ANCHOR[L][1] + '”' })]); })); }
  function tagIcons(t) { var o = []; if (t.indexOf('q') >= 0) o.push(['⏱', 'quick']); if (t.indexOf('n') >= 0) o.push(['✨', 'something new']); if (t.indexOf('f') >= 0) o.push(['👯', 'with a friend']); if (t.indexOf('p') >= 0) o.push(['💞', 'with my partner']); if (t.indexOf('b') >= 0) o.push(['🌈', 'from your Breakthrough program']); return o; }
  function itemLabel(it) { return h('span', { class: 'ds-it-l' }, [h('span', { class: 'ds-it-t', text: it.text }), h('span', { class: 'ds-it-m' }, [it.mins ? it.mins + ' min' : 'all day'].concat(tagIcons(it.tags || '').map(function (x) { return h('span', { title: x[1], 'aria-label': x[1], text: ' ' + x[0] }); })))]); }
  function letterArt(L) { var s = h('span', { class: 'ds-art', style: '--c:' + DOSE[L].col }); s.innerHTML = window.BT_HAND ? window.BT_HAND.wrap(LETTER_ART[L], 'bt-hand') : LETTER_ART[L]; return s; }
  function Dose(root) {
    boot();
    var wrap = shell(root, 'Vagal Tone Workout · DOSE', 'Your daily DOSE', 'Dopamine, oxytocin, serotonin, endorphins. Feed your brain the good stuff on purpose.');
    wrap.insertBefore(hero('dose'), wrap.firstChild);
    wrap.appendChild(seriesTabs('dose'));
    try { var sv = JSON.parse(localStorage.getItem('__bt_ds') || 'null'); if (sv && !ds.tab) { ds.tab = sv.tab; ds.card = sv.card || 0; } } catch (e) {}
    var d0 = doseData(), setUp = function () { var x = doseData(); return x.loves.length && x.plan.length; }; if (!ds.tab) ds.tab = !d0.loves.length ? 'learn' : !d0.plan.length ? 'routine' : 'home';
    var tabs = h('div', { class: 'ds-tabs', role: 'tablist' }), body = h('div', { class: 'ds-body' });
    wrap.appendChild(tabs); wrap.appendChild(body);
    var TABS0 = [['learn', 'Step 1 · Build my menu'], ['routine', 'Step 2 · Daily minimum'], ['pick', 'Step 3 · Sav picks for me'], ['menu', '♥ My DOSE menu']], TABS = TABS0;
    function go(t) { ds.tab = t; draw(); try { tabs.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }
    function draw() {
      try { localStorage.setItem('__bt_ds', JSON.stringify({ tab: ds.tab, card: ds.card })); } catch (e) {}
      tabs.innerHTML = '';
      if (setUp()) {
        // once the steps are done, everything lives on the DOSE home; the steps open from there
        if (ds.tab !== 'home') tabs.appendChild(h('button', { class: 'ds-tab on ds-backhome', type: 'button', text: '← Back to my DOSE', onclick: function () { go('home'); } }));
        body.innerHTML = '';
        ({ home: drawHome, learn: drawLearn, menu: drawMenu, routine: drawRoutine, pick: drawPick })[ds.tab]();
        return;
      }
      TABS = TABS0;
      TABS.forEach(function (t) { var on = ds.tab === t[0]; tabs.appendChild(h('button', { class: 'ds-tab' + (on ? ' on' : ''), type: 'button', role: 'tab', 'aria-selected': on ? 'true' : 'false', text: t[1], onclick: function () { go(t[0]); } })); });
      body.innerHTML = '';
      ({ home: drawHome, learn: drawLearn, menu: drawMenu, routine: drawRoutine, pick: drawPick })[ds.tab]();
    }
    function toggleLove(id) { var d = doseData(), i = d.loves.indexOf(id); if (i >= 0) d.loves.splice(i, 1); else d.loves.push(id); wr(K.dose, d); }
    function tickToday(id, el) { var d = doseData(), k = dk(), x = d.days[k] = d.days[k] || {}; if (x[id]) delete x[id]; else { x[id] = Date.now(); if (el) kit.sparkleBurst(el); var it = doseItem(id); if (it) { var vw0 = rd('bt-vwork') || { days: {} }; vw0.days = vw0.days || {}; var day = vw0.days[k] = vw0.days[k] || {}; day.dose = day.dose || {}; it.letters.split('').forEach(function (L) { day.dose[L] = true; }); day.dose.done = true; day.at = Date.now(); wr('bt-vwork', vw0); } } wr(K.dose, d); tickLesson('dose'); }
    var IMG = (window.BT_DEMO ? '' : '/') + 'img/sav/';
    var TIERS = [['quick', 'Quick wins', 'under 10 minutes', function (m) { return m <= 10; }], ['mid', 'A little more', '10 to 30 minutes', function (m) { return m > 10 && m <= 30; }], ['big', 'Bigger hits', 'over 30 minutes', function (m) { return m > 30; }]];
    var MIN_PER = 3;
    function tierCounts(L) { var d = doseData(), out = {}; TIERS.forEach(function (t) { out[t[0]] = DOSE[L].items.filter(function (it, j) { return t[3](it[1]) && d.loves.indexOf(L + j) >= 0; }).length; }); return out; }
    function letterDone(L) { var c = tierCounts(L); return TIERS.every(function (t) { var avail = DOSE[L].items.filter(function (it) { return t[3](it[1]); }).length; return c[t[0]] >= Math.min(MIN_PER, avail); }); }
    function stepHead(n, title, sub) { return h('div', { class: 'ds-step' }, [h('span', { class: 'ds-step-n', text: n }), h('div', null, [h('b', { text: title }), h('span', { text: sub })])]); }
    // ---- step 1: the four cards, options grouped by time and effort
    function drawLearn() {
      body.appendChild(stepHead('1', 'Build your full DOSE menu', 'Go through each letter and pick everything you’d love. At least 3 from each time group, so you’ve got options on busy days and slow ones.'));
      var LS = ['intro', 'D', 'O', 'S', 'E'], i = Math.min(ds.card, 4), L = LS[i];
      if (L !== 'intro') body.appendChild(doseAnchor(L));
      body.appendChild(h('div', { class: 'ds-dots', 'aria-label': 'Card ' + (i + 1) + ' of 5' }, LS.map(function (x, j) { return h('button', { class: 'ds-dot' + (j === i ? ' on' : '') + (x !== 'intro' && letterDone(x) ? ' done' : ''), type: 'button', 'aria-label': x === 'intro' ? 'Start' : DOSE[x].name + (x !== 'intro' && letterDone(x) ? ', done' : ''), text: x === 'intro' ? '★' : (letterDone(x) && j !== i ? '✓' : x), onclick: function () { ds.card = j; draw(); } }); })));
      var card = h('section', { class: 'ds-card' + (L !== 'intro' ? ' l' + L : ''), style: L !== 'intro' ? '--c:' + DOSE[L].col : '' });
      if (L === 'intro') {
        card.appendChild(h('img', { class: 'ds-chart', src: IMG + 'dose-chart.jpg', alt: 'DOSE: Dopamine, the reward chemical. Oxytocin, the love hormone. Serotonin, the mood stabiliser. Endorphins, the pain killer.' }));
        card.appendChild(h('h2', { class: 'vg-h', text: 'Getting your daily DOSE' }));
        card.appendChild(h('p', { text: 'Your brain isn’t trying to sabotage you. It’s trying to help you feel good, and sometimes it just takes the quickest route. Drive-through vs cooking a proper meal: both meet a need, one just supports you better long term.' }));
        card.appendChild(h('p', { text: 'Your daily DOSE is the proper meal. Here’s how it works:' }));
        card.appendChild(h('ol', { class: 'ds-steps' }, [h('li', null, [h('b', { text: 'Build your full menu. ' }), 'Everything you’d love, across all four letters.']), h('li', null, [h('b', { text: 'Make a daily minimum. ' }), 'A few easy wins you can stack into the first hour of your day.']), h('li', null, [h('b', { text: 'Get extra when you want it. ' }), 'Ask Sav to pick you a bigger, more fun DOSE plan.'])]));
        card.appendChild(h('details', { class: 'ds-learn', open: 'open' }, [h('summary', { text: 'The big takeaway' }), h('div', { class: 'ds-learn-b' }, [h('p', { text: 'Next time you catch yourself doom scrolling, searching the cupboards, online shopping, chasing stimulation or craving attention, pause and ask:' }), h('p', { class: 'ds-q', text: '“What need am I actually trying to meet?”' }), h('p', { text: 'Maybe you’re not lazy. Maybe you’re not broken. Maybe your brain is just looking for dopamine, oxytocin, serotonin or endorphins. And now you’re building a menu of healthier ways to meet those needs.' })])]));
        card.appendChild(h('button', { class: 'bt-btn lime', type: 'button', text: 'Let’s build my menu →', onclick: function () { ds.card = 1; draw(); } }));
        body.appendChild(card); return;
      }
      var G = DOSE[L], d = doseData(), counts = tierCounts(L);
      card.appendChild(h('div', { class: 'ds-card-top' }, [letterArt(L), h('div', null, [h('span', { class: 'ds-big', text: L }), h('h2', { class: 'vg-h', text: G.name }), h('span', { class: 'ds-tag', text: G.tag })])]));
      card.appendChild(h('p', { class: 'ds-feels', text: '“' + G.feels + '”' }));
      card.appendChild(h('p', { text: G.why }));
      card.appendChild(h('details', { class: 'ds-learn', open: 'open' }, [h('summary', { text: 'Learn more about ' + G.name.toLowerCase() }), h('div', { class: 'ds-learn-b' }, G.learn.map(function (s0) { var warn = /quick-fix/.test(s0[0]); return h('div', { class: 'ds-ls' + (warn ? ' warn' : '') }, [h('b', { text: s0[0] }), h('ul', null, s0[1].map(function (x) { return h('li', { text: x }); }))]); }).concat([h('p', { class: 'ds-q', text: 'The quick-fix version feels like: “' + G.quickfix + '”' })]))]));
      card.appendChild(h('div', { class: 'ds-pick-h' }, [h('b', { text: 'Pick everything you’d love' }), h('span', { class: 'ds-count', text: d.loves.filter(function (id) { return id.charAt(0) === L; }).length + ' picked' })]));
      card.appendChild(h('p', { class: 'ds-key', text: '⏱ quick  ✨ something new  👯 with a friend  💞 with my partner  🌈 from your Breakthrough program' }));
      TIERS.forEach(function (t) {
        var list = G.items.map(function (it, j) { return [it, j]; }).filter(function (x) { return t[3](x[0][1]); });
        if (!list.length) return;
        var need = Math.min(MIN_PER, list.length), got = counts[t[0]], ok = got >= need;
        card.appendChild(h('div', { class: 'ds-tier' + (ok ? ' ok' : '') }, [h('div', { class: 'ds-tier-h' }, [h('span', { class: 'ds-tier-bars', 'aria-hidden': 'true' }, [1, 2, 3].map(function (n) { return h('i', { class: n <= TIERS.indexOf(t) + 1 ? 'on' : '' }); })), h('b', { text: t[1] }), h('span', { text: t[2] }), h('span', { class: 'ds-tier-c', text: ok ? '✓ ' + got + ' picked' : got + ' of ' + need + ' picked' })]),
          h('div', { class: 'ds-grid' }, list.map(function (x) { var id = L + x[1], on = d.loves.indexOf(id) >= 0; return h('button', { class: 'ds-opt' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { toggleLove(id); if (!on) kit.sparkleBurst(e.currentTarget); var y = window.scrollY; draw(); window.scrollTo(0, y); } }, [h('span', { class: 'ds-ck', 'aria-hidden': 'true', text: on ? '♥' : '' }), itemLabel(doseItem(id))]); }))]));
      });
      var ready = letterDone(L);
      if (!ready) card.appendChild(h('p', { class: 'ds-need', text: 'Pick at least 3 from each time group to keep going. Choose the ones you’d genuinely enjoy.' }));
      card.appendChild(h('div', { class: 'ds-nav' }, [h('button', { class: 'bt-btn ghost', type: 'button', text: '← Back', onclick: function () { ds.card = i - 1; draw(); } }), h('button', { class: 'bt-btn ' + (ready ? 'lime' : 'dim'), type: 'button', 'aria-disabled': ready ? 'false' : 'true', text: i < 4 ? 'Next: ' + DOSE[LS[i + 1]].name + ' →' : 'Step 1 done: see my menu →', onclick: function () { if (!ready) { toast('Pick at least 3 from each time group first.'); return; } if (i < 4) { ds.card = i + 1; draw(); window.scrollTo(0, 0); } else { ds.card = 0; kit.party('Your DOSE menu is ready!', 'Everything you picked is on your menu. Step 2: build a tiny daily minimum from it.', 'Let’s go'); go('routine'); } } })]));
      body.appendChild(card);
    }
    // ---- 2. the menu
    function drawMenu() {
      var d = doseData(), today = d.days[dk()] || {};
      var menu = h('section', { class: 'ds-menu' }, [h('div', { class: 'ds-menu-h' }, [h('span', { class: 'ds-menu-k', text: '~ Today’s specials ~' }), h('h2', { text: 'My DOSE menu' }), h('span', { class: 'ds-menu-s', text: 'Everything you said you’d love. Tick what you have today.' })])]);
      if (!d.loves.length) { menu.appendChild(h('p', { class: 'vg-sub', text: 'Your menu is empty. Go through the four cards and pick what you’d love.' })); menu.appendChild(h('button', { class: 'bt-btn lime', type: 'button', text: 'Pick what I’d love →', onclick: function () { ds.card = 0; go('learn'); } })); body.appendChild(menu); return; }
      ['D', 'O', 'S', 'E'].forEach(function (L) {
        var ids = d.loves.filter(function (id) { return id.charAt(0) === L; });
        menu.appendChild(h('div', { class: 'ds-menu-sec' }, [h('div', { class: 'ds-menu-sh' }, [h('i', { style: '--c:' + DOSE[L].col, text: L }), h('b', { text: DOSE[L].name }), h('span', { text: DOSE[L].nick })]),
          ids.length ? h('ul', { class: 'ds-menu-l' }, ids.map(function (id) { var it = doseItem(id); if (!it) return null; var on = !!today[id], inR = d.plan.indexOf(id) >= 0; return h('li', null, [h('button', { class: 'ds-mi' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { tickToday(id, e.currentTarget); setTimeout(draw, 200); } }, [h('span', { class: 'ds-ck', 'aria-hidden': 'true', text: on ? '✓' : '' }), h('span', { class: 'ds-mi-t', text: it.text }), h('span', { class: 'ds-dots-l', 'aria-hidden': 'true' }), h('span', { class: 'ds-mi-m', text: it.mins ? it.mins + 'm' : '·' })]), inR ? h('span', { class: 'ds-inr', title: 'In my daily routine', text: '★' }) : null]); })) : h('button', { class: 'vg-lower', type: 'button', text: '+ Add some ' + DOSE[L].name.toLowerCase(), onclick: function () { ds.card = ['D', 'O', 'S', 'E'].indexOf(L) + 1; go('learn'); } })]));
      });
      menu.appendChild(h('div', { class: 'ds-nav' }, [h('button', { class: 'bt-btn ghost', type: 'button', text: 'Edit my menu', onclick: function () { ds.card = 1; go('learn'); } }), h('button', { class: 'bt-btn lime', type: 'button', text: d.plan.length ? 'My daily routine →' : 'Build my daily routine →', onclick: function () { go('routine'); } })]));
      body.appendChild(menu);
    }
    // ---- step 2: the daily minimum (her bare-minimum DOSE, ideally in the first hour of the day)
    function photo(file, cap) { return h('figure', { class: 'ds-ph' }, [h('img', { src: IMG + file, alt: cap, loading: 'lazy' }), h('figcaption', { text: cap })]); }
    function drawRoutine() {
      var d = doseData(), today = d.days[dk()] || {};
      body.appendChild(stepHead('2', 'Your daily bare-ass minimum', 'The smallest, quickest way to tick off D, O, S and E, ideally in the first hour of your day.'));
      if (!d.loves.length) { body.appendChild(h('p', { class: 'ds-note', text: 'Do step 1 first, so your daily minimum is built from things you love.' })); body.appendChild(h('button', { class: 'bt-btn lime', type: 'button', text: 'Go to step 1 →', onclick: function () { go('learn'); } })); return; }
      // the honest bit first, then her intention
      var intIn = h('textarea', { class: 'bt-in ds-int-in', rows: '2', 'aria-label': 'My happy hormone intention', placeholder: 'I get my happy hormones every day because…' }); intIn.value = d.intent || '';
      body.appendChild(h('section', { class: 'ds-card ds-real' }, [
        h('h2', { class: 'ds-bigh', text: 'Let’s be real for a sec' }),
        h('p', { text: 'Right now your brain is wired to grab the quickest hit: the scroll, the snack, the cart. Getting your happy hormones the healthy way might not feel unconscious and easy at first. It might take effort, and a bit of dedication, every single day.' }),
        h('p', { text: 'That’s exactly why we start with a bare-ass minimum. Tiny, quick and easy, so it becomes a standard you do every day, even on the hard ones. Once it’s automatic, it grows.' }),
        h('span', { class: 'vg-ml', text: 'My happy hormone intention' }),
        h('p', { class: 'vg-sub', text: 'Why does this matter to you? This is what you’ll come back to when you need a push.' }),
        intIn,
        h('button', { class: 'bt-btn lime', type: 'button', text: d.intent ? 'Update my intention' : 'Save my intention', onclick: function (e) { var t = kit.tx(intIn.value); if (!t) { toast('Write a line first.'); return; } var dd = doseData(); dd.intent = t; wr(K.dose, dd); kit.sparkleBurst(e.currentTarget); toast('Saved. That’s your why.'); } })
      ]));
      // Sav's story: start small, then it compounds
      function ex(file, alt, letters, title, note, cap) { return h('figure', { class: 'ds-ex' }, [h('img', { src: IMG + file, alt: alt, loading: 'lazy' }), cap ? h('span', { class: 'ds-ex-cap', text: cap }) : null, h('figcaption', null, [h('span', { class: 'ds-lts' }, letters.split('').map(function (x) { return h('i', { style: '--c:' + DOSE[x].col, text: x }); })), h('b', { text: title }), note ? h('span', { text: note }) : null])]); }
      body.appendChild(h('section', { class: 'ds-card ds-story' }, [
        h('span', { class: 'vg-k', text: 'How Sav gets it all in' }), h('h2', { class: 'ds-bigh', text: 'Start tiny. Let it compound.' }),
        h('p', { text: 'When I first started, my whole DOSE was 5 to 10 minutes, all at once.' }),
        h('div', { class: 'ds-exs one' }, [ex('dogs-outside.jpg', 'Sav dancing outside with headphones on, her two dogs beside her', 'DOSE', 'All at once: music on, outside, dancing with my dogs', 'Sun (S), dancing (E), the dogs (O), and ticking DOSE off my sticky-note list (D).')]),
        h('p', { text: 'It compounds. Once that was easy, I added more. Now a good day might look like:' }),
        h('div', { class: 'ds-exs' }, [
          ex('friend-dance.jpg', 'Sav and a friend doing a dance class at home', 'DEO', 'An at-home dance class on YouTube with a friend', 'Something fun (D), moving (E), with a friend (O).'),
          ex('stretch.jpg', 'Sav in a red-lit room, arched back in a dance pose', 'O', 'Adult fun time with the hubby (bonus O 😉)', '', 'Cheeky… this isn’t OnlyFans, guys. You don’t get a preview of that one.'),
          ex('pool.jpg', 'Sav floating in the pool, her laptop in a cardboard box beside her', 'S', 'An hour floating in the pool, and doing work from my pool box', 'Yes, I made a box for my laptop so I can work in the pool… genius, I know.')
        ]),
        h('p', { class: 'ds-q', text: 'You don’t start with the hour. You start with the 5 minutes, and you keep showing up.' })
      ]));
      body.appendChild(h('section', { class: 'ds-card ds-how' }, [h('h2', { class: 'ds-bigh', text: 'How to make yours' }), h('ol', { class: 'ds-steps big' }, [
        h('li', null, [h('b', { text: 'Choose a ready-made stack, ' }), 'or make your own from your menu.']),
        h('li', null, [h('b', { text: 'Keep it tiny: ' }), 'the smallest, quickest way you can tick off every letter.']),
        h('li', null, [h('b', { text: 'Do it every day, ' }), 'ideally in the first hour. It lives on your home page in your daily list, ready to tick.']),
        h('li', null, [h('b', { text: 'Bored of it? ' }), 'When this one runs out of dopamine, come back and choose a different one any time.'])
      ])]));
      // the routine she's building
      var lit = {}; d.plan.forEach(function (id) { var it = doseItem(id); if (it) it.letters.split('').forEach(function (L) { lit[L] = 1; }); });
      var mins = d.plan.reduce(function (a, id) { var it = doseItem(id); return a + (it ? it.mins : 0); }, 0);
      var sec = h('section', { class: 'ds-card' });
      sec.appendChild(h('div', { class: 'ds-rt-top' }, [h('div', null, [h('span', { class: 'vg-k', text: 'My daily minimum' }), h('h2', { class: 'ds-bigh', text: d.plan.length ? 'My morning DOSE · ' + mins + ' min' : 'Build it below' })]), h('div', { class: 'ds-lit' }, ['D', 'O', 'S', 'E'].map(function (L) { return h('span', { class: 'ds-lit-i' + (lit[L] ? ' on' : ''), style: '--c:' + DOSE[L].col }, [h('b', { text: L }), h('span', { text: lit[L] ? '✓' : '·' })]); }))]));
      if (d.plan.length) {
        sec.appendChild(h('ul', { class: 'ds-rt' }, d.plan.map(function (id) { var it = doseItem(id); if (!it) return null; return h('li', null, [h('div', { class: 'ds-rt-i' }, [h('span', { class: 'ds-lts' }, it.letters.split('').map(function (x) { return h('i', { style: '--c:' + DOSE[x].col, text: x }); })), h('b', { text: it.text }), it.steps ? h('ol', null, it.steps.map(function (st) { return h('li', { text: st }); })) : null]), h('button', { class: 'vg-x', type: 'button', 'aria-label': 'Remove from my minimum', text: '×', onclick: function () { var dd = doseData(); dd.plan = dd.plan.filter(function (x) { return x !== id; }); wr(K.dose, dd); draw(); } })]); })));
        if (mins > 20) sec.appendChild(h('p', { class: 'ds-need', text: 'That’s ' + mins + ' minutes. For a minimum, smaller is better. Could you take one off and save it for a bonus day?' }));
        var allL = ['D', 'O', 'S', 'E'].every(function (L) { return lit[L]; });
        sec.appendChild(h('div', { class: 'ds-nav' }, [h('span', { class: 'vg-sub', text: allL ? 'All four covered. Beautiful.' : 'Missing ' + ['D', 'O', 'S', 'E'].filter(function (L) { return !lit[L]; }).join(', ') + '. That’s okay: something is better than nothing.' }), h('button', { class: 'bt-btn lime', type: 'button', text: 'Step 2 done →', onclick: function () { kit.party('Your daily minimum is set!', 'Do it in the first hour of your day if you can. Small, easy, every day. That’s how it compounds.', 'Step 3'); go('pick'); } })]));
      } else sec.appendChild(h('p', { class: 'vg-sub', text: 'Pick a ready-made stack below, or build your own from the quick wins on your menu.' }));
      body.appendChild(sec);
      // ready-made stacks
      var stacks = h('section', { class: 'ds-card' }, [h('span', { class: 'vg-k', text: 'Option 1' }), h('h2', { class: 'ds-bigh', text: 'Choose a ready-made stack' }), h('p', { class: 'ds-sm', text: 'Do them back to back, or all at once.' }), h('p', { text: 'The first hour of your day is the sweet spot: one little stack and you’ve fed all four before life gets loud. Slot the O into things you already do, like a coffee chat or a shower together.' })]);
      stacks.appendChild(h('div', { class: 'ds-stacks' }, COMBOS.map(function (c, j) { var id = 'C' + j, on = d.plan.indexOf(id) >= 0; return h('button', { class: 'ds-stack' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function () { var dd = doseData(); if (on) dd.plan = dd.plan.filter(function (x) { return x !== id; }); else dd.plan.push(id); wr(K.dose, dd); draw(); } }, [h('div', { class: 'ds-stack-h' }, [h('b', { text: c[0] }), h('span', { class: 'ds-it-m', text: c[1] + ' min' }), h('span', { class: 'ds-ck', 'aria-hidden': 'true', text: on ? '★' : '+' })]), h('span', { class: 'ds-lts' }, c[2].split('').map(function (x) { return h('i', { style: '--c:' + DOSE[x].col, text: x }); })), h('span', { class: 'ds-stack-how', text: c[3] }), h('ol', null, c[4].map(function (st) { return h('li', { text: st }); }))]); })));
      body.appendChild(stacks);
      // or build my own from quick wins on her menu
      // make your own: her whole menu, quick ones first, one tick per letter
      var own = h('section', { class: 'ds-card' }, [h('span', { class: 'vg-k', text: 'Option 2' }), h('h2', { class: 'ds-bigh', text: 'Make your own' }), h('p', { class: 'ds-sm', text: 'This is your menu. Tick one from each letter. The quick ones are at the top: start with those, they’re the easiest to keep doing.' })]);
      ['D', 'O', 'S', 'E'].forEach(function (L) {
        var ids = d.loves.filter(function (id) { return id.charAt(0) === L; }).sort(function (a, b) { return doseItem(a).mins - doseItem(b).mins; });
        var picked = ids.filter(function (id) { return d.plan.indexOf(id) >= 0; })[0];
        own.appendChild(h('div', { class: 'ds-own' }, [h('div', { class: 'ds-own-h' }, [h('span', { class: 'ds-lt1', style: '--c:' + DOSE[L].col, text: L }), h('b', { text: DOSE[L].name }), h('span', { class: 'ds-own-st' + (picked ? ' ok' : ''), text: picked ? '✓ picked' : 'pick one' })]),
          ids.length ? h('div', { class: 'ds-own-l' }, ids.map(function (id) { var it = doseItem(id), on = d.plan.indexOf(id) >= 0, quickOne = it.mins <= 10; return h('button', { class: 'ds-own-i' + (on ? ' on' : '') + (quickOne ? ' quick' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { var dd = doseData(); dd.plan = dd.plan.filter(function (x) { return x.charAt(0) !== L; }); if (!on) dd.plan.push(id); wr(K.dose, dd); var y = window.scrollY; draw(); window.scrollTo(0, y); } }, [h('span', { class: 'ds-ck', 'aria-hidden': 'true', text: on ? '✓' : '' }), h('span', { class: 'ds-it-t', text: it.text }), h('span', { class: 'ds-own-m', text: quickOne ? '⏱ ' + (it.mins || 1) + ' min' : it.mins + ' min' })]); })) : h('button', { class: 'vg-lower', type: 'button', text: '+ Add some ' + DOSE[L].name.toLowerCase() + ' to your menu', onclick: function () { ds.card = ['D', 'O', 'S', 'E'].indexOf(L) + 1; go('learn'); } })]));
      });
      body.appendChild(own);
      body.appendChild(completeBtn('dose', 'DOSE plan'));
    }
    // ---- DOSE home, once she's built her menu and her minimum: do my plan, or spice it up
    function drawHome() {
      var d = doseData(), today = d.days[dk()] || {}, all = d.plan.length && d.plan.every(function (id) { return today[id]; });
      if (d.intent) body.appendChild(h('p', { class: 'ds-int', text: '“' + d.intent + '”' }));
      body.appendChild(h('section', { class: 'ds-card ds-home' + (all ? ' done' : '') }, [h('span', { class: 'vg-k', text: niceDay(Date.now()) }), h('h2', { class: 'ds-bigh', text: all ? 'My daily DOSE: done ✓' : 'My daily DOSE plan' }),
        h('ul', { class: 'ds-rt' }, d.plan.map(function (id) { var it = doseItem(id); if (!it) return null; var on = !!today[id]; return h('li', null, [h('button', { class: 'ds-mi' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { tickToday(id, e.currentTarget); setTimeout(draw, 200); } }, [h('span', { class: 'ds-ck', 'aria-hidden': 'true', text: on ? '✓' : '' }), h('span', { class: 'ds-mi-t', text: it.text }), h('span', { class: 'ds-lts' }, it.letters.split('').map(function (x) { return h('i', { style: '--c:' + DOSE[x].col, text: x }); }))])]); })),
        all ? h('p', { class: 'vg-sub', text: 'Your brain says thank you. Want a bigger dose today?' }) : h('button', { class: 'bt-btn lime', type: 'button', text: 'I did my whole minimum', onclick: function (e) { d.plan.forEach(function (id) { if (!(doseData().days[dk()] || {})[id]) tickToday(id); }); kit.sparkleBurst(e.currentTarget); toast('Full DOSE. Your brain says thank you.'); setTimeout(draw, 300); } })]));
      body.lastChild.appendChild(h('button', { class: 'vg-lower', type: 'button', text: 'Change my plan', onclick: function () { go('routine'); } }));
      body.appendChild(h('button', { class: 'ds-spicebtn', type: 'button', onclick: function () { if (!ds.gen) generate(); go('pick'); } }, [h('span', { class: 'ds-spice-ic', 'aria-hidden': 'true', text: '🌶' }), h('span', null, [h('b', { text: 'Add a bit of dopamine' }), h('span', { text: 'Want more fun today? Sav will pick a plan for you.' })]), h('span', { 'aria-hidden': 'true', text: '→' })]));
      var mm = h('section', { class: 'ds-menu sm' }, [h('div', { class: 'ds-menu-h' }, [h('span', { class: 'ds-menu-k', text: '~ my menu ~' }), h('h2', { text: 'My DOSE menu' })])]);
      ['D', 'O', 'S', 'E'].forEach(function (L) { var ids = d.loves.filter(function (id) { return id.charAt(0) === L; }); mm.appendChild(h('div', { class: 'ds-menu-sec' }, [h('div', { class: 'ds-menu-sh' }, [h('i', { style: '--c:' + DOSE[L].col, text: L }), h('b', { text: DOSE[L].name }), h('span', { text: ids.length + ' on your menu' })]), h('div', { class: 'ds-menu-chips' }, ids.slice(0, 6).map(function (id) { var it = doseItem(id); return it ? h('span', { class: 'ds-mc', text: it.text }) : null; }).concat(ids.length > 6 ? [h('span', { class: 'ds-mc more', text: '+' + (ids.length - 6) + ' more' })] : []))])); });
      mm.appendChild(h('div', { class: 'ds-nav' }, [h('button', { class: 'bt-btn ghost', type: 'button', text: 'Open my full menu', onclick: function () { go('menu'); } }), h('button', { class: 'bt-btn ghost', type: 'button', text: 'Add or change things', onclick: function () { ds.card = 1; go('learn'); } })]));
      body.appendChild(mm);
    }
    // ---- 4. pick a plan for me
    function fits(it) {
      if (ds.where !== 'a' && it.where !== 'a' && it.where !== ds.where) return false;
      if (ds.time !== 'any' && it.mins > +ds.time) return false;
      if (ds.who === 'friend' && (it.tags || '').indexOf('f') < 0) return false;
      if (ds.who === 'partner' && (it.tags || '').indexOf('p') < 0) return false;
      return true;
    }
    function pool(L, loved) { var d = doseData(); return DOSE[L].items.map(function (it, j) { return L + j; }).filter(function (id) { var inL = d.loves.indexOf(id) >= 0; return (loved ? inL : !inL) && fits(doseItem(id)); }); }
    function pickOne(L, avoid) {
      var mine = pool(L, true).filter(function (id) { return avoid.indexOf(id) < 0; });
      if (ds.fresh) { var nw = mine.filter(function (id) { return (doseItem(id).tags || '').indexOf('n') >= 0; }); if (nw.length) mine = nw; }
      if (!mine.length) { mine = pool(L, false).filter(function (id) { return avoid.indexOf(id) < 0; }); if (ds.fresh) { var nw2 = mine.filter(function (id) { return (doseItem(id).tags || '').indexOf('n') >= 0; }); if (nw2.length) mine = nw2; } }
      return mine.length ? mine[Math.floor(Math.random() * mine.length)] : null;
    }
    function generate() {
      var Ls = ds.letter === 'all' ? ['D', 'O', 'S', 'E'] : [ds.letter, ds.letter, ds.letter], used = [], picks = [];
      Ls.forEach(function (L) { var id = pickOne(L, used); if (id) { used.push(id); picks.push(id); } });
      var wild = [], tries = 0;
      while (wild.length < (ds.fresh ? 2 : 1) && tries < 20) { tries++; var L = ds.letter === 'all' ? 'DOSE'.charAt(Math.floor(Math.random() * 4)) : ds.letter, p = pool(L, false).filter(function (id) { return used.indexOf(id) < 0; }); if (ds.fresh) { var nn = p.filter(function (id) { return (doseItem(id).tags || '').indexOf('n') >= 0; }); if (nn.length) p = nn; } if (p.length) { var w = p[Math.floor(Math.random() * p.length)]; used.push(w); wild.push(w); } }
      ds.gen = { picks: picks, wild: wild };
    }
    function drawPick() {
      var sec = h('section', { class: 'ds-card ds-gen' });
      body.appendChild(stepHead('3', 'Get extra: let Sav pick for you', 'For days you want a bigger dose of dopamine and fun. Tell me what you’ve got and I’ll build you a plan, mostly from your menu, with a wildcard or two.'));
      sec.appendChild(h('h2', { class: 'vg-h', text: '🌶 Spice it up' }));
      sec.appendChild(h('div', { class: 'vg-filter' }, [
        h('span', { class: 'vg-ml', text: 'Time I’ve got' }), chipRow([['any', 'Any'], ['10', '10 min'], ['30', '30 min'], ['60', 'An hour'], ['240', 'Half a day']], ds.time, function (v) { ds.time = v; draw(); }, 'Time'),
        h('span', { class: 'vg-ml', text: 'Where' }), chipRow([['a', 'Anywhere', '◎'], ['h', 'At home', '⌂'], ['o', 'Out and about', '☀']], ds.where, function (v) { ds.where = v; draw(); }, 'Where'),
        h('span', { class: 'vg-ml', text: 'Who with' }), chipRow([['me', 'Just me'], ['friend', 'With a friend', '👯'], ['partner', 'With my partner', '💞']], ds.who, function (v) { ds.who = v; draw(); }, 'Who with'),
        h('span', { class: 'vg-ml', text: 'Focus' }), chipRow([['all', 'All of DOSE'], ['D', 'D'], ['O', 'O'], ['S', 'S'], ['E', 'E']], ds.letter, function (v) { ds.letter = v; draw(); }, 'Letter'),
        h('label', { class: 'vg-tog ds-tog' }, [h('input', { type: 'checkbox', checked: ds.fresh ? 'checked' : null, onchange: function (e) { ds.fresh = e.target.checked; draw(); } }), ' ✨ Try something new'])
      ]));
      sec.appendChild(h('button', { class: 'bt-btn lime ds-roll', type: 'button', text: ds.gen ? '🎲 Shuffle again' : '🎲 Pick a plan for me', onclick: function () { generate(); draw(); } }));
      if (ds.gen) {
        var d = doseData(), today = d.days[dk()] || {};
        var row = function (id, wild) { var it = doseItem(id); if (!it) return null; var on = !!today[id], loved = d.loves.indexOf(id) >= 0; return h('li', { class: 'ds-gi' + (wild ? ' wild' : '') }, [h('i', { class: 'ds-lt1', style: '--c:' + DOSE[it.L].col, text: it.L }), itemLabel(it), h('div', { class: 'ds-gi-a' }, [
          wild && !loved ? h('button', { class: 'vg-add', type: 'button', text: '♥ menu', onclick: function () { toggleLove(id); draw(); } }) : null,
          h('button', { class: 'vg-x', type: 'button', 'aria-label': 'Swap this one', text: '⟳', onclick: function () { var arr = wild ? ds.gen.wild : ds.gen.picks, idx0 = arr.indexOf(id), nid = pickOne(it.L, ds.gen.picks.concat(ds.gen.wild)); if (nid) arr[idx0] = nid; draw(); } }),
          h('button', { class: 'ds-done' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', text: on ? '✓' : 'Did it', onclick: function (e) { tickToday(id, e.currentTarget); setTimeout(draw, 200); } })])]); };
        sec.appendChild(h('ul', { class: 'ds-genl' }, ds.gen.picks.map(function (id) { return row(id, false); })));
        if (ds.gen.wild.length) { sec.appendChild(h('div', { class: 'ds-spice' }, [h('b', { text: '🌶 Wanna spice it up?' }), h('span', { text: 'A wildcard you didn’t pick. Give it a go, or add it to your menu if you love it.' })])); sec.appendChild(h('ul', { class: 'ds-genl' }, ds.gen.wild.map(function (id) { return row(id, true); }))); }
        if (!ds.gen.picks.length && !ds.gen.wild.length) sec.appendChild(h('p', { class: 'vg-sub', text: 'Nothing fits those filters. Try loosening one.' }));
      }
      if (setUp()) body.appendChild(completeBtn('dose', 'DOSE plan'));
      body.appendChild(sec);
    }
    draw();
  }

  /* ====================================================================== PAUSE (guidance) */
  var PAUSES = [
    ['A cup of tea, looking out the window', '☕'], ['Lie down, eyes closed, and let the world exist without you for a bit', '☾'], ['Sit in the car for two minutes before you go inside', '◐'],
    ['Watch the clouds or the trees move', '☁'], ['Feel your feet on the floor and take three slow breaths', '◎'], ['Eat something slowly, tasting every bite', '❦'],
    ['Stand in the sun with your eyes closed', '☀'], ['Listen to one whole song doing nothing else', '♪'], ['Sit on the back step and just notice', '⌂'],
    ['Stroke your pet and match their breathing', '♡'], ['Take the long way, slowly', '↝'], ['Doodle without trying to make it good', '✎'],
    ['Light a candle and watch the flame', '✧'], ['Hand on heart, ask: what do I need right now?', '♥'], ['Stretch like a cat when you wake up', '〰'],
    ['Put your phone in another room for 20 minutes', '⊘'], ['Shower without rushing, feel the water', '≋'], ['Notice five sounds around you', '◌'],
    ['One breath between tasks before the next thing', '·'], ['Lie on the grass and look up', '❀']
  ];

  var BREATH_PLAN = [['daily5', 'My daily 5 (the vagal tone breath)'], ['sigh', 'A physiological sigh when I need it'], ['notice', 'Noticing when my breath is shallow, and breathing deeper']];
  function breathPlan() { var p = (rd(K.breath) || {}).plan; var ids = p && p.length ? p : BREATH_PLAN.map(function (x) { return x[0]; }); return BREATH_PLAN.filter(function (x) { return ids.indexOf(x[0]) >= 0; }).map(function (x) { return x[1]; }); }
  function completeBtn(res, what) {
    return h('section', { class: 'vg-complete' }, [h('p', { text: what ? 'Your ' + what + ' is on your daily list automatically. Each day, it’s one tick to say you did it.' : 'It’s on your daily list automatically. Each day, it’s one tick to say you did it.' }),
      h('button', { class: 'bt-btn lime', type: 'button', text: '✓ Done', onclick: function (e) { kit.sparkleBurst(e.currentTarget); toast('Done. It’s on your daily list.'); setTimeout(function () { var went = false; try { went = window.BT_COURSE.activityDone(res); } catch (x) {} if (!went) { try { var f = kit.lessonForRes(res); if (f) kit.markDone(f.l.id); } catch (x) {} location.hash = '#Vagal'; } }, 500); } })]);
  }
  function pauseData() { var d = rd(K.pause) || {}; d.days = d.days || {}; return d; }
  function guideCard(title, kids, cls) { return h('section', { class: 'vg-gcard ' + (cls || '') }, [title ? h('h2', { class: 'vg-h', text: title }) : null].concat(kids)); }
  function backToCard() { return h('a', { class: 'bt-btn lime vg-tocard', href: '#Vagal', text: 'Tick it on today’s workout card →' }); }
  function Pause(root) {
    boot();
    var wrap = shell(root, 'Vagal Tone Workout · Pause', 'Pause', 'Little pockets of slow, so you can catch up to yourself.');
    wrap.insertBefore(hero('pause'), wrap.firstChild);
    wrap.appendChild(seriesTabs('pause'));
    var page = h('div', { class: 'vg-page' }); wrap.appendChild(page);
    page.appendChild(guideCard('Why pause?', [h('p', { text: 'If you’re someone who moves fast, your body is often still running while you’re trying to rest. Pausing gives your nervous system a moment to catch up, so stress doesn’t keep stacking all day.' }), h('p', { text: 'Little and often beats one big rest. A few 2-minute pauses through the day do more than collapsing at night.' })]));
    page.appendChild(guideCard('What counts', [h('div', { class: 'vg-isnt' }, [h('div', null, [h('b', { text: 'Pause IS' }), h('span', { text: 'a cup of tea looking out the window. Lying down with your eyes closed, letting the world exist and your thoughts exist.' })]), h('div', null, [h('b', { text: 'Pause ISN’T' }), h('span', { text: 'scrolling. Your brain is still taking in a firehose of information. That’s stimulation, not rest.' })])])]));
    page.appendChild(guideCard('The conveyor belt', [h('div', { class: 'vg-belt run', 'aria-hidden': 'true' }, ['emails', 'what’s for dinner', 'that thing I said', 'to-do list', 'what if…', 'laundry', 'tomorrow', 'deadlines'].map(function (t, i) { return h('span', { class: 'vg-thought', style: 'animation-delay:-' + (i * 4.4) + 's;top:' + (12 + (i % 4) * 20) + '%', text: t }); })),
      h('p', { text: 'Get comfy and close your eyes if you like. Your thoughts are allowed to be here. Picture them on a conveyor belt drifting past. You don’t have to pick any of them up. When you notice you’ve grabbed one, just pop it back on the belt.' })]));
    var pm = h('div'); page.appendChild(guideCard('Build my pause menu', [h('p', { text: 'Tap the ones you’d actually do. They go on your pause menu and show up on your workout card, ready to tick.' }), pm]));
    (function drawPM() { var menu = pauseData().menu || []; pm.innerHTML = ''; pm.appendChild(h('ul', { class: 'vg-ideas pick' }, PAUSES.map(function (p) { var on = menu.indexOf(p[0]) >= 0; return h('li', null, [h('button', { class: 'vg-idea' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { var d = pauseData(); d.menu = d.menu || []; if (on) d.menu = d.menu.filter(function (x) { return x !== p[0]; }); else { d.menu.push(p[0]); kit.sparkleBurst(e.currentTarget); } wr(K.pause, d); drawPM(); } }, [h('span', { class: 'vg-idea-ic', 'aria-hidden': 'true', text: on ? '♥' : p[1] }), h('span', { text: p[0] })])]); }))); pm.appendChild(h('p', { class: 'vg-sub', text: menu.length ? menu.length + ' on your pause menu.' : 'Nothing on your menu yet.' })); })();
    page.appendChild(guideCard('How much?', [h('div', { class: 'vg-whens' }, [['◔', 'Start with 1 pause a day'], ['⏱', '2 minutes is plenty'], ['☰', 'Build to 3 to 5 a day'], ['♡', 'Any pause counts']].map(function (w) { return h('span', { class: 'vg-when-b' }, [h('span', { class: 'vg-when-ic', 'aria-hidden': 'true', text: w[0] }), w[1]]); }))]));
    page.appendChild(completeBtn('pause', 'pause menu'));
  }

  /* ====================================================================== MOVE (guidance) */
  var LEVELS4 = [['gentle', 'Gentle', 1], ['mild', 'Mild', 2], ['medium', 'Medium', 3], ['intense', 'Intense', 4]];
  var MOVE_IDEAS = {
    gentle: ['Slow walk around the block', 'Stretching on the floor', 'Gentle yoga', 'Shaking out your hands and arms', 'Swaying to a song', 'Pottering in the garden'],
    mild: ['Brisk walk', 'Dancing in the kitchen', 'Playing with the kids or the dog', 'Cleaning the house', 'Taking the stairs', 'Pilates'],
    medium: ['Jog or run', 'Bike ride', 'Swimming laps', 'A gym session', 'A hike with hills', 'A dance class'],
    intense: ['HIIT', 'Sprints', 'Boxing', 'A heavy lifting session', 'A team sport', 'A long hard hike']
  };
  // movement that suits ADHD and autistic nervous systems: sensory input, stimming, focus boosts
  MOVE_IDEAS.gentle = MOVE_IDEAS.gentle.concat(['Rocking or swaying (stimming counts)', 'Wall push-ups for some heavy work', 'Stretch under a weighted blanket']);
  MOVE_IDEAS.mild = MOVE_IDEAS.mild.concat(['Bounce on a trampoline or exercise ball', 'Pace while you think or take a call', 'Swing on a swing']);
  MOVE_IDEAS.medium = MOVE_IDEAS.medium.concat(['Skipping rope to music', 'Heavy work: carry, push or lift things', 'Dance it out to a focus playlist']);
  MOVE_IDEAS.intense = MOVE_IDEAS.intense.concat(['Sprint intervals before a focus task', 'Boxing or a punching bag', 'Bouldering or climbing']);
  var MOVE_TYPES = ['Walk', 'Stretch', 'Dance', 'Yoga', 'Run', 'Gym', 'Swim', 'Bike', 'Played', 'Cleaned', 'Shook it out', 'Sport'];
  function moveData() { var d = rd(K.move) || {}; d.days = d.days || {}; return d; }
  function Move(root) {
    boot();
    var wrap = shell(root, 'Vagal Tone Workout · Move', 'Move', 'Get your body moving. It’s how stress leaves the building.');
    wrap.insertBefore(hero('move'), wrap.firstChild);
    wrap.appendChild(seriesTabs('move'));
    var page = h('div', { class: 'vg-page' }); wrap.appendChild(page);
    page.appendChild(guideCard('Why move?', [h('p', { text: 'Stress is energy your body made to fight or run. If it never gets used, it hangs around in your body. Moving completes the stress cycle and tells your brain the danger has passed.' }), h('p', { text: 'It also gives you endorphins and serotonin, helps you sleep and steadies your mood. You don’t need a gym. You need to move.' })]));
    var WHY = [
      ['🚶', 'You were built to move', 'For most of human history, people walked, carried, climbed, dug and danced for hours every day just to live. Our bodies haven’t changed much. Our days have. Most of us now sit for most of them, and our bodies feel it.'],
      ['⚡', 'Stress lives in your body', 'Fight or flight floods you with fuel to run or fight: adrenaline, cortisol, sugar in the blood, a faster heart. Moving uses that fuel up and tells your brain the danger has passed. If you never move, the stress chemistry hangs around.'],
      ['💧', 'Your lymph has no pump', 'Your heart pumps your blood, but your lymphatic system (part of your immune system that clears waste) mostly relies on your muscles moving and your breath to keep fluid flowing. Movement is the pump.'],
      ['💪', 'Muscles are medicine', 'Working muscles release messengers called myokines that help calm inflammation. Muscles also soak up sugar from your blood, which helps keep your energy steadier.'],
      ['🧠', 'Fertiliser for your brain', 'Moving boosts BDNF, a protein that supports learning, memory and new connections. Remember neuroplasticity? Movement helps your brain rewire.'],
      ['☀️', 'A natural DOSE', 'Movement gives you endorphins, plus a lift in dopamine and serotonin. It’s one of the quickest ways to shift your mood and change your state.'],
      ['🦴', 'Joints love motion', 'Your joints are nourished by movement. Gentle, regular motion keeps them moving well, which is why you often feel stiffer after sitting still for ages.'],
      ['☾', 'Better sleep', 'Moving during the day helps you feel properly tired at night and supports deeper sleep. Just finish the intense stuff a few hours before bed.'],
      ['🎯', 'Focus on tap (hello, ADHD brains)', 'Moving lifts dopamine and noradrenaline, the same chemicals ADHD medication works on. Many ADHDers find their focus is sharper for a while after even 10 minutes of movement. Try a quick burst before a task you’ve been avoiding.'],
      ['🔁', 'Unstick task paralysis', 'Stuck and can’t start? A movement burst changes your state, and a new state makes it easier to switch gears. Shake it out, do 20 star jumps, then start the smallest step.'],
      ['🧩', 'Sensory regulation', 'Heavy work (pushing, carrying, wall push-ups), swinging, bouncing and jumping give your body deep pressure and balance input. For many autistic and ADHD brains, that calms a busy, overloaded sensory system.'],
      ['〰', 'Stimming is movement too', 'Rocking, bouncing, pacing, flapping and fidgeting are your nervous system regulating itself. They count, they help, and you don’t need to hide them here.'],
      ['🌋', 'Release before overwhelm', 'Feelings and sensory build-up stack through the day. Moving burns some of that charge off before it tips into a shutdown or meltdown.'],
      ['😊', 'Plain old happiness', 'Movement is one of the quickest ways to feel good. A song you love and a little dance is happiness you can make on demand.']
    ];
    // a picture of the difference: a still day vs a moving day
    var vis = h('div', { class: 'mv-vis', role: 'img', 'aria-label': 'On a still day, stress builds up in your body like a filling jar and the mood clouds over. On a moving day, the stress drains away and the sun comes out.' });
    vis.innerHTML = '<div class="mv-side still"><svg viewBox="0 0 160 170" aria-hidden="true"><g class="mv-cloud"><ellipse cx="62" cy="34" rx="22" ry="13" fill="#B9AAA6"/><ellipse cx="82" cy="30" rx="18" ry="14" fill="#C9BCB8"/><ellipse cx="98" cy="38" rx="16" ry="11" fill="#B9AAA6"/><path class="mv-rain" d="M66 52v8M80 54v8M94 52v8" stroke="#8FA6C9" stroke-width="2.5" stroke-linecap="round"/></g><rect x="30" y="112" width="90" height="26" rx="10" fill="#D9CBC6" stroke="#1F1412" stroke-width="2"/><rect x="26" y="100" width="18" height="38" rx="8" fill="#D9CBC6" stroke="#1F1412" stroke-width="2"/><g class="mv-slump"><circle cx="76" cy="86" r="9" fill="#FFF4EE" stroke="#1F1412" stroke-width="2.5"/><path d="M71 89q5-3 10 0" fill="none" stroke="#1F1412" stroke-width="2" stroke-linecap="round"/><path d="M76 95v16M76 101l-12 9M76 101l12 9" stroke="#1F1412" stroke-width="3" stroke-linecap="round"/></g><g transform="translate(132 60)"><rect x="0" y="0" width="16" height="78" rx="8" fill="#fff" stroke="#1F1412" stroke-width="2"/><rect class="mv-fill up" x="2" y="2" width="12" height="74" rx="6" fill="#D3302B"/><text x="8" y="94" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" fill="#6A5A57">stress</text></g></svg><b>A still day</b><span>Stress fuel builds up with nowhere to go. Mood clouds over.</span></div>'
      + '<div class="mv-side moving"><svg viewBox="0 0 160 170" aria-hidden="true"><g class="mv-sun"><circle cx="40" cy="34" r="14" fill="#FFD9A8" stroke="#1F1412" stroke-width="2"/><path d="M40 12v-6M40 62v-6M18 34h-6M68 34h-6M24 18l-4-4M60 54l-4-4M24 50l-4 4M60 14l-4 4" stroke="#F28C3B" stroke-width="3" stroke-linecap="round"/></g><path class="mv-sp" d="M110 22c.6 5 3 7.4 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.5"/><path class="mv-sp two" d="M20 92c.5 4 2.4 6 6 6.5-3.6.5-5.5 2.4-6 6.5-.5-4-2.4-6-6-6.5 3.6-.5 5.5-2.4 6-6.5z" fill="#F4C2F7" stroke="#1F1412" stroke-width="1.5"/><g class="mv-dance"><circle cx="76" cy="72" r="9" fill="#FFF4EE" stroke="#1F1412" stroke-width="2.5"/><path d="M71 73q5 5 10 0" fill="none" stroke="#1F1412" stroke-width="2" stroke-linecap="round"/><path d="M76 81v24M76 87l-14-12M76 87l14-12M76 105l-10 22M76 105l12 20" stroke="#1F1412" stroke-width="3" stroke-linecap="round"/></g><path d="M40 140h76" stroke="#1F1412" stroke-width="2" stroke-linecap="round" opacity=".35"/><g transform="translate(132 60)"><rect x="0" y="0" width="16" height="78" rx="8" fill="#fff" stroke="#1F1412" stroke-width="2"/><rect class="mv-fill down" x="2" y="2" width="12" height="74" rx="6" fill="#3E9B4F"/><text x="8" y="94" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" fill="#6A5A57">stress</text></g></svg><b>A moving day</b><span>The fuel gets used, stress drains away and the sun comes out.</span></div>';
    page.appendChild(guideCard('Still vs moving', [vis]));
    page.appendChild(guideCard('Your body, on movement', [h('p', { text: 'Not about weight or looks. This is about how your body and brain actually work.' }), h('div', { class: 'vg-why' }, WHY.map(function (w, i) { return h('details', { class: 'vg-why-i' }, [h('summary', null, [h('span', { class: 'vg-why-ic', 'aria-hidden': 'true', text: w[0] }), w[1]]), h('p', { text: w[2] })]); })), h('p', { class: 'vg-perf', text: 'Sitting for a long stretch? Get up every 30 to 60 minutes, even just to stretch or refill your water.' })]));
    page.appendChild(guideCard('Pick your level', [h('p', { text: 'All of these count. Match it to your energy today, not the energy you think you should have.' }),
      h('div', { class: 'mv-two' }, [h('span', { class: 'ds-lt1', style: '--c:#BFE3D0', text: 'E' }), h('span', null, [h('b', { text: 'Two birds, one stone. ' }), 'Moving is the E (endorphins) in your DOSE, so every move counts twice.'])]),
      h('p', { class: 'vg-sub', text: 'Pick at least 3 from each level that you’d actually do. They build your move menu and show up on your daily list.' }), (function () { var box = h('div'); (function drawMM() { var menu = moveData().menu || []; box.innerHTML = ''; box.appendChild(h('div', { class: 'vg-lvls' }, LEVELS4.map(function (L) { return h('div', { class: 'vg-lvl', style: '--n:' + L[2] }, [h('span', { class: 'vg-lvl-bars', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(function (i) { return h('i', { class: i <= L[2] ? 'on' : '' }); })), h('b', { text: L[1] }), (function () { var c = MOVE_IDEAS[L[0]].filter(function (t) { return menu.indexOf(t) >= 0; }).length; return h('span', { class: 'mv-cnt' + (c >= 3 ? ' ok' : ''), text: c >= 3 ? '✓ ' + c + ' picked' : c + ' of 3 picked' }); })(), h('div', { class: 'vg-lvl-l' }, MOVE_IDEAS[L[0]].map(function (t) { var on = menu.indexOf(t) >= 0; return h('button', { class: 'vg-idea sm' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { var d = moveData(); d.menu = d.menu || []; if (on) d.menu = d.menu.filter(function (x) { return x !== t; }); else { d.menu.push(t); kit.sparkleBurst(e.currentTarget); } wr(K.move, d); drawMM(); } }, [h('span', { class: 'vg-idea-ic', 'aria-hidden': 'true', text: on ? '♥' : '+' }), h('span', { text: t })]); }))]); }))); })(); return box; })()]));
    page.appendChild(guideCard('On a low day', [h('p', { text: 'If you’re flat, tired or in shutdown, gentle counts. Shake it out for a minute, sway to one song, stretch in bed. The goal is to move energy, not to punish your body.' })]));
    page.appendChild(guideCard('How much?', [h('div', { class: 'vg-whens' }, [['◔', 'Start with 5 minutes'], ['☀', 'Every day if you can'], ['↗', 'Add a little each week'], ['♡', 'Any movement counts']].map(function (w) { return h('span', { class: 'vg-when-b' }, [h('span', { class: 'vg-when-ic', 'aria-hidden': 'true', text: w[0] }), w[1]]); }))]));
    var mvDone = completeBtn('move', 'move menu'), mvBtn = mvDone.querySelector('button'), mvGo = mvBtn.onclick;
    mvBtn.addEventListener('click', function (e) { var menu = moveData().menu || [], short = LEVELS4.filter(function (L) { return MOVE_IDEAS[L[0]].filter(function (t) { return menu.indexOf(t) >= 0; }).length < 3; }); if (short.length) { e.stopImmediatePropagation(); toast('Pick 3 from each level first: ' + short.map(function (L) { return L[1]; }).join(', ') + '.'); } }, true);
    page.appendChild(mvDone);
  }

  /* ====================================================================== the daily workout */
  var VK = 'bt-vwork';
  function vw() { var d = rd(VK) || {}; d.days = d.days || {}; d.min = d.min || null; return d; }
  function vday(k) { var d = vw(); return d.days[k] || {}; }
  function setV(k, part, patch) { var d = vw(), day = d.days[k] = d.days[k] || {}; day[part] = Object.assign({}, day[part] || {}, patch); day.at = Date.now(); wr(VK, d); }
  var MIN_OPTS = {
    dose: ['One feel-good thing', 'Sunlight on my face', 'A hug or a kind message', 'One song I love, loud'],
    breathe: ['One physiological sigh', '1 minute of slow breathing', 'My daily 5'],
    pause: ['One cup of tea, no phone', 'One 2-minute pause', '3 little pauses'],
    move: ['A 5-minute walk', '2 minutes of stretching', 'Dance to one song', '10 minutes of anything']
  };
  var PNAMES = { dose: 'DOSE', breathe: 'Breathe', pause: 'Pause', move: 'Move' };
  var PR_RES = { dose: '#Dose', breathe: '#Breathe', pause: '#Pause', move: '#Move' };
  var PR_BTN = { dose: 'Explore DOSE →', breathe: 'Open Breathe →', pause: 'Open my pause menu →', move: 'Open my move menu →' };
  var PR_SUB = { dose: 'A hit of the feel-good chemicals', breathe: 'Any breathwork counts', pause: 'Little pockets of slow', move: 'Get your body moving' };
  var noonOf = function (k) { return fromKey(k) + 12 * 3600000; };
  function status(k) {
    k = k || dk();
    var v = vday(k), dd = doseData(), dts = dd.days[k] || {}, planDone = dd.plan.filter(function (x) { return dts[x]; }).length;
    var br = ((rd(K.breath) || {}).log || []).filter(function (x) { return dk(x.at) === k; });
    var pz = (pauseData().days[k] || []).length, mv = moveData().days[k], mvOld = !!(mv && (mv.mins || (mv.types || []).length));
    var vd = v.dose || {}, letters = ['D', 'O', 'S', 'E'].filter(function (L) { return vd[L]; });
    return {
      dose: !!(vd.done || letters.length || Object.keys(dts).length), letters: letters, planN: dd.plan.length, planDone: planDone, doseN: Object.keys(dts).length + letters.length,
      breathe: !!((v.breathe || {}).done || br.length), breathN: br.length, breaths: br,
      pause: !!((v.pause || {}).done || pz), pauseN: (v.pause || {}).n || pz,
      move: !!((v.move || {}).done || mvOld)
    };
  }
  function anyDone(k) { var s = status(k); return s.dose || s.breathe || s.pause || s.move; }
  function workoutDays() {
    var out = {}, keys = {};
    Object.keys(vw().days).forEach(function (k) { keys[k] = 1; });
    ((rd(K.breath) || {}).log || []).forEach(function (x) { keys[dk(x.at)] = 1; });
    Object.keys(doseData().days).forEach(function (k) { keys[k] = 1; });
    Object.keys(pauseData().days).forEach(function (k) { keys[k] = 1; });
    Object.keys(moveData().days).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) { if (anyDone(k)) out[k] = 1; });
    return out;
  }
  // the workout card: one row per practice, a big "I did it" box on the right, details optional
  function workoutCard(k, onChange) {
    boot();
    k = k || dk();
    var box = h('section', { class: 'vg-wcard', 'aria-label': 'Workout card for ' + niceDay(fromKey(k)) });
    function redraw() { var nb = workoutCard(k, onChange); box.replaceWith(nb); if (onChange) onChange(); }
    var st = status(k), v = vday(k), isToday = k === dk(), d0 = vw(), min = d0.min || {};
    var n = ['dose', 'breathe', 'pause', 'move'].filter(function (x) { return st[x]; }).length;
    box.appendChild(h('div', { class: 'vg-wc-top' }, [h('div', null, [h('span', { class: 'vg-k', text: isToday ? 'Today’s workout card' : 'Workout card' }), h('h2', { class: 'vg-h', text: niceDay(fromKey(k)) })]), n ? h('span', { class: 'vg-wc-n on', text: '✦ ' + (n === 1 ? 'One thing done' : n + ' things done') }) : null]));
    box.appendChild(h('p', { class: 'vg-wc-msg', text: n === 0 ? 'Tick just one. That’s the whole job today.' : n === 1 ? 'That’s enough to create change. Anything else is a bonus.' : 'Look at you stacking. Every one is a step closer.' }));
    function section(part, kids, opt) {
      opt = opt || {};
      var on = st[part];
      var big = h('button', { class: 'vg-did' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', 'aria-label': PNAMES[part] + (on ? ': done' : ': tick when you’ve done it'), onclick: function (e) {
        if (on) { setV(k, part, { done: false }); if (part === 'dose') ['D', 'O', 'S', 'E'].forEach(function (L) { var p = {}; p[L] = false; setV(k, 'dose', p); }); }
        else { setV(k, part, { done: true }); kit.sparkleBurst(e.currentTarget.parentNode); tickLesson(part); }
        cheer(); redraw();
      } }, [h('span', { class: 'vg-did-b', 'aria-hidden': 'true', text: on ? '✓' : '' }), h('span', { text: on ? 'Did it' : 'I did it' }), on ? null : h('span', { class: 'vg-did-n', text: 'Quick fill: just tap' })]);
      var head = h('div', { class: 'vg-pr-head' }, [h('span', { class: 'vg-pr-art' }, [kit.emblem(part)]), h('div', { class: 'vg-pr-t' }, [h('b', { text: opt.title || PNAMES[part] }), h('span', { text: opt.sub || PR_SUB[part] })]), big]);
      var more = kids.length ? h('details', { class: 'vg-pr-more' }, [h('summary', { text: opt.more || 'Add a little detail (optional)' })].concat(kids)) : null;
      if (more) more.open = true;
      return h('div', { class: 'vg-pr' + (on ? ' on' : '') }, [head, opt.lead || null, more, h('a', { class: 'vg-pr-go', href: PR_RES[part], text: PR_BTN[part] })]);
    }
    function cheer() { if (n === 0 && isToday) { var ws = streakOf(workoutDays()); if ([3, 7, 14, 21, 30, 60, 100].indexOf(ws.current) >= 0) { var c = vw(); c.cel = c.cel || {}; if (!c.cel[ws.current + '_' + k]) { c.cel[ws.current + '_' + k] = 1; wr(VK, c); setTimeout(function () { kit.party(ws.current + '-day workout streak!', 'You’ve shown up for your nervous system ' + ws.current + ' days in a row. One thing a day. That’s how it changes.', 'Hell yes'); }, 500); } } } }
    // DOSE: one box per chemical, plus her plan if she made one
    var vd = v.dose || {}, dd = doseData(), dts = dd.days[k] || {};
    var doseKids = [h('div', { class: 'vg-dose4' }, ['D', 'O', 'S', 'E'].map(function (L) { var on = !!vd[L]; return h('button', { class: 'vg-d4' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', style: '--c:' + DOSE[L].col, onclick: function () { var p = {}; p[L] = !on; if (!on) p.done = true; setV(k, 'dose', p); if (!on) tickLesson('dose'); cheer(); redraw(); } }, [h('b', { text: L }), h('span', { text: DOSE[L].name })]); }))];
    if (dd.plan.length) { var pl = h('div', { class: 'vg-plan-mini' }, [h('span', { class: 'vg-ml', text: 'My daily DOSE routine' })].concat(dd.plan.map(function (id) { var it = doseItem(id); if (!it) return null; var on = !!dts[id]; return h('button', { class: 'vg-wc-i' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function () { var d2 = doseData(), x = d2.days[k] = d2.days[k] || {}; if (x[id]) delete x[id]; else { x[id] = isToday ? Date.now() : noonOf(k); var p = {}; p[it.L] = true; p.done = true; setV(k, 'dose', p); } wr(K.dose, d2); tickLesson('dose'); cheer(); redraw(); } }, [h('span', { 'aria-hidden': 'true', text: on ? '✓' : '+' }), it.text]); }))); pl.__open = true; doseKids.push(pl); }
    doseKids[0].__open = !!st.letters.length;
    box.appendChild(section('dose', doseKids, { sub: dd.plan.length ? 'Your minimum: ' + dd.plan.map(function (id) { var it = doseItem(id); return it ? it.text : ''; }).filter(Boolean).join(' · ') : PR_SUB.dose }));
    // Breathe: which one? Sessions from the Breathe guide are already picked for her
    var bplan = breathPlan(), brLead = h('div', { class: 'vg-pr-lead' }, [h('ul', { class: 'vg-plan-l' }, bplan.map(function (x) { return h('li', { text: x }); }))]);
    if (st.breaths.length) brLead.appendChild(h('div', { class: 'vg-auto' }, [h('span', { class: 'vg-auto-k', text: '✓ From your book today' })].concat(st.breaths.map(function (x) { return h('span', { class: 'vg-auto-i', text: (PATTERNS[x.p] || {}).name + ' · ' + x.mins + ' min' }); }))));
    box.appendChild(section('breathe', [], { sub: 'At least one of these today counts', lead: brLead }));
    // Pause: how many, how long
    var pmenu = pauseData().menu || [];
    var pzLead = pmenu.length ? h('details', { class: 'vg-pr-more' }, [h('summary', { text: 'Can’t remember what they look like? Here was your plan' }), h('ul', { class: 'vg-plan-l' }, pmenu.map(function (t) { return h('li', { text: t }); }))]) : h('a', { class: 'vg-pr-go', href: '#Pause', text: 'Make a pause plan →' });
    box.appendChild(section('pause', [], { title: 'Pause', sub: 'Did you take a few pauses today? Quiet moments to reconnect with yourself.', lead: pzLead }));
    // Move: how hard, and what (both optional)
    var vm = v.move || {};
    var scale = h('div', { class: 'vg-lvsel', role: 'radiogroup', 'aria-label': 'How intense' }, LEVELS4.map(function (L) { var on = vm.level === L[0]; return h('button', { class: 'vg-lv4' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { setV(k, 'move', { done: true, level: on ? '' : L[0] }); tickLesson('move'); cheer(); redraw(); } }, [h('span', { class: 'vg-lvl-bars', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(function (i) { return h('i', { class: i <= L[2] ? 'on' : '' }); })), L[1]]); }));
    scale.__open = !!(vm.level || (vm.types || []).length);
    var mmenu = moveData().menu || [], TYPES = mmenu.length ? mmenu.concat(MOVE_TYPES.filter(function (x) { return (vm.types || []).indexOf(x) >= 0; })) : MOVE_TYPES;
    var types = h('div', { class: 'vg-chips' }, TYPES.map(function (t) { var on = (vm.types || []).indexOf(t) >= 0; return h('button', { class: 'vg-chip' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', text: t, onclick: function () { var ts = (vm.types || []).filter(function (x) { return x !== t; }); if (!on) ts.push(t); setV(k, 'move', { done: true, types: ts }); tickLesson('move'); cheer(); redraw(); } }); }));
    box.appendChild(section('move', [h('span', { class: 'vg-ml', text: 'How intense?' }), scale, h('span', { class: 'vg-ml', text: mmenu.length ? 'From my move menu' : 'What did you do?' }), types]));
    return box;
  }

  /* ====================================================================== the hub: Vagal Tone Workout (a lined page) */
  var PARTS = [
    ['breathe', 'Breathe', 'Activity · your 5-minute breath, the sigh and a guided breathing tool'], ['dose', 'DOSE', 'Activity · pick your feel-good things and build a plan'],
    ['pause', 'Pause', 'Guidance · little pockets of slow'], ['move', 'Move', 'Guidance · get your body moving, at your level'],
    ['comehome', 'Coming Home', 'Back into your body when you’re stuck in your head'], ['blueprint', 'Emotional Blueprint', 'Map your emotional patterns and rewrite them']
  ];
  var vs = { day: null, editMin: false, block: null, showOne: false };
  function onePercent(onAck) {
    // stacking blocks: one small thing, then another on top, over weeks
    var steps = [['Week 1', 'A sigh when I wake up'], ['Week 3', '+ a 5-minute walk'], ['Week 6', '+ my daily 5 breath'], ['Week 10', '+ a pause with my tea']];
    var svg = '<svg viewBox="0 0 320 170" role="img" aria-label="Blocks stacking up over the weeks, and a line curving upward: 1 percent better each day is about 37 times better in a year"><rect width="320" height="170" rx="18" fill="#FFF4EE"/>'
      + steps.map(function (s, i) { var x = 16 + i * 46, hgt = 26 * (i + 1), y = 150 - hgt; return '<g>' + [0, 1, 2, 3].slice(0, i + 1).map(function (j) { return '<rect x="' + x + '" y="' + (150 - 26 * (j + 1)) + '" width="38" height="22" rx="5" fill="' + ['#F1F9A6', '#F4C2F7', '#BFE3D0', '#FFD9A8'][j] + '" stroke="#1F1412" stroke-width="1.6"/>'; }).join('') + '<text x="' + (x + 19) + '" y="164" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" fill="#6A5A57">' + s[0] + '</text></g>'; }).join('')
      + '<path d="M206 146 C 236 144, 262 132, 280 96 S 300 30, 306 18" fill="none" stroke="#4E0C08" stroke-width="3" stroke-linecap="round"/><path d="M206 146 L306 146" stroke="#EDE3DF" stroke-width="2"/>'
      + '<text x="256" y="40" text-anchor="middle" font-family="Playfair Display,Georgia,serif" font-weight="700" font-size="20" fill="#4E0C08">37x</text><text x="256" y="56" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" fill="#6A5A57">1% a day, for a year</text></svg>';
    var art = h('div', { class: 'vg-1pct' }); art.innerHTML = svg;
    var ack = !!vw().ack;
    var chk = h('label', { class: 'vg-ack' + (ack ? ' on' : '') }, [h('input', { type: 'checkbox', checked: ack ? 'checked' : null, onchange: function (e) { var d = vw(); d.ack = e.target.checked ? Date.now() : 0; wr(VK, d); if (e.target.checked) { kit.sparkleBurst(chk); toast('That’s the spirit. Something counts.'); vs.showOne = false; if (onAck) setTimeout(onAck, 700); } chk.classList.toggle('on', e.target.checked); } }), h('span', { text: 'I understand. I’ll go slow and be kind to myself. Something counts, and everything is a step closer.' })]);
    return h('section', { class: 'vg-gcard vg-onebox' }, [
      h('div', { class: 'vg-one' }, [h('span', { class: 'vg-one-ic', 'aria-hidden': 'true', text: '1' }), h('div', null, [h('b', { text: 'One thing is enough.' }), h('p', { text: 'This isn’t about filling the whole card. Pick one thing, right now, and keep showing up for just that one thing. When it feels easy, stack another on top.' })])]),
      art,
      h('p', { text: 'Tiny gets big. 1% better each day adds up to about 37 times better in a year. That’s not doing it all. That’s doing a little, a lot.' }),
      h('ul', { class: 'vg-eg' }, steps.map(function (s) { return h('li', null, [h('b', { text: s[0] + ': ' }), s[1]]); })),
      h('p', { class: 'vg-perf', text: 'Let go of perfect. Missing a day isn’t failing, it’s life. Just pick the one thing back up.' }),
      chk
    ]);
  }
  function minimumBox(onSave) {
    var dd = doseData(), pm = pauseData().menu || [], mm = moveData().menu || [];
    var rows = [
      ['dose', dd.plan.map(function (id) { var it = doseItem(id); return it ? it.text : ''; }).filter(Boolean), '#Dose', 'Build my DOSE minimum'],
      ['breathe', breathPlan(), '#Breathe', 'Choose my breathing plan'],
      ['pause', pm, '#Pause', 'Make my pause menu'],
      ['move', mm, '#Move', 'Make my move menu']
    ];
    var wrap = h('section', { class: 'vg-gcard vg-min' });
    wrap.appendChild(h('div', { class: 'vg-min-top' }, [h('div', null, [h('span', { class: 'vg-k', text: 'Step 2' }), h('h2', { class: 'vg-h', text: 'My vagal tone daily plan' })])]));
    wrap.appendChild(h('p', { class: 'vg-sub', text: 'Built from the plans you made in each part. Change any of them whenever you like. Too much? Make it smaller.' }));
    wrap.appendChild(h('ul', { class: 'vg-minl' }, rows.map(function (r) {
      var shown = r[1].slice(0, 3);
      return h('li', { class: 'vg-minr' }, [h('span', { class: 'vg-pr-art sm' }, [kit.emblem(r[0])]), h('div', { class: 'vg-minr-b' }, [h('b', { text: PNAMES[r[0]] }), r[1].length ? h('span', { text: shown.join(' · ') + (r[1].length > 3 ? ' · +' + (r[1].length - 3) + ' more' : '') }) : h('span', { class: 'vg-minr-none', text: 'Not set yet' })]), h('a', { class: 'vg-pr-go', href: r[2], text: r[1].length ? 'Change' : r[3] + ' →' })]);
    })));
    return wrap;
  }

  // she's showing up, but one practice keeps getting skipped: gently ask what's in the way
  function blockPrompt(onDone) {
    var d = vw(), snooze = d.snooze || {}, days = [], t0 = T.today();
    for (var i = 0; i < 7; i++) days.push(wk(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - i)));
    var shown = days.filter(anyDone).length; if (shown < 4) return null;
    var counts = { dose: 0, breathe: 0, pause: 0, move: 0 };
    days.forEach(function (k) { var s = status(k); Object.keys(counts).forEach(function (p) { if (s[p]) counts[p]++; }); });
    var weak = Object.keys(counts).filter(function (p) { return counts[p] <= 1 && (!snooze[p] || Date.now() - snooze[p] > 7 * DAY); })[0];
    if (!weak) return null;
    var box = h('section', { class: 'vg-gcard vg-block' });
    var later = function () { var d2 = vw(); d2.snooze = d2.snooze || {}; d2.snooze[weak] = Date.now(); wr(VK, d2); onDone(); };
    box.appendChild(h('span', { class: 'vg-k', text: 'A gentle check-in' }));
    box.appendChild(h('h2', { class: 'vg-h', text: 'You’ve shown up ' + shown + ' days this week. ' + PNAMES[weak] + ' hasn’t made it in much.' }));
    box.appendChild(h('p', { text: 'That’s useful information, not a failure. Would it help to lower the bar, or to look at what’s getting in the way?' }));
    var form = h('div', { class: 'vg-block-f', hidden: true });
    var q1 = h('textarea', { class: 'bt-in', rows: '2', 'aria-label': 'What’s getting in the way?', placeholder: 'What’s getting in the way? What’s the block?' });
    var q2 = h('textarea', { class: 'bt-in', rows: '2', 'aria-label': 'How could I remove that block?', placeholder: 'How could I remove that block, or make it easier or more fun?' });
    form.appendChild(q1); form.appendChild(q2);
    form.appendChild(h('button', { class: 'bt-btn lime', type: 'button', text: 'Save to my book', onclick: function () { if (!kit.tx(q1.value) && !kit.tx(q2.value)) return; var d2 = vw(); d2.blocks = (d2.blocks || []).concat([{ at: Date.now(), part: weak, block: q1.value.trim(), fix: q2.value.trim() }]); d2.snooze = d2.snooze || {}; d2.snooze[weak] = Date.now(); wr(VK, d2); toast('Saved. Noticing is half the work.'); onDone(); } }));
    box.appendChild(h('div', { class: 'bt-row' }, [
      h('button', { class: 'bt-btn ghost', type: 'button', text: 'Lower the bar', onclick: function () { later(); location.hash = PR_RES[weak]; } }),
      h('button', { class: 'bt-btn ghost', type: 'button', text: 'What’s getting in the way?', onclick: function () { form.hidden = false; q1.focus(); } }),
      h('button', { class: 'vg-lower', type: 'button', text: 'Not now', onclick: later })
    ]));
    box.appendChild(form);
    return box;
  }
  function Vagal(root) {
    boot();
    var wrap = shell(root, 'Embodiment series', 'Vagal Tone Workout', 'Small daily practices that build a resilient nervous system. Like building a muscle, the reps add up.');
    var ns = kit.findLesson('w1l3');
    if (ns && (kit.tx(ns.l.video) || kit.tx(ns.l.vimeo))) wrap.appendChild(h('section', { class: 'vg-refresh' }, [h('span', { class: 'vg-k', text: 'Refresh your memory' }), h('h2', { class: 'vg-h', text: 'Why the vagal tone workout matters' }), kit.videoBlock(ns.l, ns.l.id), h('p', { class: 'vg-sub', text: 'From Lesson 3: Nervous System. A strong vagal tone is what helps you bounce back after stress, instead of staying stuck in it.' })]));
    wrap.insertBefore(hero('vagal'), wrap.firstChild);
    wrap.appendChild(seriesTabs('plan'));
    var page = h('div', { class: 'vg-page' }); wrap.appendChild(page);
    function draw() {
      page.innerHTML = '';
      if (vw().ack && !vs.showOne) page.appendChild(h('button', { class: 'vg-onepill', type: 'button', onclick: function () { vs.showOne = true; draw(); } }, [h('span', { class: 'vg-one-ic sm', 'aria-hidden': 'true', text: '1' }), h('b', { text: 'One thing is enough' }), h('span', { text: 'Tap to reread' })]));
      else page.appendChild(onePercent(draw));
      page.appendChild(minimumBox(draw));
      var ws = streakOf(workoutDays());
      if (ws.current) page.appendChild(h('p', { class: 'vg-streak', text: '✦ ' + ws.current + '-day workout streak' + (ws.best > ws.current ? ' · best ' + ws.best : '') + '. Any one thing keeps it going.' }));
      var day = vs.day || dk(); vs.day = null;
      page.appendChild(h('span', { class: 'vg-k vg-step', text: 'Step 3 · tick what you did' }));
      page.appendChild(workoutCard(day));
      var bp = blockPrompt(draw); if (bp) page.appendChild(bp);
      page.appendChild(h('h2', { class: 'vg-h vg-series-h', text: 'Everything in the series' }));
      page.appendChild(h('div', { class: 'vg-parts' }, PARTS.map(function (p) {
        var r = kit.resource(p[0]) || { week: 1 }, op = r.week <= 1 || kit.isOpen(r.week) || !!(window.BT_DEMO && window.BT_DEMO.peek), href = r.href || '#' + p[1];
        var inner = [h('span', { class: 'vg-part-art' }, [kit.emblem(p[0])]), h('span', { class: 'vg-part-b' }, [h('b', { text: p[1] }), h('span', { text: op ? p[2] : 'Opens in Week ' + r.week })]), op ? h('span', { class: 'vg-part-go', 'aria-hidden': 'true', text: '→' }) : null];
        return op ? h('a', { class: 'vg-part', href: href, style: '--cv:' + (r.cover || '#FFF4EE') }, inner) : h('div', { class: 'vg-part lock', style: '--cv:' + (r.cover || '#FFF4EE') }, inner.concat([kit.icon('lock', 'vg-lock')]));
      })));
    }
    draw();
  }

  /* ====================================================================== Today's reps: the daily check-in on Home */
  var REPS_NAME = 'Today’s reps';
  var MOVE3 = [['mild', 'Mild', 1, 'Moving your body even a little is still progress. That’s a step toward the goal.'], ['medium', 'Medium', 2, 'Lovely. That’s your body completing the stress cycle.'], ['hot', 'Hot', 3, 'You went for it! Endorphins incoming.']];
  function partStreak(part) {
    var days = {}, d = vw().days;
    Object.keys(d).forEach(function (k) { if (part === 'water' ? ((d[k].water || {}).n || (d[k].water || {}).level) : part === 'win' ? (d[k].win || {}).done : status(k)[part]) days[k] = 1; });
    if (part !== 'water') Object.keys(workoutDays()).forEach(function (k) { if (status(k)[part]) days[k] = 1; });
    return streakOf(days).current;
  }
  var STREAK_WORDS = { dose: 'got your DOSE', breathe: 'did some breathwork', pause: 'took a pause', move: 'moved your body', water: 'hit your water', win: 'logged a win' };
  function cheerLine(part) { var n = part === 'win' ? Math.max(kit.winStreak().current, partStreak('win')) : partStreak(part); return n >= 2 ? '✦ That’s ' + n + ' days in a row you ' + STREAK_WORDS[part] + '. Well done!' : ''; }
  var WATER3 = [['good', 'Good', 'I had some water today', 1], ['better', 'Better', 'I drank more than usual', 2], ['best', 'Best', 'I hit my water goal', 3]];
  function waterML(w) { w = w || {}; return w.ml != null ? w.ml : (w.n || 0) * 250; }
  function waterGoalMl() { var d = vw(); return d.waterGoalMl || (d.waterGoal ? d.waterGoal * 250 : 0); }
  function waterLevel(k) { var w = (vday(k).water || {}); if (w.ml != null || w.n) { var ml = waterML(w), goal = waterGoalMl() || 2000; return ml >= goal ? 3 : ml >= goal / 2 ? 2 : ml > 0 ? 1 : 0; } if (w.level) return (WATER3.filter(function (x) { return x[0] === w.level; })[0] || [0, 0, 0, 0])[3]; var n = w.n || 0, goal = vw().waterGoal || 8; return n >= goal ? 3 : n >= Math.ceil(goal / 2) ? 2 : n > 0 ? 1 : 0; }
  function repsCard() {
    boot();
    var box = h('section', { class: 'rp', 'aria-labelledby': 'rp-h' });
    var k = dk(), mode = vw().repsMode || 'quick';
    function redraw(msg, part) { var nb = repsCard(); box.replaceWith(nb); if (msg) { var m = nb.querySelector('[data-rp="' + part + '"] .rp-msg') || nb.querySelector('.rp-msg-all'); if (m) { m.textContent = msg; m.hidden = false; } } }
    function set(part, patch, msg) { setV(k, part, patch); if (part !== 'water' && part !== 'win') tickLesson(part); redraw(msg, part); }
    // locked until Week 1 is finished: an empty card with a kind note on top
    if (window.BT_COURSE && window.BT_COURSE.weekComplete && !window.BT_COURSE.weekComplete(1) && !(window.BT_DEMO && window.BT_DEMO.peek) && !vw().repsUnlocked) {
      box.classList.add('rp-locked');
      box.appendChild(h('div', { class: 'rp-top' }, [h('div', null, [h('span', { class: 'rp-k', text: 'Your daily evidence of growth' }), h('h2', { id: 'rp-h', class: 'rp-h', text: REPS_NAME })]), h('span', { class: 'rp-n', text: '🔒' })]));
      box.appendChild(h('div', { class: 'rp-ghost', 'aria-hidden': 'true' }, ['✦', 'D', '≈', '☕', '↟', '💧'].map(function (x) { return h('div', { class: 'rp-ghost-r' }, [h('span', { text: x }), h('i'), h('b')]); })));
      box.appendChild(h('div', { class: 'rp-lockmsg' }, [
        h('span', { class: 'rp-lock-ic', 'aria-hidden': 'true', text: '🔒' }),
        h('b', { text: 'This one’s waiting for you' }),
        h('p', { text: 'Your daily reps unlock as you finish the tasks in Week 1. When Week 1 is complete, come back here and have a play with it.' })
      ]));
      return box;
    }
    if (window.BT_COURSE && window.BT_COURSE.weekComplete && window.BT_COURSE.weekComplete(1) && !vw().repsUnlocked) { var du = vw(); du.repsUnlocked = Date.now(); wr(VK, du); }
    var st = status(k), v = vday(k), wins = kit.winsOn(k), wl = waterLevel(k), wlY = waterLevel(dk(Date.now() - DAY));
    var done = { win: wins.length > 0 || !!(v.win || {}).done, dose: st.dose, breathe: st.breathe, pause: st.pause, move: st.move, water: wl > 0 };
    var n = Object.keys(done).filter(function (x) { return done[x]; }).length;
    if ((v.filled && !vs.repsOpen) || (n === 6 && !vs.repsOpen)) {
      var IC = { win: '✦', dose: kit.emblem('dose'), breathe: kit.emblem('breathe'), pause: kit.emblem('pause'), move: kit.emblem('move'), water: '💧' };
      box.classList.add('rp-mini');
      box.appendChild(h('div', { class: 'rp-mini-top' }, [h('span', { class: 'rp-mini-tick', 'aria-hidden': 'true', text: '✓' }), h('div', null, [h('b', { id: 'rp-h', text: REPS_NAME + ': done' }), h('span', { text: n + ' of 6 today. Every one is evidence you’re growing.' })])]));
      box.appendChild(h('div', { class: 'rp-mini-row', 'aria-label': 'What you did today' }, ['win', 'dose', 'breathe', 'pause', 'move', 'water'].map(function (p) { var ic = IC[p]; return h('span', { class: 'rp-mini-i' + (done[p] ? ' on' : ''), title: p }, [typeof ic === 'string' ? document.createTextNode(ic) : ic]); })));
      box.appendChild(h('div', { class: 'rp-mini-acts' }, [h('a', { class: 'bt-btn lime sm', href: '#Book', text: 'Check my progress →' }), h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Edit today', onclick: function () { vs.repsOpen = true; redraw(); } })]));
      return box;
    }
    box.appendChild(h('div', { class: 'rp-top' }, [h('div', null, [h('span', { class: 'rp-k', text: 'Your daily evidence of growth' }), h('h2', { id: 'rp-h', class: 'rp-h', text: REPS_NAME })]), h('span', { class: 'rp-n' + (n ? ' on' : ''), text: n + ' / 6' })]));
    box.appendChild(h('div', { class: 'rp-mode', role: 'radiogroup', 'aria-label': 'How do you want to fill this in?' }, [['quick', '⚡ I’ve got 3 seconds', 'Just tick the boxes'], ['detail', '✎ I want to add detail', 'Choose or write what you did']].map(function (m) { var on = mode === m[0]; return h('button', { class: 'rp-mode-b' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { var d = vw(); d.repsMode = m[0]; wr(VK, d); redraw(); } }, [h('b', { text: m[1] }), h('span', { text: m[2] })]); })));
    box.appendChild(h('p', { class: 'rp-msg rp-msg-all', 'aria-live': 'polite', hidden: true }));
    function dayDone() { return h('div', { class: 'rp-end' }, [h('button', { class: 'bt-btn lime', type: 'button', text: '✓ That’s my day', onclick: function (e) { setV(k, 'filled', { at: Date.now() }); vs.repsOpen = false; kit.sparkleBurst(e.currentTarget); setTimeout(function () { redraw(); }, 300); } }), h('a', { class: 'rp-more', href: '#Book', text: 'Check my progress →' })]); }
    var CHEERS = { win: 'Logged. Another piece of proof.', dose: 'Feel-good chemicals: delivered.', breathe: 'Your vagus nerve thanks you.', pause: 'Quiet moments count.', move: 'Moving your body, even a little, is progress.', water: 'Hydrated brain, happier brain.' };
    if (mode === 'quick') {
      var Q = [['win', '✦', 'Had a win'], ['dose', kit.emblem('dose'), 'Got my DOSE'], ['breathe', kit.emblem('breathe'), 'Did some breathwork'], ['pause', kit.emblem('pause'), 'Took a pause'], ['move', kit.emblem('move'), 'Moved my body'], ['water', '💧', 'Drank water']];
      box.appendChild(h('div', { class: 'rp-quick' }, Q.map(function (q) {
        var on = done[q[0]];
        return h('button', { class: 'rp-qi' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', 'data-rp': q[0], onclick: function (e) {
          if (q[0] === 'water') { setV(k, 'water', on ? { level: '', n: 0, ml: null } : { level: 'good', n: 0, ml: null }); }
          else if (q[0] === 'win') { setV(k, 'win', { done: !on }); }
          else { setV(k, q[0], { done: !on }); if (!on) tickLesson(q[0]); }
          if (!on) kit.sparkleBurst(e.currentTarget);
          var c = !on ? (cheerLine(q[0]) || CHEERS[q[0]]) : '';
          setTimeout(function () { redraw(c, 'all'); }, on ? 0 : 250);
        } }, [h('span', { class: 'rp-ic', 'aria-hidden': 'true' }, [typeof q[1] === 'string' ? document.createTextNode(q[1]) : q[1]]), h('b', { text: q[2] }), h('span', { class: 'rp-tick', 'aria-hidden': 'true', text: on ? '✓' : '' })]);
      })));
      if (done.win && !wins.length) box.appendChild(h('button', { class: 'rp-more', type: 'button', text: 'Want to write your win down? It becomes proof in your portfolio →', onclick: function () { var d = vw(); d.repsMode = 'detail'; wr(VK, d); redraw(); } }));
      box.appendChild(dayDone());
      return box;
    }
    function row(part, ic, q, isDone, kids) {
      return h('div', { class: 'rp-row' + (isDone ? ' done' : ''), 'data-rp': part }, [
        h('div', { class: 'rp-q' }, [h('span', { class: 'rp-ic', 'aria-hidden': 'true' }, [typeof ic === 'string' ? document.createTextNode(ic) : ic]), h('b', { text: q }), h('span', { class: 'rp-tick', 'aria-label': isDone ? 'Done' : 'Not yet', text: isDone ? '✓' : '' })]),
        h('div', { class: 'rp-a' }, kids),
        h('p', { class: 'rp-msg', 'aria-live': 'polite', hidden: true }),
        isDone && cheerLine(part) ? h('p', { class: 'rp-streak', text: cheerLine(part) }) : null
      ]);
    }
    // wins
    var winIn = h('input', { class: 'bt-in sm', placeholder: 'Today I…', 'aria-label': 'Your win today' });
    var addWin = function () { var t = kit.tx(winIn.value); if (!t) return; var ab = kit.addWin(t); setV(k, 'win', { done: true }); redraw('Added. That’s proof against ' + ab.beliefs.length + ' old beliefs.', 'win'); };
    winIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') addWin(); });
    box.appendChild(row('win', '✦', 'Wins: what went well today?', done.win, [wins.length ? h('ul', { class: 'rp-wins' }, wins.map(function (w) { return h('li', { text: '“' + w.text + '”' }); })) : null, h('div', { class: 'rp-inrow' }, [winIn, h('button', { class: 'bt-btn lime sm', type: 'button', text: wins.length ? 'Add another' : 'Add', onclick: addWin })])]));
    // DOSE: bare minimum in one tap, or "I did something different" (pick from the menu or make a new option)
    var dd = doseData(), dts = dd.days[k] || {};
    function tickDose(ids, msg) { var d2 = doseData(), x = d2.days[k] = d2.days[k] || {}, p = { done: true }; ids.forEach(function (id) { x[id] = x[id] || Date.now(); var it = doseItem(id); if (it) it.letters.split('').forEach(function (L) { p[L] = true; }); }); wr(K.dose, d2); set('dose', p, msg); }
    function untickDose(id) { var d2 = doseData(), x = d2.days[k] = d2.days[k] || {}; delete x[id]; wr(K.dose, d2); set('dose', { done: Object.keys(x).length > 0 || !!(v.dose || {}).note }, ''); }
    var doseKids = [], todays = Object.keys(dts);
    if (todays.length) doseKids.push(h('div', { class: 'vg-chips' }, todays.map(function (id) { var it = doseItem(id); return it ? h('button', { class: 'vg-wc-i on', type: 'button', 'aria-pressed': 'true', title: 'Tap to untick', onclick: function () { untickDose(id); } }, [h('span', { 'aria-hidden': 'true', text: '✓' }), it.text, h('span', { class: 'rp-let', text: it.letters })]) : null; })));
    var planLeft = dd.plan.filter(function (id) { return !dts[id]; });
    doseKids.push(h('div', { class: 'rp-dose-acts' }, [
      dd.plan.length ? h('button', { class: 'rp-big' + (dd.plan.length && !planLeft.length ? ' on' : ''), type: 'button', disabled: !planLeft.length ? true : null, onclick: function (e) { kit.sparkleBurst(e.currentTarget); setTimeout(function () { tickDose(dd.plan, 'Bare-ass minimum: done. That’s your happy hormones topped up.'); }, 200); } }, [h('b', { text: planLeft.length ? '✓ I did my bare minimum' : '✓ Bare minimum done' }), h('span', { text: dd.plan.map(function (id) { var it = doseItem(id); return it ? it.text : ''; }).filter(Boolean).join(' · ') })])
        : h('a', { class: 'rp-big', href: '#Dose' }, [h('b', { text: 'Build your bare-ass minimum →' }), h('span', { text: 'Then it’s one tap here every day.' })]),
      h('button', { class: 'rp-big alt' + (vs.doseOther ? ' on' : ''), type: 'button', 'aria-expanded': vs.doseOther ? 'true' : 'false', onclick: function () { vs.doseOther = !vs.doseOther; redraw(); } }, [h('b', { text: '✎ I did something different' }), h('span', { text: 'Pick it from your menu or add a new one' })])
    ]));
    if (vs.doseOther) {
      var oIn = h('input', { class: 'bt-in sm', id: 'rp-dose-other', placeholder: 'What did you do? e.g. danced with the dog', value: vs.doseQ || '', 'aria-label': 'What you did for your DOSE' });
      var sug = h('div', { class: 'rp-sug' });
      var newL = vs.doseNewL || {};
      function allIds() { var d2 = doseData(), ids = d2.loves.slice(); ['D', 'O', 'S', 'E'].forEach(function (L) { DOSE[L].items.forEach(function (_, j) { if (ids.indexOf(L + j) < 0) ids.push(L + j); }); }); d2.custom.forEach(function (_, j) { ids.unshift('X' + j); }); COMBOS.forEach(function (_, j) { ids.push('C' + j); }); return ids; }
      function score(text, q) { var t = text.toLowerCase(), sc = 0; q.forEach(function (w) { if (t.indexOf(w) >= 0) sc += w.length > 4 ? 3 : 2; else if (w.length > 4 && t.indexOf(w.slice(0, w.length - 2)) >= 0) sc += 1; }); return sc; }
      function drawSug() {
        sug.innerHTML = ''; var qv = kit.tx(oIn.value); vs.doseQ = oIn.value;
        var q = qv.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2 && ['the', 'and', 'with', 'for', 'did', 'went', 'had', 'some', 'was', 'got', 'then', 'today'].indexOf(w) < 0; });
        var d2 = doseData(), list = allIds().filter(function (id) { return !(d2.days[k] || {})[id]; }).map(function (id) { var it = doseItem(id); return it ? { id: id, it: it, sc: q.length ? score(it.text, q) + (d2.loves.indexOf(id) >= 0 ? 1 : 0) : (d2.loves.indexOf(id) >= 0 || it.custom ? 1 : 0) } : null; }).filter(function (x) { return x && x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, q.length ? 6 : 8);
        sug.appendChild(h('span', { class: 'rp-sub', text: q.length ? (list.length ? 'Is it one of these? Tap to tick it off:' : 'Nothing like it on the menu yet. Add it as a new option:') : 'From your menu (or type what you did above):' }));
        if (list.length) sug.appendChild(h('div', { class: 'vg-chips' }, list.map(function (x) { return h('button', { class: 'vg-wc-i', type: 'button', onclick: function (e) { kit.sparkleBurst(e.currentTarget); vs.doseQ = ''; setTimeout(function () { tickDose([x.id], CHEERS.dose); }, 200); } }, [h('span', { 'aria-hidden': 'true', text: '+' }), x.it.text, h('span', { class: 'rp-let', text: x.it.letters })]); })));
        if (qv) {
          var lets = h('div', { class: 'rp-lets', role: 'group', 'aria-label': 'Which happy hormone did it give you?' }, ['D', 'O', 'S', 'E'].map(function (L) { return h('button', { class: 'rp-letb' + (newL[L] ? ' on' : ''), type: 'button', 'aria-pressed': newL[L] ? 'true' : 'false', title: DOSE[L].name, onclick: function () { newL[L] = !newL[L]; vs.doseNewL = newL; drawSug(); } }, [h('b', { text: L }), h('span', { text: DOSE[L].name })]); }));
          sug.appendChild(h('div', { class: 'rp-new' }, [h('span', { class: 'rp-sub', text: 'Or save “' + qv + '” as a new option on your menu. Which did it give you?' }), lets,
            h('button', { class: 'bt-btn lime sm', type: 'button', text: '+ Add it to my menu and tick it off', onclick: function () {
              var ls = ['D', 'O', 'S', 'E'].filter(function (L) { return newL[L]; }).join(''); if (!ls) { var m = sug.querySelector('.rp-new .rp-sub'); if (m) m.textContent = 'Tap at least one: D, O, S or E.'; return; }
              var d3 = doseData(); d3.custom.push({ text: qv, letters: ls, at: Date.now() }); var nid = 'X' + (d3.custom.length - 1); if (d3.loves.indexOf(nid) < 0) d3.loves.push(nid); wr(K.dose, d3);
              vs.doseQ = ''; vs.doseNewL = {}; vs.doseOther = false; tickDose([nid], 'New option added to your menu. Look at you, building your own medicine cabinet.');
            } })]));
        }
      }
      oIn.addEventListener('input', drawSug);
      doseKids.push(h('div', { class: 'rp-other' }, [oIn, sug])); drawSug();
      setTimeout(function () { var el = document.getElementById('rp-dose-other'); if (el && document.activeElement !== el && vs.doseQ) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
    }
    box.appendChild(row('dose', kit.emblem('dose'), 'Get your daily DOSE?', done.dose, doseKids));
    // breathe: the breath options right here, tap the one you did
    var vb = v.breathe || {}, br = st.breaths, brDone = {}; br.forEach(function (x) { brDone[x.p] = 1; }); if (vb.p) brDone[vb.p] = 1;
    (vb.ps || []).forEach(function (p) { brDone[p] = 1; });
    box.appendChild(row('breathe', kit.emblem('breathe'), 'Did some breathwork?', done.breathe, [
      h('span', { class: 'rp-sub', text: 'Which one did you do? Tap it.' }),
      h('div', { class: 'rp-breaths' }, Object.keys(PATTERNS).map(function (pid) {
        var P = PATTERNS[pid], on = !!brDone[pid], logged = br.some(function (x) { return x.p === pid; });
        return h('button', { class: 'rp-br' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', disabled: logged ? true : null, title: logged ? 'Logged from the Breathe page' : P.desc, onclick: function (e) {
          var ps = (vb.ps || (vb.p ? [vb.p] : [])).filter(function (x) { return x !== pid; }); if (!on) ps.push(pid);
          if (!on) kit.sparkleBurst(e.currentTarget);
          setTimeout(function () { set('breathe', { done: ps.length > 0 || br.length > 0, ps: ps, p: ps[ps.length - 1] || '' }, on ? '' : CHEERS.breathe); }, on ? 0 : 200);
        } }, [h('span', { class: 'rp-br-ic', 'aria-hidden': 'true', text: on ? '✓' : '' }), h('b', { text: P.short }), h('span', { text: P.name })]);
      })),
      br.length ? h('span', { class: 'rp-did', text: 'Logged on the Breathe page: ' + br.map(function (x) { return PNAME(x.p) + ' · ' + x.mins + ' min'; }).join(' · ') }) : null,
      h('a', { class: 'rp-link', href: '#Breathe', text: done.breathe ? 'Do another one →' : 'Haven’t yet? Do one now →' })
    ]));
    // pause
    var pm = pauseData().menu || [], vp = v.pause || {}, its = vp.items || [];
    var pIn = h('input', { class: 'bt-in sm', placeholder: 'Something else…', 'aria-label': 'Another pause you took' });
    var saveP = function () { var t = kit.tx(pIn.value); if (!t) return; set('pause', { done: true, items: its.concat([t]) }, CHEERS.pause); };
    pIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveP(); });
    box.appendChild(row('pause', kit.emblem('pause'), 'Take a pause today?', done.pause, [pm.length ? h('span', { class: 'rp-sub', text: 'Do any of these today?' }) : null, pm.length ? h('div', { class: 'vg-chips' }, pm.map(function (t) { var on = its.indexOf(t) >= 0; return h('button', { class: 'vg-wc-i' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function () { var nx = its.filter(function (x) { return x !== t; }); if (!on) nx.push(t); set('pause', { done: nx.length > 0 || !!vp.n, items: nx }, on ? '' : CHEERS.pause); } }, [h('span', { 'aria-hidden': 'true', text: on ? '✓' : '+' }), t]); })) : null, h('div', { class: 'rp-inrow' }, [pIn, h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Add', onclick: saveP })])]));
    // move: tap what you did, or add something new (it joins your move menu)
    var vm = v.move || {}, mtypes = vm.types || [], mmenu = moveData().menu || [];
    var mopts = (mmenu.length ? mmenu : MOVE_TYPES).slice(); mtypes.forEach(function (t) { if (mopts.indexOf(t) < 0) mopts.push(t); });
    var mIn = h('input', { class: 'bt-in sm', placeholder: 'Something new… e.g. kitchen disco', 'aria-label': 'Another way you moved' });
    var saveM = function () { var t = kit.tx(mIn.value); if (!t) return; var md = moveData(); md.menu = (md.menu || []).concat(md.menu && md.menu.indexOf(t) >= 0 ? [] : [t]); wr(K.move, md); set('move', { done: true, types: mtypes.filter(function (x) { return x !== t; }).concat([t]) }, 'Added to your move menu. Moving your body is progress.'); };
    mIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveM(); });
    box.appendChild(row('move', kit.emblem('move'), 'Move your body today?', done.move, [
      h('span', { class: 'rp-sub', text: 'What did you do? Tap it.' }),
      h('div', { class: 'vg-chips' }, mopts.map(function (t) { var on = mtypes.indexOf(t) >= 0; return h('button', { class: 'vg-wc-i' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function (e) { var nx = mtypes.filter(function (x) { return x !== t; }); if (!on) { nx.push(t); kit.sparkleBurst(e.currentTarget); } setTimeout(function () { set('move', { done: nx.length > 0, types: nx }, on ? '' : CHEERS.move); }, on ? 0 : 200); } }, [h('span', { 'aria-hidden': 'true', text: on ? '✓' : '+' }), t]); })),
      h('div', { class: 'rp-inrow' }, [mIn, h('button', { class: 'bt-btn ghost sm', type: 'button', text: '+ Add', onclick: saveM })])
    ]));
    // water: one bottle in litres. First time, they place the goal line (with a gentle, optional guide).
    var vwat = v.water || {}, ml = waterML(vwat), mlY = waterML(vday(dk(Date.now() - DAY)).water), GOALML = waterGoalMl();
    function fmtL(m) { return (Math.round(m / 50) * 50 / 1000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' L'; }
    function fmtOz(m) { return Math.round(m / 29.5735) + ' oz'; }
    function setWater(m) {
      var g = waterGoalMl() || 2000;
      var msg = m > mlY && mlY > 0 ? 'More than yesterday! That’s progression.' : m >= g ? 'Water goal smashed. Hydrated brain, happier brain.' : m >= g / 2 ? 'Halfway there. That’s growth right there.' : m > 0 ? 'Every sip counts. Maybe one more?' : '';
      set('water', { ml: m, n: 0, level: '' }, msg);
    }
    // a draggable bottle: mode 'goal' places the goal line, mode 'track' fills it to what she drank
    function bottle(mode, start, goal, onSet, onMove) {
      var MAX = Math.max(mode === 'goal' ? 4000 : 3000, Math.ceil(((goal || 0) * 1.25) / 500) * 500), cur = Math.min(start, MAX);
      var fillEl = h('div', { class: 'rp-bt-fill' + (mode === 'goal' ? ' ghost' : '') }), lineEl = h('div', { class: 'rp-bt-line' + (mode === 'goal' ? ' goalset' : '') }, [h('span', { class: 'rp-bt-grip', 'aria-hidden': 'true', text: '⇕' })]);
      var marks = h('div', { class: 'rp-bt-marks', 'aria-hidden': 'true' }, Array.from({ length: Math.floor(MAX / 1000) }, function (_, i) { return h('span', { style: 'bottom:' + ((i + 1) * 1000 / MAX * 100) + '%', text: (i + 1) + 'L' }); }));
      var body = h('div', { class: 'rp-bt-body' }, [fillEl, marks, mode === 'track' && goal ? h('div', { class: 'rp-bt-goal', style: 'bottom:' + (goal / MAX * 100) + '%' }, [h('span', { text: 'goal' })]) : null, lineEl]);
      var el = h('div', { class: 'rp-bt', role: 'slider', tabindex: '0', 'aria-label': mode === 'goal' ? 'Your daily water goal. Drag the line to set it' : 'Water today. Drag up to how much you drank', 'aria-valuemin': '0', 'aria-valuemax': String(MAX) }, [h('div', { class: 'rp-bt-cap' }), body]);
      function show(m) { var pct = m / MAX * 100; fillEl.style.height = pct + '%'; lineEl.style.bottom = pct + '%'; el.setAttribute('aria-valuenow', String(m)); el.setAttribute('aria-valuetext', fmtL(m) + ', ' + fmtOz(m)); if (onMove) onMove(m); }
      function fromY(y) { var r = body.getBoundingClientRect(); return Math.max(0, Math.min(MAX, Math.round((1 - (y - r.top) / r.height) * MAX / 50) * 50)); }
      var dragging = false;
      el.addEventListener('pointerdown', function (e) { dragging = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} cur = fromY(e.clientY); show(cur); e.preventDefault(); });
      el.addEventListener('pointermove', function (e) { if (dragging) { cur = fromY(e.clientY); show(cur); } });
      var end = function () { if (!dragging) return; dragging = false; onSet(cur); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('keydown', function (e) { var d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 100 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -100 : 0; if (!d) return; e.preventDefault(); cur = Math.max(0, Math.min(MAX, cur + d)); show(cur); clearTimeout(el._t); el._t = setTimeout(function () { onSet(cur); }, 700); });
      el.setTo = function (m) { cur = Math.max(0, Math.min(MAX, m)); show(cur); };
      show(cur);
      return el;
    }
    var waterKids = [];
    if (!GOALML || vs.waterGoalEdit) {
      // weight -> a full target (35 ml per kg), then pick where to start: small, building, or the full goal
      var unitW = vw().weightUnit || 'kg', target = vs.waterTarget || vw().waterTarget || 0, draft = vs.waterDraft || GOALML || (target ? Math.round(target * 0.5 / 50) * 50 : 1500);
      var gRead = h('div', { class: 'rp-bt-read' }, [h('b'), h('span')]);
      var bt = bottle('goal', draft, Math.max(draft, target), function (m) { vs.waterDraft = m; vs.waterPick = ''; markPick(); }, function (m) { gRead.firstChild.textContent = fmtL(m); gRead.lastChild.textContent = fmtOz(m) + ' a day'; });
      var wIn = h('input', { class: 'bt-in sm', id: 'rp-kg', type: 'number', inputmode: 'decimal', min: '20', max: '700', placeholder: unitW, value: vs.waterW || '', 'aria-label': 'Your weight in ' + (unitW === 'kg' ? 'kilograms' : 'pounds') + ' (not saved)' });
      var uSw = h('div', { class: 'rp-unit', role: 'radiogroup', 'aria-label': 'Weight in' }, [['kg', 'kg'], ['lb', 'lb']].map(function (u) { var on = unitW === u[0]; return h('button', { class: 'rp-unit-b' + (on ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { var d = vw(); d.weightUnit = u[0]; wr(VK, d); vs.waterW = ''; redraw(); } }, [u[1]]); }));
      var opts = h('div', { class: 'rp-wopts', role: 'radiogroup', 'aria-label': 'Where do you want to start?' });
      function markPick() { Array.prototype.forEach.call(opts.children, function (c) { var on = c.getAttribute('data-k') === vs.waterPick; c.classList.toggle('on', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); }); }
      function drawOpts() {
        opts.innerHTML = ''; if (!target) return;
        [['small', '🌱', 'Start small', 0.5, 'Easy wins first. Perfect if water’s not your thing yet.'], ['build', '🌿', 'Build up', 0.75, 'A gentle stretch from where you are.'], ['full', '🌳', 'Full goal', 1, 'Your body’s full daily amount.']].forEach(function (o) {
          var m = Math.max(750, Math.round(target * o[3] / 50) * 50);
          opts.appendChild(h('button', { class: 'rp-wopt', type: 'button', role: 'radio', 'data-k': o[0], 'aria-checked': 'false', onclick: function () { vs.waterPick = o[0]; vs.waterDraft = m; bt.setTo(m); markPick(); } }, [h('span', { class: 'rp-wopt-ic', 'aria-hidden': 'true', text: o[1] }), h('b', { text: o[2] }), h('span', { class: 'rp-wopt-l', text: fmtL(m) + ' · ' + fmtOz(m) }), h('span', { class: 'rp-wopt-d', text: o[4] })]));
        });
        markPick();
      }
      function calc() {
        var w = parseFloat(wIn.value); vs.waterW = wIn.value;
        var kg = unitW === 'lb' ? w * 0.4536 : w;
        if (!(kg >= 25 && kg <= 300)) { tOut.textContent = ''; return; }
        target = Math.round(kg * 35 / 50) * 50; vs.waterTarget = target;
        tOut.textContent = 'Your body’s full daily amount is about ' + fmtL(target) + ' (' + fmtOz(target) + '). No need to start there.';
        if (!vs.waterPick) { vs.waterPick = 'small'; vs.waterDraft = Math.max(750, Math.round(target * 0.5 / 50) * 50); bt.setTo(vs.waterDraft); }
        drawOpts();
      }
      var tOut = h('p', { class: 'rp-guide-out', 'aria-live': 'polite' });
      wIn.addEventListener('input', calc);
      waterKids.push(
        h('p', { class: 'rp-sub', text: GOALML ? 'Change your daily goal.' : 'Let’s set a water goal that feels doable.' }),
        h('div', { class: 'rp-bt-wrap rp-wset' }, [bt, h('div', { class: 'rp-bt-side rp-wcalc' }, [
          h('span', { class: 'rp-sub', text: 'Pop in your weight and we’ll work out a starting point. It’s just maths. It isn’t saved anywhere.' }),
          h('div', { class: 'rp-inrow' }, [wIn, uSw]), tOut,
          h('div', { class: 'rp-wgoal' }, [h('span', { class: 'rp-sub', text: 'My daily goal' }), gRead]),
          h('button', { class: 'rp-more', type: 'button', text: 'Rather not? Start me at 1.5 L', onclick: function () { target = 2000; vs.waterTarget = 2000; vs.waterPick = ''; vs.waterDraft = 1500; bt.setTo(1500); drawOpts(); } })
        ])]),
        opts,
        h('p', { class: 'rp-sub small', text: 'Heat, movement, your cycle and how you feel all change what your body needs. As you hit your goal most days, we’ll gently raise the bar.' }),
        h('div', { class: 'rp-inrow' }, [
          h('button', { class: 'bt-btn lime sm', type: 'button', text: '✓ Set my goal', onclick: function (e) { var d = vw(); d.waterGoalMl = vs.waterDraft || draft; d.waterTarget = Math.max(target || 2000, d.waterGoalMl); wr(VK, d); vs.waterGoalEdit = false; vs.waterDraft = 0; vs.waterPick = ''; vs.waterW = ''; kit.sparkleBurst(e.currentTarget); setTimeout(function () { redraw('Goal set: ' + fmtL(d.waterGoalMl) + ' a day. Now fill your bottle as you go.', 'water'); }, 200); } }),
          GOALML ? h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Cancel', onclick: function () { vs.waterGoalEdit = false; vs.waterDraft = 0; redraw(); } }) : null
        ]));
      drawOpts(); if (vs.waterW) calc();
    } else {
      var read = h('div', { class: 'rp-bt-read' }, [h('b'), h('span')]);
      var tb = bottle('track', ml, GOALML, function (m) { setWater(m); }, function (m) { read.firstChild.textContent = fmtL(m); read.lastChild.textContent = fmtOz(m) + (m >= GOALML ? ' · goal hit!' : ' of ' + fmtL(GOALML)); });
      // raise the bar: goal hit on 5 of the last 7 days and still under the full amount
      var dw = vw(), full = dw.waterTarget || 0, hits = 0;
      for (var di = 0; di < 7; di++) { var kd = dk(Date.now() - di * DAY); if (waterML(vday(kd).water) >= GOALML) hits++; }
      if (full > GOALML && hits >= 5 && !(dw.waterRaiseSnooze && Date.now() < dw.waterRaiseSnooze)) {
        var next = Math.min(full, GOALML + 250);
        waterKids.push(h('div', { class: 'rp-raise' }, [
          h('b', { text: '🌿 You’ve hit your water goal ' + hits + ' of the last 7 days!' }),
          h('span', { text: 'Ready to raise the bar a little, to ' + fmtL(next) + '?' }),
          h('div', { class: 'rp-inrow' }, [
            h('button', { class: 'bt-btn lime sm', type: 'button', text: 'Yes, raise it', onclick: function (e) { var d = vw(); d.waterGoalMl = next; d.waterRaiseSnooze = Date.now() + 7 * DAY; wr(VK, d); kit.sparkleBurst(e.currentTarget); setTimeout(function () { redraw(next >= full ? 'That’s your full daily amount. Look at you go!' : 'New goal: ' + fmtL(next) + '. Growth looks good on you.', 'water'); }, 200); } }),
            h('button', { class: 'bt-btn ghost sm', type: 'button', text: 'Not yet', onclick: function () { var d = vw(); d.waterRaiseSnooze = Date.now() + 7 * DAY; wr(VK, d); redraw(); } })
          ])
        ]));
      }
      waterKids.push(
        h('div', { class: 'rp-bt-wrap' }, [tb, h('div', { class: 'rp-bt-side' }, [read, h('span', { class: 'rp-sub', text: 'Drag the line up to how much you’ve had today.' }), h('button', { class: 'rp-more', type: 'button', text: 'Change my goal', onclick: function () { vs.waterGoalEdit = true; redraw(); } })])]),
        mlY ? h('span', { class: 'rp-sub', text: 'Yesterday: ' + fmtL(mlY) + '. ' + (ml > mlY ? 'You’re up on yesterday!' : 'Can you match it or go one better?') }) : null);
    }
    box.appendChild(row('water', '💧', 'Water today?', done.water, waterKids));
    box.appendChild(dayDone());
    return box;
  }
  /* ====================================================================== book + home hooks */
  var PNAME = function (p) { return (PATTERNS[p] || {}).name || 'Breathing'; };
  function bookEntries() {
    boot();
    // one visual card per day: a badge for each part she did (nothing shown for what she didn't)
    var out = [], days = {}, w = vw(), dd = doseData(), pd = pauseData(), md = moveData();
    function day(k) { return days[k] = days[k] || { k: k, at: 0, b: {} }; }
    function bump(D, t) { if (t && t > D.at) D.at = t; }
    function add(D, id, detail) { var b = D.b[id] = D.b[id] || { d: [] }; if (detail && b.d.indexOf(detail) < 0) b.d.push(detail); }
    ((rd(K.breath) || {}).log || []).forEach(function (x) { var D = day(dk(x.at)); bump(D, x.at); add(D, 'breathe', ((PATTERNS[x.p] || {}).short || 'Breath') + (x.mins ? ' · ' + x.mins + 'm' : '')); });
    Object.keys(dd.days).forEach(function (k) { var ids = Object.keys(dd.days[k] || {}); if (!ids.length) return; var D = day(k); ids.forEach(function (i) { bump(D, dd.days[k][i]); }); var ls = {}; ids.forEach(function (i) { var it = doseItem(i); if (it) it.letters.split('').forEach(function (L) { ls[L] = 1; }); }); add(D, 'dose'); D.b.dose.L = Object.assign(D.b.dose.L || {}, ls); D.b.dose.n = (D.b.dose.n || 0) + ids.length; });
    Object.keys(w.days).forEach(function (k) {
      var v = w.days[k], D = day(k); bump(D, Math.min(v.at || noonOf(k), fromKey(k) + DAY - 60000));
      var vd = v.dose || {};
      if (vd.done || ['D', 'O', 'S', 'E'].some(function (L) { return vd[L]; })) { add(D, 'dose'); ['D', 'O', 'S', 'E'].forEach(function (L) { if (vd[L]) (D.b.dose.L = D.b.dose.L || {})[L] = 1; }); }
      if (v.breathe && v.breathe.done) { add(D, 'breathe'); (v.breathe.ps || (v.breathe.p ? [v.breathe.p] : [])).forEach(function (p) { add(D, 'breathe', (PATTERNS[p] || {}).short); }); }
      if (v.pause && v.pause.done) add(D, 'pause', v.pause.n ? v.pause.n + '×' : (v.pause.items || []).length ? (v.pause.items.length + '×') : '');
      if (v.move && v.move.done) { add(D, 'move', v.move.mins ? v.move.mins + 'm' : ''); (v.move.types || []).slice(0, 2).forEach(function (t) { add(D, 'move', t); }); }
      var ml = waterML(v.water); if (ml) add(D, 'water', (ml / 1000) + ' L'); else if (v.water && v.water.level) add(D, 'water', v.water.level);
      if ((v.win || {}).done || kit.winsOn(k).length) add(D, 'win');
    });
    Object.keys(pd.days).forEach(function (k) { var l = pd.days[k] || []; if (!l.length) return; var D = day(k); bump(D, l[l.length - 1].at); add(D, 'pause', l.length + '×'); });
    Object.keys(md.days).forEach(function (k) { var r = md.days[k]; if (!r || !(r.mins || (r.types || []).length)) return; var D = day(k); bump(D, r.saved || noonOf(k)); add(D, 'move', r.mins ? r.mins + 'm' : ''); });
    var ORDER = ['dose', 'breathe', 'pause', 'move', 'water', 'win'], NAMES = { dose: 'DOSE', breathe: 'Breathe', pause: 'Pause', move: 'Move', water: 'Water', win: 'Win' };
    Object.keys(days).forEach(function (k) {
      var D = days[k], ids = ORDER.filter(function (id) { return D.b[id]; }); if (!ids.length) return;
      var badges = ids.map(function (id) { var b = D.b[id], det = b.d.filter(Boolean).slice(0, 2).join(' · '); if (id === 'dose' && b.L) { var lz = ['D', 'O', 'S', 'E'].filter(function (L) { return b.L[L]; }); det = lz.length === 4 ? 'All 4' : lz.join(' '); } return { id: id, name: NAMES[id], detail: det }; });
      var core = ids.filter(function (id) { return ['dose', 'breathe', 'pause', 'move'].indexOf(id) >= 0; }).length;
      out.push({ kind: 'vagal', at: D.at || noonOf(k), title: 'Vagal tone workout', sub: core === 4 ? 'All four. Full workout!' : core ? core + ' of 4 · one thing is enough' : '', badges: badges, href: '#Vagal', res: 'vagal' });
    });
    (w.blocks || []).forEach(function (b) { out.push({ kind: 'vagal', at: b.at, title: 'Working through a block: ' + PNAMES[b.part], text: [b.block, b.fix ? 'What could help: ' + b.fix : ''].filter(Boolean).join(' · '), href: '#Vagal', res: b.part }); });
    return out;
  }
  function firstLog() { var ks = Object.keys(workoutDays()); return ks.length ? Math.min.apply(null, ks.map(fromKey)) : null; }
  function todayStatus(k) { var s = status(k); s.doseN = s.dose ? Math.max(1, s.doseN) : 0; return s; }

  window.BT_VAGAL = { repsCard: repsCard, bookEntries: bookEntries, todayStatus: todayStatus, firstLog: firstLog, doseData: doseData, doseItem: doseItem, workoutDays: workoutDays, workoutCard: workoutCard, streak: function () { return streakOf(workoutDays()); }, openDay: function (k) { vs.day = k; if (location.hash === '#Vagal') window.BT_APP.reload(); else location.hash = '#Vagal'; } };
  var N = window.BT_NATIVE || (window.BT_NATIVE = {});
  N.Vagal = Vagal; N.Breathe = Breathe; N.Dose = Dose; N.Pause = Pause; N.Move = Move;
})();
