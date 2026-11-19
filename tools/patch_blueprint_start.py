#!/usr/bin/env python3
"""Emotional Blueprint, Nov 2026 (part 2):
- Start here comes first (tab order), and opens after Lesson 2: Emotions. Before that only What am I feeling? is open.
  Process it stays locked until Lesson 4: Processing Emotions and an anger + sadness blueprint.
- Module 1: pick your way in (saved), your door as an anchor, and what every tool inside is for (not the whole process).
- The "Something's knocking" door picker is gone. Shortcuts move to the top once the mini course is done, with What am I feeling? in them.
- What am I feeling? follows their way in. ?tab=home|tune|mine|process opens a part straight away.
- A "your first steps" card at the end of Start here.
Idempotent (marker EB_START1). Run after patch_blueprint_lock.py, then tools/import_canvas.py."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_START1' in s: print('blueprint start-here already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, a[:100]
    s = s.replace(a, b, n)

# --- what opens when
rep("if (p && ((p.done && p.done.w4l4) || p.founder)) return true;", "if (p && ((p.done && (p.done.w4l2 || p.done.w4l4)) || p.founder)) return true; /* EB_START1: opens after Lesson 2 */")
rep("var rLocked = !ebVid, lockView", "var ebOpen = !!ebDone.w4l2 || ebVid; var rLocked = !ebOpen, lockView")
rep("var ebHas = function (k) { return (s.history || []).some(function (hh) { return (hh.emos || []).some(function (e) { return e.id === k; }); }); };",
    "var ebHas = function (k) { var bq = (s.blueprints || {})[k] || {}; return ['body', 'triggers', 'signs', 'express'].some(function (f) { return trim(bq[f] || ''); }) || (s.history || []).some(function (hh) { return (hh.emos || []).some(function (e) { return e.id === k; }); }); };")
rep("var ebLeft = ['anger', 'sadness', 'fear'].filter(", "var ebLeft = ['anger', 'sadness'].filter(")
rep("if (rLocked && p[0] === 'process') return { img: IMG[p[1]], t: '🔒 ' + p[2], s: 'This opens with your full Emotional Blueprint, after Lesson 4: Processing Emotions. For now, pick one of the other two. Naming it is already doing the work.',",
    "if (ebLocked && p[0] === 'process') return { img: IMG[p[1]], t: '🔒 ' + p[2], s: !ebVid ? 'This opens after Lesson 4: Processing Emotions. For now, pick one of the other two. Naming it is already doing the work.' : 'First, make your anger and sadness blueprints. Then this opens.',")
rep('<p class="big">This part opens with your full Emotional Blueprint</p>', '<p class="big">This part opens after Lesson 2: Emotions</p>')
rep("Processing, your blueprints, the body map, the emotion mixer and everything else open when you reach the Emotional Blueprint activity, after Lesson 4: Processing Emotions.",
    "Start here, your blueprints, the body map, the emotion mixer and the rest open once you’ve watched Lesson 2: Emotions. Process it opens after Lesson 4: Processing Emotions.")
# Start here first, then What am I feeling?
rep("var MENUTABS = [['tune', 'What am I feeling?', 'other'], ['home', 'Start here', 'door'],", "var MENUTABS = [['home', 'Start here', 'door'], ['tune', 'What am I feeling?', 'other'],")

# --- their way in, saved, and used to order What am I feeling?
rep("var EB_TK = {", """var WAY_SEQ = [['d', 'w', 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 'd', 'w', 4, 5, 6, 7], ['w', 'd', 1, 2, 3, 4, 5, 6, 7], ['w', 1, 2, 3, 'd', 4, 5, 6, 7]];
var WAY_NAME = ['The thinker', 'The feeler', 'The visual one', 'The knower'];
var WAY_START = ['writing it out', 'your body', 'the wheel', 'the wheel'];
function ebGroup(ph) { return ph === 'd' ? 'Write it out' : ph === 'w' ? 'Pick it on the wheel' : (ph === 1 || ph === 2 || ph === 3) ? 'Feel it in your body' : ph === 4 ? 'Does the name fit?' : (ph === 5 || ph === 6) ? 'What do you need?' : ph === 7 ? 'An intentional pause' : ''; }
function ebStepLabel(seq, pos) { var n = 0, last = null; for (var i = 0; i <= pos; i++) { var g = ebGroup(seq[i]); if (g !== last) { n++; last = g; } } return 'Step ' + n + ' · ' + ebGroup(seq[pos]); }
var EB_TK = {""")
rep("var tSeq = TSEQ.think,", "var tSeq = WAY_SEQ[s.wayIn] || TSEQ.think,")
rep("(EB_TK[tPh] || tm[0])", "(ebStepLabel(tSeq, tPos) || tm[0])")
rep("feelType: FT[s.feelType] ? s.feelType : null, tab:", "feelType: FT[s.feelType] ? s.feelType : null, wayIn: typeof s.wayIn === 'number' ? s.wayIn : null, tab:")
rep("window.localStorage.setItem(EB_KEY, JSON.stringify({ feelType: s.feelType || null,", "window.localStorage.setItem(EB_KEY, JSON.stringify({ feelType: s.feelType || null, wayIn: typeof s.wayIn === 'number' ? s.wayIn : null,")
# open a part straight away (?tab=)
rep("    if (!EB_FULL(this.state)) this.setState({ tab: 'tune' }); /* EB_LOCK1 */",
    """    if (!EB_FULL(this.state)) this.setState({ tab: 'tune' }); /* EB_LOCK1 */
    try { var qt = new URLSearchParams(window.location.search).get('tab'); if (qt && ['home', 'tune', 'mine', 'process', 'eim', 'body'].indexOf(qt) >= 0 && (qt === 'tune' || EB_FULL(this.state))) this.setState({ tab: qt, tStep: qt === 'tune' ? 0 : this.state.tStep }); } catch (e) {} /* EB_START1 */""")

# --- Module 1: pick your way in (it's saved), your door as an anchor
rep("""<span class="waydoor"><b>Your door:</b> {{w.door}}</span><button class="ghost solid" onClick="{{w.go}}">{{w.btn}}</button></div></sc-for></div>""",
    """<span class="waydoor"><b>Your door:</b> {{w.door}}</span><button class="{{w.pcls}}" aria-pressed="{{w.on}}" onClick="{{w.pick}}">{{w.pl}}</button></div></sc-for></div>
<sc-if value="{{wayChosen}}" hint-placeholder-val="{{ false }}">
<div class="doorcard" style="--dc: {{wayCol}}">
<svg class="doorart" viewBox="0 0 120 150" aria-hidden="true"><rect x="22" y="14" width="76" height="126" rx="6" fill="#FFF4EE" stroke="#4E0C08" stroke-width="3"/><path class="doorleaf" d="M28 20 H92 V134 H28 Z" fill="var(--dc)" stroke="#4E0C08" stroke-width="3" stroke-linejoin="round"/><rect x="38" y="32" width="44" height="34" rx="5" fill="#FFFFFF" fill-opacity=".45" stroke="#4E0C08" stroke-width="2"/><rect x="38" y="78" width="44" height="40" rx="5" fill="#FFFFFF" fill-opacity=".35" stroke="#4E0C08" stroke-width="2"/><circle cx="82" cy="76" r="4.5" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2"/><path class="doorglow" d="M60 4 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="1.6" stroke-linejoin="round"/></svg>
<div class="doorcard-t"><span class="hand" style="font-size: 16px; color: #A8231F">Your door · {{wayName}}</span><strong>“{{wayDoor}}”</strong><p>This door unlocks the emotion. Remember it. Whenever you open What am I feeling?, we’ll start where you do: with {{wayStart}}. You can change your door any time.</p></div>
</div>
</sc-if>""")
rep("NV.wayCards = WAYS.map(function (w, i) { return { k: w[0], t: w[1], who: w[2], door: w[3], btn: w[4], img: '/_blob/' + w[5], col: w[6], alt: w[7], go: NV.doorBtns[i].go }; });",
    """NV.wayCards = WAYS.map(function (w, i) { var on = s.wayIn === i; return { k: w[0], t: w[1], who: w[2], door: w[3], btn: w[4], img: '/_blob/' + w[5], col: w[6], alt: w[7], go: NV.doorBtns[i].go, on: on ? 'true' : 'false', pcls: on ? 'primary maroon' : 'ghost solid', pl: on ? '✓ This is me' : 'This is me', pick: function () { self.setState({ wayIn: on ? null : i }); } }; });
      NV.wayChosen = typeof s.wayIn === 'number' && !!WAYS[s.wayIn]; NV.wayName = NV.wayChosen ? WAYS[s.wayIn][0] : ''; NV.wayDoor = NV.wayChosen ? WAYS[s.wayIn][3] : ''; NV.wayCol = NV.wayChosen ? WAYS[s.wayIn][6] : '#F4C2F7'; NV.wayStart = NV.wayChosen ? WAY_START[s.wayIn] : '';""")
rep("Have a read, and notice which one sounds most like you. You can use any door, any time, and you might find you use different ones on different days.",
    "Have a read, and tap <b>This is me</b> on the one that sounds most like you. We’ll save it, and What am I feeling? will start where you do. You can change it any time.")

# --- Module 1: what every tool inside is for, instead of the whole process
a = s.index('<h3 class="mh">How it works, start to finish</h3>')
b = s.index('<div class="callout lime"><span><strong>That’s the whole point of this.</strong>')
TOOLS = [
    ('What am I feeling?', 'Name a feeling you can’t put a word to.', 'When something’s knocking and you don’t know what it is: you’re off, snappy, flat or teary. Write it out, find it on the wheel, feel it in your body. It saves to your blueprints.', '{{tool.tune}}'),
    ('Energy in Motion', 'The wheel: every feeling, where it sits and what it does to your energy.', 'When you’ve got a word and want to understand it: what it’s rooted in, how loud it is, and what to do at that volume.', '{{tool.eim}}'),
    ('My blueprints', 'Your map of how each emotion shows up for you.', 'Start with anger or sadness. Come back to see your patterns: what sets it off, the early signs it’s building, and what helps you let it out.', '{{tool.mine}}'),
    ('Process it', 'A planned, safe release, step by step.', 'When an emotion’s close to the surface and you’ve got the time and space to let it out on purpose, instead of it exploding at the wrong moment.', '{{startProcess}}'),
    ('Body map', 'Where you feel it, and what it’s telling you.', 'When you can feel something in your body but have no words for it yet. Start with the sensation and let it lead you to the feeling.', '{{tool.body}}'),
    ('Emotion mixer', 'Two feelings at once? See what they make.', 'When it’s not just one thing, like angry and sad, or excited and scared, and you want to know what the mix is.', '{{tool.blends}}'),
    ('Consciousness', 'The Map of Consciousness, every level.', 'When you want the bigger picture: where an emotion sits in terms of energy, and what’s one step up from here.', '{{tool.levels}}'),
    ('ECT with Sav', 'The deep release, at the root.', 'When the same emotion keeps coming back no matter what you do. ECT goes back to where it started and releases years of it in one go.', '{{tool.ect}}'),
]
html = '<h3 class="mh">What’s inside, and when to use it</h3>\n<p class="lead">You don’t need to learn the whole process. Here’s every tool in your Emotional Blueprint, what it’s for, and when to reach for it.</p>\n<div class="tinside">'
for t, what, when, go in TOOLS:
    html += '<div class="tin"><strong>' + t + '</strong><span class="tin-w">' + what + '</span><span class="tin-u"><b>Use it:</b> ' + when + '</span></div>'
html += '</div>\n'
s = s[:a] + html + s[b:]

# --- end of Start here: you get it now, here are your first steps
rep('<section class="sec" id="home-knock">', """<section class="sec firststeps">
<span class="hand" style="font-size: 17px; color: #A8231F">Now it all makes sense</span>
<p class="big">Your first steps</p>
<p class="lead">Do these in order. Tap the button on each one to go straight there.</p>
<div class="fsx">
<div class="fsx-c" style="--fc: #F1F9A6"><span class="fsx-n">1</span><svg class="fsx-a" viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="12" width="100" height="62" rx="12" fill="#FFFFFF" stroke="#4E0C08" stroke-width="3"/><path class="fsx-play" d="M52 30 L74 43 L52 56 Z" fill="#D3302B" stroke="#4E0C08" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 84 h60" stroke="#4E0C08" stroke-width="3" stroke-linecap="round"/><path d="M96 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#F4C2F7" stroke="#4E0C08" stroke-width="1.4"/></svg><div class="fsx-t"><strong>Watch Lesson 3</strong><span>Naming Emotions. Build your first blueprint right underneath it as you watch.</span><a class="primary sm" href="/#Lesson-w4a2" target="_self">Go to Lesson 3 →</a></div></div>
<div class="fsx-c" style="--fc: #F6D3CF"><span class="fsx-n">2</span><svg class="fsx-a" viewBox="0 0 120 90" aria-hidden="true"><g class="fsx-cardL"><rect x="14" y="16" width="46" height="60" rx="8" fill="#FBE1DF" stroke="#4E0C08" stroke-width="3" transform="rotate(-8 37 46)"/><text x="37" y="54" text-anchor="middle" font-size="22" transform="rotate(-8 37 46)">🔥</text></g><g class="fsx-cardR"><rect x="60" y="14" width="46" height="60" rx="8" fill="#DFEAF8" stroke="#4E0C08" stroke-width="3" transform="rotate(7 83 44)"/><text x="83" y="52" text-anchor="middle" font-size="22" transform="rotate(7 83 44)">💧</text></g></svg><div class="fsx-t"><strong>Make anger + sadness</strong><span>At the very least, a blueprint for each. Started one in Lesson 3? Finish it, then do the other.</span><button class="primary sm" onClick="{{tool.mine}}">My blueprints →</button></div></div>
<div class="fsx-c" style="--fc: #F4C2F7"><span class="fsx-n">3</span><svg class="fsx-a" viewBox="0 0 120 90" aria-hidden="true"><circle cx="52" cy="42" r="24" fill="#FFFFFF" stroke="#4E0C08" stroke-width="3"/><path d="M70 60 L92 82" stroke="#4E0C08" stroke-width="6" stroke-linecap="round"/><path class="fsx-heart" d="M52 52 C40 44 40 34 46 32 C50 30 52 34 52 36 C52 34 54 30 58 32 C64 34 64 44 52 52 Z" fill="#E0457B" stroke="#4E0C08" stroke-width="2"/><text x="98" y="30" font-size="16" fill="#4E0C08" font-family="Patrick Hand SC, cursive">?</text></svg><div class="fsx-t"><strong>Notice it this week</strong><span>When a feeling comes up, or you remember one you couldn’t name, check in. Each one adds to your blueprints.</span><button class="primary sm" onClick="{{tool.tune}}">What am I feeling? →</button></div></div>
<div class="fsx-c" style="--fc: #DDF0D6"><span class="fsx-n">4</span><svg class="fsx-a" viewBox="0 0 120 90" aria-hidden="true"><path d="M30 70 C24 56 30 44 40 44 L60 56 L80 44 C90 44 96 56 90 70 Z" fill="#FFF4EE" stroke="#4E0C08" stroke-width="3" stroke-linejoin="round"/><g class="fsx-rise"><path d="M60 38 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="1.8"/><path d="M42 24 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" fill="#F4C2F7" stroke="#4E0C08" stroke-width="1.4"/><path d="M80 20 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" fill="#BFD7F2" stroke="#4E0C08" stroke-width="1.4"/></g></svg><div class="fsx-t"><strong>Watch Lesson 4, then let one go</strong><span>Processing Emotions. Then come back and try a release. Quicker to lash out, or to cry? Start with that one.</span><div class="fsx-b"><a class="ghost solid sm" href="/#Lesson-w4l4" target="_self">Lesson 4 →</a><button class="primary sm" onClick="{{startProcess}}">Process it →</button></div></div></div>
</div>
</section>
<section class="sec" id="home-knock">""")
# the "Something's knocking" door picker is gone (your door now lives in Module 1); the shelf banner stays
i = s.index('<section class="sec" id="home-knock">')
j = s.index('<sc-if value="{{hasLater}}"', i)
s = s[:i] + '<section class="sec" id="home-knock">\n' + s[j:]

# --- Shortcuts: What am I feeling? in there too, and at the top once the mini course is done
rep('<div class="eyebrow">Shortcuts</div>\n<h2 class="h2">Jump straight into a tool.</h2>\n<div class="tools">',
    '<div class="eyebrow">Shortcuts</div>\n<h2 class="h2">Jump straight into a tool.</h2>\n<div class="tools">\n<button class="tooltile" onClick="{{tool.tune}}"><span class="tpic cream"><img src="/_blob/0ef8dcdd586ecd0ff80676f1e620be34" alt=""></span><span class="tt">What am I feeling?</span><span class="tsub">Name a feeling you can’t put a word to.</span></button>')
a = s.index('<sc-if value="{{homeTools}}"')
b = s.index('</sc-if>', s.index('</section>', a)) + len('</sc-if>')
tools_block = s[a:b]
s = s[:a] + s[b:]
top = tools_block.replace('<sc-if value="{{homeTools}}" hint-placeholder-val="{{ true }}">', '<sc-if value="{{homeToolsTop}}" hint-placeholder-val="{{ false }}">', 1)
bottom = tools_block
rep('<!-- ================= START HERE ================= -->\n<sc-if value="{{tabHome}}" hint-placeholder-val="{{ true }}">',
    '<!-- ================= START HERE ================= -->\n<sc-if value="{{tabHome}}" hint-placeholder-val="{{ true }}">\n' + top)
# bottom copy sits where it was (end of Start here) while the mini course is still going
k = s.index('<!-- ================= ENERGY IN MOTION')
k = s.rindex('</sc-if>', 0, k)
s = s[:k] + bottom + '\n' + s[k:]
rep("homeTools: !CMODS_ALL(s),", "homeTools: !CMODS_ALL(s), homeToolsTop: CMODS_ALL(s),")
# tool.tune exists?
if "tool[tb[0]]" in s and "['tune'," not in s: pass

CSS = """.way button.primary.maroon{align-self:flex-start}
.doorcard{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:14px;padding:18px;border-radius:24px;background:#FFF4EE;border:2px solid #1F1412;box-shadow:5px 5px 0 var(--dc,#F4C2F7)}
.doorart{flex:none;width:96px;height:120px}
.doorleaf{transform-origin:28px 77px;animation:ebDoor 5s ease-in-out infinite}
@keyframes ebDoor{0%,70%,100%{transform:perspective(200px) rotateY(0)}80%,90%{transform:perspective(200px) rotateY(-28deg)}}
.doorglow{animation:ebTw 3s ease-in-out infinite;transform-origin:60px 13px}
.doorcard-t{display:flex;flex-direction:column;gap:4px;flex:1 1 220px;min-width:0}
.doorcard-t strong{font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1F1412}
.doorcard-t p{margin:0;font-size:14px;line-height:1.55;color:#463A38}
.tinside{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.tin{display:flex;flex-direction:column;gap:4px;padding:14px;border-radius:18px;background:#FFFFFF;border:1.5px solid #EDE3DF;font-size:13.5px;line-height:1.5;color:#463A38}
.tin strong{font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#1F1412}
.tin-w{color:#1F1412;font-weight:600}
.fsx{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:4px}
.fsx-c{position:relative;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:22px;background:#FFFFFF;border:2px solid #1F1412;box-shadow:4px 4px 0 var(--fc)}
.fsx-n{position:absolute;top:-12px;left:-10px;width:34px;height:34px;border-radius:50%;background:#4E0C08;color:#F1F9A6;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:16px}
.fsx-a{width:100%;height:84px;background:color-mix(in srgb,var(--fc) 45%,#fff);border-radius:16px}
.fsx-t{display:flex;flex-direction:column;gap:6px;flex:1}
.fsx-t strong{font-family:'Playfair Display',Georgia,serif;font-size:19px;color:#1F1412;line-height:1.2}
.fsx-t span{font-size:13.5px;line-height:1.5;color:#463A38;flex:1}
.fsx-t .primary.sm,.fsx-t .ghost.sm{align-self:flex-start;text-decoration:none}
.fsx-b{display:flex;flex-wrap:wrap;gap:8px}
.fsx-t .sm{padding:9px 16px;font-size:13.5px;min-height:0}
.fsx-play{animation:fsxPulse 2s ease-in-out infinite;transform-origin:62px 43px}
@keyframes fsxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.fsx-cardL{animation:fsxTilt 3s ease-in-out infinite;transform-origin:37px 70px}
.fsx-cardR{animation:fsxTilt 3s ease-in-out infinite reverse;transform-origin:83px 70px}
@keyframes fsxTilt{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}
.fsx-heart{animation:fsxPulse 1.6s ease-in-out infinite;transform-origin:52px 42px}
.fsx-rise{animation:fsxRise 2.6s ease-in-out infinite}
@keyframes fsxRise{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@media (prefers-reduced-motion:reduce){.fsx-play,.fsx-cardL,.fsx-cardR,.fsx-heart,.fsx-rise{animation:none}}
.firststeps{padding:22px;border-radius:26px;background:#FFFFFF;border:2px solid #1F1412;box-shadow:5px 5px 0 #F1F9A6;display:flex;flex-direction:column;gap:10px}
.fsteps{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:8px;font-size:14.5px;line-height:1.55;color:#463A38}
@media (prefers-reduced-motion:reduce){.doorleaf,.doorglow{animation:none}}
"""
rep('.ftpick{', CSS + '.ftpick{')
open(P, 'w', encoding='utf-8').write(s)
print('blueprint: start here first, your way in, tools explained, first steps')
