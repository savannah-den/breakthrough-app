#!/usr/bin/env python3
"""Emotional Blueprint (24 Nov 2026): Process it shows "Coming soon" for now. To open it again, set PROCESS_SOON
to False below and rebuild. Idempotent (marker EB_SOON1). Runs after patch_blueprint_more.py."""
import os
PROCESS_SOON = True
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_SOON1' in s: print('blueprint process coming-soon already in'); raise SystemExit
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
SOON = '''<!-- EB_SOON1 -->
<sc-if value="{{tabProcessSoon}}" hint-placeholder-val="{{ false }}">
<section class="lockcard">
<span class="lockic" aria-hidden="true">✨</span>
<span class="hand" style="font-size: 16px; color: #A8231F">Process it · coming soon</span>
<p class="big">This part is on its way.</p>
<p class="lead">Process it is where you’ll move a feeling through your body and release it. It’s nearly ready. For now, keep naming what you feel with What am I feeling?, and every check-in adds to your blueprints, ready for when this opens.</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px"><button class="primary maroon" onClick="{{soonTune}}">Go to What am I feeling?</button><button class="ghost" onClick="{{soonMine}}">See my blueprints</button></div>
</section>
</sc-if>
'''
rep('<sc-if value="{{tabProcess}}" hint-placeholder-val="{{ false }}">', SOON + '<sc-if value="{{tabProcessLive}}" hint-placeholder-val="{{ false }}">')
rep("tabProcess: vt === 'process',", "tabProcess: vt === 'process', tabProcessLive: vt === 'process' && !%s, tabProcessSoon: vt === 'process' && %s, soonTune: function () { self.goTab('tune'); }, soonMine: function () { self.goTab('mine'); }," % (('true',) * 2 if PROCESS_SOON else ('false',) * 2))
open(P, 'w', encoding='utf-8').write(s)
print('blueprint: Process it coming soon' if PROCESS_SOON else 'blueprint: Process it open')
