# Activities don't block the course: she can move on, the activity stays un-ticked and Open loops keep nudging her back. Idempotent.
P='public/js/course.js'
s=open(P,encoding='utf-8').read()
if 'function skippedActs' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
rep("        if (!blocked && !p.done[l.id] && !l.optional) blocked = { w: w, l: l };",
    "        if (!blocked && !p.done[l.id] && !l.optional && !isActivityCard(l)) blocked = { w: w, l: l }; // activities never block")
rep("  function upNext() {\n    var list = openLessons(), p = prog();\n    if (!list.length) return null;",
    "  // activities she's moved past (a later lesson is done) but hasn't done yet\n  function skippedActs() {\n    var all = allLessons(), p = prog(), lastDone = -1;\n    all.forEach(function (x, i) { if (p.done[x.l.id]) lastDone = i; });\n    return all.filter(function (x, i) { return i < lastDone && isActivityCard(x.l) && !p.done[x.l.id] && lessonOpen(x.l.id); });\n  }\n  function upNext() {\n    var list = openLessons(), p = prog(), skip = {};\n    skippedActs().forEach(function (x) { skip[x.l.id] = 1; });\n    list = list.filter(function (x) { return !skip[x.l.id]; });\n    if (!list.length) return null;")
rep("    // intentions\n    if (!(tx(d.intention)",
r'''    // activities she skipped past: the doing is what creates the change
    var sk = skippedActs();
    if (sk.length) {
      var DOING = ['The doing creates the change, not the learning alone.', 'Knowing it is step one. Doing it is where the rewiring happens.', 'Watching is learning. Doing is changing.', 'Your brain changes when you practise, not when you just listen.'];
      var r0 = resource(sk[0].l.res[0]);
      out.push({ id: 'acts-' + sk.map(function (x) { return x.l.id; }).join('.') + '-' + Math.floor(Date.now() / (3 * DAY)), kind: 'act', title: sk.length === 1 ? (r0 ? r0.title : sk[0].l.title) + ' is waiting for you' : sk.length + ' activities waiting for you', text: DOING[Math.floor(Date.now() / DAY) % DOING.length] + (sk.length > 1 ? ' Start with ' + (r0 ? r0.title : sk[0].l.title) + '.' : ''), href: lessonHref(sk[0].l), cta: 'Do it now' });
    }
    // intentions
    if (!(tx(d.intention)''')
# activity card in the course list: a gentle "come back to this" when she's moved past it
rep("      h('span', { class: 'bt-act-d', text: li.open ? (hasVid ? 'Watch the video, then open ' + r.title + '.' : (r.desc || '')) : li.why })\n    ]));",
    "      h('span', { class: 'bt-act-d', text: li.open ? (hasVid ? 'Watch the video, then open ' + r.title + '.' : (r.desc || '')) : li.why }),\n      li.open && !dn && skippedActs().some(function (x) { return x.l.id === l.id; }) ? h('span', { class: 'bt-act-wait', text: 'Come back to this one. The doing creates the change.' }) : null\n    ]));")
open(P,'w',encoding='utf-8').write(s); print('ok')
