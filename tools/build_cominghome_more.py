#!/usr/bin/env python3
"""Coming Home: put the words from src/cominghome-more.py (the how-to + why-it-works page for each of the 55 ways)
into src/canvases/cominghome.dc.html, between the CH_MORE markers. Run by tools/build.py; safe to re-run."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANVAS = os.path.join(ROOT, 'src/canvases/cominghome.dc.html')
ns = {}
exec(open(os.path.join(ROOT, 'src/cominghome-more.py'), encoding='utf-8').read(), ns)
BODY, W = ns['BODY'], dict(ns['W'])
for k in ns['SOS']: assert k not in W, k
W.update(ns['SOS'])

more = {}
for k, (b, steps, why, ben, when) in W.items():
    assert b in BODY, (k, b)
    more[k] = {'b': b, 'steps': [{'t': t, 'd': d} for t, d in steps], 'why': [{'t': t, 'd': d} for t, d in why],
               'ben': ben, 'when': when}
body = {k: {'t': v['t'], 'd': v['d'], 'p': v['p']} for k, v in BODY.items()}

js = ('var CH_MORE = ' + json.dumps(more, ensure_ascii=False, separators=(',', ':')) + ';\n'
      'var CH_BODY = ' + json.dumps(body, ensure_ascii=False, separators=(',', ':')) + ';\n')
A, B = '// CH_MORE start (made by tools/build_cominghome_more.py from src/cominghome-more.py, do not edit here)\n', '// CH_MORE end\n'
s = open(CANVAS, encoding='utf-8').read()
i, j = s.find(A), s.find(B)
assert i > 0 and j > i, 'CH_MORE markers missing'
s = s[:i + len(A)] + js + s[j:]
open(CANVAS, 'w', encoding='utf-8').write(s)
print('Coming Home: how-to pages written for', len(more), 'ways + SOS moves')
