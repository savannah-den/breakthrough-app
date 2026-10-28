# Becoming Book: win + workout streaks, tap a day to see that day's cards and its workout card,
# date-range filter, proof/wins tabs up front, app logos on activity cards, saved JPEG views. Idempotent.
P='public/js/course.js'
s=open(P,encoding='utf-8').read()
if 'bk-daypanel' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
SAVE_RES = "{ 'what-if-workout': 'whatif', 'rewind': 'rewind', 'coming-home': 'comehome', 'emotional-blueprint': 'blueprint', 'breaking-out': 'box' }"
rep("if (window.BT_SAVES) window.BT_SAVES.list().forEach(function (x) { push({ kind: 'activity', at: x.at, title: x.title, text: ((window.BT_SAVES.tools[x.tool] || {}).name || ''), item: x }); });",
    "if (window.BT_SAVES) window.BT_SAVES.list().forEach(function (x) { push({ kind: 'activity', at: x.at, title: x.title, text: ((window.BT_SAVES.tools[x.tool] || {}).name || ''), item: x, img: x.img || '', res: " + SAVE_RES + "[x.tool] || '' }); });")
rep("var bookState = { tab: 'all', q: '', day: '', month: null };", "var bookState = { tab: 'all', q: '', day: '', month: null, range: 'all', from: '', to: '' };")
# streaks: wins + workout
rep("""      cal.appendChild(h('div', { class: 'bk-streaks' }, [
        h('div', { class: 'bk-stk' + (st.current ? ' hot' : '') }, [h('b', { text: String(st.current) }), h('span', { text: 'day win streak' + (st.today ? '' : st.current ? ' · add today’s to keep it going' : '') })]),
        h('div', { class: 'bk-stk' }, [h('b', { text: String(st.best) }), h('span', { text: 'best streak' })]),""",
"""      var vw = window.BT_VAGAL ? window.BT_VAGAL.streak() : { current: 0, best: 0 };
      cal.appendChild(h('div', { class: 'bk-streaks' }, [
        h('div', { class: 'bk-stk' + (st.current ? ' hot' : '') }, [h('b', { text: String(st.current) }), h('span', { text: 'day win streak' + (st.best > st.current ? ' · best ' + st.best : '') })]),
        h('div', { class: 'bk-stk' + (vw.current ? ' hot2' : '') }, [h('b', { text: String(vw.current) }), h('span', { text: 'day workout streak' + (vw.best > vw.current ? ' · best ' + vw.best : '') })]),""")
# every past day can be tapped (a blank workout card waits on each)
rep("type: 'button', 'aria-label': label, 'aria-pressed': sel ? 'true' : 'false', disabled: !kinds.length,",
    "type: 'button', 'aria-label': label, 'aria-pressed': sel ? 'true' : 'false', disabled: t > Date.now() ? 'disabled' : null,")
rep("onclick: function () { bookState.day = sel ? '' : k; drawCal(); draw(); } }, [h('span', { class: 'bk-dn', text: String(d) }),",
    "onclick: function () { bookState.day = sel ? '' : k; drawCal(); draw(); if (!sel) setTimeout(function () { var dp = document.querySelector('.bk-daypanel'); if (dp) dp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); } }, [h('span', { class: 'bk-dn', text: String(d) }),")
# day panel replaces the little "showing" button
a="      if (bookState.day) { var p = bookState.day.split('-'); cal.appendChild(h('button', { class: 'bk-cal-clear', type: 'button', text: 'Showing '"
i=s.index(a); j=s.index("\n",i)
s=s[:i]+r"""      if (bookState.day) {
        var p = bookState.day.split('-'), dt = new Date(+p[0], p[1] - 1, +p[2]), mine = all.filter(function (e) { return e.at && dayKey(e.at) === bookState.day; });
        var panel = h('div', { class: 'bk-daypanel' }, [h('div', { class: 'bk-dp-top' }, [h('b', { text: dt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) }), h('button', { class: 'bk-cal-clear', type: 'button', text: '× Close', onclick: function () { bookState.day = ''; drawCal(); draw(); } })])]);
        if (mine.length) { panel.appendChild(h('span', { class: 'bk-dp-k', text: 'What you did' })); var dl = h('div', { class: 'bk-dp-list' }); mine.forEach(function (e) { dl.appendChild(card(e)); }); panel.appendChild(dl); }
        else panel.appendChild(h('p', { class: 'bk-dp-none', text: 'Nothing in your book for this day yet.' }));
        if (window.BT_VAGAL && window.BT_VAGAL.workoutCard) panel.appendChild(window.BT_VAGAL.workoutCard(bookState.day, function () { setTimeout(function () { APP.reload(); }, 400); }));
        cal.appendChild(panel);
      }"""+s[j:]
# tabs: proof + wins up front; date range
rep("    var tabs = [['all', 'Everything'], ['journal', 'Journal'], ['milestone', 'Milestones'], ['activity', 'Activities'], ['change', 'Before & now'], ['win', 'Wins & sparkles'], ['proof', 'Proof portfolio'], ['vagal', 'Vagal tone']];",
    "    var tabs = [['all', 'Everything'], ['proof', 'Proof portfolio'], ['win', 'Wins & joy'], ['journal', 'Journal'], ['vagal', 'Vagal tone'], ['activity', 'Activities'], ['milestone', 'Milestones'], ['change', 'Before & now']];")
rep("    wrap.appendChild(tabRow); wrap.appendChild(search); wrap.appendChild(list);",
r"""    var RANGES = [['all', 'All time'], ['week', 'Last 7 days'], ['month', 'This month'], ['30', 'Last 30 days'], ['custom', 'Pick dates']];
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
    wrap.appendChild(tabRow); wrap.appendChild(rangeBox); wrap.appendChild(search); wrap.appendChild(list);""")
rep("      var items = all.filter(function (e) { return (bookState.tab === 'all'",
    """      var rf = 0, rt = Infinity, n0 = new Date(); n0.setHours(0, 0, 0, 0);
      if (bookState.range === 'week') rf = n0.getTime() - 6 * DAY; else if (bookState.range === 'month') rf = new Date(n0.getFullYear(), n0.getMonth(), 1).getTime(); else if (bookState.range === '30') rf = n0.getTime() - 29 * DAY;
      else if (bookState.range === 'custom') { if (bookState.from) rf = new Date(bookState.from + 'T00:00:00').getTime(); if (bookState.to) rt = new Date(bookState.to + 'T23:59:59').getTime(); }
      var items = all.filter(function (e) { return (bookState.range === 'all' || (e.at && e.at >= rf && e.at <= rt)) && (bookState.tab === 'all'""")
# app logo on the right of activity / vagal cards
rep("      c.appendChild(body);\n      return c;\n    }", "      if (e.res) { var lg = h('span', { class: 'bk-logo', title: (resource(e.res) || {}).title || '' }, [emblem(e.res)]); c.classList.add('has-logo'); body.appendChild(lg); }\n      if (e.href && e.kind === 'vagal') c.classList.add('vagal');\n      c.appendChild(body);\n      return c;\n    }")
open(P,'w',encoding='utf-8').write(s); print('ok')
