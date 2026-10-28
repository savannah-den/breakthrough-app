# Wins = proof: home wins card, memories, proof portfolio links, book calendar + streaks. Idempotent.
import re
P='public/js/course.js'
s=open(P).read()
if 'function winsHome' in s:
    print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)

HELPERS = r'''
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
  function proofOpen() { try { return isOpen(2); } catch (e) { return false; } }
  function openProof() {
    if (proofOpen()) { try { localStorage.setItem('cmn-open-tab', 'portfolio'); } catch (e) {} APP.go('BreakingOut.dc.html'); }
    else { bookState.tab = 'proof'; location.hash = '#Book'; }
  }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function winStreak() {
    var days = {}; evidence().forEach(function (e) { if (e.win) { var a = evAt(e); if (a) days[dayKey(a)] = 1; } });
    var keys = Object.keys(days).map(function (k) { var p = k.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).getTime(); }).sort(function (a, b) { return a - b; });
    var best = 0, run = 0, prev = null;
    keys.forEach(function (t) { run = prev != null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
    var cur = 0, d = new Date(); d.setHours(0, 0, 0, 0);
    if (!days[dayKey(d.getTime())]) d.setDate(d.getDate() - 1);
    while (days[dayKey(d.getTime())]) { cur++; d.setDate(d.getDate() - 1); }
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
      return h('li', { class: 'bt-wins-i' }, [h('span', { class: 'bt-wins-d', text: a ? new Date(a).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '' }), h('span', { text: e.text }), e.builds ? h('span', { class: 'bt-wins-s', text: '↑ built on an earlier win' }) : null]);
    }));
  }
  function winsHome() {
    var box = h('section', { class: 'bt-wins', 'aria-labelledby': 'bt-wins-h' });
    function draw() {
      box.innerHTML = '';
      var ev = evidence(), wins = ev.filter(function (e) { return e.win; }), st = winStreak();
      box.appendChild(h('div', { class: 'bt-wins-top' }, [h('div', null, [h('span', { class: 'bt-wins-k', text: 'Wins = proof' }), h('h2', { id: 'bt-wins-h', class: 'bt-wins-h', text: 'Add a win' })]), streakPill(st)]));
      box.appendChild(h('p', { class: 'bt-wins-t', text: st.today ? 'Today’s win is in. Got another? Every one is proof the new story is true.' : 'Big or tiny, it counts. Every win goes straight into your proof portfolio.' }));
      var inp = h('input', { class: 'bt-in', id: 'bt-win-in', placeholder: 'Today I…', 'aria-label': 'Your win' });
      var add = function () { var v = tx(inp.value); if (!v) return; addEvidence(v); sparkleBurst(box); APP.toast('Win added to your proof portfolio. Look at you!'); setTimeout(draw, 650); };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
      box.appendChild(h('div', { class: 'bt-wins-row' }, [inp, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add win', onclick: add })]));
      var mem = memoryWin();
      if (mem) {
        var a = evAt(mem.e), more = h('input', { class: 'bt-in', id: 'bt-mem-in', placeholder: 'Since then I’ve…', 'aria-label': 'Add more proof on top of this win' });
        var stack = function () { var v = tx(more.value); if (!v) return; addEvidence(v, { builds: mem.e.id }); memSeen(mem.e.id); sparkleBurst(box); APP.toast('Stacked. That’s more proof.'); setTimeout(draw, 650); };
        more.addEventListener('keydown', function (e) { if (e.key === 'Enter') stack(); });
        var form = h('div', { class: 'bt-wins-row', hidden: true }, [more, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add', onclick: stack })]);
        box.appendChild(h('div', { class: 'bt-mem' }, [
          h('span', { class: 'bt-mem-k', text: 'A memory from ' + agoText(a) }),
          h('p', { class: 'bt-mem-w', text: '“' + mem.e.text + '”' }),
          h('p', { class: 'bt-mem-q', text: mem.q }),
          h('div', { class: 'bt-mem-acts' }, [
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Add more proof', onclick: function () { form.hidden = false; more.focus(); } }),
            h('button', { class: 'bt-btn ghost', type: 'button', text: 'Still proud ✓', onclick: function () { memSeen(mem.e.id); APP.toast('Proud of you too.'); draw(); } })
          ]), form
        ]));
      }
      if (wins.length) box.appendChild(winList(wins.slice(0, 3)));
      box.appendChild(h('div', { class: 'bt-wins-foot' }, [
        h('span', { class: 'bt-wins-s', text: ev.length + ' piece' + (ev.length === 1 ? '' : 's') + ' of proof so far' }),
        h('button', { class: 'bt-wins-link', type: 'button', text: proofOpen() ? 'Open my proof portfolio →' : 'See them in my Becoming Book →', onclick: openProof })
      ]));
    }
    draw();
    return box;
  }
'''
rep("  var mo = null;\n  function watchSlots() {", HELPERS + "  var mo = null;\n  function watchSlots() {")
rep("    slot.appendChild(bk);\n    if (r) slot.appendChild(r);", "    slot.appendChild(winsHome());\n    slot.appendChild(bk);\n    if (r) slot.appendChild(r);")

# book entries: wins + proof both come from the portfolio
a=s.index("    ((rd(K.wins) || {}).items || []).forEach(")
b=s.index("    return out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });", a)
s = s[:a] + r'''    var evIdx = {}; evidence().forEach(function (e) { evIdx[e.id] = e; });
    evidence().forEach(function (e) {
      var base = e.builds && evIdx[e.builds], ba = base && evAt(base);
      push({ kind: e.win ? 'win' : 'proof', at: evAt(e), title: e.text, img: e.photo || '', id: e.id,
        sub: base ? 'More proof on top of your win from ' + (ba ? new Date(ba).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'before') : e.belief ? 'Proof against: ' + String(e.belief).replace(/[-_]+/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }) : e.win ? 'In your proof portfolio' : 'Proof portfolio' });
    });
''' + s[b:]

rep("var d = rd(K.wins) || { items: [] }; d.items = d.items || []; d.items.push({ id: Date.now().toString(36), text: v, at: Date.now() }); wr(K.wins, d); APP.toast('Win added. Look at you!'); APP.reload();",
    "addEvidence(v); APP.toast('Win added to your proof portfolio. Look at you!'); APP.reload();")
rep("var dd = rd(K.wins) || { items: [] }; dd.items = (dd.items || []).filter(function (x) { return x.id !== e.id; }); wr(K.wins, dd); APP.reload();",
    "removeEvidence(e.id); APP.reload();")
rep("if (e.kind === 'win') { var del", "if (e.kind === 'win' || e.kind === 'proof') { var del")
# proof tab shows wins too (they're proof)
rep("return (bookState.tab === 'all' || e.kind === bookState.tab) && (!q",
    "return (bookState.tab === 'all' || e.kind === bookState.tab || (bookState.tab === 'proof' && e.kind === 'win') || (bookState.day && false)) && (!bookState.day || (e.at && dayKey(e.at) === bookState.day)) && (!q")
rep("var count = function (k) { return all.filter(function (e) { return k === 'all' || e.kind === k; }).length; };",
    "var count = function (k) { return all.filter(function (e) { return k === 'all' || e.kind === k || (k === 'proof' && e.kind === 'win'); }).length; };")
rep("var bookState = { tab: 'all', q: '' };", "var bookState = { tab: 'all', q: '', day: '', month: null };")

# calendar at the top of the book
CAL = r'''    // calendar: symbols on the days she moved forward + win streaks
    var GLY = { milestone: '★', activity: '◆', journal: '✎', win: '✦', proof: '✓', change: '↻' };
    var byDay = {}; all.forEach(function (e) { if (!e.at) return; var k = dayKey(e.at); (byDay[k] = byDay[k] || {})[e.kind] = (byDay[k][e.kind] || 0) + 1; });
    var cal = h('section', { class: 'bk-cal', 'aria-label': 'Your progress calendar' });
    function drawCal() {
      cal.innerHTML = '';
      var st = winStreak(), now = new Date(), m0 = bookState.month || new Date(now.getFullYear(), now.getMonth(), 1).getTime(), md = new Date(m0);
      var go = function (n) { bookState.month = new Date(md.getFullYear(), md.getMonth() + n, 1).getTime(); drawCal(); };
      cal.appendChild(h('div', { class: 'bk-cal-top' }, [
        h('button', { class: 'bk-cal-nav', type: 'button', 'aria-label': 'Previous month', text: '‹', onclick: function () { go(-1); } }),
        h('b', { class: 'bk-cal-m', text: md.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) }),
        h('button', { class: 'bk-cal-nav', type: 'button', 'aria-label': 'Next month', text: '›', onclick: function () { go(1); } })
      ]));
      cal.appendChild(h('div', { class: 'bk-streaks' }, [
        h('div', { class: 'bk-stk' + (st.current ? ' hot' : '') }, [h('b', { text: String(st.current) }), h('span', { text: 'day win streak' + (st.today ? '' : st.current ? ' · add today’s to keep it going' : '') })]),
        h('div', { class: 'bk-stk' }, [h('b', { text: String(st.best) }), h('span', { text: 'best streak' })]),
        h('div', { class: 'bk-stk' }, [h('b', { text: String(Object.keys(byDay).filter(function (k) { var p = k.split('-'); return +p[0] === md.getFullYear() && +p[1] === md.getMonth() + 1; }).length) }), h('span', { text: 'days you showed up this month' })])
      ]));
      var grid = h('div', { class: 'bk-grid', role: 'grid' });
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { grid.appendChild(h('span', { class: 'bk-dow', 'aria-hidden': 'true', text: d })); });
      var lead = (md.getDay() + 6) % 7, dim = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate();
      for (var i = 0; i < lead; i++) grid.appendChild(h('span', { class: 'bk-day blank' }));
      for (var d = 1; d <= dim; d++) {
        (function (d) {
          var t = new Date(md.getFullYear(), md.getMonth(), d).getTime(), k = dayKey(t), has = byDay[k] || {}, kinds = Object.keys(has);
          var isToday = k === dayKey(Date.now()), sel = bookState.day === k;
          var label = new Date(t).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) + (kinds.length ? ': ' + kinds.map(function (x) { return has[x] + ' ' + KINDS[x][0].toLowerCase(); }).join(', ') : '');
          var cell = h('button', { class: 'bk-day' + (kinds.length ? ' on' : '') + (has.win ? ' win' : '') + (isToday ? ' today' : '') + (sel ? ' sel' : ''), type: 'button', 'aria-label': label, 'aria-pressed': sel ? 'true' : 'false', disabled: !kinds.length,
            onclick: function () { bookState.day = sel ? '' : k; drawCal(); draw(); } }, [h('span', { class: 'bk-dn', text: String(d) }),
            h('span', { class: 'bk-sy', 'aria-hidden': 'true' }, Object.keys(GLY).filter(function (x) { return has[x]; }).map(function (x) { return h('i', { style: '--kc:' + KINDS[x][1], text: GLY[x] }); }))]);
          grid.appendChild(cell);
        })(d);
      }
      cal.appendChild(grid);
      cal.appendChild(h('div', { class: 'bk-key', 'aria-label': 'Key' }, Object.keys(GLY).map(function (x) { return h('span', null, [h('i', { style: '--kc:' + KINDS[x][1], 'aria-hidden': 'true', text: GLY[x] }), KINDS[x][0]]); })));
      if (bookState.day) { var p = bookState.day.split('-'); cal.appendChild(h('button', { class: 'bk-cal-clear', type: 'button', text: 'Showing ' + new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) + ' · show every day', onclick: function () { bookState.day = ''; drawCal(); draw(); } })); }
    }
    drawCal();
    wrap.appendChild(cal);
'''
rep("    // add a win\n", CAL + "    // add a win\n")
rep("init: function (app) { APP = app; h = app.h; watchSlots(); watchJournal(); },",
    "init: function (app) { APP = app; h = app.h; try { migrateWins(); } catch (e) {} watchSlots(); watchJournal(); },")

PROF = r'''    (function () {
      var ev = evidence(), wins = ev.filter(function (e) { return e.win; }), st = winStreak();
      wrap.appendChild(card('Your proof portfolio', [
        h('div', { class: 'bt-pf-stats' }, [h('span', null, [h('b', { text: String(wins.length) }), ' wins']), h('span', null, [h('b', { text: String(ev.length - wins.length) }), ' other proof']), h('span', null, [h('b', { text: String(st.best) }), ' best streak'])]),
        streakPill(st, true),
        wins.length ? winList(wins.slice(0, 5), true) : h('p', { class: 'bt-sub', text: 'Add your first win on the home page. Tiny ones count.' }),
        h('button', { class: 'bt-btn lime', type: 'button', text: proofOpen() ? 'Open my proof portfolio' : 'See it in my Becoming Book', onclick: openProof })
      ]));
    })();
'''
rep("    if (window.BT_SAVES) wrap.appendChild(window.BT_SAVES.profileSection());", PROF + "    if (window.BT_SAVES) wrap.appendChild(window.BT_SAVES.profileSection());")
open(P,'w').write(s); print('ok')
