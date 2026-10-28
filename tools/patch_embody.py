# Embodiment = her weekly plan: its own look in the course list, and a "this week" card + weekly calendar on Home. Idempotent.
P='public/js/course.js'
s=open(P,encoding='utf-8').read()
if 'function embodyCard' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)

CODE = r'''
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
        var core = (w.lessons || []).filter(function (x) { return !isEmbody(x) && !x.optional; });
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
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var start = from ? new Date(Math.max(from, t0.getTime() - 6 * DAY)) : new Date(t0.getTime() - ((t0.getDay() + 6) % 7) * DAY);
    var row = h('div', { class: 'bt-wkcal', role: 'list' });
    for (var i = 0; i < 7; i++) {
      (function (i) {
        var d = new Date(start); d.setDate(start.getDate() + i); var k = dayKey(d.getTime()), today = k === dayKey(Date.now()), fut = d.getTime() > Date.now();
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
    return h('section', { class: 'bt-thisweek', 'aria-label': 'This week' }, [
      h('div', { class: 'bt-tw-top' }, [h('div', null, [h('span', { class: 'bt-tw-k', text: 'This week you’re working on' }), h('h2', { class: 'bt-tw-t', text: name })]), h('span', { class: 'bt-tw-day', text: over ? 'Day ' + e.dayN : 'Day ' + e.dayN + ' of 7' })]),
      h('p', { class: 'bt-tw-s', text: over ? 'Keep it going until you start Week ' + (e.w.week + 1) + '. The doing creates the change.' : (e.l.res || [])[0] === 'vagal' ? 'Your four daily practices: DOSE, Breathe, Pause, Move. Tap a day to see it.' : 'Tick off each day you do it.' }),
      weekStrip(e.l, e.from),
      h('a', { class: 'bt-btn lime bt-tw-go', href: lessonHref(e.l), text: 'Open ' + name + ' →' })
    ]);
  }
  function embodyCard(l, li, dn) {
    var name = l.title.replace(/^embodiment:\s*/i, ''), r = resource((l.res || [])[0]), e = embodyNow(), cur = e && e.l.id === l.id;
    var card = li.open ? h('a', { class: 'bt-embc' + (dn ? ' done' : '') + (cur ? ' cur' : ''), href: lessonHref(l) }) : h('div', { class: 'bt-embc lock' });
    card.appendChild(h('div', { class: 'bt-embc-top' }, [h('span', { class: 'bt-embc-k', text: cur ? 'This week’s embodiment · day ' + e.dayN : 'Embodiment · your weekly practice' }), li.open ? null : icon('lock', 'bt-embc-lock')]));
    card.appendChild(h('b', { class: 'bt-embc-t', text: name }));
    card.appendChild(h('span', { class: 'bt-embc-d', text: li.open ? (r ? r.desc : 'Practise it for 7 days after you finish this week’s lessons.') : li.why }));
    var days = h('span', { class: 'bt-embc-days', 'aria-hidden': 'true' });
    var from = cur ? e.from : null;
    for (var i = 0; i < 7; i++) { var k = from ? dayKey(from + i * DAY) : null, st = k ? embodyDay(l, k) : { any: false }; days.appendChild(h('i', { class: st.any ? 'on' : '', text: 'MTWTFSS'.charAt(((from ? new Date(from + i * DAY).getDay() : i + 1) + 6) % 7) })); }
    card.appendChild(days);
    if (li.open) {
      var tick = h('button', { class: 'bt-act-tick' + (dn ? ' on' : ''), type: 'button', 'aria-pressed': dn ? 'true' : 'false', 'aria-label': dn ? 'Done' : 'Mark as done', onclick: function (ev) { ev.preventDefault(); ev.stopPropagation(); markDone(l.id, !prog().done[l.id]); var y = window.scrollY; APP.reload(); window.scrollTo(0, y); setTimeout(celebrate, 300); } });
      tick.appendChild(icon('tick')); tick.appendChild(h('span', { text: dn ? 'Done' : 'Done?' }));
      card.appendChild(tick);
    }
    if (r && r.parts && li.open) {
      var grp = h('div', { class: 'bt-act-group' }, [card, h('div', { class: 'bt-act-parts' }, r.parts.map(function (pid) { var pr = resource(pid); if (!pr) return null; var op = pr.week <= 1 || isOpen(pr.week); return op ? h('a', { class: 'bt-act-part', href: resHref(pr) }, [emblem(pid), h('span', { text: pr.title })]) : h('span', { class: 'bt-act-part lock' }, [emblem(pid), h('span', { text: pr.title + ' · Week ' + pr.week })]); }))]);
      return grp;
    }
    return card;
  }
'''
rep("  var mo = null;\n  function watchSlots() {", CODE + "  var mo = null;\n  function watchSlots() {")
rep("        if (isActivityCard(l)) { var ac = activityCard(l, li, dn);", "        if (isEmbody(l)) { var ec = embodyCard(l, li, dn); if ((l.res || [])[0]) inline[l.res[0]] = 1; list.appendChild(ec); return; }\n        if (isActivityCard(l)) { var ac = activityCard(l, li, dn);")
rep("    if (c) slot.appendChild(c);\n    slot.appendChild(proofHome());", "    if (c) slot.appendChild(c);\n    var tw = thisWeek(); if (tw) slot.appendChild(tw);\n    slot.appendChild(proofHome());")
# embodiment lessons: activities don't block; nor should the weekly practice
rep("if (!blocked && !p.done[l.id] && !l.optional && !isActivityCard(l)) blocked", "if (!blocked && !p.done[l.id] && !l.optional && !isActivityCard(l) && !/^embodiment/i.test(l.title || '')) blocked")
open(P,'w',encoding='utf-8').write(s); print('ok')
