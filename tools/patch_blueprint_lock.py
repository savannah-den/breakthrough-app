#!/usr/bin/env python3
"""Emotional Blueprint, Nov 2026:
- Until they reach the Emotional Blueprint activity (Lesson 4: Processing Emotions done, or a Founding Member),
  only What am I feeling? is open (it's Lesson 3: Naming Emotions now). Every other tab shows a kind lock card,
  and "I'm ready to process it now" is locked too.
- What am I feeling? no longer asks which type you are: it's always write it out -> pick it on the wheel -> your body,
  with a 3-step picture card at the start.
Idempotent (marker EB_LOCK1). Then run tools/import_canvas.py."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_LOCK1' in s: print('blueprint lock already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, a[:90]
    s = s.replace(a, b, n)

# helpers
rep("function CMODS_ALL(s) {", """// EB_LOCK1: is the whole resource open yet? (Processing Emotions done, a Founding Member, or unlocked in the playground)
function EB_FULL(st) { try { var p = JSON.parse(window.localStorage.getItem('bt-course') || 'null'); if (p && ((p.done && p.done.w4l4) || p.founder)) return true; } catch (e) {} return !!(st && st.demoUnlock); }
var EB_TK = { d: 'Step 1 · Write it out', w: 'Step 2 · Pick it on the wheel', 1: 'Step 3 · Feel it in your body', 2: 'Step 3 · Feel it in your body', 3: 'Step 3 · Feel it in your body', 4: 'Step 4 · Does the name fit?', 5: 'Step 5 · What do you need?', 6: 'Step 5 · What do you need?', 7: 'Step 6 · An intentional pause' };
function CMODS_ALL(s) {""")
# open on What am I feeling? while it's locked
rep("""lessonsDone: migDone(s.lessonsDone), l4: Object.assign({ t: '', f: '', d: '' }, s.l4 || {})
      });
    }""", """lessonsDone: migDone(s.lessonsDone), l4: Object.assign({ t: '', f: '', d: '' }, s.l4 || {})
      });
    }
    if (!EB_FULL(this.state)) this.setState({ tab: 'tune' }); /* EB_LOCK1 */""")
# unlocked for Founding Members too
rep("ebVid = !!ebDone.w4l4 || !!s.demoUnlock;", "ebVid = !!ebDone.w4l4 || !!s.demoUnlock || !!(ebProg && ebProg.founder);\n    var rLocked = !ebVid, lockView = rLocked && s.tab !== 'tune', vt = lockView ? '__locked' : s.tab;")
# always the same order: write it out, wheel, body
rep("var tSeq = TSEQ[s.feelType] || TSEQ.def,", "var tSeq = TSEQ.think,")
rep("var ftShow = s.tab === 'tune' && (!FT[s.feelType] || !!s.typeOpen);", "var ftShow = false;")
rep("ftShowBar: !ftShow && !!FT[s.feelType],", "ftShowBar: false,")
rep("(s.feelType ? 'Step ' + (tPos + 1) : tm[0])", "(EB_TK[tPh] || tm[0])")
rep("tNextLabel: s.feelType && tPos < tSeq.indexOf(4)", "tNextLabel: tPos < tSeq.indexOf(4)")
# tabs: locked ones show a padlock
rep("var tabs = MENUTABS.map(function (tb) { var on = s.tab === tb[0]; return { l: tb[1], img: IMG[tb[2]], num: '', hasNum: false, cls: on ? 'tab on' : 'tab',",
    "var tabs = MENUTABS.map(function (tb) { var on = s.tab === tb[0], lk = rLocked && tb[0] !== 'tune' && tb[0] !== 'ect'; return { l: tb[1], img: IMG[tb[2]], num: lk ? '🔒' : '', hasNum: lk, cls: (on ? 'tab on' : 'tab') + (lk ? ' lockt' : ''),")
# "I'm ready to process it now" locked until then
rep("var pathBtns = TPATHS.map(function (p) { var on = c.path === p[0];",
    "var pathBtns = TPATHS.map(function (p) { if (rLocked && p[0] === 'process') return { img: IMG[p[1]], t: '🔒 ' + p[2], s: 'This opens with your full Emotional Blueprint, after Lesson 4: Processing Emotions. For now, pick one of the other two. Naming it is already doing the work.', cls: 'pathb lockd', pressed: 'false', pick: function () {} }; var on = c.path === p[0];")
# tab flags read the visible tab
s, n = re.subn(r"\b(tab[A-Z]\w*): s\.tab === '", r"\1: vt === '", s)
print('tab flags switched:', n)
# new data for the template
rep("      tabHome: vt === 'home',", """      tabLock: lockView, lockGoTune: function () { self.goTab('tune'); }, lockDemo: (function () { try { return !!(window.BT_DEMO || window.localStorage.getItem('__bt_demo_db')); } catch (e) { return false; } })(), lockDemoGo: function () { self.setState({ demoUnlock: true }); },
      tShowSteps: s.tab === 'tune' && tPos === 0 && !s.tuneDone,
      tabHome: vt === 'home',""")
# the lock card, under the tabs
LOCK = """</nav>
<!-- EB_LOCK1 -->
<sc-if value="{{tabLock}}" hint-placeholder-val="{{ false }}">
<section class="eblock">
<svg class="eblock-art" viewBox="0 0 120 120" aria-hidden="true"><rect x="24" y="52" width="72" height="54" rx="14" fill="#F4C2F7" stroke="#4E0C08" stroke-width="3"/><path d="M40 52 V38 a20 20 0 0 1 40 0 V52" fill="none" stroke="#4E0C08" stroke-width="3.4" stroke-linecap="round"/><circle cx="60" cy="74" r="7" fill="#4E0C08"/><path d="M60 80 v10" stroke="#4E0C08" stroke-width="4" stroke-linecap="round"/><path class="eblock-s" d="M98 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="1.8" stroke-linejoin="round"/></svg>
<span class="hand" style="font-size: 16px; color: #A8231F">Not quite yet</span>
<p class="big">This part opens with your full Emotional Blueprint</p>
<p class="lead">For now you’ve got <strong>What am I feeling?</strong>, so you can start naming your emotions straight away. Processing, your blueprints, the body map, the emotion mixer and everything else open when you reach the Emotional Blueprint activity, after Lesson 4: Processing Emotions.</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px"><button class="primary" onClick="{{lockGoTune}}">Go to What am I feeling? →</button><sc-if value="{{lockDemo}}" hint-placeholder-val="{{ false }}"><button class="ghost" onClick="{{lockDemoGo}}">Playground: unlock everything</button></sc-if></div>
</section>
</sc-if>"""
assert s.count('</nav>') == 1
s = s.replace('</nav>', LOCK, 1)
# the three steps, with pictures, at the start of What am I feeling?
INK = 'stroke="#4E0C08" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'
A1 = ('<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M22 14 L92 10 L96 88 L26 92 Z" fill="#FFFFFF" ' + INK + '/>'
      '<path d="M34 30 q14 -4 26 0 t24 -2 M34 44 q10 4 22 0 t28 2 M34 58 q16 -5 30 0 t18 -1 M34 72 q8 3 18 0" fill="none" stroke="#B5281E" stroke-width="2.2" stroke-linecap="round"/>'
      '<path class="ebs-pen" d="M86 74 L108 38 L114 42 L92 78 Z" fill="#F4C2F7" ' + INK + '/><path d="M86 74 L84 84 L92 78" fill="#F28C3B" ' + INK + '/></svg>')
A2 = ('<svg viewBox="0 0 120 100" aria-hidden="true"><g class="ebs-wheel" style="transform-origin:60px 50px">'
      + ''.join('<path d="M60 50 L%s Z" fill="%s" stroke="#4E0C08" stroke-width="2"/>' % (pts, col) for pts, col in [
          ('60 12 A38 38 0 0 1 93 31', '#E5534B'), ('93 31 A38 38 0 0 1 93 69', '#F2994A'), ('93 69 A38 38 0 0 1 60 88', '#F2C94C'),
          ('60 88 A38 38 0 0 1 27 69', '#7CC46A'), ('27 69 A38 38 0 0 1 27 31', '#7B7FC4'), ('27 31 A38 38 0 0 1 60 12', '#E8338A')])
      + '<circle cx="60" cy="50" r="9" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2"/></g>'
      '<path d="M98 82 l-12 -14 m0 0 l2 9 m-2 -9 l9 1" fill="none" ' + INK + '/><circle cx="83" cy="35" r="6" fill="none" stroke="#FFFFFF" stroke-width="3"/></svg>')
A3 = ('<svg viewBox="0 0 120 100" aria-hidden="true"><circle cx="60" cy="18" r="11" fill="#FFFFFF" ' + INK + '/>'
      '<path d="M60 29 V66 M60 66 L48 92 M60 66 L72 92 M60 40 L40 56 M60 40 L80 56" fill="none" ' + INK + '/>'
      '<circle class="ebs-glow" cx="60" cy="44" r="9" fill="#E5534B" opacity=".55"/><circle class="ebs-glow g2" cx="60" cy="32" r="5" fill="#F2994A" opacity=".55"/>'
      '<path d="M20 30 q-6 10 0 20 M100 30 q6 10 0 20" fill="none" stroke="#B9ADAA" stroke-width="2.4" stroke-linecap="round"/></svg>')
STEPS = """<!-- EB_LOCK1: the three steps -->
<sc-if value="{{tShowSteps}}" hint-placeholder-val="{{ true }}">
<section class="ebsteps">
<span class="hand" style="font-size: 17px; color: #A8231F">How it works</span>
<p class="big">Three steps to name what you’re feeling</p>
<p class="lead">If you move fast through life, feelings tend to catch up with you later. The moment’s already passed before you realise you were feeling something at all, or it takes a hot minute to land. These three steps slow you down just enough to catch it.</p>
<div class="ebs-l">
<div class="ebs-c"><span class="ebs-n">1</span><div class="ebs-a">""" + A1 + """</div><div class="ebs-t"><strong>Write it out</strong><span>Brain dump everything swirling around: what happened, what you’re thinking, what you wish you’d said. Messy is perfect. Getting it out of your head makes room to feel it.</span></div></div>
<div class="ebs-c"><span class="ebs-n">2</span><div class="ebs-a">""" + A2 + """</div><div class="ebs-t"><strong>Pick it on the wheel</strong><span>Look at the feelings wheel and tap the word your eyes go to first. Don’t overthink it. If a few fit, pick them all. Feelings often come in blends.</span></div></div>
<div class="ebs-c"><span class="ebs-n">3</span><div class="ebs-a">""" + A3 + """</div><div class="ebs-t"><strong>Feel it in your body</strong><span>Now drop into your body and scan from your head to your toes. Where is it? A tight chest, a lump in your throat, your stomach dropping when a message comes in? You might only have “I don’t know… bad? I just feel tight in my chest and a lump in my throat.” That’s a perfect place to start. Your body usually knows before your brain does.</span></div></div>
</div>
</section>
</sc-if>
<sc-if value="{{ftShowPick}}\""""
rep('<sc-if value="{{ftShowPick}}"', STEPS)
# styles
CSS = """.eblock{display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:26px;background:#FFF4EE;border:2px solid #1F1412;box-shadow:5px 5px 0 #F4C2F7}
.eblock-art{width:84px;height:84px}
.eblock-s{animation:ebTw 3.2s ease-in-out infinite;transform-origin:98px 32px}
@keyframes ebTw{0%,100%{transform:scale(.85) rotate(0)}50%{transform:scale(1.12) rotate(18deg)}}
.tab.lockt{opacity:.62}
.tab.lockt .tnum{background:#FFFFFF;color:#4E0C08;border:1px solid #EDE3DF;font-size:9px}
.pathb.lockd{opacity:.7;cursor:not-allowed;background:#F6F1EF;border-style:dashed}
.ebsteps{display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:26px;background:#FFFFFF;border:2px solid #1F1412;box-shadow:5px 5px 0 #F1F9A6;margin-bottom:16px}
.ebs-l{display:flex;flex-direction:column;gap:12px}
.ebs-c{position:relative;display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;padding:14px;border-radius:20px;background:#FAF7F5;border:1.5px solid #EDE3DF}
.ebs-n{position:absolute;top:-10px;left:-8px;width:30px;height:30px;border-radius:50%;background:#4E0C08;color:#F1F9A6;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
.ebs-a svg{width:96px;height:80px;display:block}
.ebs-t{display:flex;flex-direction:column;gap:4px;font-size:14px;line-height:1.5;color:#463A38}
.ebs-t strong{font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#1F1412}
.ebs-pen{animation:ebPen 2.6s ease-in-out infinite;transform-origin:100px 60px}
@keyframes ebPen{0%,100%{transform:translate(0,0) rotate(0)}50%{transform:translate(-4px,3px) rotate(-6deg)}}
.ebs-wheel{animation:ebSpin 9s linear infinite}
@keyframes ebSpin{to{transform:rotate(360deg)}}
.ebs-glow{animation:ebGlow 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ebs-glow.g2{animation-delay:.6s}
@keyframes ebGlow{0%,100%{transform:scale(.8);opacity:.35}50%{transform:scale(1.35);opacity:.7}}
@media (prefers-reduced-motion:reduce){.ebs-pen,.ebs-wheel,.ebs-glow,.eblock-s{animation:none}}
@media (max-width:420px){.ebs-c{grid-template-columns:72px 1fr}.ebs-a svg{width:72px;height:60px}}
"""
rep('.ftpick{', CSS + '.ftpick{')
open(P, 'w', encoding='utf-8').write(s)
print('blueprint: locked until the full resource, three steps in What am I feeling?')
