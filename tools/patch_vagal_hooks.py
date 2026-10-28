# Hooks in course.js for the Vagal Tone Workout tools (vagal.js), the proof-portfolio lesson, and the shared kit. Idempotent.
P='public/js/course.js'
s=open(P,encoding='utf-8').read()
if 'kit: function' in s: print('already patched'); raise SystemExit
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

# book: vagal entries + kind + calendar glyph + tab
rep("    if (window.BT_SAVES) window.BT_SAVES.list().forEach(", "    if (window.BT_VAGAL && window.BT_VAGAL.bookEntries) { try { window.BT_VAGAL.bookEntries().forEach(push); } catch (e) {} }\n    if (window.BT_SAVES) window.BT_SAVES.list().forEach(")
rep("win: ['Wins & joy', '#E4F27A', 'star'], proof: ['Proof', '#E4F27A', 'tick']", "win: ['Wins & joy', '#E4F27A', 'star'], proof: ['Proof', '#E4F27A', 'tick'], vagal: ['Vagal tone', '#BFE3D0', 'play']")
rep("var GLY = { milestone: '★', activity: '◆', journal: '✎', win: '✦', proof: '✓', change: '↻' };", "var GLY = { milestone: '★', activity: '◆', journal: '✎', win: '✦', proof: '✓', change: '↻', vagal: '≈' };")
rep("['proof', 'Proof portfolio']]", "['proof', 'Proof portfolio'], ['vagal', 'Vagal tone']]")

# proof portfolio lesson: the proof card under the video; adding proof ticks the "start your portfolio" activity
rep("  var IN_PAGE = { intent: 1, setup: 1 };", "  var IN_PAGE = { intent: 1, setup: 1 };\n  var PROOF_LESSON = 'w2l3';")
rep("        addEvidence(v, { spark: proofType, beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves });",
    "        addEvidence(v, { spark: proofType, beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves });\n        try { var pf = lessonForRes('proof'); if (pf && lessonOpen(pf.l.id) && !prog().done[pf.l.id]) markDone(pf.l.id, true); } catch (e) {}")

# routes
rep("Profile: ProfileView, ActDone: ActDoneView,", "Profile: ProfileView, Proof: function (root) { bookState.tab = 'proof'; bookState.day = ''; BookView(root); }, ActDone: ActDoneView,")
rep("  var RET_ROUTES = { 'BreakingOut.dc.html': 'box', 'StarHome.dc.html': 'star' };", "  var RET_ROUTES = { 'BreakingOut.dc.html': 'box', 'StarHome.dc.html': 'star', Vagal: 'vagal', Breathe: 'breathe', Dose: 'dose', Pause: 'pause', Move: 'move', Proof: 'proof' };")

# vagal hub card in the course list: its parts sit underneath it
rep("      li.open && !dn && skippedActs().some(function (x) { return x.l.id === l.id; }) ? h('span', { class: 'bt-act-wait', text: 'Come back to this one. The doing creates the change.' }) : null\n    ]));",
    "      li.open && !dn && skippedActs().some(function (x) { return x.l.id === l.id; }) ? h('span', { class: 'bt-act-wait', text: 'Come back to this one. The doing creates the change.' }) : null\n    ]));\n    if (r.parts && r.parts.length && li.open) { var wrapP = h('div', { class: 'bt-act-group' }); setTimeout(function () { if (card.parentNode && !card.__grouped) { card.__grouped = true; card.parentNode.insertBefore(wrapP, card); wrapP.appendChild(card); wrapP.appendChild(h('div', { class: 'bt-act-parts' }, r.parts.map(function (pid) { var pr = resource(pid); if (!pr) return null; var op = isOpen(pr.week); return op ? h('a', { class: 'bt-act-part', href: resHref(pr) }, [emblem(pid), h('span', { text: pr.title })]) : h('span', { class: 'bt-act-part lock' }, [emblem(pid), h('span', { text: pr.title + ' · Week ' + pr.week })]); }))); } }, 0); }")

# shared kit for vagal.js
rep("    unlockedWeek: function () { return APP ? unlockedWeek() : 1; },",
    "    unlockedWeek: function () { return APP ? unlockedWeek() : 1; },\n    kit: function () { return { pageHead: pageHead, back: back, waves: waves, icon: icon, emblem: emblem, party: party, sparkleBurst: sparkleBurst, dayKey: dayKey, videoBlock: videoBlock, findLesson: findLesson, lessonForRes: lessonForRes, lessonOpen: lessonOpen, isOpen: isOpen, markDone: function (id) { if (lessonOpen(id) && !prog().done[id]) { markDone(id, true); return true; } return false; }, isDone: function (id) { return !!prog().done[id]; }, resource: resource, rd: rd, wr: wr, tx: tx, playground: playground }; },")
open(P,'w',encoding='utf-8').write(s); print('ok')
