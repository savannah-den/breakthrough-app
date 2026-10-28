# Proof categories + auto-linking to limiting beliefs, streak calendar + levels, calmer card. Idempotent.
P='public/js/course.js'
s=open(P).read()
if 'function autoBeliefs' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)

rep("  var SPARK = { win: ['A win', '✦'], joy: ['Sparked joy', '♥'], sparkle: ['A sparkle of life', '✧'] };",
r'''  var SPARK = { win: ['Win', '✦'], ach: ['Achievement', '★'], joy: ['Sparked joy', '♥'], proof: ['Proof', '✓'], sparkle: ['Sparkle of life', '✧'] };
  /* Limiting beliefs (same list and keywords as Breaking Out of Your Box) and the new truth each piece of proof backs up */
  var BELIEF_PID = {"I'm not good enough":'notgood',"I'm too much":'toomuch',"I'm not enough":'notenough',"I'm broken":'broken','Something is wrong with me':'broken',"I'm lazy":'lazy',"I'm a failure":'messup',"I'm behind everyone else":'notenough','I always get it wrong':'messup',"I can't trust myself":'canttrust',"I don't belong":'dontbelong',"I don't fit in":'dontbelong',"I'm different in a bad way":'different',"I'm difficult":'toomuch',"I'm a burden":'needs',"I'm hard to love":'love','I ruin everything':'messup',"I'll never reach my potential":'potential',"I'm not capable":'capable',"I can't cope":'cope',
    "If people knew the real me, they wouldn't like me":'realme',"If I disappoint people, they'll leave me":'disappoint','Love has to be earned':'love','I have to keep everyone happy':'keephappy',"I'm responsible for other people's feelings":'responsible','Conflict is dangerous':'conflict','My needs are too much':'needs','I need to be useful to be loved':'love','I have to prove my worth':'prove','People always leave':'leave',"I can't rely on anyone":'onlytrust','I can only trust myself':'onlytrust','I have to do everything myself':'everything','Asking for help is weakness':'strong',"I'll be rejected if I speak up":'speakup',"If I set boundaries people won't like me":'disappoint',
    "If I rest, I'm lazy":'rest','My worth comes from what I achieve':'worth','I have to work hard to succeed':'workhard','I must be productive to be worthy':'worth','I have to earn rest':'rest','I have to prove myself':'prove',"If I'm not exceptional, I'm worthless":'worth',"If I'm not improving, I'm failing":'notenough','If I slow down, everything will fall apart':'slowdown','Success must be difficult':'workhard',"Easy means I'm cheating":'workhard','I can never do enough':'notenough','I should be further ahead':'notenough','Other people are doing better than me':'notgood',
    'I have to get it right the first time':'rightfirst','Mistakes are dangerous':'mistake',"If I make a mistake, I'll be rejected":'mistake',"Failure means I'm not good enough":'notgood','I need certainty before I act':'certainty','I must avoid looking stupid':'mistake','I should already know how to do this':'rightfirst',"I can't let people see me struggle":'strong',"If I try and fail, it'll prove something is wrong with me":'messup',"If I don't do it perfectly, there's no point doing it":'rightfirst',
    "If I'm seen, I'll be judged":'seen','Being successful will make people reject me':'seen',"It's safer to stay small":'seen','Standing out is dangerous':'different','Attention is unsafe':'seen','People are always judging me':'seen',"I shouldn't take up space":'toomuch','I need to shrink myself to be accepted':'toomuch',"My opinions don't matter":'opinions','Other people are more qualified than me':'notgood',
    "The world isn't safe":'unsafe',"People can't be trusted":'onlytrust','I need to stay in control':'slowdown','If I let go, everything will fall apart':'slowdown','I have to stay prepared':'relaxing','I need to expect the worst':'worst','Relaxing is dangerous':'relaxing',"I can't let my guard down":'relaxing','Being vulnerable is risky':'strong','If I stop worrying, something bad will happen':'relaxing'};
  var BELIEF_KEYS = {notgood:['good enough','compliment','proud','praise','nailed','did well','win','pb','personal best','best','first place','won'],notenough:['enough','compliment','proud','achieved','progress','win','pb','personal best','finished'],toomuch:['excited','passion','loud','laughed','enthusias','too much','myself'],lazy:['finished','completed','got through','started','ticked off','done','ran','run','gym','workout','walk','trained','pb'],rest:['rest','relax','nap','day off','slept','slow','break'],relaxing:['relax','calm','peace','still','switched off'],slowdown:['slow','delegat','let go','day off','break',"didn't check"],worth:['day off','just because','enjoyed','rest','without achieving'],workhard:['easy','easily','effortless','flowed'],needs:['asked for','needed','support','help'],strong:['help','asked','cried','vulnerable','support','struggl'],everything:['delegat','asked','help','someone else','handed'],onlytrust:['trusted','relied','someone else','delegat','help'],disappoint:['said no','boundar','no to','cancel','disappoint'],keephappy:['said no','boundar','upset','my needs','for me'],responsible:['their feelings',"didn't fix",'let them','boundar'],conflict:['conflict','argument','disagree','hard conversation','told them'],speakup:['spoke up','speak up','shared my','told','voice','opinion'],opinions:['opinion','idea','shared my','listened','agreed'],seen:['posted','post','visible','video','live','seen','presented','shared'],mistake:['mistake','wrong','messed up','error','forgot'],rightfirst:['first try','tried','attempt','practi','beginner','messy','learn'],certainty:['decided','decision','took the step','before i was ready','leap'],canttrust:['trusted myself','gut','instinct','backed myself','decided','figured'],messup:['fixed','solved','sorted','went well','worked','figured','pb','personal best','nailed'],broken:['understood','handled','coped','proud'],realme:['real me','authentic','opened up','vulnerable','myself'],different:['different','weird','special interest','unmasked','interest'],dontbelong:['belong','friend','connected','community','invited','group','team'],love:['loved','love','hug','cared','kind message','partner','mum','husband','friend'],prove:["didn't explain",'just because','no proof'],potential:['progress','grew','learned','achieved','step','pb','personal best','goal'],capable:['figured','handled','learned','managed','did it','capable','pb','personal best','ran','finished'],cope:['coped','handled','got through','managed','calm'],leave:['stayed','checked in','reached out','still here','friend'],unsafe:['new','tried','went out','left the house','travel','change','somewhere'],worst:['went well','good news','turned out','better than','fine']};
  var TRUTHS = [
    ['I am good enough', ['notgood']], ['I am enough', ['notenough']], ['I am loved', ['love', 'leave']], ['I am capable', ['capable', 'cope', 'potential']],
    ['I can trust myself', ['canttrust', 'messup']], ['I belong', ['dontbelong', 'different']], ['I am safe to be seen', ['seen']], ['My needs matter', ['needs', 'keephappy', 'responsible']],
    ['I am worthy as I am', ['worth', 'prove', 'broken']], ['Rest is safe', ['rest', 'relaxing', 'slowdown', 'lazy']], ['Mistakes help me grow', ['mistake', 'rightfirst', 'certainty']],
    ['My voice matters', ['opinions', 'speakup', 'conflict']], ['I can take up space', ['toomuch', 'realme']], ['I can ask for help', ['strong', 'everything', 'onlytrust']],
    ['Success can be easy', ['workhard']], ['Good things happen for me', ['worst', 'unsafe']], ['I can say no', ['disappoint']]
  ];
  var TYPE_PIDS = { win: ['notgood', 'notenough', 'capable', 'lazy'], ach: ['notgood', 'notenough', 'capable', 'potential', 'messup', 'worth'], joy: ['worst', 'worth', 'rest'], proof: [] };
  function pidsOf(truths) { var out = {}; TRUTHS.forEach(function (t) { if (truths.indexOf(t[0]) >= 0) t[1].forEach(function (p) { out[p] = 1; }); }); return out; }
  function autoBeliefs(text, type, truths) {
    var low = ' ' + String(text || '').toLowerCase() + ' ', pids = {};
    (TYPE_PIDS[type] || []).forEach(function (p) { pids[p] = 1; });
    Object.keys(BELIEF_KEYS).forEach(function (p) { if (BELIEF_KEYS[p].some(function (k) { return low.indexOf(k) >= 0; })) pids[p] = 1; });
    Object.assign(pids, pidsOf(truths || []));
    var beliefs = Object.keys(BELIEF_PID).filter(function (b) { return pids[BELIEF_PID[b]]; });
    var proves = TRUTHS.filter(function (t) { return t[1].some(function (p) { return pids[p]; }); }).map(function (t) { return t[0]; });
    (truths || []).forEach(function (t) { if (proves.indexOf(t) < 0) proves.push(t); });
    return { beliefs: beliefs, proves: proves };
  }
  var LEVELS = [[0, 'New spark', 'Add a win today to light your first spark.'], [3, 'Sparkler', 'Three days of finding the good. Your RAS is catching on.'], [7, 'Streaker', 'A whole week. This is what rewiring looks like.'], [17, 'Mega streaker', 'Seventeen days straight. You’re a proof-collecting machine.'], [30, 'Supernova', 'A month of daily proof. Absolute legend.'], [60, 'Glow icon', 'Sixty days. Finding the good is just who you are now.'], [100, 'Living proof', 'One hundred days. You ARE the proof.']];
  function levelOf(n) { var cur = LEVELS[0], next = null; LEVELS.forEach(function (l, i) { if (n >= l[0]) { cur = l; next = LEVELS[i + 1] || null; } }); return { cur: cur, next: next }; }''')

rep("  var STREAK_CHEERS = { 3: ['3-day streak!', 'Three days in a row of finding the good. Your RAS is catching on.'], 7: ['A whole week streak!', 'Seven days straight. This is what rewiring looks like.'], 14: ['Two-week streak!', 'Fourteen days of proof. The new groove is getting deeper.'], 21: ['21-day streak!', 'Three weeks. This is becoming who you are.'], 30: ['30-day streak!', 'A month of daily proof. Absolute legend.'] };",
    "  var STREAK_CHEERS = {}; LEVELS.slice(1).forEach(function (l) { STREAK_CHEERS[l[0]] = ['You’re a ' + l[1] + '!', l[2]]; });")

a=s.index("  var proofType = 'win';"); b=s.index("\n  var mo = null;", a)
NEW = r'''  var proofType = 'win', proofSel = {};
  function streakCal(st) {
    var days = {}; evidence().forEach(function (e) { if (e.win) { var a = evAt(e); if (a) days[dayKey(a)] = (days[dayKey(a)] || 0) + 1; } });
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var start = new Date(t0); start.setDate(start.getDate() - 13);
    var grid = h('div', { class: 'bt-sc', role: 'list', 'aria-label': 'Your last 14 days' });
    for (var i = 0; i < 14; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i); var k = dayKey(d.getTime()), n = days[k] || 0, today = i === 13;
      grid.appendChild(h('span', { class: 'bt-sc-d' + (n ? ' on' : '') + (today ? ' today' : ''), role: 'listitem', 'aria-label': d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }) + (n ? ': ' + n + ' piece' + (n === 1 ? '' : 's') + ' of proof' : today ? ': not yet' : ': none') }, [
        h('span', { class: 'bt-sc-w', 'aria-hidden': 'true', text: d.toLocaleDateString('en-AU', { weekday: 'narrow' }) }),
        h('span', { class: 'bt-sc-c', 'aria-hidden': 'true', text: n ? '✦' : today ? '+' : String(d.getDate()) })]));
    }
    var lv = levelOf(st.current), nx = lv.next;
    var pct = nx ? Math.round((st.current - lv.cur[0]) / (nx[0] - lv.cur[0]) * 100) : 100;
    return h('div', { class: 'bt-sc-wrap' }, [
      h('div', { class: 'bt-sc-top' }, [
        h('span', { class: 'bt-lv' }, [h('span', { 'aria-hidden': 'true', text: '✦' }), lv.cur[1]]),
        h('span', { class: 'bt-sc-n' }, [h('b', { text: String(st.current) }), ' day streak' + (st.best > st.current ? ' · best ' + st.best : '')])]),
      grid,
      nx ? h('div', { class: 'bt-lv-next' }, [h('div', { class: 'bt-lv-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': 'Progress to ' + nx[1] }, [h('span', { style: 'width:' + pct + '%' })]),
        h('span', { text: (nx[0] - st.current) + ' more day' + (nx[0] - st.current === 1 ? '' : 's') + ' in a row and you’re a ' + nx[1] + (st.today ? '' : '. Keep it alive today!') })]) : null
    ]);
  }
  function proofHome() {
    var box = h('section', { class: 'bt-proof', 'aria-labelledby': 'bt-proof-h' });
    var glints = h('span', { class: 'bt-glints', 'aria-hidden': 'true' });
    [0, 1, 2].forEach(function (i) { var x = h('span', { class: 'bt-glint g' + i }); x.innerHTML = STAR; glints.appendChild(x); });
    var inner = h('div', { class: 'bt-proof-in' });
    box.appendChild(inner); box.appendChild(glints);
    function draw() {
      inner.innerHTML = '';
      var ev = evidence(), wins = ev.filter(function (e) { return e.win; }), st = winStreak(), pd = pdData(), custom = pd.customProves || [];
      var jar = h('span', { class: 'bt-proof-jar' }); jar.innerHTML = JAR;
      inner.appendChild(h('div', { class: 'bt-proof-top' }, [jar, h('div', { class: 'bt-proof-tt' }, [
        h('span', { class: 'bt-wins-k', text: 'Train your brain to find the good' }),
        h('h2', { id: 'bt-proof-h', class: 'bt-wins-h', text: 'Add proof to your proof portfolio' })])]));
      inner.appendChild(h('p', { class: 'bt-wins-t', text: 'Your RAS decides what you notice. Retrain it: one win a day. Tiny counts.' }));
      inner.appendChild(streakCal(st));
      var chips = h('div', { class: 'bt-proof-chips', role: 'radiogroup', 'aria-label': 'What kind is it?' }, ['win', 'ach', 'joy', 'proof'].map(function (k) {
        return h('button', { class: 'bt-proof-chip' + (proofType === k ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': proofType === k ? 'true' : 'false', onclick: function () { proofType = k; draw(); var i = document.getElementById('bt-win-in'); if (i) i.focus(); } }, [h('span', { 'aria-hidden': 'true', text: SPARK[k][1] }), SPARK[k][0]]);
      }));
      inner.appendChild(chips);
      var ph = { win: 'Today I…', ach: 'I achieved…', joy: 'This made me smile…', proof: 'This happened…' }[proofType];
      var inp = h('input', { class: 'bt-in', id: 'bt-win-in', placeholder: ph, 'aria-label': SPARK[proofType][0] });
      var add = function () {
        var v = tx(inp.value); if (!v) return;
        var truths = proofType === 'proof' ? Object.keys(proofSel).filter(function (k) { return proofSel[k]; }) : [];
        if (proofType === 'proof' && !truths.length) { APP.toast('Tap what it’s proof of first.'); return; }
        var ab = autoBeliefs(v, proofType, truths);
        addEvidence(v, { spark: proofType, beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves });
        proofSel = {}; sparkleBurst(box);
        if (!cheerProof()) APP.toast(ab.beliefs.length ? 'Proof against ' + ab.beliefs.length + ' old belief' + (ab.beliefs.length === 1 ? '' : 's') + '. Look at you!' : 'Added to your proof portfolio. Look at you!');
        setTimeout(draw, 650);
      };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
      if (proofType === 'proof') {
        var truthsAll = TRUTHS.map(function (t) { return t[0]; }).concat(custom);
        var own = h('input', { class: 'bt-in sm', id: 'bt-own', placeholder: 'I am…', 'aria-label': 'Add your own' });
        var addOwn = function () { var v = tx(own.value); if (!v) return; var d = pdData(); d.customProves = (d.customProves || []).filter(function (x) { return x !== v; }).concat([v]); wr(PD, d); proofSel[v] = true; draw(); };
        own.addEventListener('keydown', function (e) { if (e.key === 'Enter') addOwn(); });
        inner.appendChild(h('div', { class: 'bt-truths' }, [h('span', { class: 'bt-truths-k', text: 'This is proof that…' }),
          h('div', { class: 'bt-truths-l' }, truthsAll.map(function (t) { return h('button', { class: 'bt-truth' + (proofSel[t] ? ' on' : ''), type: 'button', 'aria-pressed': proofSel[t] ? 'true' : 'false', text: t, onclick: function () { proofSel[t] = !proofSel[t]; draw(); } }); })),
          h('div', { class: 'bt-wins-row' }, [own, h('button', { class: 'bt-btn ghost', type: 'button', text: '+ Add', onclick: addOwn })])]));
      }
      inner.appendChild(h('div', { class: 'bt-wins-row' }, [inp, h('button', { class: 'bt-btn lime', type: 'button', text: 'Add proof', onclick: add })]));
      var mem = memoryWin();
      if (mem) {
        var a = evAt(mem.e), more = h('input', { class: 'bt-in', id: 'bt-mem-in', placeholder: 'Since then I’ve…', 'aria-label': 'Add more proof on top of this' });
        var stack = function () { var v = tx(more.value); if (!v) return; var ab = autoBeliefs(v + ' ' + mem.e.text, mem.e.spark || 'win', mem.e.proves || []); addEvidence(v, { builds: mem.e.id, spark: mem.e.spark || 'win', beliefs: ab.beliefs, belief: ab.beliefs[0] || null, proves: ab.proves }); memSeen(mem.e.id); sparkleBurst(box); if (!cheerProof()) APP.toast('Stacked. That’s more proof.'); setTimeout(draw, 650); };
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
        h('span', { class: 'bt-wins-s', text: wins.length + ' piece' + (wins.length === 1 ? '' : 's') + ' of proof' }),
        h('button', { class: 'bt-wins-link', type: 'button', text: 'Open my proof portfolio →', onclick: openProof })
      ]));
    }
    draw();
    return box;
  }'''
s=s[:a]+NEW+s[b:]

# book: same card as home instead of the simple win box
a=s.index("    // add a win\n"); b=s.index("    // tabs + search\n", a)
s=s[:a]+"    // add proof: the same card as on Home\n    wrap.appendChild(proofHome());\n"+s[b:]
# book entry label: what it proves
rep(": e.win ? (SPARK[e.spark] || SPARK.win)[0] + ' · in your proof portfolio' : 'Proof portfolio' });",
    ": e.win ? (SPARK[e.spark] || SPARK.win)[0] + ((e.proves || []).length ? ' · proof that ' + e.proves.slice(0, 3).join(', ') + (e.proves.length > 3 ? ' +' + (e.proves.length - 3) : '') : '') : 'Proof portfolio' });")
rep("var linkOpts", "var linkOpts") if "var linkOpts" in s else None
open(P,'w').write(s); print('ok')
