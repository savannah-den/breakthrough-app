# Emotional Blueprint, round 3 (Nov 2026): "What am I feeling?" is the main tool and the landing page,
# and each person picks how they feel their feelings (3 types). That becomes their default order:
#   body  (feel it, can't name it):     body scan -> describe it -> name it on the wheel
#   see   (notice what happens, later):  name it on the wheel -> describe it -> body scan
#   think (think it through first):      describe it -> name it on the wheel -> body scan
# If the body points to a different emotion than the one they picked on the wheel, we say so.
# Idempotent (marker EB_V3). Run after patch_blueprint.py, then tools/import_canvas.py
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_V3' in s:
    print('blueprint v3 already patched'); raise SystemExit
assert 'EB_V2' in s, 'run patch_blueprint.py first'

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:80], s.count(a))
    s = s.replace(a, b)

CSS = '''/* EB_V3 */
.ftpick{display:flex;flex-direction:column;gap:14px;padding:22px;border-radius:26px;background:#FFF4EE;border:2px solid #1F1412;box-shadow:5px 5px 0 #F4C2F7;margin-bottom:16px}
.ftpick .big,.ftpick .lead{margin:0}
.ftcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.ftc{display:flex;flex-direction:column;gap:6px;text-align:left;padding:16px;border-radius:22px;border:1.5px solid #1F1412;background:#FFFFFF;color:#1F1412;font:400 14px/1.5 Poppins,system-ui,sans-serif;cursor:pointer}
.ftc.on{background:#F1F9A6;box-shadow:4px 4px 0 #1F1412}
.ftc .ftn{width:30px;height:30px;border-radius:50%;background:#4E0C08;color:#F1F9A6;display:grid;place-items:center;font-weight:700}
.ftc strong{font-family:'Playfair Display',Georgia,serif;font-size:19px;line-height:1.2}
.ftc .ftk{margin-top:4px;font-family:'Patrick Hand SC',cursive;font-size:15px;color:#A8231F;letter-spacing:.04em}
.ftc .fte{font-style:italic;color:#5A4A47}
.ftrec{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:22px;background:#4E0C08;color:#FFF4EE}
.ftrec .lead,.ftrec .hn{color:#FBE6FC;margin:0}
.ftrec .big2{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:24px;color:#F1F9A6}
.ftseq{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ftq{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#FFF4EE;color:#1F1412;font-weight:600;font-size:14px}
.ftq b{width:22px;height:22px;border-radius:50%;background:#E8338A;color:#fff;display:grid;place-items:center;font-size:12px}
.ftrec .primary{align-self:flex-start}
.ftbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:16px;background:#FFFFFF;border:1.5px dashed #C9A39B;font-size:14px;margin-bottom:12px}
.misflag{display:flex;flex-direction:column;gap:4px;padding:14px 16px;border-radius:18px;background:#FBE6FC;border:2px solid #E8338A;font-size:15px;line-height:1.5}
.misflag strong{color:#A8231F}
'''
rep('/* EB_V2 */', CSS + '/* EB_V2 */')

# ---- template: the type picker at the top of What am I feeling?
PICK = '''<div class="toolsec" id="tool-tune">
<sc-if value="{{ftShowPick}}" hint-placeholder-val="{{ false }}">
<section class="ftpick" id="ft-pick">
<span class="hand" style="font-size: 17px; color: #A8231F">Before you start · how do you feel your feelings?</span>
<p class="big">Which one rings most true for you?</p>
<p class="lead">Do you feel your feelings in your body first, and don’t know what the feeling is called? Or do you name the feeling, then notice how it feels in your body? There are typically three types of people. Pick the one that rings most true for you. You can change it any time.</p>
<div class="ftcards"><sc-for list="{{ftCards}}" as="f" hint-placeholder-count="3"><button class="{{f.cls}}" aria-pressed="{{f.on}}" onClick="{{f.pick}}"><span class="ftn">{{f.n}}</span><strong>{{f.t}}</strong><span>{{f.s}}</span><span class="ftk">For example</span><span class="fte">{{f.e1}}</span><span class="fte">{{f.e2}}</span></button></sc-for></div>
<sc-if value="{{ftHasPick}}" hint-placeholder-val="{{ false }}">
<div class="ftrec"><span class="hand" style="font-size: 16px; color: #F4C2F7">Okay, great</span><p class="big2">{{ftRecT}}</p><p class="lead">{{ftRecD}}</p>
<div class="ftseq"><sc-for list="{{ftSeq}}" as="q" hint-placeholder-count="3"><span class="ftq"><b>{{q.n}}</b>{{q.t}}</span></sc-for></div>
<p class="hn">{{ftRecNote}}</p>
<button class="primary lime" onClick="{{ftGo}}">{{ftGoLabel}}</button></div>
</sc-if>
</section>
</sc-if>
<sc-if value="{{ftShowBar}}" hint-placeholder-val="{{ false }}"><div class="ftbar"><span>Your way in: <strong>{{ftName}}</strong> · {{ftSeqText}}</span><button class="ghost" onClick="{{ftChange}}">Change</button></div></sc-if>
'''
rep('<div class="toolsec" id="tool-tune">\n', PICK)

# the memory prompt (Create your blueprints) moves to the top of whichever step comes first
OLD_MEM = '<sc-if value="{{tBp}}" hint-placeholder-val="{{ false }}"><div class="bpmem"><span class="hand" style="font-size: 16px; color: #F4C2F7">{{tBpK}}</span><span class="bpq">{{tBpQ}}</span><p>Close your eyes if that feels okay, and put yourself back there for a moment. Where were you? Who was there? Now notice what was happening in your body. Write it all down, then we’ll map it, step by step.</p></div></sc-if>\n'
rep(OLD_MEM, '')
DROP = '<div class="dropin"><span class="breathe" aria-hidden="true"></span><div><span class="dk">Drop into your body</span><p>{{tDrop}}</p></div></div>'
rep(DROP, DROP + '\n<sc-if value="{{tBpFirst}}" hint-placeholder-val="{{ false }}"><div class="bpmem"><span class="hand" style="font-size: 16px; color: #F4C2F7">{{tBpK}}</span><span class="bpq">{{tBpQ}}</span><p>Close your eyes if that feels okay, and put yourself back there for a moment. Where were you? Who was there? {{tBpHow}}</p></div></sc-if>')

# split step 1 into "describe it" and "name it on the wheel"
rep('<sc-if value="{{tNotBp}}" hint-placeholder-val="{{ true }}"><p class="lead">What happened?', '<sc-if value="{{tShowDump}}" hint-placeholder-val="{{ true }}">\n<sc-if value="{{tNotBp}}" hint-placeholder-val="{{ true }}"><p class="lead">What happened?')
rep('<textarea id="wf-dump" class="input tall" value="{{c.dump}}" onChange="{{onDump}}" placeholder="Just keep writing. Messy is perfect."></textarea>\n<div class="qblock">\n<h3>How did that make you feel?</h3>',
    '<textarea id="wf-dump" class="input tall" value="{{c.dump}}" onChange="{{onDump}}" placeholder="Just keep writing. Messy is perfect."></textarea>\n</sc-if>\n<sc-if value="{{tShowWheel}}" hint-placeholder-val="{{ true }}">\n<div class="qblock">\n<h3>How did that make you feel?</h3>')
rep('<p class="hn" style="margin: 0">Not sure yet? That’s fine. Leave it, and we’ll work it out through your body in the next few steps.</p>\n</div>\n<div class="callout lime">',
    '<p class="hn" style="margin: 0">Not sure yet? That’s fine. Leave it, and we’ll work it out through your body in the next few steps.</p>\n</div>\n</sc-if>\n<sc-if value="{{tShowDump}}" hint-placeholder-val="{{ true }}">\n<div class="callout lime">')
i = s.index('<sc-if value="{{tShowDump}}" hint-placeholder-val="{{ true }}">\n<div class="callout lime">'); j = s.index('</div>', s.index('lets your unconscious come online', i)) + len('</div>')
s = s[:j] + '\n</sc-if>' + s[j:]

# the "your body says something different" flag on the Name it step
rep('<p class="lead">Read that back slowly. Then, based on everything you just described, which emotion feels closest?',
    '<sc-if value="{{tMis}}" hint-placeholder-val="{{ false }}"><div class="misflag"><strong>Heads up: your body might be telling a different story.</strong><span>{{tMisText}}</span></div></sc-if>\n<p class="lead">Read that back slowly. Then, based on everything you just described, which emotion feels closest?')

# ---- logic
TOP = '''// EB_V3: the three ways people feel their feelings, and the order of steps for each
var TSEQ = { def: ['dw', 1, 2, 3, 4, 5, 6, 7], body: [1, 2, 3, 'dw', 4, 5, 6, 7], see: ['w', 'd', 1, 2, 3, 4, 5, 6, 7], think: ['d', 'w', 1, 2, 3, 4, 5, 6, 7] };
var TW_STEP = ['Step 1', 'Name it on the wheel', 'other', 'Next', 'Take a breath. Look at the wheel and notice which word your eyes go to first. Don’t think too hard. Tap what feels closest.'];
var FT = {
  body: { n: '1', t: 'You feel it in your body first', s: 'You feel the feelings in your body, and struggle to name them.', e1: 'Your chest goes tight before a hard conversation, but if someone asked what you were feeling you’d say “I don’t know… bad?”', e2: 'Your stomach drops when a message comes in, and you can’t say why.', name: 'body first', recT: 'Start with your body.', recD: 'My recommendation: whenever you use any of the tools in this resource, start with the body map. You feel it first, so we’ll start where you feel it, then describe it, then find its name on the wheel.', seq: ['Body scan', 'Describe it', 'Name it on the wheel'], note: 'We’ll show you clues about which emotion it might be, based on what your body is doing.', how: 'Start by noticing what was happening in your body. We’ll map that first, then you can write it all down.' },
  see: { n: '2', t: 'You notice it later', s: 'You see what happens around you because of your feelings, and don’t realise until later that there were feelings happening. Then you notice the way your body felt.', e1: 'You slam the cupboard, snap at someone or go quiet, and only later realise you were actually hurt.', e2: 'You clean the whole house or scroll for an hour, then realise something was bugging you.', name: 'see it first', recT: 'You need to see it.', recD: 'My recommendation: whenever you use any of the tools in this resource, start with the wheel. You’ll click what you think it is on the wheel, then describe it, then do a body scan.', seq: ['Name it on the wheel', 'Describe it', 'Body scan'], note: 'We’ll let you know if your body is pointing to a different emotion. You might have had the wrong label for it, and that’s really common.', how: 'Start by finding what you think it was on the wheel, then write it all down, then we’ll check in with your body.' },
  think: { n: '3', t: 'You think it first', s: 'You think about the feelings and try to find a name for them, and then you feel them in your body.', e1: 'You can explain exactly what happened and why it bothered you, but you don’t feel much in your body until later.', e2: 'You think “I’m annoyed”, then notice your jaw is clenched.', name: 'describe it first', recT: 'You need to describe it.', recD: 'My recommendation: whenever you use any of the tools in this resource, start by describing it. Get it all out of your head first, then find its name on the wheel, then do a body scan.', seq: ['Describe it', 'Name it on the wheel', 'Body scan'], note: 'We’ll let you know if your body is pointing to a different emotion than the name you picked.', how: 'Write down everything you remember about it first. Then we’ll find its name and check in with your body.' }
};
var FTORDER = ['body', 'see', 'think'];
function tStepName(ph) { if (ph === 'w') return 'name it on the wheel'; if (ph === 'd' || ph === 'dw') return 'the brain dump'; return low(TSTEPS[ph][1]); }

'''
rep("function CMODS_ALL(s) {", TOP + "function CMODS_ALL(s) {")
rep("var self = this, s = this.state, c = s.cur, pr = s.proc, ts = s.tStep, ps = s.pStep;\n    var tm = TSTEPS[ts], pm = PSTEPS[ps];",
    "var self = this, s = this.state, c = s.cur, pr = s.proc, ps = s.pStep;\n    var tSeq = TSEQ[s.feelType] || TSEQ.def, tPos = Math.max(0, Math.min(s.tStep || 0, tSeq.length - 1)), tPh = tSeq[tPos], ts = typeof tPh === 'number' ? tPh : 0;\n    var tm = tPh === 'w' ? TW_STEP : TSTEPS[ts], pm = PSTEPS[ps];")
rep("tHasBack: ts > 0, tNoBack: ts === 0, tPrev: function () { self.setState({ tStep: ts === 7 ? 6 : Math.max(0, ts - 1), confirm: null }); self.top(); },",
    "tHasBack: tPos > 0, tNoBack: tPos === 0, tPrev: function () { self.setState({ tStep: Math.max(0, tPos - 1), confirm: null }); self.top(); },")
rep("tDots: dotsOf(8, ts), tStepLabel: 'Step ' + (ts + 1) + ' of 8',", "tDots: dotsOf(tSeq.length, tPos), tStepLabel: 'Step ' + (tPos + 1) + ' of ' + tSeq.length,")
rep("tKicker: tBpK ? tBpK + ' · ' + tm[0] : tm[0],", "tKicker: (tBpK ? tBpK + ' · ' : '') + (s.feelType ? 'Step ' + (tPos + 1) : tm[0]),")
rep("tNextLabel: tm[3], tNext: function () { self.setState({ tStep: Math.min(7, ts + 1), confirm: null }); self.top(); },",
    "tNextLabel: s.feelType && tPos < tSeq.indexOf(4) ? 'Next: ' + tStepName(tSeq[tPos + 1]) : tm[3], tNext: function () { self.setState({ tStep: Math.min(tSeq.length - 1, tPos + 1), confirm: null }); self.top(); },")
rep("tuneDone: !!s.tuneDone, tuneFlow: !s.tuneDone,", """tuneDone: !!s.tuneDone && !ftShow, tuneFlow: !s.tuneDone && !ftShow,
      ftShowPick: ftShow, ftShowBar: !ftShow && !!FT[s.feelType], ftHasPick: !!FT[s.feelType], ftName: FT[s.feelType] ? FT[s.feelType].name : '', ftSeqText: FT[s.feelType] ? FT[s.feelType].seq.join(' → ') : '',
      ftCards: FTORDER.map(function (k) { var f = FT[k], on = s.feelType === k; return { n: f.n, t: f.t, s: f.s, e1: f.e1, e2: f.e2, cls: on ? 'ftc on' : 'ftc', on: on ? 'true' : 'false', pick: function () { self.setState({ feelType: k, typeOpen: true, tStep: 0 }); setTimeout(function () { var el = document.querySelector('.ftrec'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); } }; }),
      ftRecT: FT[s.feelType] ? FT[s.feelType].recT : '', ftRecD: FT[s.feelType] ? FT[s.feelType].recD + ' This is now your default, so every time you open the Emotional Blueprint, this is the order we’ll use.' : '',
      ftSeq: FT[s.feelType] ? FT[s.feelType].seq.map(function (t, i) { return { n: String(i + 1), t: t }; }) : [], ftRecNote: FT[s.feelType] ? FT[s.feelType].note + ' Then you can choose to process it.' : '',
      ftGoLabel: s.cur && s.cur.bp ? 'Start my ' + low(EMOBY[s.cur.bp] ? EMOBY[s.cur.bp][1] : s.cur.bp) + ' blueprint →' : 'Let’s go →',
      ftGo: function () { self.setState({ typeOpen: false, tStep: 0 }); self.scrollTool('tune'); }, ftChange: function () { self.setState({ typeOpen: true }); setTimeout(function () { var el = document.getElementById('ft-pick'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); },
      tShowDump: tPh === 'd' || tPh === 'dw', tShowWheel: tPh === 'w' || tPh === 'dw', tBpFirst: !!(s.cur && s.cur.bp) && tPos === 0, tBpHow: FT[s.feelType] ? FT[s.feelType].how : 'Now notice what was happening in your body. Write it all down, then we’ll map it, step by step.',
      tMis: !!tMis, tMisText: tMis,""")
# the mismatch flag: what they picked on the wheel vs what the body clues point to
rep("    var tabs = MENUTABS.map", """    var tMis = '';
    (function () {
      var picked = Object.keys(c.words || {}).filter(function (w) { return EIMIDX[w]; }).map(function (w) { return EIMIDX[w].k; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
      if (!picked.length || ts !== 4) return;
      var best = EMO.map(function (e) { return { k: e[0], n: e[1], h: matches(c, e).length }; }).sort(function (a, b) { return b.h - a.h; })[0];
      if (best && best.h >= 2 && picked.indexOf(best.k) < 0) tMis = 'You picked ' + join(picked.map(function (k) { return low(EMOBY[k] ? EMOBY[k][1] : k); })) + ' on the wheel, but what you described in your body sounds a lot like ' + low(best.n) + '. You might have had the wrong label for it, which is really common. Have a look at ' + low(best.n) + ' below, and pick whatever feels true.';
    })();
    var ftShow = s.tab === 'tune' && (!FT[s.feelType] || !!s.typeOpen);
    var tabs = MENUTABS.map""")
# remember their type, and land on What am I feeling? once the mini course is done
rep("try { window.localStorage.setItem(EB_KEY, JSON.stringify({ tab: s.tab, tStep: s.tStep,", "try { window.localStorage.setItem(EB_KEY, JSON.stringify({ feelType: s.feelType || null, tab: s.tab, tStep: s.tStep,")
rep("tab: tabOk(s.tab), tStep: typeof s.tStep === 'number' ? Math.max(0, Math.min(7, s.tStep)) : 0,",
    "feelType: FT[s.feelType] ? s.feelType : null, tab: (CMODS_ALL(s) && ['process', 'tune', 'mine'].indexOf(tabOk(s.tab)) < 0) ? 'tune' : tabOk(s.tab), tStep: typeof s.tStep === 'number' ? Math.max(0, Math.min(8, s.tStep)) : 0,")
rep("var MENUTABS = [['home', 'Home', 'door'], ['eim', 'Energy in Motion', 'wheel'],", "var MENUTABS = [['tune', 'What am I feeling?', 'other'], ['home', 'Start here', 'door'], ['eim', 'Energy in Motion', 'wheel'],")
s = s.replace('/* EB_V2 */', '/* EB_V2 EB_V3 */', 1)
open(P, 'w', encoding='utf-8').write(s)
print('patched blueprint v3')
