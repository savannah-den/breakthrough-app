#!/usr/bin/env python3
"""Emotional Blueprint, simpler version (24 Nov 2026). The full version before this is kept as a draft in
src/canvases/blueprint-full.dc.html (/tools/emotional-blueprint-full.html, a back-end link only).
- Five tabs: Start here, What am I feeling?, My blueprints, Process it, More tools (Energy in Motion, Body map,
  Emotion mixer, Consciousness, ECT). Locked tabs are hidden instead of showing padlocks.
- Start here is just "Your first steps" (no mini course, no shortcuts grid, no video placeholders).
- Create your blueprints opens after Lesson 3: Naming Emotions (it was Lesson 4, after the course step that sends them there).
- What am I feeling? has a 1-minute quick check-in (where + feel, a name, what you need) beside the full one.
- My blueprints shows "Your pattern so far" once there are 2 check-ins.
Idempotent (marker EB_SIMPLE1). Run after the other patch_blueprint_* scripts, then tools/import_canvas.py."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_SIMPLE1' in s: print('blueprint simple already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
def scif_end(i):
    depth = 0
    for m in re.finditer(r'<sc-if\b|</sc-if>', s[i:]):
        depth += 1 if m.group() != '</sc-if>' else -1
        if depth == 0: return i + m.end()
    raise AssertionError('no end')
def cut_scif(opening):
    global s
    i = s.index(opening); j = scif_end(i); out = s[i:j]; s = s[:i] + s[j:]; return out

# ---- tabs
rep("var MENUTABS = [['home', 'Start here', 'door'], ['tune', 'What am I feeling?', 'other'], ['eim', 'Energy in Motion', 'wheel'], ['process', 'Process it', 'express'], ['mine', 'My blueprints', 'blueprint'], ['body', 'Body map', 'littleme'], ['blends', 'Emotion mixer', 'prepare'], ['levels', 'Consciousness', 'breath'], ['ect', 'ECT with Sav', 'hug']];",
    "/* EB_SIMPLE1 */ var MENUTABS = [['home', 'Start here', 'door'], ['tune', 'What am I feeling?', 'other'], ['mine', 'My blueprints', 'blueprint'], ['process', 'Process it', 'express'], ['more', 'More tools', 'wheel']];\nvar MORE_T = ['more', 'eim', 'body', 'blends', 'levels', 'energy', 'roots', 'menu', 'wheel'];")
rep("var tabs = MENUTABS.map(function (tb) { var on = s.tab === tb[0], lk = rLocked && tb[0] !== 'tune' && tb[0] !== 'ect';",
    "var tabs = MENUTABS.filter(function (tb) { return !(rLocked && tb[0] !== 'tune'); }).map(function (tb) { var on = tb[0] === 'more' ? MORE_T.indexOf(s.tab) >= 0 : s.tab === tb[0], lk = false;")
rep("tabHome: vt === 'home', tabTune: vt === 'tune',", "tabHome: vt === 'home', tabMore: vt === 'more', tabTune: vt === 'tune',")
rep("['home', 'tune', 'mine', 'process', 'eim', 'body'].indexOf(qt) >= 0", "['home', 'tune', 'mine', 'process', 'more', 'eim', 'body', 'blends', 'levels'].indexOf(qt) >= 0")

# ---- Start here: just your first steps
i = s.index('<sc-if value="{{tabHome}}"')
top = s.index('<sc-if value="{{homeToolsTop}}"', i)
tiles_block = s[top:scif_end(top)]
s = s[:top] + s[scif_end(top):]
a = s.index('<section class="sec" id="home-course">', i); b = s.index('</section>', a) + len('</section>\n')
s = s[:a] + s[b:]
cut_scif('<sc-if value="{{homeTools}}"')
rep('<span class="hand" style="font-size: 17px; color: #A8231F">Now it all makes sense</span>\n<p class="big">Your first steps</p>\n<p class="lead">Do these in order. Tap the button on each one to go straight there.</p>',
    '<span class="hand" style="font-size: 17px; color: #A8231F">Start here</span>\n<p class="big">Your first steps</p>\n<p class="lead">Your Emotional Blueprint helps you notice a feeling, name it, and let it move, and over time it shows you your own patterns. Do these in order. Tap the button on each one to go straight there.</p>')

# ---- More tools tab
tiles = re.findall(r'<button class="tooltile[^"]*" onClick="\{\{tool\.(?:eim|body|blends|levels|ect)\}\}">.*?</button>', tiles_block, re.S)
assert len(tiles) == 5, len(tiles)
more = ('\n<!-- ================= MORE TOOLS ================= -->\n<sc-if value="{{tabMore}}" hint-placeholder-val="{{ false }}">\n<section class="sec">\n'
        '<span class="hand" style="font-size: 17px; color: #A8231F">More tools</span>\n<p class="big">When you want to go deeper.</p>\n'
        '<p class="lead">You don’t need these to do the work. What am I feeling?, your blueprints and Process it are the main three. These are here when you’re curious.</p>\n'
        '<div class="tools">\n' + '\n'.join(tiles) + '\n</div>\n</section>\n</sc-if>\n')
rep('<!-- ================= ENERGY IN MOTION ================= -->', more + '\n<!-- ================= ENERGY IN MOTION ================= -->')
rep("      lx: lx, go: go, tool: tool,", "      lx: lx, go: go, tool: tool, goMore: function () { self.goTab('more'); },")

# ---- blueprints open after Lesson 3
rep("bpNeedVid: !ebVid, bpCanMake: ebVid,", "bpNeedVid: !(ebVid || !!ebDone.w4a2), bpCanMake: ebVid || !!ebDone.w4a2,")
rep('🔒 These open after the <strong>Processing Emotions</strong> video in Week 4. For now, have a play with the wheel and start naming what you feel.',
    '🔒 These open after <strong>Lesson 3: Naming Emotions</strong> in Week 4. For now, try What am I feeling? and start naming what you feel.')

# ---- quick check-in
QUICK = '''<!-- quick check-in (EB_SIMPLE1) -->
<sc-if value="{{tModeShow}}" hint-placeholder-val="{{ true }}">
<div class="tmode" role="group" aria-label="How long have you got?">
<button class="{{tmQuickCls}}" aria-pressed="{{tmQuickP}}" onClick="{{tmQuick}}"><span class="tmk">About 1 minute</span><b>Quick check-in</b><span>Where you feel it, a name for it, and what you need.</span></button>
<button class="{{tmFullCls}}" aria-pressed="{{tmFullP}}" onClick="{{tmFull}}"><span class="tmk">About 10 minutes</span><b>The full check-in</b><span>All three steps, write it out, name it and feel it, in your order.</span></button>
</div>
</sc-if>
<sc-if value="{{qShow}}" hint-placeholder-val="{{ false }}">
<section class="flow qflow" aria-live="polite">
<div class="qtop"><span class="hand" style="font-size: 16px; color: #A8231F">{{qKick}}</span><span class="qdots"><sc-for list="{{qDots}}" as="d" hint-placeholder-count="3"><i class="{{d.cls}}"></i></sc-for></span></div>
<p class="qh">{{qTitle}}</p>
<p class="lead" style="font-size: 15.5px">{{qHint}}</p>
<sc-if value="{{qS0}}" hint-placeholder-val="{{ true }}">
<span class="qq">Where is it?</span>
<div class="chips"><sc-for list="{{qSpots}}" as="c" hint-placeholder-count="9"><button class="{{c.cls}}" aria-pressed="{{c.pressed}}" onClick="{{c.pick}}">{{c.l}}</button></sc-for></div>
<span class="qq">What does it feel like?</span>
<div class="chips"><sc-for list="{{qFeels}}" as="c" hint-placeholder-count="8"><button class="{{c.cls}}" aria-pressed="{{c.pressed}}" onClick="{{c.pick}}">{{c.l}}</button></sc-for></div>
</sc-if>
<sc-if value="{{qS1}}" hint-placeholder-val="{{ false }}">
<sc-if value="{{qHasGuess}}" hint-placeholder-val="{{ false }}"><p class="qguess">{{qGuess}}</p></sc-if>
<div class="qemos"><sc-for list="{{qEmos}}" as="c" hint-placeholder-count="7"><button class="{{c.cls}}" aria-pressed="{{c.pressed}}" onClick="{{c.pick}}"><b>{{c.l}}</b><span>{{c.h}}</span></button></sc-for></div>
</sc-if>
<sc-if value="{{qS2}}" hint-placeholder-val="{{ false }}">
<div class="qneeds"><sc-for list="{{qNeeds}}" as="c" hint-placeholder-count="5"><button class="{{c.cls}}" aria-pressed="{{c.pressed}}" onClick="{{c.pick}}">{{c.l}}</button></sc-for></div>
</sc-if>
<sc-if value="{{qS3}}" hint-placeholder-val="{{ false }}">
<div class="qdone"><p class="qdone-t">{{qDoneText}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px"><button class="primary maroon" onClick="{{goMine}}">See my blueprints</button><sc-if value="{{qCanProcess}}" hint-placeholder-val="{{ false }}"><button class="ghost solid" onClick="{{qProcess}}">Process it now</button></sc-if><button class="ghost" onClick="{{qAgain}}">Another quick one</button><button class="ghost" onClick="{{tmFull}}">Do the full check-in</button></div></div>
</sc-if>
<sc-if value="{{qNav}}" hint-placeholder-val="{{ true }}">
<div class="qnav"><sc-if value="{{qHasBack}}" hint-placeholder-val="{{ false }}"><button class="ghost" onClick="{{qBack}}">Back</button></sc-if><button class="primary" onClick="{{qNext}}">{{qNextL}}</button></div>
</sc-if>
</section>
</sc-if>
'''
rep('<sc-if value="{{tuneDone}}" hint-placeholder-val="{{ false }}">\n<section class="donebox" aria-live="polite">', QUICK + '<sc-if value="{{tuneDone}}" hint-placeholder-val="{{ false }}">\n<section class="donebox" aria-live="polite">')
rep("tuneDone: !!s.tuneDone && !ftShow, tuneFlow: !s.tuneDone && !ftShow,", "tuneDone: !!s.tuneDone && !ftShow && s.tMode !== 'quick', tuneFlow: !s.tuneDone && !ftShow && s.tMode !== 'quick',")
QLOGIC = r'''
    var qVals = (function () { // ---- quick check-in (EB_SIMPLE1), its own scope so nothing below can clash
    var q = s.qk || { where: {}, feel: {}, emo: null, need: null }, qs = s.qStep || 0, qQuick = s.tMode === 'quick';
    var qSet = function (patch) { self.setState({ qk: Object.assign({}, self.state.qk || { where: {}, feel: {}, emo: null, need: null }, patch) }); };
    var qFlip = function (field, k) { var o = Object.assign({}, q[field] || {}); if (o[k]) delete o[k]; else o[k] = true; var p = {}; p[field] = o; qSet(p); };
    var qFeelList = keys(q.feel), qScore = EMO.map(function (e) { return { k: e[0], n: e[1], h: qFeelList.filter(function (f) { return (e[3].feel || []).indexOf(f) >= 0; }).length }; }).sort(function (a, b) { return b.h - a.h; });
    var qBest = qScore[0] && qScore[0].h > 0 ? qScore[0] : null;
    var qNeedOpts = (q.emo && NEEDS[q.emo] ? NEEDS[q.emo].slice(0, 4) : []).concat(GENERAL).map(function (x) { return x[2]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 6);
    var qSave = function () {
      var c = self.state.qk || q, en = { id: String(Date.now()), at: Date.now(), what: 'Quick check-in', dump: '', quick: true,
        emos: c.emo ? [{ id: c.emo, n: emoName(c.emo) }] : [], recap: '', size: null, need: c.need || '', little: '', status: 'enough',
        feel: keys(c.feel), where: keys(c.where).filter(function (k) { return k !== 'unsure'; }).map(spotName), shape: [], colour: [], temp: null, force: null, urge: [], words: [], feelWords: '' };
      self.setState({ history: [en].concat(self.state.history || []), qStep: 3, qSaved: en.id });
    };
    var qTitles = ['Drop into your body', 'If you had to name it…', 'What do you need right now?', 'Saved'];
    var qHints = ['One slow breath in, and a long breath out. Scan from your head down to your toes. Tap where you notice it and how it feels. Anything counts.',
      'Read these slowly and notice which one your body goes “yeah… that” to. You don’t need to be sure.',
      'Ask your body, not your brain. Pick the one you feel a little pull towards, then go and do it.', ''];
    var qVals = {
      tModeShow: vt === 'tune' && !s.tuneDone && ((!qQuick && !(s.tStep || 0)) || (qQuick && qs === 0)),
      tmQuickCls: 'tmb' + (qQuick ? ' on' : ''), tmFullCls: 'tmb' + (!qQuick ? ' on' : ''), tmQuickP: qQuick ? 'true' : 'false', tmFullP: !qQuick ? 'true' : 'false',
      tmQuick: function () { self.setState({ tMode: 'quick', qStep: 0, qk: { where: {}, feel: {}, emo: null, need: null }, tuneDone: null }); },
      tmFull: function () { self.setState({ tMode: 'full', qStep: 0, tStep: 0, tuneDone: null }); },
      qShow: vt === 'tune' && qQuick, qS0: qs === 0, qS1: qs === 1, qS2: qs === 2, qS3: qs === 3, qNav: qs < 3, qHasBack: qs > 0,
      qKick: qs < 3 ? 'Quick check-in · ' + (qs + 1) + ' of 3' : 'Quick check-in', qTitle: qTitles[qs], qHint: qHints[qs],
      qDots: [0, 1, 2].map(function (i) { return { cls: i <= qs ? 'on' : '' }; }),
      qSpots: SPOTS.concat(WHEREX).map(function (sp) { var on = !!(q.where || {})[sp[0]]; return { l: sp[1], cls: on ? 'chip on' : 'chip', pressed: on ? 'true' : 'false', pick: function () { qFlip('where', sp[0]); } }; }),
      qFeels: FEEL.map(function (f) { var on = !!(q.feel || {})[f]; return { l: f, cls: on ? 'chip on' : 'chip', pressed: on ? 'true' : 'false', pick: function () { qFlip('feel', f); } }; }),
      qHasGuess: !!qBest, qGuess: qBest ? 'What you felt in your body sounds a lot like ' + low(qBest.n) + '. Go with your body, though.' : '',
      qEmos: (qBest ? [EMOBY[qBest.k]].concat(EMO.filter(function (e) { return e[0] !== qBest.k; })) : EMO).map(function (e) { var on = q.emo === e[0]; return { l: e[1], h: e[2], cls: 'qemo' + (on ? ' on' : ''), pressed: on ? 'true' : 'false', pick: function () { qSet({ emo: on ? null : e[0], need: null }); } }; }).concat([{ l: 'I’m not sure', h: 'That’s okay. It still counts, and it still saves.', cls: 'qemo' + (q.emo === null && qs === 1 && s.qUnsure ? ' on' : ''), pressed: 'false', pick: function () { self.setState({ qUnsure: true }); qSet({ emo: null }); } }]),
      qNeeds: qNeedOpts.map(function (t) { var on = q.need === t; return { l: t, cls: 'qneed' + (on ? ' on' : ''), pressed: on ? 'true' : 'false', pick: function () { qSet({ need: on ? null : t }); } }; }),
      qNextL: qs === 2 ? 'Save it' : 'Next',
      qNext: function () { if (qs === 2) { qSave(); return; } self.setState({ qStep: qs + 1 }); },
      qBack: function () { self.setState({ qStep: Math.max(0, qs - 1) }); },
      qAgain: function () { self.setState({ qStep: 0, qk: { where: {}, feel: {}, emo: null, need: null }, qUnsure: false }); },
      qCanProcess: !!q.emo && !ebLocked, qProcess: function () { self.startProcess(q.emo, s.qSaved); },
      qDoneText: q.emo ? 'Saved to your ' + low(emoName(q.emo)) + ' blueprint. ' + (q.need ? 'Now go and do it: ' + low(q.need).replace(/\.$/, '') + '.' : 'Every check-in makes your pattern clearer.') : 'Saved. Even “not sure” is useful: it shows you what this feeling does in your body.'
    };
    // ---- your pattern so far (EB_SIMPLE1)
    var patH = s.history || [], patT = function (arr) { var c = {}; arr.forEach(function (a) { (a || []).forEach(function (w) { c[w] = (c[w] || 0) + 1; }); }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }); };
    var patRows = EMO.map(function (e) {
      var hs = patH.filter(function (h) { return (h.emos || []).some(function (x) { return x.id === e[0]; }); }); if (hs.length < 2) return null;
      var wh = patT(hs.map(function (h) { return h.where; })).slice(0, 2).map(low), fe = patT(hs.map(function (h) { return h.feel; })).slice(0, 3).map(low), nd = hs.map(function (h) { return h.need; }).filter(Boolean)[0] || '';
      var bits = []; if (wh.length) bits.push('You feel it most in your ' + join(wh) + '.'); if (fe.length) bits.push('It usually feels ' + join(fe) + '.'); if (nd) bits.push('Last time, what you needed: ' + low(nd).replace(/\.$/, '') + '.');
      return { n: e[1], img: IMG[e[0]] || IMG.other, count: hs.length + ' times', t: bits.join(' ') || 'Keep checking in and the details will fill in here.' };
    }).filter(Boolean);
    qVals.patShow = patH.length >= 2; qVals.patRows = patRows; qVals.patNone = patH.length >= 2 && !patRows.length;
    return qVals;
    })();
'''
rep("    var tabs = MENUTABS.filter(", QLOGIC + "    var tabs = MENUTABS.filter(")
# merge the values into what render returns (find the object with tabHome: and wrap)
rep("    return Object.assign(flags, eflags, {", "    return Object.assign(flags, eflags, qVals, {")
CSS = """.tmode{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.tmb{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:16px 18px;border-radius:22px;border:1.5px solid #EDE3DF;background:#FFFFFF;color:#1F1412;text-align:left;cursor:pointer;font:inherit}
.tmb b{font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#4E0C08}.tmb span{font-size:14px;color:#463A38;line-height:1.45}
.tmb .tmk{font-family:'Patrick Hand SC',cursive;letter-spacing:.06em;font-size:15px;color:#A8231F}
.tmb.on{border-color:#1F1412;background:#F1F9A6}
.qflow{gap:14px}
.qtop{display:flex;justify-content:space-between;align-items:center;gap:10px}
.qdots{display:flex;gap:6px}.qdots i{width:28px;height:6px;border-radius:999px;background:#EDE3DF}.qdots i.on{background:#4E0C08}
.qh{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:clamp(24px,4vw,30px);color:#1F1412}
.qq{font-weight:600;font-size:15px;margin-top:4px}
.qguess{margin:0;padding:10px 14px;border-radius:16px;background:#FBE6FC;font-size:14.5px}
.qemos{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}
.qemo,.qneed{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;border-radius:18px;border:1.5px solid #EDE3DF;background:#FFFFFF;color:#1F1412;text-align:left;cursor:pointer;font:inherit}
.qemo b{font-size:16px}.qemo span{font-size:13px;color:#463A38;line-height:1.4}
.qneeds{display:flex;flex-direction:column;gap:8px}.qneed{font-size:15px;line-height:1.45}
.qemo.on,.qneed.on{border-color:#1F1412;background:#F1F9A6}
.qnav{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.qnav .primary{margin-left:auto}
.qdone{display:flex;flex-direction:column;gap:14px}.qdone-t{margin:0;font-size:17px;line-height:1.55}
.patcard{display:flex;flex-direction:column;gap:10px;padding:20px;border-radius:24px;background:#FFF4EE;border:1.5px solid #1F1412}
.patrow{display:flex;gap:12px;align-items:flex-start;padding:10px;border-radius:16px;background:#FFFFFF}
.patrow img{flex:none;width:44px;height:44px;border-radius:12px}.patrow b{font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#4E0C08}
.patrow .pc{font-size:12px;font-weight:600;color:#A8231F;margin-left:6px}.patrow p{margin:2px 0 0;font-size:14px;line-height:1.5;color:#1F1412}
</style>"""
assert s.count('</style>') >= 1
s = s.replace('</style>', CSS, 1)
# pattern card at the top of My blueprints (under Create your blueprints)
rep('<section class="sec">\n<p class="big">My blueprints.</p>', """<sc-if value="{{patShow}}" hint-placeholder-val="{{ false }}"><section class="patcard"><span class="hand" style="font-size: 16px; color: #A8231F">Your pattern so far</span><p class="lead" style="font-size: 15px">From your check-ins. The more you check in, the clearer this gets.</p><sc-for list="{{patRows}}" as="r" hint-placeholder-count="2"><div class="patrow"><img src="{{r.img}}" alt=""><div><b>{{r.n}}</b><span class="pc">{{r.count}}</span><p>{{r.t}}</p></div></div></sc-for><sc-if value="{{patNone}}" hint-placeholder-val="{{ false }}"><p class="lead" style="font-size: 15px">Once you’ve named the same feeling twice, its pattern shows up here.</p></sc-if></section></sc-if>
<section class="sec">
<p class="big">My blueprints.</p>""")
# remember quick or full
rep("JSON.stringify({ feelType: s.feelType || null,", "JSON.stringify({ tMode: s.tMode || null, feelType: s.feelType || null,")
rep("        blueprints: s.blueprints || {}, history:", "        tMode: s.tMode || null, blueprints: s.blueprints || {}, history:")
open(P, 'w', encoding='utf-8').write(s)
print('blueprint simplified')
