# Breaking Out of Your Box, step 1 as a game: one category at a time, 5 beliefs per page,
# each rated All the time / Sometimes / Never. Idempotent; run by build.py.
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = '''<div id="pd-game" class="pdg">
<div class="pdg-cats" role="list">
<sc-for list="{{game.cats}}" as="gc" hint-placeholder-count="6"><button class="{{gc.cls}}" role="listitem" aria-current="{{gc.cur}}" onClick="{{gc.go}}"><span class="pdg-cn">{{gc.n}}</span><span>{{gc.name}}</span></button></sc-for>
</div>
<div class="pdg-card">
<div class="pdg-head">
<div style="display: flex; flex-direction: column; gap: 2px">
<span class="hand" style="font-size: 16px; color: #A8231F">{{game.kicker}}</span>
<h3 style="margin: 0; font-weight: 700; font-size: 26px; line-height: 1.1">{{game.name}}</h3>
</div>
<span class="pdg-page">{{game.pageLabel}}</span>
</div>
<div class="pdg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{game.pct}}" aria-label="How far through you are"><span style="width: {{game.pct}}%"></span></div>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #463A38">How often does this feel true for you? Go with your gut.</p>
<div class="pdg-list">
<sc-for list="{{game.items}}" as="g" hint-placeholder-count="5">
<div class="{{g.cls}}">
<div style="display: flex; flex-direction: column; gap: 4px"><span class="pdg-text">{{g.text}}</span><span class="btag">{{g.f5}}</span></div>
<div class="pdg-dots" role="radiogroup" aria-label="{{g.text}}">
<sc-for list="{{g.opts}}" as="o" hint-placeholder-count="3"><button class="{{o.cls}}" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}"><span class="pdg-dot" aria-hidden="true"></span><span>{{o.label}}</span></button></sc-for>
</div>
</div>
</sc-for>
</div>
<sc-if value="{{game.hasNote}}" hint-placeholder-val="{{ false }}"><div class="pdg-note">{{game.note}}</div></sc-if>
<div class="pdg-nav">
<sc-if value="{{game.canBack}}" hint-placeholder-val="{{ false }}"><button class="ghost" onClick="{{game.back}}">← Back</button></sc-if>
<span style="flex: 1 1 auto"></span>
<button class="{{game.nextCls}}" onClick="{{game.next}}">{{game.nextLabel}}</button>
</div>
</div>
<sc-if value="{{game.done}}" hint-placeholder-val="{{ false }}">
<div class="pdg-res">
<span class="hand" style="font-size: 17px; color: #F1F9A6">Level complete</span>
<div style="font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 26px; line-height: 1.15">{{game.resTitle}}</div>
<div class="pdg-resrow"><span class="pdg-k all"><span class="pdg-dot" aria-hidden="true"></span><b>{{game.nAll}}</b> all the time · your core beliefs</span><span class="pdg-k some"><span class="pdg-dot" aria-hidden="true"></span><b>{{game.nSome}}</b> sometimes · parts of you</span></div>
<sc-if value="{{game.hasCore}}" hint-placeholder-val="{{ false }}"><div style="display: flex; flex-wrap: wrap; gap: 6px"><sc-for list="{{game.core}}" as="c" hint-placeholder-count="3"><span class="pdg-chip">{{c.text}}</span></sc-for></div></sc-if>
<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #F6D6CF">The ones you feel all the time are the beliefs running the show. The sometimes ones are parts of you that pop up in certain moments. Both are worth knowing.</p>
</div>
</sc-if>
</div>
'''
LOGIC = r'''
    // ---- Step 1 as a game: one category, five beliefs at a time ----
    var freq = s.freq || {}, G_PER = 5, FREQ = [['all', 'All the time'], ['some', 'Sometimes'], ['never', 'Never']];
    var gTotal = 0, gAnswered = 0, nAll = 0, nSome = 0, coreList = [];
    PD_CATS.forEach(function (cat) { cat.items.forEach(function (pair, i) { var k = cat.id + '-' + i; gTotal++; var f = freq[k] || (ticked[k] ? 'some' : ''); if (f) gAnswered++; if (f === 'all') { nAll++; coreList.push({ text: pair[0] }); } if (f === 'some') nSome++; }); });
    var gci = Math.min(Math.max(0, s.gCat || 0), PD_CATS.length - 1), gcat = PD_CATS[gci];
    var gPages = Math.ceil(gcat.items.length / G_PER), gpi = Math.min(Math.max(0, s.gPage || 0), gPages - 1);
    var gTop = function () { setTimeout(function () { var el = document.getElementById('pd-game'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); };
    var gItems = gcat.items.slice(gpi * G_PER, gpi * G_PER + G_PER).map(function (pair, j) {
      var key = gcat.id + '-' + (gpi * G_PER + j), f = freq[key] || (ticked[key] ? 'some' : '');
      return { text: pair[0], f5: pdF5Name(pdF5Of(pair[0], pair[1])), cls: 'pdg-row' + (f ? ' ' + f : ''),
        opts: FREQ.map(function (o) { var on = f === o[0]; return { label: o[1], cls: 'pdg-o ' + o[0] + (on ? ' on' : ''), on: on ? 'true' : 'false', pick: function () {
          var nf = Object.assign({}, self.state.freq || {}), nt = Object.assign({}, self.state.ticked || {});
          nf[key] = o[0]; if (o[0] === 'never') delete nt[key]; else nt[key] = true;
          self.setState({ freq: nf, ticked: nt });
        } }; }) };
    });
    var pageDone = gItems.every(function (g) { return / (all|some|never)$/.test(g.cls); });
    var lastPage = gpi >= gPages - 1, lastCat = gci >= PD_CATS.length - 1;
    var game = {
      cats: PD_CATS.map(function (c, ci) {
        var ans = c.items.filter(function (p, i) { var k = c.id + '-' + i; return freq[k] || ticked[k]; }).length, full = ans === c.items.length;
        return { n: full ? '✓' : String(ci + 1), name: c.name, cur: ci === gci ? 'step' : 'false', cls: 'pdg-c' + (ci === gci ? ' on' : '') + (full ? ' full' : ''), go: function () { self.setState({ gCat: ci, gPage: 0, gDone: false }); gTop(); } };
      }),
      kicker: 'Level ' + (gci + 1) + ' of ' + PD_CATS.length, name: gcat.name, pageLabel: (gpi + 1) + ' / ' + gPages,
      pct: Math.round(gAnswered / Math.max(1, gTotal) * 100), items: gItems,
      hasNote: !pageDone, note: 'Pick a dot for each one to keep going. Not sure? Sometimes is a great answer.',
      canBack: gci > 0 || gpi > 0,
      back: function () { if (gpi > 0) self.setState({ gPage: gpi - 1, gDone: false }); else if (gci > 0) { var pc = PD_CATS[gci - 1]; self.setState({ gCat: gci - 1, gPage: Math.ceil(pc.items.length / G_PER) - 1, gDone: false }); } gTop(); },
      nextCls: 'primary' + (pageDone ? ' lime' : ' dim'),
      nextLabel: !lastPage ? 'Next 5 →' : !lastCat ? 'Next level: ' + PD_CATS[gci + 1].name + ' →' : 'See my results →',
      next: function () { if (!pageDone) return; if (!lastPage) self.setState({ gPage: gpi + 1 }); else if (!lastCat) self.setState({ gCat: gci + 1, gPage: 0 }); else self.setState({ gDone: true }); gTop(); },
      done: !!s.gDone, nAll: nAll, nSome: nSome, core: coreList, hasCore: coreList.length > 0,
      resTitle: nAll + nSome ? 'You found ' + (nAll + nSome) + (nAll + nSome === 1 ? ' limiting belief.' : ' limiting beliefs.') + ' That takes guts.' : 'Nothing ticked yet. That’s okay too.'
    };
'''
for f in ['src/companion.html', 'src/one-on-one.html']:
    p = os.path.join(root, f); s = open(p, encoding='utf-8').read(); o = s
    if 'id="pd-game"' not in s and '<sc-for list="{{cats}}" as="cat"' in s:
        i = s.index('<sc-for list="{{cats}}" as="cat"')
        j = s.index('</sc-for>\n</div>\n</div>\n</sc-for>', i) + len('</sc-for>\n</div>\n</div>\n</sc-for>')
        s = s[:i] + TPL + s[j:]
        a = "    var matchedIds = Object.keys(fromByProg);"
        assert s.count(a) == 1, f
        s = s.replace(a, LOGIC + a)
        a = "      cats: cats,\n"
        assert s.count(a) == 1, f
        s = s.replace(a, "      cats: cats, game: game,\n")
        a = "careAck: s.careAck, openBelief: s.openBelief, reminder: s.reminder }));"
        assert s.count(a) == 1, f
        s = s.replace(a, "careAck: s.careAck, openBelief: s.openBelief, reminder: s.reminder, freq: s.freq, gCat: s.gCat, gPage: s.gPage, gDone: s.gDone, customProves: s.customProves }));")
        for a, b in [
            ('<h2 style="margin: 0; font-weight: 700; font-size: 34px; line-height: 1.1">Tick the beliefs that feel familiar</h2>', '<h2 style="margin: 0; font-weight: 700; font-size: 34px; line-height: 1.1">How often does it feel true?</h2>'),
            ('<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6A5A57">Don’t overthink this. Just notice your reaction.</p>', '<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6A5A57">Six levels, five beliefs at a time. For each one, pick a dot: all the time, sometimes or never. Don’t overthink it. Just notice your reaction.</p>'),
            ('<div style="font-weight: 600; font-size: 15px">Tick any belief that:</div>', '<div style="font-weight: 600; font-size: 15px">A belief counts if it:</div>'),
            ('If your brain says <strong>“Oof.”</strong> Tick it.', 'If your brain says <strong>“Oof.”</strong> it’s at least a sometimes.'),
            ("auditDoneTitle: total ? 'You ticked ' + total + (total === 1 ? ' belief.' : ' beliefs.') + ' Well done.' : 'Ready when you are.',", "auditDoneTitle: total ? 'You found ' + total + (total === 1 ? ' belief' : ' beliefs') + (nAll ? ' (' + nAll + ' all the time)' : '') + '. Well done.' : 'Ready when you are.',"),
        ]:
            if a in s: s = s.replace(a, b)
    if s != o: open(p, 'w', encoding='utf-8').write(s); print('patched game', f)
