#!/usr/bin/env python3
"""Turn a Claude Design canvas tool (Main.dc.html) into a stand-alone app page.

  python3 tools/import_canvas.py            # rebuilds every tool listed in TOOLS below

Each tool becomes public/tools/<slug>.html. Images the canvas uploaded (/_blob/<id>)
must already be in public/tools/assets/ as <id>.<ext>.
The page logs the client in (or sends them to log in), syncs their answers to their
account, and runs the tool with the same view engine as the main app.
"""
import json, os, re, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# slug, canvas source, page title, who can open it ('all' or 'private')
TOOLS = [
    ('what-if-workout', 'src/canvases/whatif.dc.html', 'The What If? Workout', 'all'),
    ('understanding-bridge', 'src/canvases/bridge.dc.html', 'The Understanding Bridge', 'all'),
    ('rewind', 'src/canvases/rewind.dc.html', 'REWIND: Respond Instead of React', 'all'),
    ('coming-home', 'src/canvases/cominghome.dc.html', 'Coming Home: into your body', 'all'),
    ('emotional-blueprint', 'src/canvases/blueprint.dc.html', 'Emotional Blueprint', 'all'),
]

# Old Claude links -> where they live in the app now
LINKMAP = {
    'https://claude.ai/artifact/QqJyzMdLBPxAYAqEF75ZLU': '/tools/what-if-workout.html',
    'https://claude.ai/artifact/X9AtqxBpUrFqNGeEpV4oDq': '/tools/understanding-bridge.html',
    'https://claude.ai/artifact/7vhPXB6qk44ZgBedMtu1LH': '/tools/understanding-bridge.html',
    'https://claude.ai/artifact/FqJ1L11BF9aea3ikK9AwxL': '/tools/rewind.html',
    'https://claude.ai/artifact/35eQW5zjXVifUVwkN29WYH': '/tools/coming-home.html',
    'https://claude.ai/artifact/HRAvvMMNcBxzfHp8WKBdng': '/tools/emotional-blueprint.html',
    'https://claude.ai/artifact/6HCi595DN9RDB3vYTWz586': '/tools/emotional-blueprint.html',
    'https://claude.ai/artifact/9EmLZhKxht5gpVt2Vzi2by': '/#BreakingOut',
    'https://claude.ai/artifact/Q77bEWStxEkmQuNSg8rEK5': '/#BreakingOut',
    'https://claude.ai/artifact/RLjVTdNeFaxE7R5uaxdTrV': '/#StarHome',
}


def runtime():
    """The tiny view engine, taken from the merged app bundle so both stay identical."""
    s = open('src/companion.html', encoding='utf-8').read()
    i = s.find('<script>') + len('<script>')
    j = s.find('var VIEWS = {};')
    return s[i:j]


def relink(text):
    for old, new in LINKMAP.items():
        text = text.replace(old, new)
    return text


def assets_index():
    idx = {}
    for f in os.listdir('public/tools/assets'):
        stem, _, ext = f.partition('.')
        idx[stem] = f
    return idx


def build(slug, src, title, access, rt, assets):
    s = open(src, encoding='utf-8').read()
    hi, he = s.find('<helmet>'), s.find('</helmet>')
    head_extra = s[hi + 8:he].strip() if hi >= 0 else ''
    xi = s.find('<x-dc>')
    body = s[(he + 9 if hi >= 0 else xi + 6):s.find('</x-dc>')]
    m = re.search(r"<script type=\"text/x-dc\" data-dc-script(?: data-props='([^']*)')?>(.*?)</script>", s, re.S)
    if not m:
        raise SystemExit('no component script in ' + src)
    props_decl = json.loads(m.group(1) or '{}')
    props = {k: v.get('default', '') for k, v in props_decl.items() if not k.startswith('$') and isinstance(v, dict)}
    code = m.group(2)

    missing = set()
    def blob(mm):
        name = assets.get(mm.group(1))
        if not name:
            missing.add(mm.group(1)); return mm.group(0)
        return '/tools/assets/' + name
    body = re.sub(r'/_blob/([0-9a-f]{32})', blob, relink(body))
    code = re.sub(r'/_blob/([0-9a-f]{32})', blob, relink(code))
    head_extra = re.sub(r'/_blob/([0-9a-f]{32})', blob, head_extra)
    # some tools build '/_blob/' + id at runtime
    code = code.replace("'/_blob/' + ", "BT_ASSET(").replace('"/_blob/" + ', 'BT_ASSET(')
    if 'BT_ASSET(' in code:
        # close the call: BT_ASSET(x) — the original was '/_blob/' + EXPR; wrap EXPR up to the next ',' ')' or ';'
        code = re.sub(r'BT_ASSET\(([A-Za-z0-9_\.\[\]]+)', r'BT_ASSET(\1)', code)
    # "Download as JPEG" / "Copy to notes" -> save into the Becoming Book (handled by saves.js)
    body = re.sub(r'<button class="primary lime edge" onClick="\{\{download\}\}">.*?Download as JPEG</button>\s*<button class="ghost" onClick="\{\{copy\}\}">\{\{copyLabel\}\}</button>',
                  '<a class="primary lime edge" href="#bt-book-save" style="text-decoration:none">Save to my Becoming Book</a>', body, flags=re.S)
    body = body.replace('Download it as an image, copy it into your notes, or screenshot the card. Looking back at old what-ifs',
                        'Save it to your Becoming Book with today’s date. Looking back at old what-ifs')
    body = body.replace('Download it as an image, copy it into your notes, or screenshot the card. Pop it somewhere you’ll see it.',
                        'Save it to your Becoming Book with today’s date, so you can look back and see how you’ve changed.')
    props = json.loads(relink(json.dumps(props)))
    props_js = json.dumps(props)

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="theme-color" content="#4E0C08">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/css/shell.css">
<link rel="stylesheet" href="/css/app.css">
{head_extra}
<style>body{{padding-top:env(safe-area-inset-top,0px)}}[hidden]{{display:none!important}}</style>
</head>
<body>
<!-- GENERATED by tools/import_canvas.py from {src}. Re-run it after updating the canvas. -->
<div id="bt-gate" class="bt-gate" hidden></div>
<div id="app"></div>
<template id="t-main">{body}</template>
<script>
var BT_ASSETS = {json.dumps({k: v for k, v in assets.items()})};
function BT_ASSET(id) {{ return '/tools/assets/' + (BT_ASSETS[id] || id); }}
{rt}
window.BT_TOOL = {{ slug: {json.dumps(slug)}, access: {json.dumps(access)}, props: {props_js}, cls: (function () {{
{code}
return Component;
}})() }};
</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="/js/config.js"></script>
<script src="/js/course-data.js"></script>
<script src="/js/course.js"></script>
<script src="/js/saves.js"></script>
<script src="/js/tool-shell.js"></script>
</body>
</html>
'''
    out = f'public/tools/{slug}.html'
    open(out, 'w', encoding='utf-8').write(page)
    print(f'{out}: {len(page)//1024} KB' + (f'  MISSING ASSETS: {sorted(missing)}' if missing else ''))


if __name__ == '__main__':
    rt, assets = runtime(), assets_index()
    for t in TOOLS:
        build(*t, rt, assets)
