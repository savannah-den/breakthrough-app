# Proof portfolio home card (RAS training), party(), journal lives in the Becoming Book. Idempotent.
P='public/js/course.js'
s=open(P).read()
if 'function proofHome' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)

# 1. shared party()
a=s.index("    var bg = h('div', { class: 'bt-party', role: 'dialog', 'aria-label': title });")
b=s.index("    document.body.appendChild(bg);\n  }\n", a)+len("    document.body.appendChild(bg);\n  }\n")
s=s[:a]+"    party(title, msg, 'Hell yes');\n  }\n"+r'''  function party(title, msg, btn) {
    var bg = h('div', { class: 'bt-party', role: 'dialog', 'aria-label': title });
    var conf = h('div', { class: 'bt-confetti', 'aria-hidden': 'true' });
    var cols = ['#F1F9A6', '#F4C2F7', '#F28C3B', '#D3302B', '#FFF4EE', '#3E9B4F'];
    for (var i = 0; i < 70; i++) conf.appendChild(h('i', { style: 'left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.8).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;transform:rotate(' + Math.round(Math.random() * 360) + 'deg)' }));
    var card = h('div', { class: 'bt-party-card' }, [icon('star', 'bt-party-star'), h('b', { text: title }), h('p', { text: msg }),
      h('button', { class: 'bt-btn lime', type: 'button', text: btn || 'Hell yes', onclick: function () { bg.remove(); } })]);
    bg.appendChild(conf); bg.appendChild(card);
    bg.addEventListener('click', function (e) { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
  }
'''+s[b:]

# 2. new home card replaces winsHome
a=s.index("  function winsHome() {")
b=s.index("\n  var mo = null;", a)
NEW = r'''  var SPARK = { win: ['A win', '✦'], joy: ['Sparked joy', '♥'], sparkle: ['A sparkle of life', '✧'] };
  var JAR = '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="1" y="1" width="118" height="118" rx="29" fill="#FFFFFF" stroke="#4E0C08" stroke-width="2"/>' +
    '<path d="M38 40 Q36 50 32 58 Q26 72 28 92 Q30 104 44 106 L76 106 Q90 104 92 92 Q94 72 88 58 Q84 50 82 40 Z" fill="#FBE6FC" stroke="#4E0C08" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<rect x="34" y="28" width="52" height="13" rx="5" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.6"/>' +
    '<path d="M40 70 Q60 64 80 70" fill="none" stroke="#4E0C08" stroke-width="1.6" opacity=".35"/>' +
    '<g class="jar-s"><path transform="translate(42 76) scale(.75)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.4" stroke-linejoin="round"/></g>' +
    '<g class="jar-s s2"><path transform="translate(62 84) scale(.6)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F28C3B" stroke="#4E0C08" stroke-width="2.8" stroke-linejoin="round"/></g>' +
    '<g class="jar-s s3"><path transform="translate(60 56) scale(.55)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F4C2F7" stroke="#4E0C08" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<circle cx="50" cy="94" r="3" fill="#D3302B" stroke="#4E0C08" stroke-width="1"/><circle cx="76" cy="74" r="2.6" fill="#F1F9A6" stroke="#4E0C08" stroke-width="1"/>' +
    '<g class="jar-s s2"><path transform="translate(84 10) scale(.8)" d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="#F1F9A6" stroke="#4E0C08" stroke-width="2.4" stroke-linejoin="round"/></g></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1C12.7 7.3 16.7 11.3 23 12C16.7 12.7 12.7 16.7 12 23C11.3 16.7 7.3 12.7 1 12C7.3 11.3 11.3 7.3 12 1Z" fill="currentColor" stroke="#4E0C08" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var COUNT_CHEERS = { 1: ['Your first piece of proof!', 'That’s your RAS getting its first lesson in finding the good. Come back tomorrow and give it another.'], 5: ['5 pieces of proof!', 'Your brain is starting to notice. Keep feeding it.'], 10: ['10 pieces of proof!', 'Ten times you caught yourself doing life well. That’s a pattern now, not a fluke.'], 25: ['25 pieces of proof!', 'Your portfolio is getting heavy, and the old story is getting lighter.'], 50: ['50 pieces of proof!', 'Fifty. Read back through them on a hard day. This is who you are.'], 100: ['100 pieces of proof!', 'One hundred. You’ve rewired what your brain looks for. I’m so proud of you.'] };
  var STREAK_CHEERS = { 3: ['3-day streak!', 'Three days in a row of finding the good. Your RAS is catching on.'], 7: ['A whole week streak!', 'Seven days straight. This is what rewiring looks like.'], 14: ['Two-week streak!', 'Fourteen days of proof. The new groove is getting deeper.'], 21: ['21-day streak!', 'Three weeks. This is becoming who you are.'], 30: ['30-day streak!', 'A month of daily proof. Absolute legend.'] };
  function cheerProof() {
    var m = rd(MEMK) || {}, done = m.cel || {}, n = evidence().filter(function (e) { return e.win; }).length, st = winStreak(), c = null, k = '';
    if (STREAK_CHEERS[st.current] && !done['s' + st.current + '_' + dayKey(Date.now())]) { c = STREAK_CHEERS[st.current]; k = 's' + st.current + '_' + dayKey(Date.now()); }
    else if (COUNT_CHEERS[n] && !done['c' + n]) { c = COUNT_CHEERS[n]; k = 'c' + n; }
    if (!c) return false;
    done[k] = Date.now(); m.cel = done; wr(MEMK, m);
    setTimeout(function () { party(c[0], c[1], 'Hell yes'); }, 700);
    return true;
  }
  var proofType = 'win';
  function proofHome() {
    var box = h('section', { class: 'bt-proof', 'aria-labelledby': 'bt-proof-h' });
    var ring = h('span', { class: 'bt-proof-ring', 'aria-hidden': 'true' });
    var spk = [0, 1, 2].map(function (i) { var x = h('span', { class: 'bt-spk s' + i, 'aria-hidden': 'true' }); x.innerHTML = STAR; return x; });
    var inner = h('div', { class: 'bt-proof-in' });
    box.appendChild(ring); spk.forEach(function (x) { box.appendChild(x); }); box.appendChild(inner);
    function draw() {
      inner.innerHTML = '';
      var ev = evidence(), wins = ev.filter(function (e) { return e.win; }), st = winStreak();
      var jar = h('span', { class: 'bt-proof-jar' }); jar.innerHTML = JAR;
      inner.appendChild(h('div', { class: 'bt-proof-top' }, [jar, h('div', { class: 'bt-proof-tt' }, [
        h('span', { class: 'bt-wins-k', text: 'Train your brain to find the good' }),
        h('h2', { id: 'bt-proof-h', class: 'bt-wins-h', text: 'Add proof to your proof portfolio' })])]));
      inner.appendChild(h('p', { class: 'bt-wins-t', text: 'Your RAS is the filter in your brain that decides what you notice. For years it’s been collecting proof for the old story. Let’s retrain it. Once a day, drop in a win, a moment that sparked joy, or a little sparkle of life. Tiny counts.' }));
      inner.appendChild(h('p', { class: 'bt-wins-t sm', text: 'Every piece lands in your proof portfolio, so when you meet your limiting beliefs in Breaking Out of Your Box, the evidence that they’re wrong is already waiting for you.' }));
      var stRow = h('div', { class: 'bt-proof-stats' }, [
        h('span', { class: 'bt-proof-stat' + (st.current ? ' hot' : '') }, [h('b', { text: String(st.current) }), h('span', { text: 'day streak' })]),
        h('span', { class: 'bt-proof-stat' }, [h('b', { text: String(wins.length) }), h('span', { text: 'pieces of proof' })]),
        h('span', { class: 'bt-proof-stat' }, [h('b', { text: String(st.best) }), h('span', { text: 'best streak' })])
      ]);
      inner.appendChild(stRow);
      inner.appendChild(h('p', { class: 'bt-proof-nudge', text: st.today ? 'Today’s proof is in. Your streak is safe. Got another? Add it.' : st.current ? 'Add today’s to keep your ' + st.current + '-day streak going.' : 'Add one today to start your streak.' }));
      var chips = h('div', { class: 'bt-proof-chips', role: 'radiogroup', 'aria-label': 'What kind of proof?' }, Object.keys(SPARK).map(function (k) {
        return h('button', { class: 'bt-proof-chip' + (proofType === k ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': proofType === k ? 'true' : 'false', onclick: function () { proofType = k; draw(); var i = document.getElementById('bt-win-in'); if (i) i.focus(); } }, [h('span', { 'aria-hidden': 'true', text: SPARK[k][1] }), SPARK[k][0]]);
      }));
      inner.appendChild(chips);
      var ph = { win: 'Today I…', joy: 'This made me smile…', sparkle: 'I noticed…' }[proofType];
      var inp = h('input', { class: 'bt-in', id: 'bt-win-in', placeholder: ph, 'aria-label': SPARK[proofType][0] });
      var add = function () {
        var v = tx(inp.value); if (!v) return;
        addEvidence(v, { spark: proofType }); sparkleBurst(box);
        if (!cheerProof()) APP.toast(['Added to your proof portfolio. Look at you!', 'Proof collected. Your RAS is learning.', 'Into the jar it goes. More proof the new story is true.'][wins.length % 3]);
        setTimeout(draw, 650);
      };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
      inner.appendChild(h('div', { class: 'bt-wins-row' }, [inp, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add proof', onclick: add })]));
      var mem = memoryWin();
      if (mem) {
        var a = evAt(mem.e), more = h('input', { class: 'bt-in', id: 'bt-mem-in', placeholder: 'Since then I’ve…', 'aria-label': 'Add more proof on top of this' });
        var stack = function () { var v = tx(more.value); if (!v) return; addEvidence(v, { builds: mem.e.id, spark: 'win' }); memSeen(mem.e.id); sparkleBurst(box); if (!cheerProof()) APP.toast('Stacked. That’s more proof.'); setTimeout(draw, 650); };
        more.addEventListener('keydown', function (e) { if (e.key === 'Enter') stack(); });
        var form = h('div', { class: 'bt-wins-row', hidden: true }, [more, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add', onclick: stack })]);
        inner.appendChild(h('div', { class: 'bt-mem' }, [
          h('span', { class: 'bt-mem-k', text: 'A memory from ' + agoText(a) }),
          h('p', { class: 'bt-mem-w', text: '“' + mem.e.text + '”' }),
          h('p', { class: 'bt-mem-q', text: mem.q }),
          h('div', { class: 'bt-mem-acts' }, [
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Add more proof', onclick: function () { form.hidden = false; more.focus(); } }),
            h('button', { class: 'bt-btn ghost', type: 'button', text: 'Still proud ✓', onclick: function () { memSeen(mem.e.id); APP.toast('Proud of you too.'); draw(); } })
          ]), form
        ]));
      }
      if (wins.length) inner.appendChild(winList(wins.slice(0, 3)));
      inner.appendChild(h('div', { class: 'bt-wins-foot' }, [
        h('button', { class: 'bt-wins-link', type: 'button', text: 'Open my proof portfolio →', onclick: openProof })
      ]));
    }
    draw();
    return box;
  }'''
s=s[:a]+NEW+s[b:]
rep("    slot.appendChild(winsHome());", "    slot.appendChild(proofHome());")
# winList shows the spark glyph
rep("[h('span', { class: 'bt-wins-d', text: a ? new Date(a).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '' }), h('span', { text: e.text }),",
    "[h('span', { class: 'bt-wins-d', text: a ? new Date(a).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '' }), h('span', { class: 'bt-wins-g', 'aria-hidden': 'true', text: (SPARK[e.spark] || SPARK.win)[1] }), h('span', { class: 'bt-wins-x', text: e.text }),")
# openProof: always go to the portfolio part of the book unless Breaking Out is open
rep("    else { bookState.tab = 'proof'; location.hash = '#Book'; }", "    else { bookState.tab = 'proof'; bookState.day = ''; if (location.hash === '#Book') APP.reload(); else location.hash = '#Book'; }")

# 3. book: journal is here now (editable + prompts waiting), wins labelled by type
rep("push({ kind: 'journal', at: log.at || null, title: q, text: val, sub: f ? f.l.title : '' });",
    "push({ kind: 'journal', key: key, at: log.at || null, title: q, text: val, sub: f ? f.l.title : '', lesson: f ? f.l.id : '' });")
rep("push({ kind: 'change', at: log.at || null, title: q, before: log.first, beforeAt: log.firstAt, text: val, sub: f ? f.l.title : '' });",
    "push({ kind: 'change', key: key, at: log.at || null, title: q, before: log.first, beforeAt: log.firstAt, text: val, sub: f ? f.l.title : '' });")
rep(": e.win ? 'In your proof portfolio' : 'Proof portfolio' });", ": e.win ? (SPARK[e.spark] || SPARK.win)[0] + ' · in your proof portfolio' : 'Proof portfolio' });")
rep("win: ['Win', '#FFD9A8', 'star'], proof: ['Proof', '#BFD7F2', 'tick']", "win: ['Win & sparkle', '#FFD9A8', 'star'], proof: ['Proof', '#BFD7F2', 'tick']")
rep("['win', 'Wins'], ['proof', 'Proof']]", "['win', 'Wins & sparkles'], ['proof', 'Proof portfolio']]")
rep("['all', 'Everything'], ['milestone', 'Milestones'], ['activity', 'Activities'], ['journal', 'Journal'],",
    "['all', 'Everything'], ['journal', 'Journal'], ['milestone', 'Milestones'], ['activity', 'Activities'],")
JOUR = r'''  function setJournal(key, val) { var c = comp(); c.j = c.j || {}; c.j[key] = val; wr(K.comp, c); }
  function journalEditor(key, val, onDone) {
    var ta = h('textarea', { class: 'bt-in bk-ta', rows: '4', 'aria-label': 'Your answer' }); ta.value = val || '';
    return h('div', { class: 'bk-edit' }, [ta, h('div', { class: 'bt-row' }, [
      h('button', { class: 'bt-btn lime', type: 'button', text: 'Save', onclick: function () { var v = tx(ta.value); setJournal(key, v); APP.toast('Saved to your journal. It’s under the lesson too.'); onDone(); } }),
      val ? h('button', { class: 'bt-btn ghost', type: 'button', text: 'Cancel', onclick: function () { onDone(true); } }) : null])]);
  }
  function waitingPrompts() {
    var j = comp().j || {}, out = [];
    openLessons().forEach(function (x) { (x.l.prompts || []).forEach(function (p, i) { var k = x.l.id + '_' + i; if (!tx(j[k])) out.push({ key: k, q: p[0], lesson: x.l }); }); });
    return out;
  }
'''
rep("  var bookState = { tab: 'all', q: '', day: '', month: null };", JOUR + "  var bookState = { tab: 'all', q: '', day: '', month: null };")
rep("      if (e.kind === 'win' || e.kind === 'proof') { var del",
    "      if ((e.kind === 'journal' || e.kind === 'change') && e.key) { var eb = h('button', { class: 'bk-open', type: 'button', text: 'Edit ✎', onclick: function () { eb.replaceWith(journalEditor(e.key, e.text, function (cancel) { if (cancel) draw(); else APP.reload(); })); } }); body.appendChild(eb); }\n      if (e.kind === 'win' || e.kind === 'proof') { var del")
rep("      if (!items.length) { list.appendChild(h('p', { class: 'bk-empty', text:",
    "      if (bookState.tab === 'journal' && !q && !bookState.day) { var wp = waitingPrompts(); if (wp.length) { var wbox = h('section', { class: 'bk-wait' }, [h('h2', { class: 'bk-month', text: 'Waiting for you' }), h('p', { class: 'bk-sub', text: 'Prompts from lessons you’ve opened. Answer here or under the video, they stay in sync.' })]); wp.slice(0, 3).forEach(function (w) { wbox.appendChild(h('article', { class: 'bk-e journal bk-w', style: '--kc:#FFF4EE' }, [h('div', { class: 'bk-body' }, [h('span', { class: 'bk-sub', text: w.lesson.title }), h('b', { class: 'bk-t', text: w.q }), journalEditor(w.key, '', function () { APP.reload(); })])])); }); if (wp.length > 3) wbox.appendChild(h('p', { class: 'bk-sub', text: '+ ' + (wp.length - 3) + ' more waiting' })); list.appendChild(wbox); } }\n      if (!items.length) { list.appendChild(h('p', { class: 'bk-empty', text:")
# empty-state fix so Waiting can show even when no answers yet
s=s.replace("      if (!items.length) { list.appendChild(h('p', { class: 'bk-empty', text:",
    "      if (!items.length) { if (bookState.tab === 'journal' && list.querySelector('.bk-wait')) return; list.appendChild(h('p', { class: 'bk-empty', text:")
open(P,'w').write(s); print('ok')
