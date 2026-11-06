# Run by build.py before merging. Idempotent edits to the two source artifacts (Nov 2026):
# - Breaking Out Step 3: the "Weigh up the proof" lesson + example becomes "Why we do this" (no inputs),
#   the Disprove it activity lives in a slot (course.js fills it), and the old link box to the portfolio goes
# - Breaking Out keeps keys other pages write to its storage, and re-reads proof when it changes elsewhere
# - Week numbers: Week 1 is the Set yourself up for success mini course, so course weeks show one higher (WKD)
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in ['src/companion.html', 'src/one-on-one.html']:
    p = os.path.join(root, f); s = open(p, encoding='utf-8').read(); o = s
    def rep(a, b, n=1):
        global s
        assert s.count(a) == n, (f, a[:80], s.count(a)); s = s.replace(a, b)
    if f.endswith('companion.html') and 'data-slot="disprove"' not in s:
        a = s.index('<div style="background: #F1F9A6; border: 2px solid #1F1412; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; gap: 10px; max-width: 680px">\n<div class="hand" style="font-size: 17px; color: #A8231F">Activity · Disprove it</div>')
        b = s.index('</div>\n', s.index('Start my Disprove It list', a)) + 7
        s = s[:a] + s[b:]
        st = s.index('<div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 18px">\n<div style="display: flex; flex-direction: column; gap: 6px">\n<div class="hand" style="font-size: 15px; color: #A8231F">Your turn · 2</div>\n<h3 style="margin: 0; font-weight: 700; font-size: 26px">Weigh up the proof</h3>')
        en = s.index('<div class="dark" style="padding: 26px; display: flex; flex-direction: column; gap: 14px">', st)
        card = s[st:en]; s = s[:st] + s[en:]
        a = card.index('<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px">\n<span style="padding: 8px 14px; border-radius: 999px; background: #F6EFEC; font-size: 14px">Weighing up:')
        b = card.index('<sc-if value="{{showExample}}"')
        card = card[:a] + card[b:]
        a = card.index('<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px">\n<label')
        card = card[:a] + '</div>\n\n'
        card = card.replace('<sc-if value="{{showExample}}" hint-placeholder-val="{{ true }}">\n', '', 1)
        i = card.rindex('</sc-if>'); card = card[:i] + card[i + len('</sc-if>'):]
        card = card.replace('<div class="hand" style="font-size: 15px; color: #A8231F">Your turn · 2</div>', '<div class="hand" style="font-size: 15px; color: #A8231F">Why we do this</div>')
        card = card.replace('<li>A client said I changed how she sees herself</li>', '<li>A client said I changed how they see themselves</li>')
        assert card.count('<div') == card.count('</div>'), f
        anchor = '<div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">\n<div style="display: flex; flex-direction: column; gap: 4px">\n<div class="hand" style="font-size: 15px; color: #A8231F">Your turn · 1</div>'
        rep(anchor, card + anchor)
        a = '<div style="font-size: 13px; color: #6A5A57">{{focusHint}}</div>\n</div>\n'
        rep(a, a + '\n<div class="bt-slot bt-dis-slot" data-slot="disprove"></div>\n')
        rep("      window.localStorage.setItem(PD_KEY, JSON.stringify({ tab: s.tab,", "      var prevPD = {}; try { prevPD = JSON.parse(window.localStorage.getItem(PD_KEY) || '{}') || {}; } catch (e0) {}\n      window.localStorage.setItem(PD_KEY, JSON.stringify(Object.assign(prevPD, { tab: s.tab,")
        rep("gDone: s.gDone, customProves: s.customProves }));", "gDone: s.gDone, customProves: s.customProves })));")
        rep("      if (openTab === 'portfolio') {", "      var selfPD = this; this._pdSync = function () { try { var x = JSON.parse(window.localStorage.getItem(PD_KEY) || 'null'); if (x) selfPD.setState({ evidence: x.evidence || [], customProves: x.customProves || selfPD.state.customProves }); } catch (e) {} };\n      window.addEventListener('bt-pd-changed', this._pdSync);\n      if (openTab === 'now') { this.setState({ tab: 'now' }); try { window.scrollTo(0, 0); } catch (e) {} }\n      if (openTab === 'portfolio') {")
        rep("  componentWillUnmount() { if (this.vpCleanup) this.vpCleanup(); }", "  componentWillUnmount() { if (this.vpCleanup) this.vpCleanup(); if (this._pdSync) window.removeEventListener('bt-pd-changed', this._pdSync); }")
    if 'function WKD(' not in s:
        rep("function lookup(path, scopes) {", "function WKD(n) { n = Number(n); return window.BT_WK ? window.BT_WK(n) : (n >= 1 ? n + 1 : n); }\nfunction lookup(path, scopes) {")
    pairs = [
        ("Your Week {{w.week}} reflective", "Your Week {{w.wkLabel}} reflective"),
        ("week: w.week, label: w.week === 0 ? 'Start here' : 'Week ' + w.week, title: w.title,", "week: w.week, wkLabel: WKD(w.week), label: w.week === 0 ? 'Week 1' : 'Week ' + WKD(w.week), title: w.title,"),
        ("'Unlocks when you finish Week ' + (w.week - 1)),", "'Unlocks when you finish Week ' + WKD(w.week - 1)),"),
        ("weekLabel: r.week ? 'Week ' + r.week + ' resource' : 'Start here',", "weekLabel: 'Week ' + (r.week ? WKD(r.week) : 1) + ' resource', wkLabel: r.week ? WKD(r.week) : 1,"),
        ("unlockLabel: 'I’ve finished Week ' + unlocked + ' · unlock Week ' + (unlocked + 1),", "unlockLabel: 'I’ve finished Week ' + WKD(unlocked) + ' · unlock Week ' + WKD(unlocked + 1),"),
        ("'Available once you finish Week ' + (n - 1))", "'Available once you finish Week ' + WKD(n - 1))"),
        ("Week {{w.n}}</span>", "Week {{w.nLabel}}</span>"),
        ("return { minis: minis, n: n, done: done,", "return { minis: minis, n: n, nLabel: WKD(n), done: done,"),
        ("Week {{r.week}} resource</span>", "Week {{r.wkLabel}} resource</span>"),
        ("You’ll learn all about it in the Week 1 modules.", "You’ll learn all about it in the Week 2 modules."),
        ("resources open up in your <strong>Resources</strong> tab. Week 1 is ready for you now.", "resources open up in your <strong>Resources</strong> tab. Week 2 is ready for you now."),
        ("sub: op ? (r.week ? 'Week ' + r.week + ' resource' : 'Start here') : ((window.BT_COURSE ? window.BT_COURSE.unlockText(r.week) : 'Unlocks after Week ' + (r.week - 1)", "sub: op ? ('Week ' + (r.week ? WKD(r.week) : 1) + ' resource') : ((window.BT_COURSE ? window.BT_COURSE.unlockText(r.week) : 'Unlocks after Week ' + WKD(r.week - 1)"),
    ]
    for a, b in pairs:
        if a in s: s = s.replace(a, b)
    if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched', f)
