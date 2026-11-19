#!/usr/bin/env python3
"""Make public/breakthrough-tbd.html (served at /breakthrough-tbd): the Breakthrough landing page with every price shown as TBD.
Built from public/breakthrough.html, so the two stay identical apart from the prices. Re-run after changing the main page.
What changes: every price on the page (option cards, comparison table, quiz result) says TBD, the currency picker is hidden,
and the quiz skips the "how much do you want to invest" question (its answers would show price levels)."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'public/breakthrough.html'), encoding='utf-8').read()

def must(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:80])
    s = s.replace(old, new)

# 1. flag + styles, before anything else runs
must('</head>', '''<script>window.BW_TBD = true;</script>
<style>.bw-curpick,.bw-cur-c,.bw-from,.bw-cur-note{display:none!important}.bw-cur{letter-spacing:.02em}</style>
</head>''')
# 2. the prices already in the page's HTML (before any script runs)
s, n = re.subn(r'(<span class="bw-cur" data-aud="\d+"(?: data-aud2="\d+")?>)[^<]*(</span>)', r'\1TBD\2', s)
assert n >= 9, n
s = re.sub(r'(<span class="bw-cur-c">)[^<]*(</span>)', r'\1\2', s)
# 3. the currency script redraws prices: keep them TBD
must("document.querySelectorAll('.bw-cur').forEach(function (el) {",
     "document.querySelectorAll('.bw-cur').forEach(function (el) {\n      if (window.BW_TBD) { el.textContent = 'TBD'; var c0 = el.nextElementSibling; if (c0 && c0.classList.contains('bw-cur-c')) c0.textContent = ''; return; }")
# 4. the quiz: prices in its result say TBD, and the budget question is skipped
must("function price(k) { var g = k === 'group';", "function price(k) { if (window.BW_TBD) return '<span class=\"bw-cur\">TBD</span>'; var g = k === 'group';")
i = s.find('var Q = [')
j = s.find('];', i) + 2
s = s[:j] + "\n  if (window.BW_TBD) Q = Q.filter(function (q) { return !q.budget; });" + s[j:]
open(os.path.join(ROOT, 'public/breakthrough-tbd.html'), 'w', encoding='utf-8').write(s)
print('public/breakthrough-tbd.html written,', n, 'prices set to TBD')
