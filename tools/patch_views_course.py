#!/usr/bin/env python3
"""One-off edits to the imported artifact views for the in-app course (Oct 2026).

  python3 tools/patch_views_course.py     (safe to re-run: skips edits already made)

- Self-paced home (src/companion.html): course card slot instead of the Stan button,
  Course + 1:1 tabs, header badge shows the access type, drip-fed weeks, journal +
  search read the course from window.BT_COURSE (set up by public/js/course.js).
- 1:1 home (src/one-on-one.html): no Stan button or "unlock your course" step,
  tests save to the profile instead of being sent on WhatsApp, weeks follow the drip.
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
changed = []

def edit(text, old, new, label, count=1, regex=False):
    if regex:
        n = len(re.findall(old, text))
        if n == 0:
            return text
        changed.append(label); return re.sub(old, new, text, flags=re.S)
    if new and new in text and (old not in text or text.count(new) >= text.count(old)):
        return text
    n = text.count(old)
    if n == 0:
        if new and new in text: return text
        sys.exit(f'patch failed, not found: {label}')
    if count and n != count:
        sys.exit(f'patch failed, {label}: expected {count}, found {n}')
    changed.append(label)
    return text.replace(old, new)

STAR = '<path d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z"></path></svg>'
BTN = '<a class="bl" href="{{courseLink}}" target="_blank" rel="noopener"><svg width="20" height="20" viewBox="0 0 24 24" fill="#D3302B" aria-hidden="true">' + STAR + 'Access Breakthrough Course</a>'
SLOT = '<div class="bt-slot" data-slot="home-top"></div>'
SLOT_IF = '<sc-if value="{{showTabs}}" hint-placeholder-val="{{ true }}">' + SLOT + '</sc-if>'

# ---------------- view engine: let the app fill "slots" without the view wiping them ----------------
for p in ('src/companion.html', 'src/one-on-one.html'):
    s = open(p, encoding='utf-8').read()
    s = edit(s, "setProps(el, v.p); patchChildren(el, v.c, isSvg && v.t !== 'foreignObject'); return el; }",
             "setProps(el, v.p); if (!('data-slot' in v.p)) patchChildren(el, v.c, isSvg && v.t !== 'foreignObject'); return el; }", p + ': slot create', count=0)
    s = edit(s, "if (dom && dom.nodeType === 1 && dom.__t === v.t) { setProps(dom, v.p); patchChildren(dom,",
             "if (dom && dom.nodeType === 1 && dom.__t === v.t) { setProps(dom, v.p); if (!('data-slot' in v.p)) patchChildren(dom,", p + ': slot patch', count=0)
    open(p, 'w', encoding='utf-8').write(s)

# ---------------- self-paced home ----------------
p = 'src/companion.html'
s = open(p, encoding='utf-8').read()
s = edit(s, BTN, SLOT, 'companion: course slot')
if SLOT_IF not in s: s = edit(s, SLOT, SLOT_IF, 'companion: slot hidden on activity pages')
s = edit(s, '>Self-paced</span>', '>{{tierLabel}}</span>', 'companion: badge')
s = edit(s, '<button class="{{tabHomeCls}}" role="tab" aria-selected="{{tabHomeSel}}" onClick="{{goHome}}">Home</button>\n',
         '<button class="{{tabHomeCls}}" role="tab" aria-selected="{{tabHomeSel}}" onClick="{{goHome}}">Home</button>\n<a class="tab" href="#Course">Course</a>\n', 'companion: course tab')
ONE_TAB = '<sc-if value="{{isPrivate}}" hint-placeholder-val="{{ false }}"><a class="tab" href="#OneOnOne">1:1</a></sc-if>\n'
if ONE_TAB in s: s = s.replace(ONE_TAB, ''); changed.append('companion: no 1:1 tab')
if 'isPrivate: this.props.tierLabel' not in s:
    s = edit(s, 'showTabs: !inI, inIntent: inI,',
             "showTabs: !inI, inIntent: inI, isPrivate: this.props.tierLabel === '1:1 client', tierLabel: this.props.tierLabel || 'Self-paced',", 'companion: tier vals')
s = edit(s, 'var unlocked = d.unlocked || 1,', 'var unlocked = window.BT_COURSE ? window.BT_COURSE.unlockedWeek() : (d.unlocked || 1),', 'companion: drip')
s = edit(s, 'unlockAfter: w.week >= 1', 'unlockAfter: !window.BT_COURSE && w.week >= 1', 'companion: no manual unlock (journal)')
s = edit(s, 'unlockAfter: r.week === unlocked', 'unlockAfter: !window.BT_COURSE && r.week === unlocked', 'companion: no manual unlock (resources)')
s = edit(s, "'Unlocks when you finish Week ' + (w.week - 1)", "(window.BT_COURSE ? window.BT_COURSE.unlockText(w.week) : 'Unlocks when you finish Week ' + (w.week - 1))", 'companion: week label')
s = edit(s, "'Unlocks when you finish Week ' + (r.week - 1)", "(window.BT_COURSE ? window.BT_COURSE.unlockText(r.week) : 'Unlocks when you finish Week ' + (r.week - 1))", 'companion: res label')
s = edit(s, "'Unlocks after Week ' + (r.week - 1)", "(window.BT_COURSE ? window.BT_COURSE.unlockText(r.week) : 'Unlocks after Week ' + (r.week - 1))", 'companion: res label 2')
s = edit(s, 'When you finish a week, tap the unlock button under it to open the next week.', 'A new week opens every 7 days, and its resources open with it.', 'companion: res copy')
# journal + lesson lookups come from the course Sav edits in the coach dashboard
seg_start = s.find("var KEY = 'cmn-companion'")
if seg_start < 0: sys.exit('companion code not found')
seg_end = s.find('return Component;', seg_start)
seg = s[seg_start:seg_end]
if 'function JL()' not in seg:
    seg = seg.replace('var JOURNAL = ', 'function JL() { return window.BT_COURSE ? window.BT_COURSE.journal(JOURNAL) : JOURNAL; }\nvar JOURNAL = ', 1)
    head, rest = seg.split('var JOURNAL = ', 1)
    line_end = rest.find('\n')
    rest = rest[:line_end] + re.sub(r'\bJOURNAL\.', 'JL().', rest[line_end:])
    seg = head + 'var JOURNAL = ' + rest
    changed.append('companion: journal from course')
s = s[:seg_start] + seg + s[seg_end:]
s = edit(s, "var found = tx(st.q) ? kbSearch(st.q) : [];",
         "var found = tx(st.q) ? kbSearch(st.q).concat(window.BT_COURSE ? window.BT_COURSE.search(st.q) : []) : [];", 'companion: transcript search')
s = edit(s, "t: f.l.t.replace(/^Activity: /, 'Activity: '), href: cl, target: '_blank' }",
         "t: f.l.t.replace(/^Activity: /, 'Activity: '), href: window.BT_COURSE ? '#Lesson-' + id : cl, target: window.BT_COURSE ? '_self' : '_blank' }", 'companion: search opens lessons')
s = edit(s, 'Your answers save on this device as you type, and each week unlocks along with your resources.', 'Your answers save to your account as you type, and they’re the same answers you write under each lesson’s video. Change them here or there.', 'companion: journal copy')
if 'unlocked : Math.max(1, unlocked)' not in s:
    s = s.replace('Math.max(1, unlocked)', '(window.BT_COURSE ? unlocked : Math.max(1, unlocked))'); changed.append('companion: no free week 1')
s = edit(s, "this.state = { d: load(), tab: 'home', view: (function", "this.state = { d: load(), tab: (function () { var t = window.BT_START_TAB || 'home'; window.BT_START_TAB = null; return t; })(), view: (function", 'companion: start tab')
s = edit(s, "var close = function () { self.setState({ view: null, tab: 'home' });", "var close = function () { self.setState({ view: null, tab: 'home' }); try { if (/^#(Intentions|Setup)$/.test(location.hash)) location.hash = '#Dashboard'; } catch (e) {}", 'companion: close intent resets route')
# app-made logos for resources the original artifact had no artwork for (set-up, Coming Home, Emotional Blueprint)
s = edit(s, "isUb: r.id === 'ub', week: r.week,", "isUb: r.id === 'ub', isOther: ['setup', 'comehome', 'blueprint'].indexOf(r.id) >= 0, resId: r.id, week: r.week,", 'companion: res emblem vals')
s = edit(s, "isUb: id === 'ub', arrow", "isUb: id === 'ub', isOther: ['setup', 'comehome', 'blueprint'].indexOf(id) >= 0, resId: id, arrow", 'companion: card emblem vals')
if 'data-slot="emb"' not in s:
    s, n = re.subn(r'(<sc-if value="\{\{(\w)\.isUb\}\}" hint-placeholder-val="\{\{ false \}\}">.*?</sc-if>)',
                   lambda m: m.group(1) + '<sc-if value="{{' + m.group(2) + '.isOther}}" hint-placeholder-val="{{ false }}"><span class="bt-emb-slot" data-slot="emb" data-res="{{' + m.group(2) + '.resId}}"></span></sc-if>', s, flags=re.S)
    changed.append('companion: emblem slots x%d' % n)
# resources come from the app's list (src/resources.json); week 0 = "Start here"
s = edit(s, 'var RESOURCES = [', 'var RESOURCES = window.BT_RESOURCES || [', 'companion: shared resources')
s = edit(s, "sub: op ? ('Week ' + r.week + ' resource')", "sub: op ? (r.week ? 'Week ' + r.week + ' resource' : 'Start here')", 'companion: res card label')
s = edit(s, 'Week {{r.week}} resource', '{{r.weekLabel}}', 'companion: res tab label')
s = edit(s, "week: r.week, title: r.title, desc: r.desc,", "week: r.week, weekLabel: r.week ? 'Week ' + r.week + ' resource' : 'Start here', title: r.title, desc: r.desc,", 'companion: res tab label val')
# the app can open the view straight on Intentions or Set-up (window.BT_START_VIEW)
if 'window.BT_START_VIEW || null' not in s:
    s = edit(s, "this.state = { d: load(), tab: 'home', view: null", "this.state = { d: load(), tab: 'home', view: (function () { var v = window.BT_START_VIEW || null; window.BT_START_VIEW = null; return v; })()", 'companion: start view')
s = edit(s, 'tabJour: !inI && st.tab ===', "tabJour: !inI && st.view !== 'setup' && st.tab ===", 'companion: setup hides journal')
s = edit(s, 'tabHome: !inI && st.tab ===', "tabHome: !inI && st.view !== 'setup' && st.tab ===", 'companion: setup hides home')
s = edit(s, 'tabRes: !inI && st.tab ===', "tabRes: !inI && st.view !== 'setup' && st.tab ===", 'companion: setup hides res')
s = edit(s, "showTabs: !inI, inIntent: inI, isPrivate:", "showTabs: !inI && st.view !== 'setup', inIntent: inI, inSetup: st.view === 'setup', closeSetup: function () { self.setState({ view: null, tab: 'home' }); try { window.location.hash = '#Dashboard'; window.scrollTo(0, 0); } catch (e) {} }, isPrivate:", 'companion: setup vals')
# move "Set yourself up for success" off the home tab onto its own page
t0 = s.find('<template id="t-dash"'); t1 = s.find('</template>', t0); t = s[t0:t1]
if 'value="{{inSetup}}"' not in t:
    def match_end(text, start):
        depth = 0
        for m in re.finditer(r'<sc-if\b|</sc-if>', text[start:]):
            if m.group(0) == '</sc-if>':
                depth -= 1
                if depth == 0: return start + m.end()
            else: depth += 1
    a = t.find('<sc-if value="{{setupMin}}"'); b = match_end(t, t.find('<sc-if value="{{setupOpen}}"'))
    block = t[a:b].replace('<sc-if value="{{setupMin}}"', '<sc-if value="{{false}}"', 1).replace('<sc-if value="{{setupOpen}}"', '<sc-if value="{{true}}"', 1)
    t = t[:a] + t[b:]
    h0 = t.find('<sc-if value="{{tabHome}}"'); h1 = match_end(t, h0)
    page = ('\n<sc-if value="{{inSetup}}" hint-placeholder-val="{{ false }}">\n<div style="display: flex; flex-direction: column; gap: 22px">\n'
            '<button class="gc" style="align-self: flex-start" onClick="{{closeSetup}}">← Back</button>\n'
            '<span class="hand" style="font-size: 18px; color: #F1F9A6">Introduction · activity</span>\n' + block +
            '\n<button class="bl" style="border: 0; cursor: pointer" onClick="{{closeSetup}}">Done, back to home</button>\n</div>\n</sc-if>\n')
    t = t[:h1] + page + t[h1:]
    s = s[:t0] + t + s[t1:]
    changed.append('companion: set-up gets its own page')
open(p, 'w', encoding='utf-8').write(s)

# ---------------- 1:1 home ----------------
p = 'src/one-on-one.html'
s = open(p, encoding='utf-8').read()
if BTN in s: s = s.replace(BTN + ' ', '').replace(BTN, ''); changed.append('one: remove course button')
a = s.find('VIEWS["Dashboard.dc.html"]'); b = s.find('VIEWS["', a + 30)
code = s[a:b]
code = edit(code, "var tab = st.tab || (startDone ? 'home' : 'start');", "var tab = this.props.embed ? 'start' : (st.tab || (startDone ? 'home' : 'start'));", 'one: embed shows start-here')
code = edit(code, 'var flags = [homeDone, waDone, courseDone, testsAll];', 'var flags = [homeDone, waDone, testsAll];', 'one: 3 steps')
code = edit(code, 'var startDone = doneCount === 4;', 'var startDone = doneCount === 3;', 'one: startDone')
code = edit(code, "ct: 4 - doneCount", "ct: 3 - doneCount", 'one: tab count')
code = edit(code, 'hasLeft: doneCount < 4, leftCount: 4 - doneCount,', 'hasLeft: doneCount < 3, leftCount: 3 - doneCount,', 'one: left')
code = edit(code, 'allDone: doneCount === 4,', 'allDone: doneCount === 3,', 'one: allDone')
code = edit(code, 'showCourse: !courseDone || !!ro.course, minCourse: courseDone && !ro.course,', 'showCourse: false, minCourse: false,', 'one: hide course step')
code = edit(code, 'var unl = function (n) { return n === 1 || !!wk[n - 1]; };',
            'var unl = function (n) { return window.BT_COURSE ? n <= window.BT_COURSE.unlockedWeek() : (n === 1 || !!wk[n - 1]); };', 'one: drip')
code = edit(code, "'Available once you finish Week ' + (n - 1)", "(window.BT_COURSE ? window.BT_COURSE.unlockText(n) : 'Available once you finish Week ' + (n - 1))", 'one: week label')
code = edit(code, "note: 'Available once you finish Week ' + (r.week - 1)", "note: (window.BT_COURSE ? window.BT_COURSE.unlockText(r.week) : 'Available once you finish Week ' + (r.week - 1))", 'one: res label')
code = edit(code, "Your tests are below. Do each one once, trust your first answer, and send each result to Savannah on WhatsApp.",
            "Your tests are below. Do each one once and trust your first answer. Your results save straight to your profile, so Savannah sees them too.", 'one: tests intro')
code = edit(code, "'Thank you! Moved to My tests, where you can re-open your results any time.'", "'Done! It’s saved to your profile and Savannah can see it. Re-open it any time under My tests.'", 'one: rep flash')
code = edit(code, "'Thank you! Moved to My tests. You can upload a copy there too if you’d like to look back at it.'", "'Done! Upload your chart under My tests so it saves to your profile for Savannah.'", 'one: sent flash', count=2)
code = edit(code, "'Saved to My tests. Now send it to Savannah in your WhatsApp chat too, so she has it.'", "'Saved to your profile. Savannah can see it now, no need to send it anywhere.'", 'one: upload flash')
code = edit(code, "'Marked as done, but this device couldn’t keep a copy. Please send it to Savannah on WhatsApp.'", "'That file was too big to save. Try a screenshot of it instead.'", 'one: upload big')
s = s[:a] + code + s[b:]

t0 = s.find('<template id="t-dash"'); t1 = s.find('</template>', t0)
t = s[t0:t1]
t = edit(t, 'Start here: 4 quick steps', 'Start here: 3 quick steps', 'one: 3 quick steps')
t = edit(t, '{{doneCount}} of 4 complete', '{{doneCount}} of 3 complete', 'one: of 3')
t = edit(t, 'Step 4 · done', 'Step 3 · done', 'one: step 3 done')
t = edit(t, '<span class="sn">4</span><span class="hand" style="font-size: 16px; color: #A8231F">Before your first 1:1 call', '<span class="sn">3</span><span class="hand" style="font-size: 16px; color: #A8231F">Before your first 1:1 call', 'one: step 3 number')
t = edit(t, 'Make sure you’ve sent each one to Savannah on WhatsApp, and she’ll see you in session.', 'They’re saved to your profile, so Savannah already has them. See you in session.', 'one: all set copy')
t = edit(t, r'<a class="gc" style="background: #FFFFFF" href="\{\{waLink\}\}" target="_blank" rel="noopener">Open WhatsApp</a>\s*', '', 'one: flash wa', regex=True)
t = edit(t, 'chat with Savannah is where you’ll send your results, and how she’ll stay in touch between sessions.', 'chat with Savannah is how she’ll stay in touch between sessions.', 'one: wa copy')
t = edit(t, 'Send the image to Savannah in your private WhatsApp chat, then upload it here too so you can look back at it.', 'Upload the image here. It saves to your profile, so Savannah sees it too.', 'one: rep copy')
t = edit(t, 'Send the chart to Savannah in your WhatsApp chat, then upload it here too so you can look back at it.', 'Upload the chart here. It saves to your profile, so Savannah sees it too.', 'one: hd copy')
t = edit(t, 'Send the screenshot to Savannah in your WhatsApp chat, then upload it here too.', 'Upload the screenshot here. It saves to your profile, so Savannah sees it too.', 'one: disc copy')
t = edit(t, r'<button class="sentb" onClick="\{\{(?:completeRep|sentHd|sentDisc)\}\}"><span class="sbx" aria-hidden="true"></span>Sent to Sav on WhatsApp</button>\s*', '', 'one: remove sent buttons', regex=True)
t = edit(t, r'<button class="\{\{repSentCls\}\}"[^>]*onClick="\{\{toggleRepSent\}\}">.*?</button>\s*', '', 'one: remove rep sent toggle', regex=True)
t = edit(t, '<sc-if value="{{u.canSend}}" hint-placeholder-val="{{ true }}">', '<sc-if value="{{u.canSendNever}}" hint-placeholder-val="{{ false }}">', 'one: hide sent toggle')
t = edit(t, 'Your uploads are saved on this device and browser only, which is why it’s important to send each one to Savannah on WhatsApp too.', 'Your tests are saved to your profile, so Savannah can see them too.', 'one: uploads footer')
s = s[:t0] + t + s[t1:]
open(p, 'w', encoding='utf-8').write(s)
print('\n'.join(changed) if changed else 'nothing to change (already patched)')
