#!/usr/bin/env python3
"""Turn the Private Coaching Packages design (src/canvases/coaching.dc.html, copied from Sav's Design canvas)
into the real app page public/coaching.html (served at /coaching). Re-run after copying a newer canvas in.
Buttons email Sav for now; they get swapped for Stripe checkout links later."""
import re, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src/canvases/coaching.dc.html'), encoding='utf-8').read()

head = re.search(r'<helmet>(.*?)</helmet>', src, re.S).group(1)
body = re.search(r'</helmet>(.*)</x-dc>', src, re.S).group(1).strip()
# the canvas wraps everything in one extra closing </div> from x-dc's root; keep the page div only
script = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', src, re.S).group(1)

# table rows from the canvas logic (plain JS object literals → JSON)
rows_js = re.search(r'const table = (\[.*?\]);', script, re.S).group(1)
rows = json.loads(re.sub(r"(\w+):\s*'", r'"\1": "', rows_js).replace("',", '",').replace("' }", '" }').replace("'}", '"}'))
tpl = re.search(r'<sc-for list="\{\{table\}\}"[^>]*>(.*?)</sc-for>', body, re.S)
out_rows = ''.join(re.sub(r'\{\{r\.(\w+)\}\}', lambda m: r[m.group(1)], tpl.group(1)) for r in rows)
body = body[:tpl.start()] + out_rows + body[tpl.end():]
assert '{{' not in body, 'unfilled template left in coaching canvas'

# photo + responsive width
body = re.sub(r'src="/_blob/[0-9a-f]+"', 'src="/img/coaching-sav.jpg"', body)
body = body.replace('<div style="width: 390px; min-height:', '<div class="cp-page" style="min-height:', 1)
body = re.sub(r'(class="cp-page" style=")min-height: \d+px; ', r'\1', body)

# buttons: back → home, package buttons → email Sav (Stripe later)
body = body.replace('<a href="#" aria-label="Back"', '<a href="/" aria-label="Back to the app"', 1)
MAIL = 'mailto:savannah@colourmeneurospicy.com.au?subject='
for label, pkg in [('Pull up a seat', 'Around the fire (group)'), ('Stoke my fire', 'Stoke the fire'),
                   ('Fan my flames', 'Fan the flames'), ('Pour it on', 'Pour on the lighter fluid')]:
    i = body.find('>' + label + '</a>')
    assert i > 0, label
    j = body.rfind('<a href="#"', 0, i)
    assert j > 0, label
    body = body[:j] + '<a href="' + MAIL + pkg.replace(' ', '%20').replace('(', '%28').replace(')', '%29') + '"' + body[j + len('<a href="#"'):]
assert 'href="#"' not in body, 'a button still has no link'

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Private Coaching · Colour Me Neurospicy</title>
<meta name="description" content="Private coaching with Sav: group, 4, 8 or 12 private hours over four months.">
<meta name="theme-color" content="#FCF5F6">
<link rel="icon" href="/icons/favicon-32.png" sizes="32x32">
{head.strip()}
<style>
html{{background:#F3E4EA}}
.cp-page{{width:100%;max-width:480px;margin:0 auto;box-shadow:0 0 40px rgba(122,22,56,.08)}}
</style>
</head>
<body>
{body}
</body>
</html>
'''
open(os.path.join(ROOT, 'public/coaching.html'), 'w', encoding='utf-8').write(page)
print('public/coaching.html written,', len(rows), 'table rows')
