# Breaking Out of Your Box, Nov 2026 rework of Step 1 (Beliefs). Idempotent; run by build.py.
# - one page per section, each with a hand-drawn picture
# - "signs you might believe this" under every belief, no Fierce 5 tags yet (they learn those in the results)
# - "This isn't every limiting belief ever" now teaches how to spot one
# - See my results opens the results page (#BoxResults, in course.js)
# - only three steps for clients: Beliefs, Programs, Proof. The other pages are drafts:
#   visible in the playground and to Sav (coach login), hidden from clients.
import os, json, sys
SCALE = '<svg viewBox="0 -20 360 230" role="img" aria-label="A scale tipping towards the new proof" style="width: 100%; max-width: 380px; align-self: center; height: auto"><g fill="none" stroke="#4E0C08" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M180 50l-22 150h44z" fill="#F4C2F7"/><path d="M132 202h96" stroke-width="3"/><g transform="rotate(12 180 50)"><path d="M60 50h240" stroke-width="5"/><path d="M60 50v34M60 50L32 84M60 50l28 34" stroke-width="1.6"/><path d="M14 84h92c-4 22-22 32-46 32S18 106 14 84z" fill="#F6EFEC"/><g fill="#C9A39B" stroke-width="1.4"><circle cx="46" cy="94" r="6"/><circle cx="60" cy="96" r="6"/><circle cx="74" cy="94" r="6"/><circle cx="53" cy="84" r="6"/></g><text x="60" y="140" text-anchor="middle" stroke="none" fill="#6A5A57" font-family="Poppins,sans-serif" font-size="13" font-weight="700">Old proof</text><path d="M300 50v34M300 50l-28 34M300 50l28 34" stroke-width="1.6"/><path d="M254 84h92c-4 22-22 32-46 32s-42-10-46-32z" fill="#F8FCD6"/><g fill="#F2B705" stroke-width="1.2"><path d="M272 82l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M290 84l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M308 82l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M326 84l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M281 70l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M299 70l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/><path d="M317 70l3 6 6.6 1-4.8 4.6 1.1 6.6-5.9-3.1-5.9 3.1 1.1-6.6-4.8-4.6 6.6-1z"/></g><text x="300" y="140" text-anchor="middle" stroke="none" fill="#4E0C08" font-family="Poppins,sans-serif" font-size="13" font-weight="700">New proof</text></g><circle cx="180" cy="50" r="7" fill="#F1F9A6"/></g></svg>'
MAPTXT = '<div class="pd-mapwhy"><div class="hand" style="font-size: 15px; color: #A8231F">Feeling a bit much?</div><p>This might feel overwhelming to look at, and that’s okay. You don’t need to keep looking at it if you don’t want to.</p><p>The real purpose of all this is the search. When you notice something happening, you can come in, tap what you’re experiencing or write a bit about it, and it’ll pull up the program and show you the limiting beliefs you might be bumping up against. Then you can go to your proof and remind yourself the opposite is true, so you can move through it.</p><p><b>For example:</b> you notice yourself abandoning your needs and people pleasing. Come here and say that, or use the search bubble in the bottom right that’s always there. It’ll find the limiting belief that created that program, so you can remind yourself it’s not true.</p><p>It lives at the top of Breaking Out of Your Box, along with a quick way to add proof. In later weeks, you’ll learn how to rewire this in more depth.</p></div>'
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
from box_art import ART
from box_signs_sf import SF
_LOOK = json.load(open(os.path.join(root, 'tools', 'box_signs.json'), encoding='utf-8'))
# each belief: l = can look like, s = can sound like, f = can feel like
SIGNS = {k: {'l': v, 's': SF[i][0], 'f': SF[i][1]} for i, (k, v) in enumerate(_LOOK.items())}

# little hand-drawn pictures for each section, same style as the proof portfolio steps
_G = '<g filter="url(#pdw)" fill="none" stroke="#4E0C08" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
ICON_LOOK = '<svg class="pdg-si" viewBox="0 0 44 44" aria-hidden="true">' + _G + '<path d="M4 22c5-8 11-12 18-12s13 4 18 12c-5 8-11 12-18 12S9 30 4 22z" fill="#FFFFFF"/><circle cx="22" cy="22" r="7" fill="#F4C2F7"/><circle cx="22" cy="22" r="2.6" fill="#4E0C08"/><path d="M36 6l1 2 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L33 8.3l2-.3z" fill="#F2B705" stroke-width="1"/></g></svg>'
ICON_SOUND = '<svg class="pdg-si" viewBox="0 0 44 44" aria-hidden="true">' + _G + '<path d="M6 10h32c2 0 3 1 3 3v15c0 2-1 3-3 3H18l-8 7v-7H6c-2 0-3-1-3-3V13c0-2 1-3 3-3z" fill="#F1F9A6"/><path d="M13 18v4M17 18v4M27 18v4M31 18v4" stroke-width="2.4"/></g></svg>'
ICON_FEEL = '<svg class="pdg-si" viewBox="0 0 44 44" aria-hidden="true">' + _G + '<path d="M22 38C10 30 4 23 4 15c0-5 4-9 9-9 4 0 7 2 9 6 2-4 5-6 9-6 5 0 9 4 9 9 0 8-6 15-18 23z" fill="#E8338A"/><path d="M11 13c1-2 2-3 4-3" stroke="#FFFFFF" stroke-width="2"/></g></svg>'
SIGNS_HTML = ('<div class="pdg-signs">'
  '<div class="pdg-sg look">' + ICON_LOOK + '<div><span class="pdg-sl">Can look like</span><span class="pdg-sv">{{g.look}}</span></div></div>'
  '<div class="pdg-sg sound">' + ICON_SOUND + '<div><span class="pdg-sl">Can sound like</span><span class="pdg-sv">{{g.sound}}</span></div></div>'
  '<div class="pdg-sg feel">' + ICON_FEEL + '<div><span class="pdg-sl">Can feel like</span><span class="pdg-sv">{{g.feel}}</span></div></div>'
  '</div>')
PD_FILTER = '<svg width="0" height="0" style="position: absolute" aria-hidden="true"><filter id="pdw" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter></svg>'

CONSTS = ('var PD_SIGNS = ' + json.dumps(SIGNS, ensure_ascii=False) + ';\n'
          'var PD_ART = ' + json.dumps(ART, ensure_ascii=False) + ';\n'
          '// draft pages: in the playground and for Sav, never for clients\n'
          'function PD_DRAFTS() { try { return !!(window.BT_DEMO || (window.BT_COURSE && window.BT_COURSE.isCoach && window.BT_COURSE.isCoach())); } catch (e) { return false; } }\n'
          'function pdResults() { setTimeout(function () { try { window.location.hash = "#BoxResults"; } catch (e) {} }, 250); }\n')

NOTICE = '''<div class="card" style="padding: 22px; display: flex; flex-direction: column; gap: 12px; border-color: #F4C2F7">
<div class="hand" style="font-size: 16px; color: #4E0C08">Before you start</div>
<h3 style="margin: 0; font-weight: 700; font-size: 22px; line-height: 1.2">This isn’t every limiting belief ever</h3>
<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #463A38">These are just the main ones. Your brain has plenty more, and once you know how to spot them, you’ll start hearing them everywhere.</p>
<div style="font-weight: 700; font-size: 16px; color: #1F1412; margin-top: 4px">How to spot a limiting belief</div>
<div class="pdg-spot">
<div class="pdg-sp"><b>It sounds like a rule.</b> Always, never, should, have to, can’t.</div>
<div class="pdg-ex"><span class="pdg-exl">Always</span><p class="pdg-exb">“I always mess it up.”</p><p class="pdg-exq">Always? You’ve never once gotten it right? Not ever? Is that really true?</p></div>
<div class="pdg-ex"><span class="pdg-exl">Never</span><p class="pdg-exb">“I never finish anything I start.”</p><p class="pdg-exq">Never? You’ve never finished anything? Did you finish your breakfast? High school? Brushing your teeth?</p></div>
<div class="pdg-ex"><span class="pdg-exl">Should</span><p class="pdg-exb">“I should go to that birthday party.”</p><p class="pdg-exq">Should? Says who? Do you actually want to go, or do you feel like you have to? What would really happen if you didn’t?</p></div>
<div class="pdg-ex"><span class="pdg-exl">Have to</span><p class="pdg-exb">“I have to do everything myself.”</p><p class="pdg-exq">Have to? Who decided that? What would happen if you asked for help, just once?</p></div>
<div class="pdg-ex"><span class="pdg-exl">Can’t</span><p class="pdg-exb">“I can’t do this.”</p><p class="pdg-exq">Can’t, or haven’t yet? What’s one hard thing you’ve already done that you once thought you couldn’t?</p></div>
<div class="pdg-sp"><b>It stops you doing something you want.</b></div>
<div class="pdg-ex"><span class="pdg-exl">Stops you</span><p class="pdg-exb">“I’d apply, but I’m not qualified.”</p><p class="pdg-exq">Says who? Have you ever learned something on the job before? What would you do if you knew you couldn’t fail?</p></div>
<div class="pdg-sp"><b>It keeps coming back,</b> in different places, with different people.</div>
<div class="pdg-ex"><span class="pdg-exl">Comes back</span><p class="pdg-exb">“Nobody ever listens to me.” At work, at home, with friends.</p><p class="pdg-exq">Nobody? Ever? Or does your brain go looking for the times it’s true and skip the times it isn’t?</p></div>
<div class="pdg-sp"><b>You defend it.</b></div>
<div class="pdg-ex"><span class="pdg-exl">Defend it</span><p class="pdg-exb">“But it’s true though!”</p><p class="pdg-exq">Is it true, or does it just feel true because you’ve believed it for so long? What would you lose if it wasn’t?</p></div>
</div>
<div style="padding: 12px 16px; border-radius: 14px; background: #F1F9A6; font-size: 15px; line-height: 1.5">Caught one that isn’t on the list? Write it down. Under each belief below are a few signs, to help you notice which ones are running in the background.</div>
</div>
'''

def patch(f):
    p = os.path.join(root, f); s = open(p, encoding='utf-8').read(); o = s
    if 'var PD_SIGNS = ' in s:
        # refresh the content (signs + pictures) so edits to the json / art flow through
        a = s.index('var PD_SIGNS = '); b = s.index('\nvar PD_ART = ', a); s = s[:a] + 'var PD_SIGNS = ' + json.dumps(SIGNS, ensure_ascii=False) + ';' + s[b:]
        a = s.index('var PD_ART = '); b = s.index('\n', a); s = s[:a] + 'var PD_ART = ' + json.dumps(ART, ensure_ascii=False) + ';' + s[b:]
    else:
        a = "var PD_PRACTICES = "
        assert s.count(a) == 1, f
        s = s.replace(a, CONSTS + a)
        rep = [
            # one page per section
            ("var freq = s.freq || {}, G_PER = 5,", "var freq = s.freq || {}, G_PER = 99,"),
            ("pageLabel: (gpi + 1) + ' / ' + gPages,", "pageLabel: gcat.items.length + ' beliefs', artRef: function (el) { if (el && el.__a !== gcat.id) { el.__a = gcat.id; el.innerHTML = PD_ART[gcat.id] || ''; } }, openResults: pdResults,"),
            ("return { text: pair[0], f5: pdF5Name(pdF5Of(pair[0], pair[1])), cls: 'pdg-row' + (f ? ' ' + f : ''),", "return { text: pair[0], signs: PD_SIGNS[pair[0]] || '', cls: 'pdg-row' + (f ? ' ' + f : ''),"),
            ("else self.setState({ gDone: true }); gTop(); },", "else { self.setState({ gDone: true }); if (PD_IN_APP) { pdResults(); return; } } gTop(); },"),
            ('<div style="display: flex; flex-direction: column; gap: 4px"><span class="pdg-text">{{g.text}}</span><span class="btag">{{g.f5}}</span></div>',
             '<div style="display: flex; flex-direction: column; gap: 4px"><span class="pdg-text">{{g.text}}</span><span class="pdg-sign">{{g.signs}}</span></div>'),
            ('<div class="pdg-head">\n<div style="display: flex; flex-direction: column; gap: 2px">', '<div class="pdg-head">\n<span class="pdg-art" ref="{{game.artRef}}"></span>\n<div style="display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto">'),
            ('Six levels, five beliefs at a time.', 'Six levels, one page each.'),
            ('<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #F6D6CF">The ones you feel all the time are the beliefs running the show. The sometimes ones are parts of you that pop up in certain moments. Both are worth knowing.</p>\n</div>',
             '<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #F6D6CF">The ones you feel all the time are the beliefs running the show. The sometimes ones are parts of you that pop up in certain moments. Both are worth knowing.</p>\n<button class="primary lime" style="align-self: flex-start" onClick="{{game.openResults}}">See my results →</button>\n</div>'),
            ('<div style="font-size: 14px; line-height: 1.6; color: #F6D6CF">Noticing is the work. Next, save your list so you’ve always got it.</div>', '<div style="font-size: 14px; line-height: 1.6; color: #F6D6CF">Noticing is the work. Next, see what you found.</div>'),
            ('<button class="primary lime" onClick="{{goPause}}">Save my limiting beliefs', '<button class="primary lime" onClick="{{goPause}}">See my results'),
            ('<button class="primary lime" onClick="{{goMap}}">See my program map', '<button class="primary lime" onClick="{{goMap}}">Next step'),
            # three steps for clients, the rest are drafts
            ("var tabs = [['audit', '1', 'Beliefs'], ['pause', '', 'Save my beliefs'], ['decoder', '2', 'Programs'], ['map', '', 'My map'], ['now', '3', 'Proof'], ['portfolio', '', 'My proof portfolio']].map(function (t) {",
             "var DRAFT_TABS = ['pause', 'map', 'portfolio'];\n    var tabs = [['audit', '1', 'Beliefs'], ['pause', '', 'Draft · Save my beliefs'], ['decoder', '2', 'Programs'], ['map', '', 'Draft · My map'], ['now', '3', 'Proof'], ['portfolio', '', 'Draft · My proof portfolio']].filter(function (t) { return PD_DRAFTS() || DRAFT_TABS.indexOf(t[0]) < 0; }).map(function (t) {"),
            ("  go(tab) {\n", "  go(tab) {\n    if (!PD_DRAFTS()) { if (tab === 'pause' && PD_IN_APP) { pdResults(); return; } if (tab === 'pause') tab = 'decoder'; if (tab === 'map') tab = 'now'; }\n"),
        ]
        for a, b in rep:
            assert s.count(a) == 1, (f, a[:80], s.count(a))
            s = s.replace(a, b)
        # the "how to spot one" card replaces the Fierce 5 pills (they meet the Fierce 5 in their results)
        i = s.index('<div class="card" style="padding: 22px; display: flex; flex-direction: column; gap: 12px; border-color: #F4C2F7">\n<div class="hand" style="font-size: 16px; color: #4E0C08">Before you start</div>')
        j = s.index('<div id="pd-game" class="pdg">', i)
        s = s[:i] + NOTICE + '\n' + s[j:]
        # no Fierce 5 lead on the done card yet
        a = '<sc-if value="{{hasF5Lead}}" hint-placeholder-val="{{ false }}"><div style="display: inline-flex; align-self: flex-start; padding: 6px 14px; border-radius: 999px; background: #F1F9A6; color: #1F1412; font-size: 14px; font-weight: 600">{{f5Lead}}</div></sc-if>\n'
        if a in s: s = s.replace(a, '', 1)
    # look / sound / feel with little pictures (Nov 2026)
    a = "signs: PD_SIGNS[pair[0]] || '',"
    if a in s:
        s = s.replace(a, "look: (PD_SIGNS[pair[0]] || {}).l || '', sound: ((PD_SIGNS[pair[0]] || {}).s || '').split(' · ').map(function (x) { return '“' + x + '”'; }).join('  '), feel: (PD_SIGNS[pair[0]] || {}).f || '',")
    a = '<span class="pdg-sign">{{g.signs}}</span>'
    if a in s:
        s = s.replace(a, SIGNS_HTML)
        i = s.index('<div class="pdg-spot">'); s = s[:i] + PD_FILTER + '\n' + s[i:]
    # one point per line, in three columns (Nov 2026)
    a = "look: (PD_SIGNS[pair[0]] || {}).l || '', sound: ((PD_SIGNS[pair[0]] || {}).s || '').split(' · ').map(function (x) { return '“' + x + '”'; }).join('  '), feel: (PD_SIGNS[pair[0]] || {}).f || '',"
    if a in s: s = s.replace(a, "look: ((PD_SIGNS[pair[0]] || {}).l || '').split(' · ').join('\\n'), sound: ((PD_SIGNS[pair[0]] || {}).s || '').split(' · ').map(function (x) { return '“' + x + '”'; }).join('\\n'), feel: ((PD_SIGNS[pair[0]] || {}).f || '').split(' · ').join('\\n'),")
    # a little gap between points so they don't run together on a phone
    s = s.replace(".join('\\n'), sound:", ".join('\\n\\n'), sound:").replace("}).join('\\n'), feel:", "}).join('\\n\\n'), feel:").replace(".split(' · ').join('\\n'), cls:", ".split(' · ').join('\\n\\n'), cls:")
    # "See my results" opens a results page inside this resource, in the step sequence (Nov 2026)
    if 'PD_RES_V1' not in s:
        reps = [
            ('function pdResults() { setTimeout(function () { try { window.location.hash = "#BoxResults"; } catch (e) {} }, 250); }',
             '// PD_RES_V1 results live inside the resource\nfunction pdResults() { if (window.__PD_GO && PD_IN_APP && window.BT_NATIVE && window.BT_NATIVE.BoxResults) { window.__PD_GO("results"); return; } setTimeout(function () { try { window.location.hash = "#BoxResults"; } catch (e) {} }, 250); }'),
            ("    this.setState({ tab: tab, justAdded: '' });\n    try {\n      if (this.rootEl && PD_IN_APP)",
             "    if (tab === 'results') window.__PD_RESN = (window.__PD_RESN || 0) + 1;\n    this.setState({ tab: tab, justAdded: '' });\n    try {\n      if (this.rootEl && PD_IN_APP)"),
            ("var tabs = [['audit', '1', 'Beliefs'], ['pause', '',",
             "window.__PD_GO = function (t) { self.go(t); };\n    var PD_HAS_RES = !!(PD_IN_APP && window.BT_NATIVE && window.BT_NATIVE.BoxResults);\n    var tabs = [['audit', '1', 'Beliefs']].concat(PD_HAS_RES ? [['results', '', 'Your results']] : []).concat([['pause', '',"),
            ("['portfolio', '', 'Draft · My proof portfolio']].filter(", "['portfolio', '', 'Draft · My proof portfolio']]).filter("),
            ("      showAudit: s.tab === 'audit',\n",
             "      showAudit: s.tab === 'audit',\n      showResults: s.tab === 'results',\n      resultsRef: function (el) { if (!el || el.__n === (window.__PD_RESN || 0)) return; el.__n = window.__PD_RESN || 0; el.innerHTML = ''; try { window.BT_NATIVE.BoxResults(el, { embed: true, go: function (t) { self.go(t); } }); } catch (e) { el.textContent = 'Your results couldn’t load. Try again.'; } },\n"),
            ('<sc-if value="{{showDecoder}}" hint-placeholder-val="{{ false }}">',
             '<sc-if value="{{showResults}}" hint-placeholder-val="{{ false }}"><div class="pd-results bt-native" ref="{{resultsRef}}"></div></sc-if>\n<sc-if value="{{showDecoder}}" hint-placeholder-val="{{ false }}">'),
        ]
        for a, b in reps:
            assert s.count(a) == 1, (f, a[:70], s.count(a))
            s = s.replace(a, b)
    if 'PD_RES_V2' not in s:
        reps = [
            ('if (window.__PD_GO && PD_IN_APP && window.BT_NATIVE', 'if (window.__PD_GO && window.BT_NATIVE'),
            ('var PD_HAS_RES = !!(PD_IN_APP && window.BT_NATIVE', '// PD_RES_V2 the results page works in the Breakthrough app\n    var PD_HAS_RES = !!(window.BT_NATIVE'),
            ("goPause: function () { self.go('pause'); },", "goPause: function () { if (PD_HAS_RES) pdResults(); else self.go('pause'); },"),
        ]
        for a, b in reps:
            assert s.count(a) == 1, (f, a[:70], s.count(a))
            s = s.replace(a, b)
    if 'PD_RES_V3' not in s:
        reps = [
            ("      if (openTab === 'now') { this.setState({ tab: 'now' });",
             "      // PD_RES_V3 open straight to a page from elsewhere in the app\n      if (openTab === 'audit' || openTab === 'decoder' || openTab === 'results') { var me = this; setTimeout(function () { me.go(openTab); }, 0); }\n      if (openTab === 'now') { this.setState({ tab: 'now' });"),
            # the results page replaces the draft "Save my beliefs" page
            (".concat([['pause', '', 'Draft · Save my beliefs'], ['decoder', '2', 'Programs']", ".concat(/* PD_RES_V3 */ (PD_HAS_RES ? [] : [['pause', '', 'Draft · Save my beliefs']]).concat([['decoder', '2', 'Programs']"),
            ("['portfolio', '', 'Draft · My proof portfolio']]).filter(", "['portfolio', '', 'Draft · My proof portfolio']])).filter("),
        ]
        for a, b in reps:
            if 'openTab' in a and a not in s: continue
            assert s.count(a) == 1, (f, a[:70], s.count(a))
            s = s.replace(a, b)
    if 'PD_RES_V4' not in s:
        # finishing the last level (Safety & control) opens Your results
        a = "else { self.setState({ gDone: true }); if (PD_IN_APP) { pdResults(); return; } }"
        assert s.count(a) == 1, (f, 'v4')
        s = s.replace(a, "else { self.setState({ gDone: true }); /* PD_RES_V4 */ if (PD_IN_APP || (window.__PD_GO && window.BT_NATIVE)) { pdResults(); return; } }")
    if 'PD_FLOW_V5' not in s:
        # Step 2: programs grouped by the same areas of life as Step 1, in the same order
        a = '<sc-for list="{{progs}}" as="p" hint-placeholder-count="6">'
        assert s.count(a) == 1, (f, 'v5 progs')
        i = s.index(a); j = s.index('</article>\n</sc-for>', i)
        s = s[:j] + '</article>\n</sc-for></div></sc-for>' + s[j + len('</article>\n</sc-for>'):]
        s = s.replace(a, '<!-- PD_FLOW_V5 --><sc-for list="{{progGroups}}" as="g" hint-placeholder-count="2"><div class="prog-grp"><h3 class="prog-grph">{{g.name}}</h3><sc-for list="{{g.progs}}" as="p" hint-placeholder-count="4">', 1)
        a = "      progs: progs,\n"
        assert s.count(a) == 1, (f, 'v5 ret')
        s = s.replace(a, a + "      progGroups: (function () { var by = {}; progs.forEach(function (x, k) { by[list[k].id] = x; }); var seen = {}, out = []; PD_CATS.forEach(function (cat) { var g = []; cat.items.forEach(function (it) { var id = it[1]; if (by[id] && !seen[id]) { seen[id] = 1; g.push(by[id]); } }); if (g.length) out.push({ name: cat.name, progs: g }); }); var rest = list.filter(function (x) { return !seen[x.id]; }).map(function (x) { return by[x.id]; }); if (rest.length) out.push({ name: 'More programs', progs: rest }); return out; })(),\n", 1)
        # the mind map becomes a flow chart: Fierce 5 at the top, beliefs under them, programs under each belief. No proof filling.
        i = s.index('<div class="mm-note">'); j = s.index('</div>', s.index('</span>', i)) + len('</div>')
        s = s[:i] + s[j:]
        i = s.index('<div class="mm-vp" ref="{{vpRef}}">'); j = s.index('<div class="mm-ctrl">', i); j = s.index('</div>\n</div>', j) + len('</div>\n</div>')
        s = s[:i] + '<div class="pd-flow bt-native" ref="{{flowRef}}"></div>' + s[j:]
        a = "      vpRef: this.vpRef, panRef: this.panRef,"
        assert s.count(a) == 1, (f, 'v5 vp')
        s = s.replace(a, a + "\n      flowRef: function (el) { if (!el || !window.BT_NATIVE || !window.BT_NATIVE.ProgFlow) return; var sig = JSON.stringify([s.freq || {}, s.noted || {}, s.ticked || {}]); if (el.__sig === sig) return; el.__sig = sig; el.innerHTML = ''; window.BT_NATIVE.ProgFlow(el, { progs: PD_PROGS, cats: PD_CATS, noted: s.noted || {}, flip: function (k) { self.flip('noted', k); } }); },")
        # legend: just the three things on the chart
        k = s.index('<div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #463A38">', s.index('How it all links'))
        e = s.index('</div>', k) + len('</div>')
        s = s[:k] + '<div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #463A38"><span style="display: inline-flex; align-items: center; gap: 6px"><span class="lgdot" style="background: #4E0C08"></span>Fierce 5 root</span><span style="display: inline-flex; align-items: center; gap: 6px"><span class="lgdot st0"></span>Your limiting belief</span><span style="display: inline-flex; align-items: center; gap: 6px"><span class="mm-key-prog">program</span>A program that grew from it</span></div>' + s[e:]
        k = s.index('Pinch or scroll to zoom, drag to move around. Tap a belief or program to open it.')
        s = s[:k] + 'Scroll sideways to see all of your roots. Tap a program to mark it as yours.' + s[k + len('Pinch or scroll to zoom, drag to move around. Tap a belief or program to open it.'):]
    if 'PD_MAPN_V6' not in s:
        # the map only counts what they picked: beliefs, and the programs they marked as theirs
        reps = [
            ("countLine: bel.length + (bel.length === 1 ? ' belief' : ' beliefs') + ' · ' + behaviours.length + ' programs' + (mineB.length ? ' · ' + mineB.length + ' you recognised' : ''),",
             "/* PD_MAPN_V6 */ mineN: mineB.length, countLine: bel.length + (bel.length === 1 ? ' belief' : ' beliefs') + ' · ' + mineB.length + (mineB.length === 1 ? ' program you picked' : ' programs you picked'),"),
            ("mapCountLine: mapFams.length ? total + (total === 1 ? ' belief, ' : ' beliefs, ') + 'all from ' + mapFams.length + (mapFams.length === 1 ? ' root' : ' roots') : 'Nothing mapped yet',",
             "mapCountLine: mapFams.length ? (function () { var pn = mapFams.reduce(function (a, m) { return a + (m.mineN || 0); }, 0); return total + (total === 1 ? ' limiting belief · ' : ' limiting beliefs · ') + pn + (pn === 1 ? ' program you picked' : ' programs you picked'); })() : 'Nothing mapped yet',"),
            ("Every piece of new proof you add fills its belief bubble with lime, like a loading bar. When the new proof outweighs the old, the bubble is full.", "Start at the top with your Fierce 5, follow the lines down to the beliefs that grew from each one, then the programs that grew from those."),
        ]
        for a, b in reps:
            assert s.count(a) == 1, (f, a[:60], s.count(a))
            s = s.replace(a, b)
    if 'PD_PICK_V7' not in s:
        # see it in a list or a map, with a little example of each
        a = s[s.index('<div role="group" aria-label="Map view"'):]
        a = a[:a.index('</div>') + len('</div>')]
        s = s.replace(a, '<!-- PD_PICK_V7 --><div class="pd-pick"><span class="pd-pickq">How do you want to see it?</span><div class="pd-pickrow"><button class="{{pickListCls}}" aria-pressed="{{viewListPressed}}" onClick="{{viewList}}"><span class="pd-pickart"><svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><rect x=\"10\" y=\"6\" width=\"100\" height=\"16\" rx=\"5\" fill=\"#4E0C08\"/><rect x=\"16\" y=\"11\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#F1F9A6\"/><rect x=\"10\" y=\"28\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#fff\" stroke=\"#EDE3DF\" stroke-width=\"1.5\"/><rect x=\"16\" y=\"33\" width=\"88\" height=\"10\" rx=\"4\" fill=\"#FBE6FC\"/><rect x=\"18\" y=\"49\" width=\"50\" height=\"4\" rx=\"2\" fill=\"#C9A39B\"/><rect x=\"18\" y=\"57\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#C9A39B\"/><rect x=\"18\" y=\"65\" width=\"16\" height=\"5\" rx=\"2.5\" fill=\"#F1F9A6\" stroke=\"#4E0C08\" stroke-width=\".8\"/><rect x=\"37\" y=\"65\" width=\"20\" height=\"5\" rx=\"2.5\" fill=\"#F1F9A6\" stroke=\"#4E0C08\" stroke-width=\".8\"/><rect x=\"60\" y=\"65\" width=\"14\" height=\"5\" rx=\"2.5\" fill=\"#fff\" stroke=\"#C9A39B\" stroke-width=\".8\"/></svg></span><b>See it in a list</b><span>Each root with its beliefs and programs underneath. Easy to read and save.</span></button><button class="{{pickMapCls}}" aria-pressed="{{viewMindPressed}}" onClick="{{viewMind}}"><span class="pd-pickart"><svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><g stroke-width=\"1.5\"><rect x=\"4\" y=\"6\" width=\"34\" height=\"13\" rx=\"5\" fill=\"#5B8DD9\" stroke=\"#4E0C08\"/><rect x=\"43\" y=\"6\" width=\"34\" height=\"13\" rx=\"5\" fill=\"#F2B705\" stroke=\"#4E0C08\"/><rect x=\"82\" y=\"6\" width=\"34\" height=\"13\" rx=\"5\" fill=\"#F2675A\" stroke=\"#4E0C08\"/><path d=\"M10 19v50M49 19v40M88 19v46\" fill=\"none\" stroke=\"#C9A39B\"/><path d=\"M10 30h6M10 46h6M10 62h6M49 30h6M49 48h6M88 30h6M88 52h6\" fill=\"none\" stroke=\"#C9A39B\"/></g><g fill=\"#fff\" stroke-width=\"1.2\"><rect x=\"16\" y=\"26\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#5B8DD9\"/><rect x=\"16\" y=\"42\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#5B8DD9\"/><rect x=\"16\" y=\"58\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#5B8DD9\"/><rect x=\"55\" y=\"26\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#F2B705\"/><rect x=\"55\" y=\"44\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#F2B705\"/><rect x=\"94\" y=\"26\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#F2675A\"/><rect x=\"94\" y=\"48\" width=\"20\" height=\"8\" rx=\"3\" stroke=\"#F2675A\"/></g><g fill=\"#F1F9A6\" stroke=\"#4E0C08\" stroke-width=\".7\"><rect x=\"18\" y=\"36\" width=\"9\" height=\"4\" rx=\"2\"/><rect x=\"29\" y=\"36\" width=\"7\" height=\"4\" rx=\"2\"/><rect x=\"57\" y=\"36\" width=\"10\" height=\"4\" rx=\"2\"/><rect x=\"96\" y=\"38\" width=\"9\" height=\"4\" rx=\"2\"/></g></svg></span><b>See it in a map</b><span>A flow chart from your Fierce 5, down to your beliefs, down to your programs.</span></button></div></div>', 1)
        a = "mapList: mapView === 'list', mapMind: mapView === 'mind',"
        assert s.count(a) == 1, (f, 'v7')
        s = s.replace(a, a + " pickListCls: 'pd-pickc' + (mapView === 'list' ? ' on' : ''), pickMapCls: 'pd-pickc' + (mapView === 'mind' ? ' on' : ''),")
    if 'PD_NOW_V8' not in s and 'PD_HOME_V9' not in s:
        # the "right now" helper on the front of the resource
        a = '<nav aria-label="Sections" class="tabs">'
        assert s.count(a) == 1, (f, 'v8 nav')
        s = s.replace(a, '<!-- PD_NOW_V8 --><div class="pd-now bt-native" ref="{{nowRef}}"></div>\n' + a, 1)
        a = "      flowRef: function (el) {"
        assert s.count(a) == 1, (f, 'v8 ref')
        s = s.replace(a, "      nowRef: function (el) { if (!el || !window.BT_NATIVE || !window.BT_NATIVE.BoxNow) return; var sig = JSON.stringify([s.freq || {}, s.noted || {}, (s.evidence || []).length]); if (el.__sig === sig) return; el.__sig = sig; window.BT_NATIVE.BoxNow(el); },\n" + a, 1)
        # map page: what this is for, then what's next
        a = '<div style="display: flex; flex-wrap: wrap; gap: 10px">\n<button class="ghost" onClick="{{copyMap}}">'
        assert s.count(a) == 1, (f, 'v8 map')
        s = s.replace(a, MAPTXT + '\n' + a, 1)
        a = '<div style="font-family: \'Playfair Display\', Georgia, serif; font-weight: 700; font-size: 26px">Got your map saved?</div>\n<div style="font-size: 14px; line-height: 1.6; color: #F6D6CF">Then let’s talk about what to do with it.</div>'
        assert s.count(a) == 1, (f, 'v8 next')
        s = s.replace(a, '<div class="hand" style="font-size: 15px; color: #F1F9A6">What’s next</div><div style="font-family: \'Playfair Display\', Georgia, serif; font-weight: 700; font-size: 26px">Step 3: Proof</div>\n<div style="font-size: 14px; line-height: 1.6; color: #F6D6CF">Now you know what’s holding the box together, let’s start proving it wrong.</div>', 1)
        s = s.replace('onClick="{{goNow}}">So… what now? <svg', 'onClick="{{goNow}}">Go to Step 3: Proof <svg', 1)
        # Step 3: a scale above the example, no "choose one belief" step, turns renumbered
        a = '<span class="hand" style="font-size: 15px; color: #A8231F">Example</span>'
        assert s.count(a) == 1, (f, 'v8 ex')
        i = s.index(a); i = s.rfind('<div style="border: 1.5px dashed #A8352B', 0, i)
        s = s[:i] + SCALE + '\n' + s[i:]
        if 'data-slot="disprove"' in s:
            i = s.index('<div class="hand" style="font-size: 15px; color: #A8231F">Your turn · 1</div>'); i = s.rfind('<div class="card"', 0, i); j = s.index('<div class="bt-slot bt-dis-slot" data-slot="disprove"></div>', i)
            s = s[:i] + s[j:]
            s = s.replace('Your turn · 3 · from now on', 'Your turn · 2 · from now on', 1)
    if 'PD_HOME_V9' not in s:
        # a Home tab before Beliefs: the right-now helper + quick proof live there.
        # Until they reach Step 3 they land where they left off (Beliefs the first time); after that, Home.
        a = '<!-- PD_NOW_V8 --><div class="pd-now bt-native" ref="{{nowRef}}"></div>\n'
        assert s.count(a) == 1, (f, 'v9 now')
        s = s.replace(a, '', 1)
        a = '<sc-if value="{{showResults}}" hint-placeholder-val="{{ false }}">'
        assert s.count(a) == 1, (f, 'v9 res')
        s = s.replace(a, '<!-- PD_HOME_V9 --><sc-if value="{{showHome}}" hint-placeholder-val="{{ false }}"><div class="pd-now bt-native" ref="{{nowRef}}"></div></sc-if>\n' + a, 1)
        a = "var tabs = [['audit', '1', 'Beliefs']]"
        assert s.count(a) == 1, (f, 'v9 tabs')
        s = s.replace(a, "var tabs = [['home', '', 'Home'], ['audit', '1', 'Beliefs']]", 1)
        s = s.replace("if (openTab === 'audit' || openTab === 'decoder' || openTab === 'results')", "if (openTab === 'home' || openTab === 'audit' || openTab === 'decoder' || openTab === 'results')", 1)
        a = "      showResults: s.tab === 'results',"
        assert s.count(a) == 1, (f, 'v9 show')
        s = s.replace(a, "      showHome: s.tab === 'home',\n" + a, 1)
        a = "          delete s.collected; delete s.ignored;\n          this.setState(s);"
        assert s.count(a) == 1, (f, 'v9 mount')
        s = s.replace(a, "          delete s.collected; delete s.ignored;\n          if (s.stepsDone && !openTab) s.tab = 'home';\n          this.setState(s);", 1)
        a = "    if (tab === 'results') window.__PD_RESN = (window.__PD_RESN || 0) + 1;"
        assert s.count(a) == 1, (f, 'v9 go')
        s = s.replace(a, a + "\n    if (tab === 'now') { try { var xx = JSON.parse(window.localStorage.getItem(PD_KEY) || '{}'); if (!xx.stepsDone) { xx.stepsDone = Date.now(); window.localStorage.setItem(PD_KEY, JSON.stringify(xx)); } } catch (e) {} }", 1)
    if 'PD_PGP_V10' not in s:
        # Step 2 paged like Step 1: one area of life per page, a progress bar, back / next
        a = '<!-- PD_FLOW_V5 --><sc-for list="{{progGroups}}" as="g" hint-placeholder-count="2"><div class="prog-grp"><h3 class="prog-grph">{{g.name}}</h3><sc-for list="{{g.progs}}" as="p" hint-placeholder-count="4">'
        assert s.count(a) == 1, (f, 'v10 a')
        s = s.replace(a, '<!-- PD_FLOW_V5 --><!-- PD_PGP_V10 --><div id="pd-pgp" class="pdg pgp"><div class="pdg-cats" role="list"><sc-for list="{{pg.cats}}" as="gc" hint-placeholder-count="6"><button class="{{gc.cls}}" role="listitem" aria-current="{{gc.cur}}" onClick="{{gc.go}}"><span class="pdg-cn">{{gc.n}}</span><span>{{gc.name}}</span></button></sc-for></div><div class="pdg-card"><div class="pdg-head"><span class="pdg-art" ref="{{pg.artRef}}"></span><div style="display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto"><span class="hand" style="font-size: 16px; color: #A8231F">{{pg.kicker}}</span><h3 style="margin: 0; font-weight: 700; font-size: 26px; line-height: 1.1">{{pg.name}}</h3></div><span class="pdg-page">{{pg.pageLabel}}</span></div><div class="pdg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{pg.pct}}" aria-label="How far through you are"><span style="width: {{pg.pct}}%"></span></div><p style="margin: 0; font-size: 15px; line-height: 1.5; color: #463A38">Open each belief and tick any programs you recognise in yourself.</p><div style="display: flex; flex-direction: column; gap: 10px"><sc-for list="{{pg.progs}}" as="p" hint-placeholder-count="4">', 1)
        a = '</article>\n</sc-for></div></sc-for>'
        assert s.count(a) == 1, (f, 'v10 b')
        s = s.replace(a, '</article>\n</sc-for></div><div class="pdg-nav"><sc-if value="{{pg.canBack}}" hint-placeholder-val="{{ false }}"><button class="ghost" onClick="{{pg.back}}">← Back</button></sc-if><span style="flex: 1 1 auto"></span><button class="primary lime" onClick="{{pg.next}}">{{pg.nextLabel}}</button></div></div></div>', 1)
        a = "      progGroups: (function () {"
        assert s.count(a) == 1, (f, 'v10 c')
        s = s.replace(a, "      pg: (function () { var by = {}; progs.forEach(function (x, k) { by[list[k].id] = x; }); var seen = {}, gs = []; PD_CATS.forEach(function (cat) { var g = []; cat.items.forEach(function (it) { var id = it[1]; if (by[id] && !seen[id]) { seen[id] = 1; g.push(by[id]); } }); if (g.length) gs.push({ id: cat.id, name: cat.name, progs: g }); }); var rest = list.filter(function (x) { return !seen[x.id]; }).map(function (x) { return by[x.id]; }); if (rest.length) gs.push({ id: 'more', name: 'More programs', progs: rest }); if (!gs.length) return { cats: [], progs: [], name: '', kicker: '', pageLabel: '', pct: 0, canBack: false, back: function () {}, next: function () { self.go('map'); }, nextLabel: 'See my map →', artRef: function () {} }; var i = Math.max(0, Math.min(s.progPage || 0, gs.length - 1)), g = gs[i], top = function () { setTimeout(function () { var el = document.getElementById('pd-pgp'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }; return { cats: gs.map(function (x, k) { return { n: String(k + 1), name: x.name, cur: k === i ? 'step' : 'false', cls: 'pdg-c' + (k === i ? ' on' : '') + (k < i ? ' full' : ''), go: function () { self.setState({ progPage: k }); top(); } }; }), progs: g.progs, name: g.name, kicker: 'Area ' + (i + 1) + ' of ' + gs.length, pageLabel: g.progs.length + (g.progs.length === 1 ? ' belief' : ' beliefs'), pct: Math.round((i + 1) / gs.length * 100), canBack: i > 0, back: function () { self.setState({ progPage: i - 1 }); top(); }, next: function () { if (i < gs.length - 1) { self.setState({ progPage: i + 1 }); top(); } else self.go('map'); }, nextLabel: i < gs.length - 1 ? 'Next: ' + gs[i + 1].name + ' →' : 'See my map →', artRef: function (el) { if (el && el.__a !== g.id) { el.__a = g.id; el.innerHTML = PD_ART[g.id] || ''; } } }; })(),\n" + a, 1)
    if 'PD_MAPHOW_V11' not in s:
        # the map is no longer a draft; the proof portfolio draft goes (it's its own resource)
        reps = [
            ("    var DRAFT_TABS = ['pause', 'map', 'portfolio'];", "    var DRAFT_TABS = ['pause']; /* PD_MAPHOW_V11 */"),
            ("['map', '', 'Draft · My map'], ['now', '3', 'Proof'], ['portfolio', '', 'Draft · My proof portfolio']]", "['map', '', 'My map'], ['now', '3', 'Proof']]"),
            ("if (tab === 'pause') tab = 'decoder'; if (tab === 'map') tab = 'now'; }", "if (tab === 'pause') tab = 'decoder'; }"),
        ]
        for a, b in reps:
            assert s.count(a) == 1, (f, a[:50], s.count(a))
            s = s.replace(a, b)
        # "feeling a bit much?" shows the search in action, in three steps
        assert s.count(MAPTXT) == 1, (f, 'v11 maptxt')
        s = s.replace(MAPTXT, '<div class="pd-mapwhy bt-native" ref="{{mapHowRef}}"></div>', 1)
        a = "      nowRef: function (el) {"
        assert s.count(a) == 1, (f, 'v11 ref')
        s = s.replace(a, "      mapHowRef: function (el) { if (!el || el.__done || !window.BT_NATIVE || !window.BT_NATIVE.MapHow) return; el.__done = 1; window.BT_NATIVE.MapHow(el); },\n" + a, 1)
    if 'PD_DL_V12' not in s:
        # download the new flow chart (not the old circles), plus a list option; next steps start at the top of the page
        a = "      downloadMap: function () { self.exportMap(); },"
        assert s.count(a) == 1, (f, 'v12 dl')
        s = s.replace(a, "      downloadMap: function () { /* PD_DL_V12 */ if (window.BT_NATIVE && window.BT_NATIVE.FlowPic) { window.BT_NATIVE.FlowPic({ progs: PD_PROGS, cats: PD_CATS, noted: s.noted || {} }); return; } self.exportMap(); },", 1)
        a = 'Download as JPEG</button>\n</div>\n</div>\n</sc-if>'
        if a in s:
            s = s.replace(a, 'Download my map</button>\n<button class="ghost" onClick="{{downloadMapList}}">Download as a list</button>\n</div>\n</div>\n</sc-if>', 1)
        a = "    this.setState({ tab: tab, justAdded: '' });"
        assert s.count(a) == 1, (f, 'v12 go')
        s = s.replace(a, a + "\n    setTimeout(function () { try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e) {} }, 60);", 1)
    a = '<span class="mm-key-prog">program</span>A program that grew from it</span>'
    if a in s: s = s.replace(a, '<span style="color: #A8231F; font-weight: 700">–</span>A program you picked</span>')
    if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched box steps', f)

for f in ['src/companion.html', 'src/one-on-one.html']:
    patch(f)
