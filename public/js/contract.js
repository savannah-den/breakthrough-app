/* Breakthrough + 1:1 Coaching Agreement.
   Sav sets the package in the coach dashboard (terms). The client reads it in the app, fills in her
   details, picks her marketing consent and taps "I agree & sign". The signed copy (her details + the
   exact terms at the time) is saved to her account. Wording is from Sav's agreement PDF. */
(function () {
  'use strict';
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v == null || v === false) return; if (k === 'text') e.textContent = v; else if (k === 'class') e.className = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); });
    [].concat(kids || []).forEach(function (c) { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function money(n) { n = Number(n) || 0; return '$' + n.toLocaleString('en-AU', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' AUD'; }
  function fmtDate(d) { if (!d) return ''; var x = new Date(String(d).length === 10 ? d + 'T00:00:00' : d); return isNaN(x) ? String(d) : x.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }); }

  var COMPANY = 'SDI Interior Design Studio PTY LTD trading as Colour Me Neurospicy / Savannah Barber';
  var PLANS = {
    full: { label: 'Pay in full', line: 'Pay in full: $4,900 AUD', desc: 'One payment. Total: $4,900 AUD.', total: 4900 },
    in4: { label: 'Pay in 4', line: 'Pay in 4: $1,275 AUD per payment', desc: '4 fortnightly payments over 2 months. Total: $5,100 AUD.', total: 5100 },
    weekly: { label: 'Weekly', line: 'Weekly: $450 AUD per week', desc: '12 weekly payments over 12 weeks. Total: $5,400 AUD.', total: 5400 },
    bespoke: { label: 'Bespoke', line: 'Bespoke payment plan', desc: '', total: 0 }
  };
  var PROGRAMS = ['Breakthrough', 'ECT'];
  var INCL = [
    ['privateChat', '1:1 private chat', 'Private chat access'],
    ['groupChats', 'Group coaching chats', 'Group coaching chats'],
    ['modules', 'Breakthrough program modules', 'Breakthrough program modules'],
    ['library', 'Resource library (valued at $333 AUD)', 'Resource library (valued at $333 AUD)']
  ];
  function defaults(start) {
    return { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: start || new Date().toISOString().slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' },
      inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, bespoke: { per: '', freq: '', count: '', notes: '' }, coach: 'Savannah Barber' };
  }
  function planLines(t) {
    var p = PLANS[t.plan] || PLANS.in4;
    if (t.plan === 'bespoke') {
      var b = t.bespoke || {}, bits = [];
      if (b.per) bits.push(money(b.per) + (b.freq ? ' per ' + b.freq : ' per payment'));
      if (b.count) bits.push(b.count + ' payment' + (b.count == 1 ? '' : 's'));
      return { line: 'Bespoke: ' + (bits.join(', ') || 'as agreed'), desc: (b.notes ? b.notes + ' ' : '') + 'Total: ' + money(t.amount) + '.' };
    }
    var desc = p.desc; if (Number(t.amount) && Number(t.amount) !== p.total) desc += ' Investment as agreed: ' + money(t.amount) + '.';
    return { line: p.line, desc: desc };
  }
  function programName(t) { var ps = (t.programs || []).filter(Boolean); return ps.length ? ps.join(' + ') : 'Breakthrough'; }

  var NOTES = [
    'Your intent to change and desire for change will be serious.',
    'You recognise you are solely responsible for the results you achieve.',
    'You will make every effort to ensure You are at your peak mental, physical and emotional state for each Session.',
    'You are ready to work and receive feedback. You are willing to try new ways of learning, be honest and open, keep to your commitments and inform your coach immediately when things are not working for you.',
    'You are willing to explore, challenge and change thoughts, feelings and actions that you recognise as self-defeating.',
    'You understand your coach will be focused on you and your best interests as a whole, not just your goals.',
    'You are willing to wholeheartedly act on new concepts or different ways of doing/approaching things.',
    'You recognise the value and worth of yourself and the investment you are making in your personal development.',
    'You understand the need to plan the relationship ending in advance to allow for a degree of closure and wrap-up.'
  ];
  var CLAUSES = [
    ['3. The Company’s Commitment', [
      '3.1 The Company will provide 1 hour group and/or individual coaching Sessions through the Coaching Team.',
      '3.2 The Company will provide coaching that is a professional client relationship designed to facilitate the creation and development of personal, professional or business goals and to develop and carry out a strategy/plan for moving towards those goals.',
      '3.3 E-mails and Signal messenger chats are welcome between sessions if you would like to share a success, have urgent questions or an issue.']],
    ['4. Your Commitment', [
      '4.1 You agree to pay the Company the Fees as set out in this Agreement and as per the invoice.',
      '4.2 You agree to call or meet the Coaching Team at the specified times.',
      '4.3 You agree to be honest and open, to believe in yourself and to adopt an enthusiastic and positive outlook on life from this moment onwards. You are truly committed to change and agree to take responsibility for your life, choices and actions.']],
    ['5. Coaching', [
      '5.1 You enter into this Agreement with the full understanding that You are solely responsible for creating your own results. You understand that achieving your goals (in whole or part) cannot be guaranteed and no warranties are given.',
      '5.2 You are aware that coaching is different to counseling, psychotherapy, psychoanalysis or any other form of mental health care treatment or therapy, nor is it to be used as a substitute for professional advice by legal, medical, financial, business or other qualified professionals.',
      '5.3 If appropriate, You will seek independent professional guidance in the areas indicated in 5.2 and You understand that all decisions and actions in these areas are Your sole responsibility.']],
    ['6. Your Agenda', [
      '6.1 The Session agenda belongs to You. If the Session is not heading in the direction you would like, if the Coaching Team ever says anything you don’t feel comfortable with or if You have a concern with the way the Sessions are proceeding You will let the Coaching Team know immediately.']],
    ['7. Ethics and Confidentiality', [
      '7.1 Any notes the Coaching Team makes during the Session or about You are kept confidential.',
      '7.2 The Coaching Team will not use or disclose the information You share with them during Your Sessions, except as authorised by You or as required by law.',
      '7.3 You understand that on occasion the Company may anonymously share generalised information for training or consultation purposes with other Coaching professionals. Your identity and any information that could lead to Your identification will remain entirely confidential.']],
    ['8. Admin', [
      '8.1 The Session may be refused if payment has not been made as required by this Agreement.',
      '8.2 Where it is necessary for either You or the Coaching Team to reschedule a Session this will be confirmed at least 12 hours before the scheduled Session.',
      '8.3 You will forfeit missed Sessions which are not rescheduled in accordance with this agreement, except in exceptional circumstances (at the Coaching Team’s discretion).',
      '8.4 If You are late for a Session, the Session will complete at the scheduled time.']],
    ['9. Termination', [
      '9.1 In the unlikely event that you may wish to cancel this Agreement, you must notify in writing (by email to savannah@colourmeneurospicy.com.au), giving at least 7 clear days notice. An exit interview will be booked with Savannah. In the event that you owe money to the Company at the time of cancellation, full payment of the contract agreement is due at the time of cancellation.',
      '9.2 In the unlikely event that the company cancels this Agreement before all the Sessions You have paid for have been provided the Company will refund you for any Sessions you have paid for but which the Company has not provided at the pro rata rate.']],
    ['10. General', [
      '10.1 Upon termination of this Agreement the Company shall immediately cease to be liable to You in respect of the coaching Sessions.',
      '10.2 In the event of You choosing to feel mental, physical or emotional distress (or related ailment or condition) which You believe to be related either directly or indirectly to the coaching Sessions You will not hold the Company liable for any loss or cost incurred by you (or any person related to you). You will indemnify the Company in the event of any such claim.',
      '10.3 Except as expressly set out in this Agreement the Company will have no liability to You. This Agreement reflects the entire agreement and understanding between You and the Company regarding the matters in this Agreement.']],
    ['11. Intellectual Property + Use of Content', [
      '11.1 All Breakthrough modules, recordings, videos, workbooks, illustrations, frameworks and other coaching or program materials remain the intellectual property of SDI Interior Design Studio PTY LTD trading as Colour Me Neurospicy / Savannah Barber, or their respective licensors.',
      '11.2 You receive a personal, non-transferable licence to access and use the supplied materials for your own learning during the access period agreed on page 1. You may apply what you learn in your own life.',
      '11.3 You must not share access, login details or materials; copy, distribute, publish, sell, teach, adapt or repurpose the content; or use it in your own products, services, training or marketing without prior written permission. You must not record coaching calls or share other participants’ messages or personal information without written permission from those involved. These obligations continue after this agreement ends, subject to rights permitted by law.']]
  ];
  var CONSENT_INTRO = 'From time to time, Colour Me Neurospicy may share general insights, advice, themes or learnings from coaching sessions for educational or marketing purposes, including social media, email content, workshops and promotional materials. No content will be shared beyond the scope of the option you approve below. Please select one option.';
  var CONSENTS = [
    ['none', 'No, I do not consent', 'I do not consent to coaching-related content from my sessions being shared in any format, including audio, video or screen recordings.'],
    ['anon', 'Yes, I consent with my identity kept confidential', 'I consent to anonymised sharing of insights or advice through audio with my voice removed or altered so I cannot be identified; video of Savannah only; and screen recordings with my name, image, voice and identifying details removed or obscured.'],
    ['public', 'Yes, I consent and I am comfortable being publicly identified', 'I consent to sharing insights or advice through audio including my voice; video of Savannah referencing our session; and screen recordings where my name, image and/or voice may be visible.']
  ];
  // little phone mock-ups showing what each choice looks like on social media
  var INK = '#1F1412';
  // what each choice looks like: the real Zoom example, plus voice + name icons underneath
  var IMG = (window.BT_DEMO ? '' : '/') + 'img/sav/';
  function ico(svg, label, cls) { return '<span class="ct-ico ' + cls + '"><svg viewBox="0 0 40 24" aria-hidden="true">' + svg + '</svg><b>' + label + '</b></span>'; }
  var WAVE = '<path d="M3 12c2.5-7 4 7 6.5 0s4 7 6.5 0 4 7 6.5 0 4 7 6.5 0 4 7 6.5 0" fill="none" stroke="#A8231F" stroke-width="2.6" stroke-linecap="round"/>';
  var ICONS = {
    none: ico('<path d="M14 11V8a6 6 0 0 1 12 0v3" fill="none" stroke="#A39A97" stroke-width="2.6"/><rect x="11" y="11" width="18" height="12" rx="3" fill="#A39A97"/>', 'Not shared', 'off'),
    anonVoice: ico('<path d="M4 12h6M14 12h4M22 12h6M32 12h4" stroke="#A39A97" stroke-width="2.6" stroke-linecap="round"/><path d="M3 20L37 4" stroke="#A8231F" stroke-width="2.4" stroke-linecap="round"/>', 'Voice obscured', 'off'),
    anonName: ico('<rect x="2" y="6" width="36" height="12" rx="6" fill="#1F1412"/><path d="M9 12h22" stroke="#F1F9A6" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 3"/>', 'Name hidden', 'off'),
    pubVoice: ico(WAVE, 'Voice heard', 'on'),
    pubName: ico('<rect x="2" y="6" width="36" height="12" rx="6" fill="#F1F9A6" stroke="' + INK + '" stroke-width="1.5"/><text x="20" y="15.5" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#1F1412">@you</text>', 'Name shown', 'on')
  };
  var LOCK = '<svg viewBox="0 0 160 90" aria-hidden="true" class="ct-shot"><rect x="1" y="1" width="158" height="88" rx="10" fill="#F6EFEC" stroke="#E6DCD8" stroke-width="2"/><path d="M66 42v-8a14 14 0 0 1 28 0v8" fill="none" stroke="#A39A97" stroke-width="5"/><rect x="58" y="42" width="44" height="30" rx="7" fill="#A39A97"/><circle cx="80" cy="56" r="4.5" fill="#FFFFFF"/></svg>';
  var CONSENT_ART = {
    none: LOCK + '<span class="ct-icos">' + ICONS.none + '</span>',
    anon: '<img class="ct-shot" alt="" src="' + IMG + 'zoom-blur.jpg"><span class="ct-icos">' + ICONS.anonVoice + ICONS.anonName + '</span>',
    pub: '<img class="ct-shot" alt="" src="' + IMG + 'zoom-clear.jpg"><span class="ct-icos">' + ICONS.pubVoice + ICONS.pubName + '</span>'
  };
  var CONSENT_LABEL = { none: 'Nothing about you is shared', anon: 'Your story, never your name. Face is always blurred and voice obscured', pub: 'You can be named, seen and heard' };
  var CONSENT_OUTRO = 'Colour Me Neurospicy agrees that no sensitive personal information will be shared, content will not be taken out of context or misrepresented, and consent may be withdrawn at any time in writing, applying to future content only. For group sessions, each identifiable participant must consent separately. A blank selection means no marketing consent.';
  function artEl(k) { var key = k === 'public' ? 'pub' : k, f = el('figure', { class: 'ct-art' }); f.innerHTML = CONSENT_ART[key] || ''; f.appendChild(el('figcaption', { text: CONSENT_LABEL[key] || '' })); return f; }
  function agreeLine(t) { return 'I agree to all pages and the full amount of my selected payment plan, including payments due after week ' + (t.weeks || 8) + '. My marketing consent is limited to my selection on the final page.'; }

  /* render(terms, client, opts)
     opts.form = true  -> client fields + consent are inputs (returns {node, read()})
     opts.signed = { client, signed_at } -> shows the signed record */
  function render(t, client, opts) {
    t = Object.assign(defaults(), t || {}); client = client || {}; opts = opts || {};
    var form = !!opts.form, inputs = {};
    function field(key, label, val, type, auto) {
      if (!form || key === 'coach') return el('div', { class: 'ct-f' }, [el('span', { text: label }), el('b', { text: val || '—' })]);
      var i = el('input', { class: 'bt-in', id: 'ct-' + key, type: type || 'text', value: val || '', autocomplete: auto || null });
      inputs[key] = i; return el('label', { class: 'ct-f in', for: 'ct-' + key }, [el('span', { text: label }), i]);
    }
    var pl = planLines(t), wk = t.weeks || 8;
    var doc = el('article', { class: 'ct-doc' });
    doc.appendChild(el('header', { class: 'ct-head' }, [el('p', { class: 'ct-k', text: 'Colour Me Neurospicy' }), el('h1', { class: 'ct-h', text: 'Breakthrough + 1:1 Coaching Agreement' })]));
    doc.appendChild(el('section', { class: 'ct-s' }, [el('h2', { text: '1. Definitions' }),
      el('div', { class: 'ct-grid' }, [field('name', 'Your name', client.name, 'text', 'name'), field('coach', 'Coach', t.coach || 'Savannah Barber'), field('phone', 'Phone', client.phone, 'tel', 'tel'), field('email', 'Your email address', client.email, 'email', 'email'), field('address', 'Your address', client.address, 'text', 'street-address')]),
      el('div', { class: 'ct-pay' }, [el('span', { class: 'ct-l', text: 'Payment structure' }), el('p', { class: 'ct-plan' }, [el('span', { class: 'ct-tick', 'aria-hidden': 'true', text: '✓' }), el('b', { text: pl.line })]), el('p', { class: 'ct-sub', text: pl.desc })]),
      el('p', { text: 'Program duration: ' + wk + ' weeks, starting ' + fmtDate(t.start) + ', with no fixed end date. The selected payment plan may continue beyond the program end date if both coach and participant agree to continue the coaching and client relationship or a new agreement is made.' })
    ]));
    var incl = INCL.filter(function (x) { return (t.inclusions || {})[x[0]]; }).map(function (x) {
      var dur = x[0] === 'modules' ? 'Lifetime access' : x[0] === 'library' ? 'Included' : wk + ' weeks';
      return el('div', { class: 'ct-row' }, [el('span', { text: x[2] }), el('b', { text: x[0] === 'modules' ? 'Lifetime access' : (x[0] === 'privateChat' ? 'Included for ' : x[0] === 'library' ? '' : 'Access included for ') + dur })]);
    });
    doc.appendChild(el('section', { class: 'ct-s' }, [el('h2', { text: '2. Brief' }),
      el('p', { text: wk + ' week ' + programName(t) + ' program (' + (t.package || '1:1') + '), group and 1:1 coaching' + ((t.inclusions || {}).modules ? ', plus lifetime access to program modules.' : '.') }),
      el('div', { class: 'ct-rows' }, [
        t.group && Number(t.group.n) ? el('div', { class: 'ct-row' }, [el('span', { text: 'Group 1 hour session(s)' }), el('b', { text: t.group.n + ' per ' + String(t.group.per).toLowerCase() + ' for ' + wk + ' weeks' })]) : null,
        t.one && Number(t.one.n) ? el('div', { class: 'ct-row' }, [el('span', { text: 'Individual 1 hour session(s)' }), el('b', { text: t.one.n + ' per ' + String(t.one.per).toLowerCase() + ' for ' + wk + ' weeks' })]) : null
      ].concat(incl)),
      el('p', { class: 'ct-sub', text: 'Schedule: Sessions will take place on consistent days/times where practicable, subject to coach availability. It is the client’s responsibility to pre-book individual sessions.' })
    ]));
    // to get the most out of coaching: tick each one
    var notesSec = el('section', { class: 'ct-s' }, [el('h2', { text: 'To get the most out of coaching' }), el('p', { class: 'ct-sub', text: form ? 'Tick each one to show you’re in.' : '' })]);
    var noteBoxes = [];
    if (form) notesSec.appendChild(el('button', { class: 'ct-all', type: 'button', text: '✓ Tick all', onclick: function () { noteBoxes.forEach(function (b) { b.checked = true; }); } }));
    notesSec.appendChild(el('div', { class: 'ct-notes' }, NOTES.map(function (n, i) {
      if (form) { var cb = el('input', { type: 'checkbox', id: 'ct-n' + i }); noteBoxes.push(cb); return el('label', { class: 'ct-note', for: 'ct-n' + i }, [cb, el('span', { text: n })]); }
      var on = !!client.notesAgreed; return el('div', { class: 'ct-note ro' + (on ? ' on' : '') }, [el('span', { class: 'ct-box', 'aria-hidden': 'true', text: on ? '✓' : '' }), el('span', { text: n })]);
    })));
    doc.appendChild(notesSec);
    // the terms in a scroll box, then a tick to agree
    var terms = el('div', { class: 'ct-terms', tabindex: '0', role: 'region', 'aria-label': 'Terms and conditions' }, CLAUSES.map(function (c) { return el('div', { class: 'ct-tc' }, [el('h3', { text: c[0] })].concat(c[1].map(function (p) { return el('p', { text: p }); }))); }));
    var termsSec = el('section', { class: 'ct-s' }, [el('h2', { text: 'Terms and conditions' }), el('p', { class: 'ct-sub', text: 'Scroll through to read them all.' }), terms]);
    var termsCb = null;
    if (form) { termsCb = el('input', { type: 'checkbox', id: 'ct-terms' }); termsSec.appendChild(el('label', { class: 'ct-note ct-terms-ok', for: 'ct-terms' }, [termsCb, el('span', { text: 'I have read and agree to the terms and conditions.' })])); }
    else termsSec.appendChild(el('div', { class: 'ct-note ro' + (client.termsAgreed ? ' on' : '') }, [el('span', { class: 'ct-box', 'aria-hidden': 'true', text: client.termsAgreed ? '✓' : '' }), el('span', { text: 'I have read and agree to the terms and conditions.' })]));
    doc.appendChild(termsSec);
    // 12. marketing consent
    var cSec = el('section', { class: 'ct-s' }, [el('h2', { text: '12. Marketing + Social Media Consent' }), el('p', { text: CONSENT_INTRO })]);
    var chosen = client.consent || '';
    CONSENTS.forEach(function (c) {
      if (form) {
        var r = el('input', { type: 'radio', name: 'ct-consent', value: c[0], id: 'ct-c-' + c[0] }); if (chosen === c[0]) r.checked = true;
        cSec.appendChild(el('label', { class: 'ct-opt', for: 'ct-c-' + c[0] }, [r, el('span', null, [el('b', { text: c[1] }), el('span', { text: c[2] })]), artEl(c[0])]));
      } else cSec.appendChild(el('div', { class: 'ct-opt ro' + (chosen === c[0] ? ' on' : '') }, [el('span', { class: 'ct-box', 'aria-hidden': 'true', text: chosen === c[0] ? '✓' : '' }), el('span', null, [el('b', { text: c[1] }), el('span', { text: c[2] })]), artEl(c[0])]));
    });
    cSec.appendChild(el('p', { class: 'ct-sub', text: CONSENT_OUTRO }));
    doc.appendChild(cSec);
    // agreement + signature
    var sig = el('section', { class: 'ct-s ct-sig' }, [el('h2', { text: 'Agreement + Signatures' }), el('p', { text: 'This agreement is between the client named above and: ' + COMPANY + '.' }), el('p', { class: 'ct-agree', text: agreeLine(t) })]);
    if (opts.signed) {
      var s = opts.signed, when = s.signed_at ? new Date(s.signed_at) : null;
      sig.appendChild(el('div', { class: 'ct-signed' }, [el('span', { class: 'ct-l', text: 'Signed electronically' }), el('b', { class: 'ct-signame', text: (s.client || {}).signedName || client.name || '' }),
        el('span', { text: when ? when.toLocaleString('en-AU', { dateStyle: 'long', timeStyle: 'short' }) + ((s.client || {}).tz ? ' (' + s.client.tz + ')' : '') : '' })]));
    }
    doc.appendChild(sig);
    return {
      node: doc, terms: t, agreeText: agreeLine(t),
      read: function () { var o = {}; Object.keys(inputs).forEach(function (k) { o[k] = inputs[k].value.trim(); }); var r = doc.querySelector('input[name="ct-consent"]:checked'); o.consent = r ? r.value : ''; o.notesAgreed = noteBoxes.length > 0 && noteBoxes.every(function (b) { return b.checked; }); o.notesLeft = noteBoxes.filter(function (b) { return !b.checked; }).length; o.termsAgreed = !!(termsCb && termsCb.checked); return o; },
      focusNotes: function () { var b = noteBoxes.filter(function (x) { return !x.checked; })[0]; if (b) { b.focus(); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } },
      focusTerms: function () { if (termsCb) { termsCb.focus(); termsCb.scrollIntoView({ block: 'center', behavior: 'smooth' }); } },
      focus: function (k) { if (inputs[k]) inputs[k].focus(); }
    };
  }
  window.BT_CONTRACT = { PLANS: PLANS, PROGRAMS: PROGRAMS, INCL: INCL, CONSENTS: CONSENTS, defaults: defaults, render: render, money: money, fmtDate: fmtDate, planLines: planLines };
})();
