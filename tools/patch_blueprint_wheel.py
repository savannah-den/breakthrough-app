#!/usr/bin/env python3
"""Emotional Blueprint, What am I feeling? wheel (24 Nov 2026): zoom buttons on the wheel (it's hard to read
small), and tapping a word now opens a simple card under the wheel (what it means, what it can sound like,
where you might feel it, what it might make you do) with "Yes, that's it" / "Not this one" before it's picked.
Idempotent (marker EB_WHEEL1). Runs after patch_blueprint_way.py, then tools/import_canvas.py."""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_WHEEL1' in s: print('blueprint wheel zoom already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)

OLD = '''<div class="wheelwrap pwheel"><img src="/_blob/155c64712190eac9be159d6ad01d6e35" alt="The Energy in Motion wheel. Tap any feeling that fits.">
<sc-for list="{{tfHl}}" as="h" hint-placeholder-count="2"><span class="{{h.cls}}" style="left: {{h.x}}%; top: {{h.y}}%" aria-hidden="true"></span></sc-for>
<sc-for list="{{tfBtns}}" as="w" hint-placeholder-count="126"><button class="{{w.cls}}" style="left: {{w.x}}%; top: {{w.y}}%" aria-label="{{w.l}}" onClick="{{w.pick}}"></button></sc-for></div>'''
NEW = '''<!-- EB_WHEEL1 -->
<div class="wzbar"><span class="wz-t">Tap a word to see what it means</span><span class="wz-c"><button class="{{wzOutCls}}" onClick="{{wzOut}}" aria-label="Zoom out">−</button><span class="wz-p">{{wzPct}}</span><button class="{{wzInCls}}" onClick="{{wzIn}}" aria-label="Zoom in">+</button><sc-if value="{{wzZoomed}}" hint-placeholder-val="{{ false }}"><button class="wz-r" onClick="{{wzReset}}">Fit</button></sc-if></span></div>
<div class="{{wzBoxCls}}" id="wzbox">
<div class="wheelwrap pwheel" style="width: {{wzW}}; max-width: {{wzMax}}"><img src="/_blob/155c64712190eac9be159d6ad01d6e35" alt="The Energy in Motion wheel. Tap any feeling to read about it.">
<sc-for list="{{tfHl}}" as="h" hint-placeholder-count="2"><span class="{{h.cls}}" style="left: {{h.x}}%; top: {{h.y}}%" aria-hidden="true"></span></sc-for>
<sc-for list="{{tfBtns}}" as="w" hint-placeholder-count="126"><button class="{{w.cls}}" style="left: {{w.x}}%; top: {{w.y}}%" aria-label="{{w.l}}" onClick="{{w.pick}}"></button></sc-for></div>
</div>
<sc-if value="{{wiShow}}" hint-placeholder-val="{{ false }}">
<section class="wicard" id="wicard" style="border-top-color: {{wi.col}}" aria-live="polite">
<div class="wi-h" style="background: {{wi.bg}}"><span class="ftag">{{wi.ring}}</span><span class="wi-w">{{wi.word}}</span><p class="wi-r">{{wi.root}}</p><button class="wi-x" onClick="{{wi.close}}" aria-label="Close this card">×</button></div>
<p class="wi-d">{{wi.desc}}</p>
<div class="wi-g">
<div class="wi-s"><span class="tfk">It can sound like</span><div class="bubbles"><sc-for list="{{wi.thoughts}}" as="t" hint-placeholder-count="3"><span class="bub">“{{t}}”</span></sc-for></div></div>
<div class="wi-s"><span class="tfk">In your body</span><ul class="wi-l"><sc-for list="{{wi.body}}" as="t" hint-placeholder-count="3"><li>{{t}}</li></sc-for></ul></div>
<div class="wi-s"><span class="tfk">It might make you want to</span><ul class="wi-l"><sc-for list="{{wi.urges}}" as="t" hint-placeholder-count="3"><li>{{t}}</li></sc-for></ul></div>
</div>
<p class="wi-q">{{wi.ask}}</p>
<div class="wi-a"><button class="primary maroon" onClick="{{wi.yes}}">{{wi.yesL}}</button><button class="ghost" onClick="{{wi.no}}">{{wi.noL}}</button></div>
</section>
</sc-if>'''
rep(OLD, NEW)

# wheel taps open the card instead of picking straight away
rep("return { cls: ['wb ec0', 'wb ec1', 'wb ec2', 'wb ec3', 'wb ec4'][ix.ring], x: p.x, y: p.y, l: 'Pick ' + w, pick: function () { pickTw(w); } }; });",
    "return { cls: ['wb ec0', 'wb ec1', 'wb ec2', 'wb ec3', 'wb ec4'][ix.ring] + (s.wInfo === w ? ' on' : ''), x: p.x, y: p.y, l: 'Read about ' + w, pick: function () { self.setState({ wInfo: w }); setTimeout(function () { var el = document.getElementById('wicard'); if (el && el.scrollIntoView) { var r = el.getBoundingClientRect(); if (r.top > window.innerHeight - 120 || r.top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 60); } }; });\n"
    "      var wiVals = (function () { var w = s.wInfo, ix = w && EIMIDX[w], d = w && EIMW[w]; if (!ix || !d) return { wiShow: false, wi: {} }; var E0 = EIMBY[ix.k], col = E0[2], on = !!tw[w], close = function () { self.setState({ wInfo: null }); };\n"
    "        return { wiShow: true, wi: { word: w, col: col, bg: col + '1F', ring: EIMRING[ix.ring], root: ix.ring === 0 ? E0[1] + ' is one of the root feelings on the wheel.' : 'Part of the ' + E0[1].toLowerCase() + ' family.', desc: d[0], thoughts: d[1] || [], body: d[2] || [], urges: d[4] || [],\n"
    "          ask: on ? 'You’ve picked this one.' : 'Does this sound like what you’re feeling?', yesL: on ? 'Keep it' : 'Yes, that’s it', noL: on ? 'Take it off' : 'Not this one',\n"
    "          yes: function () { if (!on) pickTw(w); self.setState({ wInfo: null }); }, no: function () { if (on) pickTw(w); self.setState({ wInfo: null }); }, close: close } }; })();\n"
    "      Object.assign(NV, wiVals);\n"
    "      var wzVals = (function () { var Z = [1, 1.5, 2, 2.6, 3.2], z = Math.max(0, Math.min(Z.length - 1, s.wZoom || 0)), go = function (nz) { var b = document.getElementById('wzbox'), cx = 0.5, cy = 0.5; if (b && b.scrollWidth) { cx = (b.scrollLeft + b.clientWidth / 2) / b.scrollWidth; cy = (b.scrollTop + b.clientHeight / 2) / b.scrollHeight; } self.setState({ wZoom: nz }); setTimeout(function () { var b2 = document.getElementById('wzbox'); if (b2) { b2.scrollLeft = cx * b2.scrollWidth - b2.clientWidth / 2; b2.scrollTop = cy * b2.scrollHeight - b2.clientHeight / 2; } }, 40); };\n"
    "        return { wzW: z ? (Z[z] * 100) + '%' : '100%', wzMax: z ? Math.round(640 * Z[z]) + 'px' : '640px', wzPct: Math.round(Z[z] * 100) + '%', wzZoomed: z > 0, wzBoxCls: z ? 'wzbox zoomed' : 'wzbox', wzOutCls: z === 0 ? 'wz-b off' : 'wz-b', wzInCls: z === Z.length - 1 ? 'wz-b off' : 'wz-b',\n"
    "          wzIn: function () { if (z < Z.length - 1) go(z + 1); }, wzOut: function () { if (z > 0) go(z - 1); }, wzReset: function () { go(0); } }; })();\n"
    "      Object.assign(NV, wzVals);")

CSS = """.wzbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:4px}
.wz-t{font-size:14px;font-weight:600;color:#4E0C08}
.wz-c{display:inline-flex;align-items:center;gap:6px}
.wz-b{width:40px;height:40px;border-radius:999px;border:1.5px solid #1F1412;background:#FFFFFF;color:#1F1412;font-size:22px;font-weight:700;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.wz-b.off{opacity:.35;cursor:default}
.wz-p{min-width:46px;text-align:center;font-size:13px;font-weight:600;color:#463A38}
.wz-r{padding:8px 14px;border-radius:999px;border:1.5px solid #EDE3DF;background:#FBE6FC;color:#4E0C08;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.wzbox{border-radius:22px}
.wzbox.zoomed{overflow:auto;max-height:min(78vh,720px);border:1.5px solid #EDE3DF;background:#FFFFFF;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.wzbox.zoomed .wheelwrap{margin:0}
.wicard{display:flex;flex-direction:column;gap:14px;padding:0 0 18px;border-radius:24px;background:#FFFFFF;border:1.5px solid #EDE3DF;border-top:10px solid #EDE3DF;box-shadow:0 14px 34px rgba(78,12,8,.10);overflow:hidden;scroll-margin-top:90px;animation:wiIn .35s ease}
@keyframes wiIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.wi-h{position:relative;display:flex;flex-direction:column;gap:4px;padding:16px 56px 16px 20px}
.wi-w{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:clamp(28px,6vw,40px);line-height:1.1;color:#1F1412}
.wi-r{margin:0;font-size:14px;color:#463A38}
.wi-x{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:999px;border:1.5px solid #1F1412;background:#FFFFFF;font-size:22px;line-height:1;cursor:pointer;color:#1F1412}
.wi-d{margin:0 20px;font-size:16px;line-height:1.55;color:#1F1412}
.wi-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:0 20px}
.wi-s{display:flex;flex-direction:column;gap:8px;min-width:0}
.wi-l{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:14.5px;line-height:1.45;color:#1F1412}
.wi-q{margin:0 20px;font-weight:600;color:#4E0C08}
.wi-a{display:flex;flex-wrap:wrap;gap:10px;margin:0 20px}
@media (prefers-reduced-motion: reduce){.wicard{animation:none}}
</style>"""
s = s.replace('</style>', CSS, 1)
open(P, 'w', encoding='utf-8').write(s)
print('blueprint wheel zoom + info card added')
