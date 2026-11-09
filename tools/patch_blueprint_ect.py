#!/usr/bin/env python3
"""Emotional Blueprint: its ECT tab used to be its own copy of the ECT page. Now every 'ECT' button opens the one
real ECT page (/ect, built from the app's ECT view by tools/build_ect.py), so there's only one to keep up to date.
Idempotent (marker EB_ECT1). Then run tools/import_canvas.py."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_ECT1' in s: print('blueprint ECT already linked'); raise SystemExit
a = s.index('<sc-if value="{{tabEct}}"'); depth = 0
for m in re.finditer(r'<sc-if\b|</sc-if>', s[a:]):
    depth += 1 if m.group() != '</sc-if>' else -1
    if depth == 0: end = a + m.end(); break
stub = ('<!-- EB_ECT1: the ECT page lives in one place now (/ect) --><sc-if value="{{tabEct}}" hint-placeholder-val="{{ false }}">'
        '<section class="sec"><p class="lead">Taking you to the ECT page…</p><div style="display: flex; flex-wrap: wrap; gap: 10px">'
        '<a class="primary" href="{{ectPageUrl}}" target="_self">Open the ECT page →</a><button class="ghost" onClick="{{go.mine}}">← My blueprints</button></div></section></sc-if>')
s = s[:a] + stub + s[end:]
old = "goEct: function () { self.goTab('ect'); },"
assert old in s
s = s.replace(old, "goEct: function () { self.openEct(); }, ectPageUrl: String(self.props.ectPageUrl || '/ect'),", 1)
old = '  goTab(t) {'
assert old in s
s = s.replace(old, "  openEct() { var u = String(this.props.ectPageUrl || '/ect'); if (this.state.tab === 'ect') this.setState({ tab: 'mine' }); try { window.location.href = u; } catch (e) {} }\n  goTab(t) { if (t === 'ect') return this.openEct();", 1)
old = "    try { var raw = window.localStorage.getItem(EB_KEY); if (raw) s = JSON.parse(raw); } catch (e) {}"
assert s.count(old) == 1
s = s.replace(old, old + "\n    if (s && s.tab === 'ect') s.tab = 'mine'; /* EB_ECT1 */", 1)
open(P, 'w', encoding='utf-8').write(s)
print('blueprint: ECT buttons open /ect')
