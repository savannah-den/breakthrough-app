#!/usr/bin/env python3
"""Build the Claude "playground" copy of the app into playground/ (not deployed).

  python3 tools/build_playground.py

Same pages as public/, but paths are relative (so it runs as a Claude artifact),
and the real database is swapped for playground-src/demo-backend.js, so nothing
in the playground touches live clients. The launcher page is playground-src/launcher.html.
"""
import json, os, re, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = 'playground'
SUPA = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'
if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT + '/tools/assets'); os.makedirs(OUT + '/js'); os.makedirs(OUT + '/css'); os.makedirs(OUT + '/icons')

def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)
def must(s, old, new, name):
    if old not in s: raise SystemExit(f'build_playground: "{old}" not found in {name}')
    return s.replace(old, new)

def root_page(s):
    s = s.replace('<link rel="manifest" href="/manifest.webmanifest">', '')
    s = s.replace(SUPA, 'js/demo-backend.js')
    for a in ('css', 'js', 'icons'):
        s = s.replace(f'"/{a}/', f'"{a}/')
    s = s.replace("'/tools/", "'tools/").replace('"/tools/', '"tools/')
    s = s.replace("'/#", "'#").replace('"/#', '"#')
    return s

def tool_page(s):
    s = s.replace('<link rel="manifest" href="/manifest.webmanifest">', '')
    s = s.replace(SUPA, '../js/demo-backend.js')
    for a in ('css', 'js', 'icons'):
        s = s.replace(f'"/{a}/', f'"../{a}/')
    s = s.replace('/tools/assets/', 'assets/').replace('/tools/', '')
    s = s.replace("'/#", "'../app.html#").replace('"/#', '"../app.html#')
    return s

wr(OUT + '/app.html', root_page(rd('public/index.html')))
wr(OUT + '/admin.html', root_page(rd('public/admin.html')))
for f in os.listdir('public/tools'):
    if f.endswith('.html'):
        wr(f'{OUT}/tools/{f}', tool_page(rd('public/tools/' + f)))
for f in os.listdir('public/tools/assets'):
    shutil.copy(f'public/tools/assets/{f}', f'{OUT}/tools/assets/{f}')
for f in os.listdir('public/icons'):
    shutil.copy(f'public/icons/{f}', f'{OUT}/icons/{f}')
shutil.copytree('public/img', OUT + '/img', dirs_exist_ok=True)
for f in os.listdir('public/css'):
    shutil.copy(f'public/css/{f}', f'{OUT}/css/{f}')

sh = rd('public/js/shell.js')
sh = must(sh, "href: '/admin'", "href: 'admin.html'", 'shell.js')
sh = must(sh, "'/1to1' : '/'", "'./' : './'", 'shell.js')
sh = re.sub(r"\n\s*if \('serviceWorker' in navigator[^\n]*", '\n', sh)
sh = must(sh, "/^\\/(tools\\/|#)/", "/^(tools\\/|#)/", 'shell.js')
sh = must(sh, "x.charAt(1) === '#'", "x.charAt(0) === '#'", 'shell.js')
sh = sh.replace("href: '/tools/", "href: 'tools/")
sh = sh.replace("src: '/icons/", "src: 'icons/")
wr(OUT + '/js/shell.js', sh)

ts = rd('public/js/tool-shell.js')
ts = ts.replace("'/#", "'../app.html#")
ts = must(ts, "location.replace('/')", "location.replace('../app.html')", 'tool-shell.js')
ts = must(ts, "href.charAt(0) === '/' && a.target === '_blank'", "!/^https?:/.test(href) && a.target === '_blank'", 'tool-shell.js')
wr(OUT + '/js/tool-shell.js', ts)

ad = rd('public/js/admin.js')
ad = ad.replace("href: '/', text: 'Open the app'", "href: 'app.html?door=private', text: 'Open the app'").replace('<a href="/"', '<a href="app.html"')
wr(OUT + '/js/admin.js', ad)

for f in os.listdir('public/js'):
    if f.endswith('.js') and not os.path.exists(f'{OUT}/js/{f}'):
        wr(f'{OUT}/js/{f}', rd('public/js/' + f).replace("'/tools/", "'tools/").replace('"/tools/', '"tools/'))
os.makedirs(OUT + '/js/vendor', exist_ok=True)
for f in os.listdir('public/js/vendor'):
    shutil.copy('public/js/vendor/' + f, OUT + '/js/vendor/' + f)
wr(OUT + '/js/config.js', "// PLAYGROUND: uses the pretend database in demo-backend.js, never the live one.\nwindow.BT_CONFIG = { supabaseUrl: 'playground', supabaseAnonKey: 'playground', aiEnabled: false, coachName: 'Sav' };\n")
shutil.copy('playground-src/demo-backend.js', OUT + '/js/demo-backend.js')
# Launcher: the tools, in the order they come up in the program, with their logos (like the course cards)
import subprocess, html as _h
EMB = json.loads(subprocess.check_output(['node', 'tools/emblems.js']))
RES = {r['id']: r for r in json.load(open('src/resources.json', encoding='utf-8'))}
OUTLINE = json.load(open('src/course-outline.json', encoding='utf-8'))
order, where = [], {}
for w in OUTLINE['weeks']:
    for l in w['lessons']:
        for rid in (l.get('res') or []):
            if rid in RES and rid not in order: order.append(rid); where[rid] = w['week']
for rid in RES:
    if rid not in order: order.append(rid); where[rid] = RES[rid].get('week', 0)
LINK = {'setup': 'app.html?door=course&amp;peek=1#Setup', 'intent': 'app.html?door=course&amp;peek=1#Intentions', 'box': 'app.html?door=course&amp;peek=1#BreakingOut',
        'star': 'app.html?door=course&amp;peek=1#StarHome', 'proof': 'app.html?door=course&amp;peek=1#Proof'}
def href(r):
    if r['id'] in LINK: return LINK[r['id']]
    hf = r.get('href') or ''
    if hf.startswith('/tools/'): return hf[1:]
    if hf.startswith('#'): return 'app.html?door=course&amp;peek=1' + hf
    return 'app.html?door=course&amp;peek=1'
def tile(rid):
    r = RES[rid]; wk = where.get(rid, 0)
    em = EMB.get(rid, EMB.get('star', ''))
    return ('<a class="tool tl" href="%s"><span class="tl-em" style="background:%s"><svg viewBox="0 0 64 64" aria-hidden="true">%s</svg></span>'
            '<span class="tl-t"><span class="tl-k">%s</span><b>%s</b><span>%s</span></span></a>') % (
        href(r), r.get('cover', '#FFF4EE'), em, 'Start here' if wk == 0 else 'Week %d' % wk, _h.escape(r['title']), _h.escape(r.get('desc', '')))
REP = '<a class="tool tl" href="app.html?door=private&amp;peek=1#RepTest"><span class="tl-em" style="background:#FFF4EE"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="22" cy="22" r="10" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.5"/><circle cx="42" cy="22" r="10" fill="#F1F9A6" stroke="#1F1412" stroke-width="2.5"/><circle cx="22" cy="42" r="10" fill="#F28C3B" stroke="#1F1412" stroke-width="2.5"/><circle cx="42" cy="42" r="10" fill="#4E0C08" stroke="#1F1412" stroke-width="2.5"/></svg></span><span class="tl-t"><span class="tl-k">Start here · 1:1 clients</span><b>Rep System Test</b><span>How your brain takes things in</span></span></a>'
tl = [tile(rid) for rid in order]
k = max(i for i, rid in enumerate(order) if where.get(rid, 0) == 0) + 1
tl.insert(k, REP)
tiles = '\n      '.join(tl)
L = rd('playground-src/launcher.html')
m = re.search(r'<div class="tools">.*?</div>\n  </section>', L, re.S)
assert m, 'tools block not found'
L = L[:m.start()] + '<div class="tools tl-list">\n      ' + tiles + '\n    </div>\n  </section>' + L[m.end():]
L = L.replace('</style>', '.tl-list{grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))}\n.tool.tl{flex-direction:row;align-items:center;gap:12px;padding:10px 12px}\n.tl-em{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;border:1.5px solid var(--ink)}\n.tl-em svg{width:42px;height:42px}\n.tl-t{display:flex;flex-direction:column;gap:1px;min-width:0}\n.tl-t .tl-k{font-family:var(--hand);font-size:14px;letter-spacing:.05em;color:#A8231F}\n.tl-t b{font-size:15px}\n.tl-t span:last-child{font-size:12.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}\n</style>', 1)
wr(OUT + '/index.html', L)

left = []
for d, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith(('.html', '.js', '.css')):
            for m in re.finditer(r'''["'(]/(?!/)[A-Za-z_#]''', rd(os.path.join(d, f))):
                left.append(f'{os.path.join(d, f)}: {m.group(0)}')
n = sum(len(fs) for _, _, fs in os.walk(OUT))
print(f'built {OUT}/ ({n} files)')
if left: print('absolute paths left:', left[:15])
