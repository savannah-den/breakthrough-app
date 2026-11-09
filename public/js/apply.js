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

  var WORTH = ['$1,000 - $2,000 AUD', '$2,000 - $3,000 AUD', '$3,000 - $4,000 AUD', 'Priceless: I\'m ready to invest whatever it takes to become them'];
  // show the ranges in their own currency (guessed from their time zone), stored in AUD
  var FX = { AUD: 1, NZD: 1.09, USD: 0.66, CAD: 0.91, GBP: 0.5, EUR: 0.58, SEK: 6.6, NOK: 6.9, DKK: 4.3, CHF: 0.53, SGD: 0.86, ZAR: 11.8, INR: 55, JPY: 98 };
  var CUR = (function () { var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var M = { 'Pacific/Auckland': 'NZD', 'Europe/London': 'GBP', 'Europe/Stockholm': 'SEK', 'Europe/Oslo': 'NOK', 'Europe/Copenhagen': 'DKK', 'Europe/Zurich': 'CHF', 'Asia/Singapore': 'SGD', 'Africa/Johannesburg': 'ZAR', 'Asia/Kolkata': 'INR', 'Asia/Tokyo': 'JPY' };
    if (M[tz]) return M[tz]; if (/^Australia\//.test(tz)) return 'AUD'; if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal)/.test(tz)) return 'CAD';
    if (/^America\//.test(tz) || /^US\//.test(tz)) return 'USD'; if (/^Europe\//.test(tz)) return 'EUR'; return 'AUD'; })();
  var TZCUR = CUR;
  function curNow() { var c = ''; try { if (window.BW_CCY) c = BW_CCY.fromCountry(A.country || A.location || ''); } catch (e) {} CUR = (c && FX[c] !== undefined) ? c : (c || TZCUR); if (FX[CUR] === undefined) CUR = TZCUR; return CUR; }
  try { if (window.BW_CCY) BW_CCY.rates(function (r) { if (r) for (var k in r) FX[k] = r[k]; }); } catch (e) {}
  function money(n) { var v = n * (FX[CUR] || 1); if (CUR !== 'AUD') v = Math.round(v / 10) * 10; try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: CUR, maximumFractionDigits: 0 }).format(v); } catch (e) { return CUR + ' ' + Math.round(v); } }
  function curName(c) { var n = ''; try { n = new Intl.DisplayNames(['en'], { type: 'currency' }).of(c); } catch (e) {} return (n && n !== c ? n + ' (' + c + ')' : c); }
  function worthLabel(i) { curNow(); if (i === 3) return 'Priceless: I’m ready to invest whatever it takes to become them';
    var a = [1000, 2000, 3000][i], b = a + 1000;
    return CUR === 'AUD' ? '$' + a.toLocaleString('en-AU') + ' – $' + b.toLocaleString('en-AU') + ' AUD' : money(a) + ' – ' + money(b) + ' ' + CUR + '  (A$' + (a / 1000) + '–' + (b / 1000) + 'K)'; }
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
    { kick: 'Worth it?', h: 'What is becoming that person worth to you?', p: function () { return 'Currency in ' + curName(curNow()); }, fields: [['worth', '', 'radio', true, '', '', '', WORTH]] },
    { kick: 'Last one!', h: 'What does it mean to you to be given a chance to change?', p: 'Sav gets a lot of applications, so if you want to be seriously considered, here is where you tell her how badly you want this.',
      small: 'She reads all the applications and hand picks the people she knows she can create the biggest transformations for. That requires a level of commitment to changing from your end that she can’t create for you. You need to want it for her to be able to support you getting it.',
      fields: [['commitment', '', 'textarea', true, '', 'Tell her how badly you want this…']] },
    { done: true }
  ];
  var BALL = '<svg class="ball" viewBox="-24 -28 48 52" aria-hidden="true"><g class="bob"><path d="M-17 20 C-19 -2 -11 -15 0 -15 C11 -15 19 -2 17 20 Z" fill="#F4C2F7" stroke="#1F1412" stroke-width="2.6"/><circle cx="-5.5" cy="0" r="2" fill="#1F1412"/><circle cx="5.5" cy="0" r="2" fill="#1F1412"/><path d="M-5 6 q5 4.5 10 0" fill="none" stroke="#1F1412" stroke-width="1.8" stroke-linecap="round"/><circle cx="-10" cy="5" r="2.6" fill="#E8338A" opacity=".5"/><circle cx="10" cy="5" r="2.6" fill="#E8338A" opacity=".5"/></g></svg>';
  var SP = function (x, y, r, c, k) { return '<path class="tw ' + (k || '') + '" d="M' + x + ' ' + (y - r) + 'C' + (x + r * .15) + ' ' + (y - r * .3) + ' ' + (x + r * .3) + ' ' + (y - r * .15) + ' ' + (x + r) + ' ' + y + 'C' + (x + r * .3) + ' ' + (y + r * .15) + ' ' + (x + r * .15) + ' ' + (y + r * .3) + ' ' + x + ' ' + (y + r) + 'C' + (x - r * .15) + ' ' + (y + r * .3) + ' ' + (x - r * .3) + ' ' + (y + r * .15) + ' ' + (x - r) + ' ' + y + 'C' + (x - r * .3) + ' ' + (y - r * .15) + ' ' + (x - r * .15) + ' ' + (y - r * .3) + ' ' + x + ' ' + (y - r) + 'Z" fill="' + (c || '#F1F9A6') + '" stroke="#1F1412" stroke-width="1.8"/>'; };
  var BLOB = function (x, y, c, s, extra) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><path d="M-17 20 C-19 -2 -11 -15 0 -15 C11 -15 19 -2 17 20 Z" fill="' + c + '" stroke="#1F1412" stroke-width="2.6"/><circle cx="-5.5" cy="0" r="2" fill="#1F1412"/><circle cx="5.5" cy="0" r="2" fill="#1F1412"/><path d="M-5 6 q5 4.5 10 0" fill="none" stroke="#1F1412" stroke-width="1.8" stroke-linecap="round"/>' + (extra || '') + '</g>'; };
  var HEART = function (x, y, s, c) { return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 -3 C-2 -7 -8 -6 -8 -1 C-8 3 -3 6 0 9 C3 6 8 3 8 -1 C8 -6 2 -7 0 -3 Z" fill="' + (c || '#E8338A') + '" stroke="#1F1412" stroke-width="' + (1.6 / s) + '"/>'; };
  var ART = [
    /* hello */ '<svg viewBox="0 0 200 120"><g class="bob">' + BLOB(100, 72, '#F4C2F7', 2.1, '<path class="wave" d="M15 2 l12 -14" stroke="#1F1412" stroke-width="2.6" stroke-linecap="round"/>') + '</g>' + SP(40, 30, 9) + SP(162, 24, 7, '#F4C2F7', 'b') + SP(170, 78, 6, '#F1F9A6', 'c') + '</svg>',
    /* pick */ '<svg viewBox="0 0 220 120"><g class="bob">' + HEART(50, 70, 2.4, '#F4C2F7') + HEART(110, 60, 3.2, '#E8338A') + HEART(170, 70, 2.4, '#F1F9A6') + '</g>' + SP(80, 22, 7) + SP(150, 20, 6, '#F4C2F7', 'b') + '</svg>',
    /* boring */ '<svg viewBox="0 0 200 120"><g class="bob"><rect x="62" y="16" width="76" height="98" rx="10" fill="#FFF" class="f"/><rect x="82" y="8" width="36" height="16" rx="5" fill="#F1F9A6" class="f"/><path class="s" d="M76 46 h48 M76 64 h48 M76 82 h30"/><path d="M146 30 l18 -18 l8 8 l-18 18 z" fill="#E8338A" class="f"/></g>' + SP(40, 40, 8) + '</svg>',
    /* know */ '<svg viewBox="0 0 200 120"><g class="bob">' + HEART(92, 64, 3.6, '#E8338A') + '<circle cx="108" cy="56" r="30" fill="#FFF" fill-opacity=".55" class="f"/><path class="s" d="M130 78 l22 22" stroke-width="6"/></g>' + SP(46, 30, 8, '#F4C2F7') + SP(164, 36, 6, '#F1F9A6', 'b') + '</svg>',
    /* brain */ '<svg viewBox="0 0 200 120"><g class="bob"><path d="M64 70 C52 52 66 28 86 34 C92 18 120 18 124 34 C146 30 156 56 140 70 C150 88 128 104 112 94 C104 106 82 106 78 92 C58 96 52 80 64 70Z" fill="#F4C2F7" class="f"/><path class="s" d="M100 30 v64 M84 50 c8 4 8 12 0 16 M118 50 c-8 4 -8 12 0 16"/></g>' + SP(40, 34, 8) + SP(166, 30, 7, '#F1F9A6', 'b') + SP(170, 88, 5, '#F4C2F7', 'c') + '</svg>',
    /* people */ '<svg viewBox="0 0 220 120"><g class="bob">' + BLOB(60, 72, '#BFD7F2', 1.6) + BLOB(112, 66, '#F4C2F7', 1.9) + BLOB(162, 76, '#F1F9A6', 1.4) + '<g transform="translate(196 96)"><ellipse rx="14" ry="9" fill="#E8B07A" class="f"/><circle cx="12" cy="-8" r="7" fill="#E8B07A" class="f"/><circle cx="14" cy="-9" r="1.4" fill="#1F1412"/></g></g>' + HEART(112, 18, 1.6) + '</svg>',
    /* storm */ '<svg viewBox="0 0 200 120"><g class="bob"><path d="M58 70 c-18 0 -18 -26 0 -26 c2 -20 30 -24 38 -8 c14 -14 40 -4 36 14 c16 0 16 20 0 20 z" fill="#D9C8F5" class="f"/><path d="M96 74 l-10 18 h12 l-8 18" fill="none" stroke="#E8338A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><path class="s tw" d="M70 92 v8 M120 90 v10 M140 94 v8" stroke="#4C7FD1"/>' + SP(160, 26, 7, '#F1F9A6', 'b') + '</svg>',
    /* tools */ '<svg viewBox="0 0 200 120"><g class="bob"><rect x="52" y="54" width="96" height="52" rx="8" fill="#B5281E" class="f"/><path class="s" d="M78 54 v-14 h44 v14"/><rect x="52" y="70" width="96" height="10" fill="#4E0C08" class="f"/><path d="M150 30 l-30 30" stroke="#9A8A87" stroke-width="8" stroke-linecap="round"/><circle cx="152" cy="28" r="9" fill="none" stroke="#1F1412" stroke-width="3"/></g>' + SP(40, 34, 8) + '</svg>',
    /* wand */ '<svg viewBox="0 0 200 120"><g class="bob"><path d="M60 100 L126 40" stroke="#1F1412" stroke-width="10" stroke-linecap="round"/><path d="M60 100 L126 40" stroke="#4E0C08" stroke-width="6" stroke-linecap="round"/><path d="M112 52 L126 40" stroke="#F1F9A6" stroke-width="6" stroke-linecap="round"/></g>' + SP(140, 28, 14) + SP(166, 56, 8, '#F4C2F7', 'b') + SP(112, 18, 7, '#E8338A', 'c') + SP(48, 50, 6, '#F1F9A6', 'b') + '</svg>',
    /* future */ '<svg viewBox="0 0 200 120"><circle cx="100" cy="62" r="50" fill="#F1F9A6" opacity=".55"/><g class="bob">' + BLOB(100, 74, '#F4C2F7', 1.9, '<path d="M-12 -16 l4 -10 l8 7 l8 -7 l4 10 z" fill="#F1F9A6" stroke="#1F1412" stroke-width="1.6" stroke-linejoin="round"/>') + '</g>' + SP(46, 30, 8) + SP(158, 30, 9, '#F4C2F7', 'b') + SP(164, 92, 6, '#F1F9A6', 'c') + '</svg>',
    /* worth */ '<svg viewBox="0 0 200 120"><g class="bob"><path d="M100 18 l34 30 l-34 56 l-34 -56 z" fill="#BFD7F2" class="f"/><path class="s" d="M66 48 h68 M100 18 l-12 30 l12 56 l12 -56 z"/></g>' + SP(48, 36, 9) + SP(156, 30, 8, '#F4C2F7', 'b') + SP(150, 92, 6, '#F1F9A6', 'c') + '</svg>',
    /* rocket */ '<svg viewBox="0 0 200 120"><g class="bob"><path d="M100 10 C124 30 128 66 116 92 H84 C72 66 76 30 100 10Z" fill="#FFF" class="f"/><circle cx="100" cy="48" r="10" fill="#BFD7F2" class="f"/><path d="M84 76 l-16 18 l18 -2 z M116 76 l16 18 l-18 -2 z" fill="#E8338A" class="f"/><path d="M90 94 l10 20 l10 -20" fill="#F28C3B" class="f"/></g>' + SP(48, 40, 8) + SP(154, 28, 7, '#F4C2F7', 'b') + '</svg>',
    /* done */ '<svg viewBox="0 0 220 120"><g class="bob">' + BLOB(110, 70, '#F4C2F7', 2.1, '<path class="wave" d="M15 2 l12 -14" stroke="#1F1412" stroke-width="2.6" stroke-linecap="round"/><path d="M-15 2 l-12 -14" stroke="#1F1412" stroke-width="2.6" stroke-linecap="round"/>') + '</g>' + SP(46, 30, 10) + SP(176, 26, 9, '#F4C2F7', 'b') + SP(184, 86, 7, '#E8338A', 'c') + SP(36, 86, 6, '#BFD7F2', 'b') + '</svg>'];
  var SAY = ['Hey! I’m Sav. Grab a cuppa, this takes about 5 minutes.', 'Not sure yet? Tick them all and we’ll work it out together.', 'Boring bit first, I promise it gets juicier.', 'We’re divergent. Surface level? Not for us! 🤣',
    'However your brain is wired, it’s welcome here.', 'Dogs definitely count. 🐶', 'Brain dump away. No wrong answers.', 'No judgement. Every attempt taught you something.', 'Dream big. This is your wish.',
    'Close your eyes for a sec and picture them.', 'Be honest. There’s no wrong answer here either.', 'Last one! You’re nearly there. 🎉', ''];
  function artEl(n) { var d = el('div', { class: 'art', 'aria-hidden': 'true' }); d.innerHTML = ART[n] || ''; return d; }
  function sayEl(n) { if (!SAY[n]) return null; var d = el('div', { class: 'say' }); d.innerHTML = BALL; d.appendChild(el('span', { class: 'bub', text: SAY[n] })); return d; }
  function confetti() { var c = el('div', { class: 'confetti', 'aria-hidden': 'true' }); var cols = ['#F1F9A6', '#F4C2F7', '#E8338A', '#BFD7F2', '#F28C3B']; for (var k = 0; k < 60; k++) { var x = el('i'); x.style.left = Math.random() * 100 + '%'; x.style.background = cols[k % cols.length]; x.style.animationDelay = (Math.random() * 1.2) + 's'; c.appendChild(x); } document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500); }
  var ICO = { community: '💬', group: '👯', '1:1': '💗', ADHD: '⚡', Autism: '🧩', AuDHD: '🌈' };
  var INT = [['community', 'The community program', 'Self-paced lessons in the Breakthrough app + the online community. Early access when doors open.'],
    ['group', 'The intimate group program', 'Small group, live weekly coaching calls with me for 8 weeks, plus the app and community.'],
    ['1:1', '1:1 with Sav', 'Private coaching, built completely around you. Limited spots.']];

  var i = Math.min(+A._step || 0, STEPS.length - 2), card = document.getElementById('card');
  function el(tag, attrs, kids) {
    var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] == null) return; if (k === 'text') n.textContent = attrs[k]; else if (k === 'html') n.innerHTML = attrs[k]; else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]); else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }); return n;
  }
  function opt(type, name, val, title, desc, on) {
    var inp = el('input', { type: type, name: name, value: val }); inp.checked = !!on;
    return el('label', { class: 'opt' + (type === 'radio' ? ' radio' : '') }, [inp, el('span', { class: 'box', 'aria-hidden': 'true' }), ICO[val] ? el('span', { class: 'ico', 'aria-hidden': 'true', text: ICO[val] }) : null, el('span', null, [el('b', { text: title }), desc ? el('span', { class: 'd', text: desc }) : null])]);
  }
  function field(f) {
    var k = f[0], label = f[1], t = f[2], req = f[3], hint = f[4], ph = f[5], ac = f[6], id = 'f-' + k;
    var lab = label ? el('label', { class: 'q', for: t === 'radio' || t === 'interests' ? null : id }, [label + (req ? '' : ''), hint ? el('small', { text: hint }) : null]) : (hint ? el('p', { class: 'note', text: hint }) : null);
    if (t === 'interests') return el('fieldset', { style: 'border:0;padding:0;margin:0' }, [el('legend', { class: 'q', text: 'I’m interested in…', style: 'padding:0' }), el('div', { class: 'opts' }, INT.map(function (x) { return opt('checkbox', 'interests', x[0], x[1], x[2], A.interests.indexOf(x[0]) >= 0); }))]);
    if (t === 'radio') return el('fieldset', { style: 'border:0;padding:0;margin:0' }, [label ? el('legend', { class: 'q', text: label, style: 'padding:0' }) : null, el('div', { class: 'opts' }, f[7].map(function (x, n) { return opt('radio', k, x, k === 'worth' ? worthLabel(n) : x, '', A[k] === x); }))]);
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
    var pc = Math.round((s.done ? 1 : i / (qs + 1)) * 100); document.getElementById('bar').style.width = pc + '%'; var rn = document.getElementById('runner'); if (rn) rn.style.left = 'calc(' + pc + '% + ' + (pc < 4 ? 14 : pc > 96 ? -14 : 0) + 'px)';
    document.getElementById('stepn').textContent = s.intro || s.done ? '' : 'Question ' + i + ' of ' + qs + ' · saves as you go';
    if (s.intro) {
      var spots = el('div', { class: 'spots', 'aria-hidden': 'true' }); for (var k = 0; k < 15; k++) spots.appendChild(el('i'));
      card.appendChild(el('div', { class: 'sheet' }, [artEl(0), sayEl(0), el('p', { class: 'kick', text: 'Rewiring your neurospicy brain 🧠' }), el('h1', null, ['The 8 week ', el('em', { text: 'neurodivergent breakthrough' }), ' application']),
        el('p', { text: 'The program runs for 8 weeks, with a maximum of 15 people in each group. You have nothing to lose and a whole new life to gain.' }),
        el('p', { class: 'kick', text: '➔ Only 15 spaces, and one of them could be YOURS' }), spots,
        el('div', { class: 'perks' }, [el('div', null, [el('b', { text: '🔑 Early access. ' }), 'Doors open for you before everyone else.']), el('div', null, [el('b', { text: '🎟️ First pick of the spaces. ' }), 'Applicants are offered spots first.']),
          el('div', null, [el('b', { text: '💌 A personal reply from me. ' }), 'I read every single one.']), el('div', null, [el('b', { text: '🧠 Built around you. ' }), 'Your answers shape what we cover.'])]),
        el('p', { text: 'If nothing changes, nothing changes. If you commit to wanting change, I’ll teach you how.' }),
        el('p', { class: 'note', text: 'Also, you’re ADHD… you could procrastinate this easy 5-minute form for weeks, or you could do it now and get an instant dopamine hit. 😉 It saves as you go, so you can come back to it.' }),
        el('p', { class: 'kick', text: 'How bad do you want to change? 👇' }),
        el('div', { class: 'nav' }, [el('span'), el('button', { type: 'submit', class: 'btn', text: 'I need change →' })])]));
    } else if (s.done) {
      try { localStorage.removeItem(KEY); } catch (e) {}
      confetti();
      var YT = 'https://www.youtube.com/watch?v=pXgxX6_TqvE', SPOT = 'https://open.spotify.com/episode/4CkFWSxnrXAkjWOYIsLTnl', APPLE = 'https://podcasts.apple.com/au/podcast/late-diagnosed-autism-and-adhd-unmasking-your-true/id1527116818?i=1000764174368';
      var pod = el('div', { class: 'pod' }, [
        el('div', { class: 'pod-yt' }, [el('iframe', { src: 'https://www.youtube-nocookie.com/embed/pXgxX6_TqvE?rel=0', title: 'The podcast episode on YouTube', allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share', allowfullscreen: '', loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin' })]),
        el('a', { class: 'pod-b yt', href: YT, target: '_blank', rel: 'noopener', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect y="4" width="24" height="16" rx="5" fill="#FF0000"/><path d="M10 8.5v7l6-3.5z" fill="#fff"/></svg><span>Watch on YouTube</span>' }),
        el('div', { class: 'pod-btns' }, [
          el('a', { class: 'pod-b spot', href: SPOT, target: '_blank', rel: 'noopener', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path d="M6.5 9.2c3.8-1.1 8-.8 11.2 1M7.2 12.3c3.1-.9 6.6-.6 9.3.9M7.9 15.2c2.5-.6 5.1-.4 7.3.8" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg><span>Listen on Spotify</span>' }),
          el('a', { class: 'pod-b apple', href: APPLE, target: '_blank', rel: 'noopener', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#9933CC"/><circle cx="12" cy="10" r="2.4" fill="#fff"/><path d="M10.6 14h2.8l-.5 6h-1.8z" fill="#fff"/><path d="M7.6 15.2a6 6 0 1 1 8.8 0M9.3 13.4a3.5 3.5 0 1 1 5.4 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg><span>Listen on Apple Podcasts</span>' })])]);
      card.appendChild(el('div', { class: 'sheet done' }, [el('img', { class: 'dance', src: 'img/sav-dance.jpg', alt: 'Sav in a red blazer, arms up, dancing and celebrating' }), el('h1', null, ['HOW FREAKING EXCITING, ', el('em', { text: (A.first_name || 'friend') + '!' })]),
        el('p', { text: 'Thanks so much. Your application is in, and you’re on the early access list.' }),
        el('p', { class: 'note', text: 'Applying doesn’t lock you in to a spot, it just shows me you’re seriously considering it.' }),
        el('h2', { text: 'What happens now?', style: 'margin-top:22px' }),
        el('div', { class: 'next' }, [el('h3', { text: '1. 💌 A personal invitation from me, if you’re successful' }), el('p', { text: 'I read every single one. If I believe the program is right for you, I’ll personally email you an invitation for a call closer to the doors opening.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '2. 😊 A 60 minute 1:1 Zoom call with me' }), el('p', { text: 'I want to get to know you, what’s going on for you, and make sure the program is the best next step for you to become the next level version of yourself.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '3. 🔑 Early access' }), el('p', { text: 'When doors open, you’ll hear before anyone else.' })]),
        el('p', { text: 'I cannot wait to talk to you further. ❤️ Sav xx', style: 'margin-top:18px' }),
        el('h2', { text: 'In the meantime… 🦋', style: 'margin-top:26px' }),
        el('div', { class: 'next' }, [el('h3', { text: '📱 Get a head start with Self-paced' }), el('p', { text: 'You could wait for the program, or you could get a head start with the self-paced version of the program. If you decide to come on board for the community, group or 1:1 version, Sav will make sure the price of the self-paced course is discounted for you.' }),
          el('p', { class: 'soon', text: '⏳ Coming soon: you’re on the waitlist, so you’ll get notified when it’s live.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '🦋 Or try the mini courses' }), el('p', { text: 'Set yourself up for success and Money mindset: both are included inside the program.' }),
          el('p', { class: 'soon', text: '⏳ Coming soon: you’re on the waitlist, so you’ll get notified when they’re live.' })]),
        el('div', { class: 'next' }, [el('h3', { text: '💛 Or start with Love your ADHD' }), el('p', { text: 'My course for learning to understand, accept and actually love the way your brain works. You can start it today.' }),
          el('div', { class: 'links' }, [el('a', { href: 'https://colourmeneurospicy.com.au/products/love-your-adhd', target: '_blank', rel: 'noopener', text: 'Love your ADHD →' })])]),
        el('div', { class: 'next' }, [el('h3', { text: '🎧 Or listen to the FREE podcast' }), el('p', { text: 'Where I talk about some of what you’ll learn inside the program.' }), pod])]));
    } else {
      var kids = [artEl(i), sayEl(i), el('p', { class: 'kick', text: s.kick }), el('h2', { text: s.h }), s.p ? el('p', { text: typeof s.p === 'function' ? s.p() : s.p }) : null, s.small ? el('p', { class: 'note small', text: s.small }) : null].concat(s.fields.map(field));
      kids.push(el('input', { class: 'hp', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }));
      kids.push(el('p', { class: 'err', id: 'err', role: 'alert' }));
      var last = i === STEPS.length - 2;
      if (last) kids.push(el('p', { class: 'joke', style: 'margin-top:16px', text: '🔽 IMPORTANT 🔽 You’re most likely ADHD, so I can’t have you getting distracted before hitting submit 🤣 SO PLEASE HIT SUBMIT. 😳' }));
      kids.push(el('div', { class: 'nav' }, [el('button', { type: 'button', class: 'btn ghost', text: '← Back', onclick: function () { collect(s); i--; A._step = i; keep(); draw(); } }),
        el('button', { type: 'submit', class: 'btn', text: last ? 'Submit my application 🚀' : 'Next →' })]));
      card.appendChild(el('div', { class: 'sheet' }, kids));
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
    if (window.BT_APPLY_PREVIEW) { setTimeout(function () { i = STEPS.length - 1; draw(); }, 500); return; }
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
