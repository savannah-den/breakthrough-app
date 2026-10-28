# Run by build.py before merging. Idempotent edits to the two source artifacts:
# - Breaking Out: home-page proof that isn't linked to a belief yet can be linked with one tap
# - Home view: Journal tab removed (the Becoming Book is the journal now)
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in ['src/companion.html', 'src/one-on-one.html']:
    p = os.path.join(root, f); s = open(p, encoding='utf-8').read(); o = s
    if 'linkOpts' not in s:
        a = "return { date: e.date, text: e.text || 'A photo for my portfolio', hasPhoto: !!e.photo, photo: e.photo || '', alt: e.text ? 'Photo: ' + e.text : 'Photo of new proof', removable: true,"
        assert s.count(a) == 1, f
        s = s.replace(a, "var linkOpts = !e.belief ? candidates.map(function (b) { return { text: b, pick: function () { self.setState({ evidence: (self.state.evidence || []).map(function (x) { return x.id === e.id ? Object.assign({}, x, { belief: b }) : x; }), justAdded: 'Linked. That’s more proof against “' + b + '”.' }); } }; }) : [];\n        " + a.replace("removable: true,", "removable: true, canLink: linkOpts.length > 0, linkOpts: linkOpts,"))
        a = "belief: k === '__none' ? 'Not linked to a belief yet' : k,"
        assert s.count(a) == 1, f
        s = s.replace(a, "belief: k === '__none' ? 'My wins & sparkles' : k,")
        a = '<sc-if value="{{e.hasPhoto}}" hint-placeholder-val="{{ false }}"><img src="{{e.photo}}" alt="{{e.alt}}" style="width: 100%; max-width: 280px; border-radius: 14px"></sc-if>\n</span>'
        assert s.count(a) == 1, f
        s = s.replace(a, a[:-len('</span>')] + '<sc-if value="{{e.canLink}}" hint-placeholder-val="{{ false }}"><span style="font-size: 12px; font-weight: 600; color: #6A5A57">This is proof against…</span><span style="display: flex; flex-wrap: wrap; gap: 6px"><sc-for list="{{e.linkOpts}}" as="lk" hint-placeholder-count="2"><button class="tag" onClick="{{lk.pick}}">{{lk.text}}</button></sc-for></span></sc-if>\n</span>')
    a = '<button class="{{tabJourCls}}" role="tab" aria-selected="{{tabJourSel}}" onClick="{{goJour}}">Journal</button>'
    if a in s: s = s.replace(a, '')
    a = "goJour: function () { self.setState({ tab: 'jour' }); try { window.scrollTo({ top: 300, behavior: 'smooth' }); } catch (e) {} },"
    if a in s: s = s.replace(a, "goJour: function () { location.hash = '#Journal'; },")
    if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched', f)

# Home-only extras; Resources tab opens straight onto the "what's going on for you?" helper + resources
import re
p = os.path.join(root, 'src/companion.html'); s = open(p, encoding='utf-8').read(); o = s
a = '<sc-if value="{{showTabs}}" hint-placeholder-val="{{ true }}"><div class="bt-slot" data-slot="home-top"></div></sc-if>'
if a in s: s = s.replace(a, '<sc-if value="{{tabHome}}" hint-placeholder-val="{{ true }}"><div class="bt-slot" data-slot="home-top"></div></sc-if>')
a = '<p style="margin: 0; font-size: 17px; line-height: 1.65; color: #F6D6CF">This is your companion for the Breakthrough course'
if a in s and '<sc-if value="{{tabHome}}" hint-placeholder-val="{{ true }}">' + a not in s:
    i = s.index(a); j = s.index('</p>', i) + 4
    s = s[:i] + '<sc-if value="{{tabHome}}" hint-placeholder-val="{{ true }}">' + s[i:j] + '</sc-if>' + s[j:]
# the in-page Home/Course/Resources tabs duplicate the top nav
m = re.search(r'<sc-if value="\{\{showTabs\}\}" hint-placeholder-val="\{\{ true \}\}">\n<div class="tabs" role="tablist" aria-label="Companion sections">.*?</div>\n</sc-if>\n', s, re.S)
if m: s = s[:m.start()] + s[m.end():]
if 'data-moved="srch"' not in s:
    i = s.index('<section class="srch">')
    depth, k = 0, i
    for t in re.finditer(r'<(/?)section\b', s[i:]):
        depth += -1 if t.group(1) else 1
        if depth == 0: k = i + t.start(); break
    k = s.index('>', k) + 1
    block = s[i:k]; s = s[:i] + s[k:]
    a = '<sc-if value="{{tabRes}}" hint-placeholder-val="{{ false }}">\n<div style="display: flex; flex-direction: column; gap: 14px">\n'
    assert s.count(a) == 1
    s = s.replace(a, a + block.replace('<section class="srch">', '<section class="srch" data-moved="srch">', 1).replace('Stuck? Ask your companion', 'What will help right now?') + '\n')
if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched home/resources in companion')

# Proof from the home page can back up many beliefs at once (e.beliefs)
for f in ['src/companion.html', 'src/one-on-one.html']:
    p = os.path.join(root, f); s = open(p, encoding='utf-8').read(); o = s
    a = "(s.evidence || []).forEach(function (e) { var k = e.belief || '__none'; ensure(k); groups[k].push(e); });"
    if a in s:
        s = s.replace(a, "(s.evidence || []).forEach(function (e) { var ks = (e.beliefs && e.beliefs.length) ? e.beliefs : [e.belief || '__none']; ks.forEach(function (k) { ensure(k); groups[k].push(e); }); });")
    a = "var linkOpts = !e.belief ? candidates.map("
    if a in s: s = s.replace(a, "var linkOpts = !e.belief && !(e.beliefs && e.beliefs.length) ? candidates.map(")
    if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched multi-belief', f)

p = os.path.join(root, 'src/companion.html'); s = open(p, encoding='utf-8').read()
a = 'Your resources open up as you move through the course. A new week opens every 7 days, and its resources open with it.'
if a in s: open(p, 'w', encoding='utf-8').write(s.replace(a, 'Your resources open up as you move through the course, at your own pace.')); print('patched resources copy')

# Set-up + Intentions: Back/Done go back to where she came from (course -> next lesson, resources -> resources); Intentions shows its lesson video at the top
p = os.path.join(root, 'src/companion.html'); s = open(p, encoding='utf-8').read(); o = s
if 'doneSetup' not in s:
    pairs = [
        ('onClick="{{closeSetup}}">← Back</button>', 'onClick="{{backSetup}}">{{backSetupLabel}}</button>'),
        ('onClick="{{closeSetup}}">Done, back to home</button>', 'onClick="{{doneSetup}}">{{doneSetupLabel}}</button>'),
        ('onClick="{{closeIntent}}">← Back</button>', 'onClick="{{backIntent}}">{{backIntentLabel}}</button>\n<div class="bt-slot bt-actvid" data-slot="act-video" data-lesson="i2"></div>'),
        ('onClick="{{closeIntent}}">Done, back to my set-up steps</button>', 'onClick="{{doneIntent}}">{{doneIntentLabel}}</button>'),
        ("inSetup: st.view === 'setup',", "inSetup: st.view === 'setup', backSetup: function () { if (window.BT_COURSE && window.BT_COURSE.activityBack('setup')) return; self.setState({ view: null, tab: 'home' }); try { window.location.hash = '#Dashboard'; window.scrollTo(0, 0); } catch (e) {} }, doneSetup: function () { if (window.BT_COURSE && window.BT_COURSE.activityDone('setup')) return; self.setState({ view: null, tab: 'home' }); try { window.location.hash = '#Dashboard'; window.scrollTo(0, 0); } catch (e) {} }, backSetupLabel: window.BT_COURSE ? window.BT_COURSE.backLabel('setup', '← Back') : '← Back', doneSetupLabel: window.BT_COURSE ? window.BT_COURSE.doneLabel('setup', 'Done, back to home') : 'Done, back to home',"),
        ("closeIntent: close,", "closeIntent: close, backIntent: function () { if (window.BT_COURSE && window.BT_COURSE.activityBack('intent')) return; close(); }, doneIntent: function () { if (window.BT_COURSE && window.BT_COURSE.activityDone('intent')) return; close(); }, backIntentLabel: window.BT_COURSE ? window.BT_COURSE.backLabel('intent', '← Back') : '← Back', doneIntentLabel: window.BT_COURSE ? window.BT_COURSE.doneLabel('intent', 'Done, back to home') : 'Done, back to home',"),
    ]
    for a, b in pairs:
        assert s.count(a) == 1, a
        s = s.replace(a, b)
if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched activity returns')

# new resources get their emblem slot on the Resources page
p = os.path.join(root, 'src/companion.html'); s = open(p, encoding='utf-8').read()
a = "isOther: ['setup', 'comehome', 'blueprint'].indexOf(r.id) >= 0"
if a in s: open(p, 'w', encoding='utf-8').write(s.replace(a, "isOther: ['setup', 'comehome', 'blueprint', 'vagal', 'breathe', 'dose', 'pause', 'move', 'proof'].indexOf(r.id) >= 0")); print('patched resource emblems')
