# Emotional Blueprint, Nov 2026: simplify + follow the Week 4 videos. Idempotent (marker EB_V2).
# - once the mini course is done, Home is just "Where are you starting from?" (shortcuts hidden; tabs stay up top)
# - the keep-going buttons in the step-by-step flows sit bottom right
# - "Create your blueprints": think back to the angriest / saddest / most scared you've felt, what was your body doing?
#   Anger, sadness and fear are the main three; hurt, grief, shame and guilt are "go deeper"
# - Process it is locked until the Processing Emotions video (w4l4) is watched, then until the three main blueprints exist
# Run, then: python3 tools/import_canvas.py
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_V2' in s:
    print('blueprint already patched'); raise SystemExit

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)

CSS = '''/* EB_V2 */
.flownav{flex-direction:row-reverse;justify-content:space-between}
.bpmake{display:flex;flex-direction:column;gap:12px;padding:20px;border-radius:26px;background:#FFF4EE;border:2px solid #1F1412;box-shadow:5px 5px 0 #F4C2F7;margin-bottom:16px}
.bpmake .big{margin:0}
.bpmake p{margin:0}
.bpgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.bpbtn{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:18px;border:1.5px solid #1F1412;background:#FFFFFF;font:600 15px Poppins,system-ui,sans-serif;color:#1F1412;cursor:pointer;text-align:left}
.bpbtn img{width:40px;height:40px;flex:none}
.bpbtn .bps{display:block;font-size:12px;font-weight:600;color:#A8231F}
.bpbtn.done{background:#F1F9A6}
.bpdeep{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:18px;background:#FFFFFF;border:1.5px dashed #C9A39B}
.bpmem{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:20px;background:#4E0C08;color:#FFF4EE}
.bpmem .bpq{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:22px;line-height:1.25;color:#F1F9A6}
.bpmem p{margin:0;font-size:15px;line-height:1.55}
.lockcard{display:flex;flex-direction:column;gap:10px;align-items:flex-start;padding:22px;border-radius:26px;background:#FFF4EE;border:2px solid #1F1412}
.lockcard .lockic{font-size:34px}
.lockcard .big,.lockcard .lead{margin:0}
.bpnote{padding:12px 14px;border-radius:16px;background:#F8FCD6;border:1.5px solid #1F1412;font-size:14.5px;line-height:1.5}
'''
rep('</style>\n</helmet>', CSS + '</style>\n</helmet>')

# 1. Home after the mini course: just "Where are you starting from?"
i = s.index('Jump straight into a tool.'); a = s.rindex('<section class="sec">', 0, i); b = s.index('</section>', i) + len('</section>')
s = s[:a] + '<sc-if value="{{homeTools}}" hint-placeholder-val="{{ true }}">\n' + s[a:b] + '\n</sc-if>' + s[b:]

# 2. keep going, bottom right
rep('<div class="navrow">\n<sc-if value="{{tShowNext}}"', '<div class="navrow flownav">\n<sc-if value="{{tShowNext}}"')
rep('<div class="navrow">\n<sc-if value="{{pShowNext}}"', '<div class="navrow flownav">\n<sc-if value="{{pShowNext}}"')

# 3. Create your blueprints (top of My blueprints)
MAKE = '''<div class="toolsec" id="tool-mine">
<section class="bpmake" id="bp-make">
<span class="hand" style="font-size: 17px; color: #A8231F">Start here · create your blueprints</span>
<p class="big">Create your blueprints.</p>
<p class="lead">Anger, sadness and fear are usually the easiest to name, and the easiest to notice in your body. Hurt, grief, shame and guilt often look and feel like sadness if you’re not really in tune with your body yet. That was me. It all just felt like sadness, and that is okay.</p>
<p class="lead"><strong>If you want to, just do a blueprint for these three. They’re the main ones.</strong></p>
<sc-if value="{{bpNeedVid}}" hint-placeholder-val="{{ false }}"><div class="bpnote">🔒 These open after the <strong>Processing Emotions</strong> video in Week 4. For now, have a play with the wheel and start naming what you feel.</div></sc-if>
<sc-if value="{{bpCanMake}}" hint-placeholder-val="{{ true }}">
<div class="bpgrid"><sc-for list="{{bpMain}}" as="b" hint-placeholder-count="3"><button class="{{b.cls}}" onClick="{{b.go}}"><img src="{{b.img}}" alt=""><span>{{b.l}}<span class="bps">{{b.st}}</span></span></button></sc-for></div>
<div class="bpdeep">
<span class="hand" style="font-size: 16px; color: #4E0C08">Want to go deeper? (optional)</span>
<p class="lead" style="font-size: 15px">If you’re naturally really in tune with your body, and you know what each of these feels like, with its own pattern and feeling, you can make a blueprint for them too.</p>
<div class="bpgrid"><sc-for list="{{bpDeep}}" as="b" hint-placeholder-count="4"><button class="{{b.cls}}" onClick="{{b.go}}"><img src="{{b.img}}" alt=""><span>{{b.l}}<span class="bps">{{b.st}}</span></span></button></sc-for></div>
</div>
</sc-if>
</section>
<section class="sec">'''
rep('<div class="toolsec" id="tool-mine">\n<section class="sec">', MAKE)

# step 1 of the flow, when it's a blueprint: the memory prompt
rep('<p class="lead">What happened? Write down how you’re feeling.',
    '<sc-if value="{{tBp}}" hint-placeholder-val="{{ false }}"><div class="bpmem"><span class="hand" style="font-size: 16px; color: #F4C2F7">{{tBpK}}</span><span class="bpq">{{tBpQ}}</span><p>Close your eyes if that feels okay, and put yourself back there for a moment. Where were you? Who was there? Now notice what was happening in your body. Write it all down, then we’ll map it, step by step.</p></div></sc-if>\n<sc-if value="{{tNotBp}}" hint-placeholder-val="{{ true }}"><p class="lead">What happened? Write down how you’re feeling.')
i = s.index('<sc-if value="{{tNotBp}}"'); j = s.index('</p>', i) + 4
s = s[:j] + '</sc-if>' + s[j:]
rep('<label class="lbl" for="wf-trigger">What happened? (the trigger, in a line)</label>', '<label class="lbl" for="wf-trigger">{{tTrigLabel}}</label>')

# 4. Process it: locked until the video, then until the three main blueprints
i = s.index('<sc-if value="{{tabProcess}}" hint-placeholder-val="{{ false }}">\n') + len('<sc-if value="{{tabProcess}}" hint-placeholder-val="{{ false }}">\n')
LOCK = '''<sc-if value="{{pLocked}}" hint-placeholder-val="{{ false }}">
<section class="lockcard">
<span class="lockic" aria-hidden="true">🔒</span>
<span class="hand" style="font-size: 16px; color: #A8231F">Process it · not yet</span>
<p class="big">{{pLockT}}</p>
<p class="lead">{{pLockD}}</p>
<div class="navrow">
<sc-if value="{{pLockBp}}" hint-placeholder-val="{{ false }}"><button class="primary maroon" onClick="{{goMakeBp}}">Create my blueprints</button></sc-if>
<sc-if value="{{pLockVid}}" hint-placeholder-val="{{ true }}"><button class="ghost solid" onClick="{{goEimTab}}">Play with the wheel</button></sc-if>
<sc-if value="{{pDemo}}" hint-placeholder-val="{{ false }}"><button class="ghost" onClick="{{pDemoUnlock}}">Playground only: unlock to preview</button></sc-if>
</div>
</section>
</sc-if>
<sc-if value="{{pOpen}}" hint-placeholder-val="{{ true }}">
'''
s = s[:i] + LOCK + s[i:]
rep('<div class="navrow"><button class="ghost" onClick="{{go.mine}}">← My blueprints</button>', '</sc-if>\n<div class="navrow"><button class="ghost" onClick="{{go.mine}}">← My blueprints</button>')

# ---- logic ----
LOGIC = '''    // EB_V2: where they're up to in Week 4, and which blueprints exist
    var ebProg = null; try { ebProg = JSON.parse(window.localStorage.getItem('bt-course') || 'null'); } catch (e) {}
    var ebDone = (ebProg && ebProg.done) || {}, ebVid = !!ebDone.w4l4 || !!s.demoUnlock;
    var ebHas = function (k) { return (s.history || []).some(function (hh) { return (hh.emos || []).some(function (e) { return e.id === k; }); }); };
    var ebLeft = ['anger', 'sadness', 'fear'].filter(function (k) { return !ebHas(k); });
    var ebLocked = s.demoUnlock ? false : (!ebVid || ebLeft.length > 0);
    var EB_Q = { anger: 'Think back to a time you felt the angriest you’ve ever felt. What was happening in your body?', sadness: 'Think back to a time you felt the saddest you’ve ever felt. What was happening in your body?', fear: 'Think back to a time you felt the most scared you’ve ever felt. What was happening in your body?', hurt: 'Think back to a time you felt the most hurt you’ve ever felt. What was happening in your body?', grief: 'Think back to a time you were grieving the hardest. What was happening in your body?', shame: 'Think back to a time you felt the most ashamed you’ve ever felt. What was happening in your body?', guilt: 'Think back to a time you felt the guiltiest you’ve ever felt. What was happening in your body?' };
    var bpBtn = function (k) { var n = (s.history || []).filter(function (hh) { return (hh.emos || []).some(function (e) { return e.id === k; }); }).length; return { l: EMOBY[k] ? EMOBY[k][1] : cap(k), img: IMG[k] || IMG.other, st: n ? '✓ Blueprint made' : 'Make this one', cls: n ? 'bpbtn done' : 'bpbtn', go: function () { var c0 = emptyCur(); c0.emos = {}; c0.emos[k] = true; c0.bp = k; self.setState({ tab: 'tune', tStep: 0, cur: c0, tuneDone: null, confirm: null }); self.scrollTool('tune'); } }; };
    var tBpK = s.cur && s.cur.bp ? 'Your ' + low(EMOBY[s.cur.bp] ? EMOBY[s.cur.bp][1] : s.cur.bp) + ' blueprint' : '';
'''
rep('    var tabs = MENUTABS.map', LOGIC + '    var tabs = MENUTABS.map')
rep("tabHome: s.tab === 'home',", """homeTools: !CMODS_ALL(s), bpNeedVid: !ebVid, bpCanMake: ebVid, bpMain: ['anger', 'sadness', 'fear'].map(bpBtn), bpDeep: ['hurt', 'grief', 'shame', 'guilt'].map(bpBtn),
      tBp: !!(s.cur && s.cur.bp), tNotBp: !(s.cur && s.cur.bp), tBpK: tBpK, tBpQ: s.cur && s.cur.bp ? (EB_Q[s.cur.bp] || '') : '', tTrigLabel: s.cur && s.cur.bp ? 'What was happening? (in a line, just for you)' : 'What happened? (the trigger, in a line)',
      pLocked: ebLocked, pOpen: !ebLocked, pLockVid: !ebVid, pLockBp: ebVid && ebLeft.length > 0,
      pLockT: !ebVid ? 'This unlocks after the Processing Emotions video.' : 'First, create your blueprints.',
      pLockD: !ebVid ? 'Watch Lesson 4: Processing Emotions in Week 4 of the course, then come back here. Until then, have a play with the wheel and start naming what you feel.' : 'Before you process anything, map how ' + join(ebLeft.map(function (k) { return low(EMOBY[k] ? EMOBY[k][1] : k); })) + ' feel' + (ebLeft.length === 1 ? 's' : '') + ' in your body. It only takes a few minutes each, then this opens up.',
      pDemo: (function () { try { return !!(window.BT_DEMO || window.localStorage.getItem('__bt_demo_db')); } catch (e) { return false; } })() && ebLocked, pDemoUnlock: function () { self.setState({ demoUnlock: true }); },
      goMakeBp: function () { self.setState({ tab: 'mine', confirm: null }); setTimeout(function () { var el = document.getElementById('bp-make'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); },
      goEimTab: function () { self.goTab('eim'); },
      tabHome: s.tab === 'home',""")
rep('tKicker: tm[0], tTitle: tm[1],', "tKicker: tBpK ? tBpK + ' · ' + tm[0] : tm[0], tTitle: tm[1],")
# mini course "all done" helper (used for Home)
rep('class Component extends DCLogic {', "function CMODS_ALL(s) { var ld = s.lessonsDone || {}; for (var i = 0; i < 6; i++) if (!ld['mod' + i]) return false; return true; }\n\nclass Component extends DCLogic {")
rep('Breakthrough Program · Week 3 · Emotions', 'Breakthrough Program · Week 4 · Emotions')
open(P, 'w', encoding='utf-8').write(s)
print('patched blueprint')
