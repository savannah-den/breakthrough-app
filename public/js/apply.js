// The Breakthrough application (public page: /apply.html). One question screen at a time, saves as you go
// (in this browser), then sends everything to the "lead" function, which adds it to Sav's leads list and rates it.
// ?l=<lead id> fills in what we already know from the waitlist. ?want=group|community|1:1 pre-ticks an option.
(function () {
  'use strict';
  var KEY = 'bt-apply-v1', P = new URLSearchParams(location.search), LID = P.get('l') || '';
  var A = {}; try { A = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  A.interests = A.interests || [];
  var want = P.get('want'); if (want === 'group' && A.interests.indexOf('group') < 0) A.interests.push('group');
  if (want === 'community' && A.interests.indexOf('community') < 0) A.interests.push('community');
  if (want === '1:1' && A.interests.indexOf('1:1') < 0) A.interests.push('1:1');
  function keep() { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} }

  var WORTH = ['$1,000 - $2,000 USD', '$2,000 - $3,000 USD', '$3,000 - $4,000 USD', 'Priceless - I\'m ready to invest in becoming HER'];
  // field: [key, label, type, required, hint, placeholder]
  var STEPS = [
    { intro: true },
    { kick: 'First up', h: 'What are you keen on?', p: 'Tick as many as you like. Not sure yet? Tick them all and we’ll work it out together.',
      fields: [['interests', '', 'interests', true]] },
    { kick: 'The boring stuff 🥴', h: 'Let’s get the boring stuff out of the way first.', fields: [
      ['first_name', 'What’s your first name?', 'text', true, '', 'First name', 'given-name'], ['last_name', 'Last name?', 'text', true, '', 'Last name', 'family-name'],
      ['email', 'Email?', 'email', true, '', 'you@example.com', 'email'], ['phone', 'Phone number?', 'tel', true, 'With your country code, e.g. +61', '+61 4…', 'tel'],
      ['instagram', 'Instagram handle', 'text', false, 'Optional', '@yourhandle']] },
    { kick: 'Getting to know you', h: 'The questions in this form are very intentional.', p: 'They might seem a bit intrusive, but we’re divergent, we like to know each other in depth right? Surface level, not for us! 🤣 The more I get to know you, the easier it is to work out if the program is right for you. The last thing I want is your time being wasted. ❤️',
      fields: [['age', 'How many years of life have you lived?', 'text', true, 'aka your age lol 😂', ''], ['location', 'Where are you located?', 'text', true, 'City and country please', 'e.g. Brisbane, Australia', 'address-level2'],
        ['work', 'What do you do for a living?', 'textarea', true, 'Career, study, job, business etc', '']] },
    { kick: 'Your brain', h: 'A little about your beautiful brain', fields: [
      ['diagnosis', 'What is your specific diagnosis?', 'radio', true, '', '', '', ['ADHD', 'Autism', 'AuDHD', 'Going through diagnosis / self-identified']],
      ['otherDiagnosis', 'Any other additional diagnosis?', 'text', false, 'Optional', ''],
      ['pronouns', 'What are your pronouns?', 'radio', true, '', '', '', ['She/Her', 'They/Them', 'He/Him']]] },
    { kick: 'Your people ❤️', h: 'Who are the important people in your life?', fields: [
      ['kids', 'Do you have kids? If so, how many, their ages and names', 'text', false, 'ps. dogs definitely count… 🐶', ''],
      ['partner', 'Do you have a partner/spouse? Are they also neurodivergent?', 'text', true, '', ''],
      ['partnerWork', 'What do they do for a living?', 'text', false, 'Skip if no partner', '']] },
    { kick: 'Real talk', h: 'What are your biggest challenges right now?', fields: [['challenges', 'What’s impacting you the most in life?', 'textarea', true, '', 'Brain dump away. No wrong answers.']] },
    { kick: 'Real talk', h: 'What have you tried so far?', fields: [['tried', 'What have you tried to overcome your challenges?', 'textarea', false, 'Therapy, psychology, other programs, Instagram hacks, medication, etc.', '']] },
    { kick: '🪄 Magic wand time', h: 'If you could master one thing in this program, what would it be?', fields: [['wand', '', 'textarea', true, '', 'The one thing…']] },
    { kick: 'Future you', h: 'When you picture your ideal future self, how do they feel?', fields: [['future', '', 'textarea', true, '', 'Calm? Confident? Free?']] },
    { kick: 'Worth it?', h: 'What is becoming that person worth to you?', fields: [['worth', '', 'radio', true, '', '', '', WORTH]] },
    { kick: 'Last one!', h: 'How committed are you to changing?', p: 'What does it mean to you to be given a chance to change?', fields: [['commitment', '', 'textarea', true, '', '']] },
    { done: true }
  ];
  var INT = [['community', 'The community program', 'Self-paced lessons in the Breakthrough app + the online community. Early access when doors open.'],
    ['group', 'The intimate group program', 'Small group, live weekly coaching calls with me for 8 weeks, plus the app and community.'],
    ['1:1', '1:1 with Sav', 'Private coaching, built completely around you. Limited spots.']];

  var i = Math.min(+A._step || 0, STEPS.length - 2), card = document.getElementById('card');
  function el(tag, attrs, kids) {
    var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] == null) return; if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]); else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }); return n;
  }
  function opt(type, name, val, title, desc, on) {
    var inp = el('input', { type: type, name: name, value: val }); inp.checked = !!on;
    return el('label', { class: 'opt' + (type === 'radio' ? ' radio' : '') }, [inp, el('span', { class: 'box', 'aria-hidden': 'true' }), el('span', null, [el('b', { text: title }), desc ? el('span', { class: 'd', text: desc }) : null])]);
  }
  function field(f) {
    var k = f[0], label = f[1], t = f[2], req = f[3], hint = f[4], ph = f[5], ac = f[6], id = 'f-' + k;
    var lab = label ? el('label', { class: 'q', for: t === 'radio' || t === 'interests' ? null : id }, [label + (req ? '' : ''), hint ? el('small', { text: hint }) : null]) : (hint ? el('p', { class: 'note', text: hint }) : null);
    if (t === 'interests') return el('fieldset', { style: 'border:0;padding:0;margin:0' }, [el('legend', { class: 'q', text: 'I’m interested in…', style: 'padding:0' }), el('div', { class: 'opts' }, INT.map(function (x) { return opt('checkbox', 'interests', x[0], x[1], x[2], A.interests.indexOf(x[0]) >= 0); }))]);
    if (t === 'radio') return el('fieldset', { style: 'border:0;padding:0;margin:0' }, [label ? el('legend', { class: 'q', text: label, style: 'padding:0' }) : null, el('div', { class: 'opts' }, f[7].map(function (x) { return opt('radio', k, x, x, '', A[k] === x); }))]);
    var inp = t === 'textarea' ? el('textarea', { id: id, name: k, placeholder: ph || null, 'aria-label': label ? null : 'Your answer' }) : el('input', { id: id, name: k, type: t, placeholder: ph || null, autocomplete: ac || null });
    inp.value = A[k] || ''; return el('div', null, [lab, inp]);
  }
  function collect(s) {
    (s.fields || []).forEach(function (f) {
      var k = f[0];
      if (f[2] === 'interests') A.interests = [].slice.call(card.querySelectorAll('input[name=interests]:checked')).map(function (x) { return x.value; });
      else if (f[2] === 'radio') { var c = card.querySelector('input[name="' + k + '"]:checked'); A[k] = c ? c.value : ''; }
      else { var n = card.querySelector('[name="' + k + '"]'); if (n) A[k] = n.value.trim(); }
    }); keep();
  }
  function missing(s) {
    var bad = (s.fields || []).filter(function (f) { if (!f[3]) return false; var v = f[2] === 'interests' ? A.interests.length : A[f[0]]; return !v; })[0];
    if (bad) return bad[2] === 'interests' ? 'Tick at least one, or tick them all if you’re not sure.' : 'Just need an answer for “' + (bad[1] || 'this one') + '”.';
    if ((s.fields || []).some(function (f) { return f[0] === 'email'; }) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(A.email || '')) return 'That email doesn’t look quite right.';
    return '';
  }
  function draw() {
    var s = STEPS[i], qs = STEPS.length - 2; card.innerHTML = '';
    document.getElementById('bar').style.width = Math.round((s.done ? 1 : i / (qs + 1)) * 100) + '%';
    document.getElementById('stepn').textContent = s.intro || s.done ? '' : 'Question ' + i + ' of ' + qs + ' · saves as you go';
    if (s.intro) {
      card.appendChild(el('div', null, [el('p', { class: 'kick', text: 'Breakthrough application' }), el('h1', null, ['The 8 week ', el('em', { text: 'rewiring your AuDHD brain' }), ' application']),
        el('p', { text: 'You have nothing to lose and a whole new life to gain. If nothing changes, nothing changes. If you commit to wanting change, I’ll teach you how.' }),
        el('div', { class: 'perks' }, [el('div', null, [el('b', { text: '🔑 Early access. ' }), 'Doors open for you before everyone else.']), el('div', null, [el('b', { text: '🎟️ First pick of the spaces. ' }), 'The group is small on purpose. Applicants are offered spots first.']),
          el('div', null, [el('b', { text: '💌 A personal reply from me. ' }), 'I read every single one.']), el('div', null, [el('b', { text: '🧠 Built around you. ' }), 'Your answers shape what we cover.'])]),
        el('p', { class: 'note', text: 'You’re ADHD… you could procrastinate this easy 5-minute form for weeks, or you could do it now and get an instant dopamine hit. 😉 It saves as you go, so you can come back to it.' }),
        el('div', { class: 'nav' }, [el('span'), el('button', { type: 'submit', class: 'btn', text: 'I need change →' })])]));
    } else if (s.done) {
      try { localStorage.removeItem(KEY); } catch (e) {}
      card.appendChild(el('div', null, [el('div', { class: 'big-emoji', text: '🎉' }), el('h1', null, ['How freaking exciting, ', el('em', { text: (A.first_name || 'friend') + '!' })]),
        el('p', { text: 'Your application is in, and you’re on the early access list. Here’s what happens now.' }),
        el('div', { class: 'next' }, [el('h3', { text: '1. 💌 An email' }), el('p', { text: 'If group or 1:1 is right for you, I’ll personally email you an invitation for a call.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '2. 😊 A 60 minute zoom call with me' }), el('p', { text: 'I want to get to know you, what’s going on for you, and make sure the program is the best next step for you.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '3. 🔑 Early access' }), el('p', { text: 'When doors open, you’ll hear before anyone else.' })]),
        el('p', { text: 'I cannot wait to talk to you further. ❤️ Sav xx', style: 'margin-top:18px' }),
        el('h2', { text: 'In the meantime… 🦋', style: 'margin-top:26px' }), el('p', { text: 'Start changing your mindset around your beautiful brain right now with the mini course, or listen to the podcast where I talk about some of what you’ll learn.' }),
        el('div', { class: 'links' }, [el('a', { href: 'https://colourmeneurospicy.com.au/products/reprogram-your-adhd-brain', text: 'The mini course' }), el('a', { href: 'https://www.youtube.com/watch?v=pXgxX6_TqvE', text: 'YouTube' }),
          el('a', { href: 'https://open.spotify.com/episode/4CkFWSxnrXAkjWOYIsLTnl', text: 'Spotify' }), el('a', { href: 'https://podcasts.apple.com/au/podcast/late-diagnosed-autism-and-adhd-unmasking-your-true/id1527116818?i=1000764174368', text: 'Apple Podcasts' })])]));
    } else {
      var kids = [el('p', { class: 'kick', text: s.kick }), el('h2', { text: s.h }), s.p ? el('p', { text: s.p }) : null].concat(s.fields.map(field));
      kids.push(el('input', { class: 'hp', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }));
      kids.push(el('p', { class: 'err', id: 'err', role: 'alert' }));
      var last = i === STEPS.length - 2;
      kids.push(el('div', { class: 'nav' }, [el('button', { type: 'button', class: 'btn ghost', text: '← Back', onclick: function () { collect(s); i--; A._step = i; keep(); draw(); } }),
        el('button', { type: 'submit', class: 'btn', text: last ? 'Submit my application 🚀' : 'Next →' })]));
      card.appendChild(el('div', null, kids));
      var first = card.querySelector('input:not(.hp),textarea'); if (first && i > 1) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    }
    window.scrollTo(0, 0);
  }
  card.addEventListener('submit', function (e) {
    e.preventDefault(); var s = STEPS[i];
    if (s.intro) { i = 1; A._step = i; keep(); draw(); return; }
    collect(s); var m = missing(s), err = document.getElementById('err');
    if (m) { err.textContent = m; return; }
    if (i < STEPS.length - 2) { i++; A._step = i; keep(); draw(); return; }
    var btn = card.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
    var hp = card.querySelector('.hp');
    var answers = {}; ['age', 'location', 'work', 'diagnosis', 'otherDiagnosis', 'pronouns', 'kids', 'partner', 'partnerWork', 'challenges', 'tried', 'wand', 'future', 'worth', 'commitment', 'instagram'].forEach(function (k) { answers[k] = A[k] || ''; });
    var country = String(A.location || '').split(',').pop().trim();
    fetch('/.netlify/functions/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'apply', id: LID || A._id || null, first_name: A.first_name, last_name: A.last_name, email: A.email, phone: A.phone, country: A.country || country, interests: A.interests, answers: answers, website: hp ? hp.value : '' }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Couldn’t send'); }); })
      .then(function () { i = STEPS.length - 1; draw(); })
      .catch(function (x) { btn.disabled = false; btn.textContent = 'Try again 🚀'; err.textContent = (x && x.message) || 'That didn’t send. Check your internet and try again. Your answers are saved.'; });
  });
  // fill in what we know from the waitlist
  if (LID) fetch('/.netlify/functions/lead?l=' + encodeURIComponent(LID)).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    var l = j && j.lead; if (!l) return;
    ['first_name', 'last_name', 'email', 'phone', 'country'].forEach(function (k) { if (!A[k] && l[k]) A[k] = l[k]; });
    if (!A.location && l.country) A.location = l.country;
    (l.interests || []).forEach(function (x) { if (A.interests.indexOf(x) < 0) A.interests.push(x); }); A._id = l.id; keep(); if (i > 0) draw();
  }).catch(function () {});
  draw();
})();
