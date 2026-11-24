#!/usr/bin/env python3
"""Emotional Blueprint, What am I feeling? (24 Nov 2026): after the "three steps" card, people pick how they
usually experience a feeling: think it (write it out first), feel it (body first) or see it (name it on the wheel first).
Everyone still does all three steps; only the order changes. Uses the existing wayIn / WAY_SEQ orders.
Idempotent (marker EB_WAY1). Runs after patch_blueprint_simple.py, then tools/import_canvas.py."""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_WAY1' in s: print('blueprint way-in already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
i = s.index('<section class="ebsteps">'); j = s.index('</section>', i) + len('</section>')
PICK = '''
<!-- EB_WAY1 -->
<sc-if value="{{wayShow}}" hint-placeholder-val="{{ true }}">
<section class="waypick">
<span class="hand" style="font-size: 17px; color: #A8231F">Where do you start?</span>
<p class="wp-h">How do feelings usually show up for you?</p>
<p class="lead" style="font-size: 16px">Everyone experiences emotions a little differently. You’ll write, name and feel every time. Where you start changes the order, and how much writing there is. Start with the one that comes most naturally to you.</p>
<div class="wp-l"><button class="{{w0.cls}}" aria-pressed="{{w0.pressed}}" onClick="{{w0.pick}}"><span class="wp-art"><svg viewBox="0 0 120 100" aria-hidden="true"><path d="M22 14 L92 10 L96 88 L26 92 Z" fill="#FFFFFF" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 30 q14 -4 26 0 t24 -2 M34 44 q10 4 22 0 t28 2 M34 58 q16 -5 30 0 t18 -1 M34 72 q8 3 18 0" fill="none" stroke="#B5281E" stroke-width="2.2" stroke-linecap="round"/><path class="ebs-pen" d="M86 74 L108 38 L114 42 L92 78 Z" fill="#F4C2F7" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M86 74 L84 84 L92 78" fill="#F28C3B" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="wp-q">{{w0.q}}</span><b>{{w0.t}}</b><span class="wp-d">{{w0.d}}</span><span class="wp-o">{{w0.o}}</span></button><button class="{{w1.cls}}" aria-pressed="{{w1.pressed}}" onClick="{{w1.pick}}"><span class="wp-art"><svg viewBox="0 0 120 100" aria-hidden="true"><circle cx="60" cy="18" r="11" fill="#FFFFFF" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 29 V66 M60 66 L48 92 M60 66 L72 92 M60 40 L40 56 M60 40 L80 56" fill="none" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle class="ebs-glow" cx="60" cy="44" r="9" fill="#E5534B" opacity=".55"/><circle class="ebs-glow g2" cx="60" cy="32" r="5" fill="#F2994A" opacity=".55"/><path d="M20 30 q-6 10 0 20 M100 30 q6 10 0 20" fill="none" stroke="#B9ADAA" stroke-width="2.4" stroke-linecap="round"/></svg></span><span class="wp-q">{{w1.q}}</span><b>{{w1.t}}</b><span class="wp-d">{{w1.d}}</span><span class="wp-o">{{w1.o}}</span></button><button class="{{w2.cls}}" aria-pressed="{{w2.pressed}}" onClick="{{w2.pick}}"><span class="wp-art"><svg viewBox="0 0 120 100" aria-hidden="true"><g class="ebs-wheel" style="transform-origin:60px 50px"><path d="M60 50 L60 12 A38 38 0 0 1 93 31 Z" fill="#E5534B" stroke="#4E0C08" stroke-width="2"/><path d="M60 50 L93 31 A38 38 0 0 1 93 69 Z" fill="#F2994A" stroke="#4E0C08" stroke-width="2"/><path d="M60 50 L93 69 A38 38 0 0 1 60 88 Z" fill="#F2C94C" stroke="#4E0C08" stroke-width="2"/><path d="M60 50 L60 88 A38 38 0 0 1 27 69 Z" fill="#7CC46A" stroke="#4E0C08" stroke-width="2"/><path d="M60 50 L27 69 A38 38 0 0 1 27 31 Z" fill="#7B7FC4" stroke="#4E0C08" stroke-width="2"/><path d="M60 50 L27 31 A38 38 0 0 1 60 12 Z" fill="#E8338A" stroke="#4E0C08" stroke-width="2"/><circle cx="60" cy="50" r="9" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2"/></g><path d="M98 82 l-12 -14 m0 0 l2 9 m-2 -9 l9 1" fill="none" stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="83" cy="35" r="6" fill="none" stroke="#FFFFFF" stroke-width="3"/></svg></span><span class="wp-q">{{w2.q}}</span><b>{{w2.t}}</b><span class="wp-d">{{w2.d}}</span><span class="wp-o">{{w2.o}}</span></button></div>
<sc-if value="{{wayPicked}}" hint-placeholder-val="{{ false }}"><p class="wp-note">{{wayNote}}</p></sc-if>
</section>
</sc-if>'''
s = s[:j] + PICK + s[j:]
LOGIC = r'''
    var wayVals = (function () { // EB_WAY1: think it, feel it or see it
      var W = [[0, 'Do you think about your emotions?', 'Write it out first', 'You tend to go over things in your head: what happened, why, what it means. A big brain dump comes first, then you name it and feel it. The longest of the three.', 'Write it out → name it → feel it · about 10 min'],
        [1, 'Do you feel emotions in your body?', 'Feel it first', 'You notice it physically before you can explain it: a tight chest, a lump in your throat, a buzz. Your body leads, a line on what happened, then the name.', 'Feel it → a line on what happened → name it · about 5 min'],
        [2, 'Do you visualise your emotions?', 'Name it first', 'You see it: a colour, a shape, a picture. You find it on the feelings wheel first, jot what happened, then check in with your body.', 'Name it → a line on what happened → feel it · about 3 min']];
      var cur = typeof s.wayIn === 'number' ? s.wayIn : null, started = (s.tStep || 0) > 0;
      return {
        wayShow: vt === 'tune', wayPicked: true,
        wayNote: cur !== null ? (started ? 'You’re part way through a check-in. Your new starting point is used next time, or tap Start over.' : 'Your check-in is open below. Next time it starts here too, and you can change it any time.') : 'Tap the one that sounds most like you and your check-in opens below.',
        tModeShow: false, qShow: false,
        w0: null, w1: null, w2: null,
        wayOpts: W.map(function (w) { var on = cur === w[0]; return { q: w[1], t: w[2], d: w[3], o: w[4], cls: 'wp-b' + (on ? ' on' : ''), pressed: on ? 'true' : 'false',
          pick: function () { var p = { wayIn: w[0], tMode: 'full', tuneDone: null }; if (!(self.state.tStep || 0) || self.state.wayIn !== w[0] && !self.state.tStep) p.tStep = 0; self.setState(p); setTimeout(function () { try { var f = [].slice.call(document.querySelectorAll('section.flow')).filter(function (x) { return !x.classList.contains('qflow') && x.offsetParent; })[0]; if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }, 120); } }; })
      };
    })();
    wayVals.w0 = wayVals.wayOpts[0]; wayVals.w1 = wayVals.wayOpts[1]; wayVals.w2 = wayVals.wayOpts[2];
'''
rep("    var qVals = (function () {", LOGIC + "    var qVals = (function () {")
rep("    return Object.assign(flags, eflags, qVals, {", "    return Object.assign(flags, eflags, qVals, wayVals, {")
# no quick/full switch any more: the three starting points ARE the choice. Writing it out first is the longest;
# feel it first and name it first get a one-line "what happened" instead of the big brain dump.
rep("var WAY_SEQ = [['d', 'w', 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 'd', 'w', 4, 5, 6, 7], ['w', 'd', 1, 2, 3, 4, 5, 6, 7],",
    "var WAY_SEQ = [['d', 'w', 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 'dl', 'w', 4, 5, 6, 7], ['w', 'dl', 1, 4, 5, 6, 7],")
rep("function ebGroup(ph) { return ph === 'd' ?", "function ebGroup(ph) { return ph === 'd' || ph === 'dl' ?")
rep("function tStepName(ph) { if (ph === 'w') return 'name it on the wheel';", "function tStepName(ph) { if (ph === 'w') return 'name it on the wheel'; if (ph === 'dl') return 'what happened';")
rep("var tm = tPh === 'w' ? TW_STEP : TSTEPS[ts],", "var tm = tPh === 'w' ? TW_STEP : tPh === 'dl' ? TDL_STEP : TSTEPS[ts],")
rep("var TW_STEP = [", "var TDL_STEP = ['Step 1', 'What happened?', 'journal', 'Next', 'Just a line or two. Get it out of your head and onto the page, then come back to your body.'];\nvar TW_STEP = [")
rep("tShowDump: tPh === 'd' || tPh === 'dw',", "tShowDump: tPh === 'd' || tPh === 'dw' || tPh === 'dl', tDumpBig: tPh !== 'dl',")
rep('<sc-if value="{{tNotBp}}" hint-placeholder-val="{{ true }}"><p class="lead">What happened? Write down how you’re feeling.', '<sc-if value="{{tDumpBig}}" hint-placeholder-val="{{ true }}"><sc-if value="{{tNotBp}}" hint-placeholder-val="{{ true }}"><p class="lead">What happened? Write down how you’re feeling.')
i = s.index('<sc-if value="{{tDumpBig}}"'); j = s.index('<label class="lbl" for="wf-trigger">', i)
s = s[:j] + '</sc-if>\n' + s[j:]
rep('<label class="lbl" for="wf-dump">Big ass brain dump</label>\n<textarea id="wf-dump" class="input tall" value="{{c.dump}}" onChange="{{onDump}}" placeholder="Just keep writing. Messy is perfect."></textarea>',
    '<sc-if value="{{tDumpBig}}" hint-placeholder-val="{{ true }}"><label class="lbl" for="wf-dump">Big ass brain dump</label>\n<textarea id="wf-dump" class="input tall" value="{{c.dump}}" onChange="{{onDump}}" placeholder="Just keep writing. Messy is perfect."></textarea></sc-if>')
rep("tuneDone: !!s.tuneDone && !ftShow && s.tMode !== 'quick', tuneFlow: !s.tuneDone && !ftShow && s.tMode !== 'quick',",
    "tuneDone: !!s.tuneDone && !ftShow, tuneFlow: !s.tuneDone && !ftShow && typeof s.wayIn === 'number',")
# "In your body": where first, then what it feels like
i = s.index('<!-- T2 IN YOUR BODY -->'); a1 = s.index('<div class="qblock">\n<h3>What does it feel like in your body?</h3>', i)
b1 = s.index('<div class="qblock">\n<h3>Where do you feel it?</h3>', a1)
# the "where" block ends where the T2 sc-if ends (its last </div> before </sc-if>)
e2 = s.index('</sc-if>\n\n<!-- T3 PICTURE IT -->', b1)
feel_blk, where_blk = s[a1:b1], s[b1:e2]
s = s[:a1] + where_blk + feel_blk + s[e2:]
# "If you had to guess…": every feeling that sits within each emotion, as little words under it
rep('<span class="es">{{e.s}}</span><sc-if value="{{e.hasMatch}}"', '<span class="es">{{e.s}}</span><span class="ew">{{e.held}}</span><span class="ewi">{{e.up}}</span><sc-if value="{{e.hasMatch}}"')
rep("return { n: e[1], s: e[2], img: IMG[e[0]], cls: on ? 'emo on' : 'emo',", "var fam = EIMBY[e[0]]; return { held: fam ? fam[3].concat(fam[4]).join(' · ') : '', up: fam ? 'Let it move and it becomes: ' + fam[5].join(', ').toLowerCase() + ', ' + fam[6].toLowerCase() : '', n: e[1], s: e[2], img: IMG[e[0]], cls: on ? 'emo on' : 'emo',")
# the course calls this Week 5 now
rep('Breakthrough Program · Week 4 · Emotions', 'Breakthrough Program · Week 5 · Emotions')
s = s.replace('video in Week 4 of the course', 'video in Week 5 of the course').replace('Processing Emotions in Week 4 of the course', 'Processing Emotions in Week 5 of the course').replace('</strong> in Week 4.', '</strong> in Week 5.').replace('</strong> video in Week 4.', '</strong> video in Week 5.')
# opens on What am I feeling? (the course's "Start here" card is gone); a ?tab= link still opens that part
rep("      tab: 'home', tStep: 0, pStep: 0,", "      tab: 'tune', tStep: 0, pStep: 0,")
rep("tab: (CMODS_ALL(s) && ['process', 'tune', 'mine'].indexOf(tabOk(s.tab)) < 0) ? 'tune' : tabOk(s.tab)", "tab: ['process', 'mine'].indexOf(tabOk(s.tab)) >= 0 ? tabOk(s.tab) : 'tune'")
# the playground's "Everything unlocked" opens the whole resource too
rep("function EB_FULL(st) { try {", "function EB_FULL(st) { try { if (window.BT_DEMO && window.BT_DEMO.unlock) return true;")
rep("var ebDone = (ebProg && ebProg.done) || {}, ebVid = !!ebDone.w4l4 || !!s.demoUnlock", "var ebDone = (ebProg && ebProg.done) || {}, ebVid = !!ebDone.w4l4 || !!s.demoUnlock || !!(window.BT_DEMO && window.BT_DEMO.unlock)")
rep("var ebOpen = !!ebDone.w4l2 || ebVid;", "var ebOpen = !!ebDone.w4l2 || ebVid || !!(window.BT_DEMO && window.BT_DEMO.unlock);")
CSS = """.waypick{display:flex;flex-direction:column;gap:12px}
.wp-h{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:clamp(24px,4vw,30px);line-height:1.2}
.wp-l{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.wp-b{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px 18px;border-radius:22px;border:1.5px solid #EDE3DF;background:#FFFFFF;color:#1F1412;text-align:left;cursor:pointer;font:inherit}
.wp-b:hover{border-color:#1F1412}
.wp-art{display:block;width:120px;height:100px;margin:-4px 0 2px}.wp-art svg{width:100%;height:100%;overflow:visible}
.wp-q{font-family:'Patrick Hand SC',cursive;letter-spacing:.05em;font-size:16px;color:#A8231F}
.wp-b b{font-family:'Playfair Display',Georgia,serif;font-size:21px;color:#4E0C08}
.wp-d{font-size:14px;line-height:1.5;color:#463A38}
.wp-o{margin-top:auto;padding:4px 10px;border-radius:999px;background:#FBE6FC;font-size:12.5px;font-weight:600;color:#4E0C08}
.wp-b.on{border-color:#1F1412;background:#F1F9A6}.wp-b.on .wp-o{background:#FFFFFF}
.emo .ew{display:block;margin-top:6px;font-size:12px;line-height:1.45;color:#4E0C08;font-weight:500}
.emo .ewi{display:block;margin-top:3px;font-size:11.5px;line-height:1.4;color:#6A5A57;font-style:italic}
.wp-note{margin:0;font-size:14.5px;font-weight:600;color:#4E0C08}
</style>"""
s = s.replace('</style>', CSS, 1)
open(P, 'w', encoding='utf-8').write(s)
print('blueprint way-in added')
