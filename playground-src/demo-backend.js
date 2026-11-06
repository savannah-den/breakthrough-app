/* PLAYGROUND ONLY. Stands in for the real database so the copy of the app in Claude
   works on its own: you're logged in automatically, your answers save in this browser,
   and the coach dashboard shows you, a few made-up example clients, and your founding members (names, emails, tags, agreements).
   Nothing here ever touches the live app: sending a welcome email here only pretends to send. */
(function () {
  'use strict';
  var K = '__bt_demo_db', raw = Storage.prototype.setItem;
  var ME = 'u-me';
  function iso(daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); }
  function seed() {
    return {
      seq: 10,
      profiles: [
        { id: ME, email: 'you@playground', full_name: 'Sav (playground)', tier: 'private', is_admin: true, created_at: iso(30), last_seen_at: iso(0), program_start: iso(14).slice(0, 10) },
        { id: 'u-ex1', email: 'example.anna@sample.test', full_name: 'Example: Anna', tier: 'private', is_admin: false, status: 'current', tags: [{ t: 'Founding Member', on: false }, { t: '1:1', on: true }, { t: 'Group', on: false }], created_at: iso(12), last_seen_at: iso(1), program_start: iso(16).slice(0, 10) },
        { id: 'u-ex2', email: 'example.bec@sample.test', full_name: 'Example: Bec', tier: 'self_paced', is_admin: false, status: 'past', tags: [{ t: 'Founding Member', on: false }, { t: 'Kylie ECT', on: false }], created_at: iso(40), last_seen_at: iso(9) }
      ],
      client_data: [
        { user_id: 'u-ex1', key: 'cmn-rep-results', value: JSON.stringify({ ranks: [{ 0: 4, 1: 2, 2: 3, 3: 1 }, { 0: 1, 1: 4, 2: 2, 3: 3 }, { 0: 4, 1: 3, 2: 1, 3: 2 }, { 0: 1, 1: 2, 2: 4, 3: 3 }, { 0: 2, 1: 1, 2: 4, 3: 3 }], name: 'Anna', date: 'Example' }), updated_at: iso(3) },
        { user_id: 'u-ex1', key: 'cmn-1to1-dashboard', value: JSON.stringify({ guideOk: true, wa: true, repDone: true, hd: { type: 'sent', sent: true, date: 'Example' }, weeks: { w1: true, w2: true } }), updated_at: iso(1) },
        { user_id: 'u-ex1', key: 'north-star-home-v1', value: JSON.stringify({ northStar: 'Example answer: I am a calm, grounded woman who trusts herself and leads from ease rather than fear.', identity: ['Calm', 'Trusting', 'Playful'] }), updated_at: iso(2) },
        { user_id: 'u-ex1', key: 'bt-course', value: JSON.stringify({ done: { i1: Date.now() - 11 * 864e5, i3: Date.now() - 10 * 864e5, i2: Date.now() - 10 * 864e5, w1l1: Date.now() - 8 * 864e5, w1l2: Date.now() - 7 * 864e5, w1l3: Date.now() - 6 * 864e5, w1l4: Date.now() - 5 * 864e5, w1a4: Date.now() - 4 * 864e5 }, pct: { w1l5: 40 } }), updated_at: iso(4) },
        { user_id: 'u-ex1', key: 'cmn-companion', value: JSON.stringify({ anchor: 'Ease', nsToward: 'Example: a calm, grounded woman who backs herself and finishes what she starts.', nsAway: 'Example: done being the one who over-explains and apologises for taking up space.', intention: 'Example: so my kids see a mum who believes in herself.', su: { 1: Date.now() - 10 * 864e5, 2: Date.now() - 10 * 864e5 }, accountability: 'Example: my sister, a Sunday check-in text', j: { w1l1_0: 'Example: I always thought I was just lazy. Learning my brain wants dopamine and isn’t broken was huge.', w1l1_1: 'Example: My body tells me I’m overwhelmed before my head does, tight jaw and shoulders.', w1l2_0: 'Example: A belief I keep running: I’m not good enough unless I’m busy.', w1l3_0: 'Example: I notice anger comes up fast when the house is loud. Then shame after.', w1l4_0: 'Example: Dopamine: music and walking the dog. Serotonin: sun on my face in the morning.' } }), updated_at: iso(4) },
        { user_id: 'u-ex1', key: 'bt-dose', value: JSON.stringify({ plan: { D: ['Music while I cook', 'Tick off one small win'], O: ['Hug the kids before school'], S: ['Morning sun, 10 minutes'], E: ['Dance in the kitchen'] }, days: {} }), updated_at: iso(4) },
        { user_id: 'u-ex2', key: 'cmn-companion', value: JSON.stringify({ checks: { watched: true, joined: true } }), updated_at: iso(9) }
      ],
      coach_notes: [{ id: 1, client_id: 'u-ex1', body: 'Example note: big shift in session 2 around her money story.', created_at: iso(2) }],
      invites: [{ email: 'example.anna@sample.test', tier: 'private', full_name: 'Example: Anna', created_at: iso(12), contract: null, contract_status: null }, { email: 'example.jess@sample.test', tier: 'private', full_name: 'Example: Jess (not logged in yet)', created_at: iso(1), contract: null, contract_status: null, status: 'current', tags: [{ t: 'Founding Member', on: true }] }],
      app_settings: [],
      contracts: [{ user_id: 'u-ex1', status: 'signed', terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(16).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber' }, signed_at: iso(15), signed: { client: { name: 'Example: Anna', signedName: 'Example: Anna', email: 'example.anna@sample.test', phone: '0400 000 000', address: '1 Example St, Brisbane QLD', consent: 'anon', tz: 'Australia/Brisbane' }, terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(16).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber' } } }]
    };
  }
  var D; try { D = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { D = null; }
  if (!D || !D.profiles) D = seed();
  if (!D.contracts) D.contracts = seed().contracts;
  if (!D.coach_clients) D.coach_clients = [];
  if (D.invites && !D.invites.some(function (i) { return i.email === 'example.jess@sample.test'; })) { D.invites.forEach(function (i) { if (!('contract' in i)) { i.contract = null; i.contract_status = null; } }); D.invites.push({ email: 'example.jess@sample.test', tier: 'private', full_name: 'Example: Jess (not logged in yet)', created_at: iso(1), contract: null, contract_status: null }); }
  // Sav's real founding members (same list as the Supabase SQL), so the playground matches the live app
  var FOUNDING = [{"email": "emma_chapman24@rocketmail.com", "full_name": "Emma Chapman", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "karen.t.chu98@gmail.com", "full_name": "Karen Chu", "tier": "private", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "1:1", "on": true}, {"t": "Group", "on": false}, {"t": "Kylie ECT", "on": false}], "contract": {"package": "1:1", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 2, "per": "Month"}, "inclusions": {"privateChat": true, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 1245, "bespoke": {"per": "1245", "freq": "month", "count": "", "notes": "Ongoing monthly coaching, paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "marlii2395@hotmail.com", "full_name": "Marlii Forward", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "sarahkirsch@live.de", "full_name": "Karolin Franke", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "ty_tamara@hotmail.com", "full_name": "Tamara Gioiosa", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "m35224784@gmail.com", "full_name": "Martina Johansson", "tier": "private", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "1:1", "on": true}, {"t": "Group", "on": false}, {"t": "Kylie ECT", "on": false}], "contract": {"package": "1:1", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 2, "per": "Month"}, "inclusions": {"privateChat": true, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 1245, "bespoke": {"per": "1245", "freq": "month", "count": "", "notes": "Ongoing monthly coaching, paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "k.kerling@outlook.de", "full_name": "Karina Kerling", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "anna.stenson@mac.com", "full_name": "Anna Mikkelsen", "tier": "self_paced", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "Group", "on": true}, {"t": "Kylie ECT", "on": false}], "contract": {"package": "Group", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 0, "per": "Month"}, "inclusions": {"privateChat": false, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 499, "bespoke": {"per": "499", "freq": "month", "count": "", "notes": "Ongoing monthly group coaching (2 group calls a month), paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "hamblin.moore@gmail.com", "full_name": "Vicky Moore", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}, {"t": "Kylie ECT", "on": false}], "contract": null, "contract_status": null}, {"email": "rachelmromero2@gmail.com", "full_name": "Rachel Nguyen", "tier": "private", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "1:1", "on": true}, {"t": "Group", "on": false}, {"t": "ECT", "on": true}], "contract": {"package": "1:1", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 2, "per": "Month"}, "inclusions": {"privateChat": true, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 1245, "bespoke": {"per": "1245", "freq": "month", "count": "", "notes": "Ongoing monthly coaching, paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "tahls.02@hotmail.com", "full_name": "Tahlia Paterson", "tier": "private", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "1:1", "on": true}, {"t": "Group", "on": false}, {"t": "Kylie ECT", "on": false}, {"t": "PRAC", "on": false}], "contract": {"package": "1:1", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 2, "per": "Month"}, "inclusions": {"privateChat": true, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 1245, "bespoke": {"per": "1245", "freq": "month", "count": "", "notes": "Ongoing monthly coaching, paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "roze.lelia@gmail.com", "full_name": "Lelia Roze", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}, {"t": "Group", "on": false}], "contract": null, "contract_status": null}, {"email": "claire.stolfi@gmail.com", "full_name": "Clarissa Stolfi", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}, {"email": "zammitzoe@ymail.com", "full_name": "Zoe Zammit", "tier": "private", "status": "current", "tags": [{"t": "Founding Member", "on": false}, {"t": "1:1", "on": true}, {"t": "Group", "on": false}, {"t": "Kylie ECT", "on": false}, {"t": "PRAC", "on": false}], "contract": {"package": "1:1", "programs": ["Breakthrough"], "ongoing": true, "weeks": 8, "start": "2026-08-10", "group": {"n": 2, "per": "Month"}, "one": {"n": 2, "per": "Month"}, "inclusions": {"privateChat": true, "groupChats": true, "modules": true, "library": false}, "plan": "bespoke", "amount": 1245, "bespoke": {"per": "1245", "freq": "month", "count": "", "notes": "Ongoing monthly coaching, paid monthly on the 10th of each month."}, "coach": "Savannah Barber"}, "contract_status": "sent"}, {"email": "zingerella57@gmail.com", "full_name": "Ella Zinger", "tier": "self_paced", "status": "past", "tags": [{"t": "Founding Member", "on": false}], "contract": null, "contract_status": null}];
  D.invites = D.invites || [];
  FOUNDING.forEach(function (f, k) { if (!D.invites.some(function (i) { return i.email === f.email; })) D.invites.push(Object.assign({ created_at: iso(2), welcome_sent_at: null }, f)); });
  // Tyler (real 1:1 client) with his Rep System, Human Design chart, DISC and the example coaching profile
  if (!D.profiles.some(function (p) { return p.id === 'u-tyler'; })) {
    D.profiles.push({ id: 'u-tyler', email: 'tylerwilliamauld@hotmail.com', full_name: 'Tyler Auld', tier: 'private', is_admin: false, status: 'current', tags: [{ t: '1:1', on: true }], created_at: iso(2), last_seen_at: iso(0), program_start: iso(2).slice(0, 10) });
    D.client_data.push({ user_id: 'u-tyler', key: 'cmn-rep-results', value: JSON.stringify({ ranks: [{ 0: 2, 1: 3, 2: 1, 3: 4 }, { 0: 3, 1: 2, 2: 4, 3: 1 }, { 0: 1, 1: 3, 2: 4, 3: 2 }, { 0: 2, 1: 4, 2: 3, 3: 1 }, { 0: 2, 1: 4, 2: 1, 3: 3 }], name: 'Tyler', date: '1 Nov 2026' }), updated_at: iso(2) });
    D.client_data.push({ user_id: 'u-tyler', key: 'cmn-1to1-dashboard', value: JSON.stringify({ guideOk: true, wa: true, repDone: true, hd: { type: 'image', date: '3 Nov 2026' }, disc: { type: 'image', date: '1 Nov 2026' } }), updated_at: iso(0) });
    D.client_data.push({ user_id: 'u-tyler', key: 'cmn-companion', value: JSON.stringify({ anchor: 'Bold', nsToward: 'I want to live truly authentically and be connected to people around me who love me as I am.', nsAway: 'I no longer want to procrastinate, be anxious, overthink, hide, and feel disconnected. I no longer want to feel stuck.', intention: 'My intention is to live and continuously grow whilst exhibiting love, kindness and compassion. That is how I will best serve the world.' }), updated_at: iso(1) });
    D.coach_clients.push({ client_id: 'u-tyler', data: { hd: { img: window.BT_TYLER_HD }, disc: { notes: 'DISC (123test): Steadiness 34%, Compliance 33%, Dominance 26%, Influence 7%. Male, 33.' }, insight: window.BT_TYLER_INSIGHT, insightJob: { state: 'done', at: window.BT_TYLER_INSIGHT.made } }, updated_at: iso(0) });
  }
  D.coach_clients.forEach(function (r) { if (r.client_id === 'u-tyler' && r.data && (!r.data.insight || !r.data.insight.glance)) r.data.insight = window.BT_TYLER_INSIGHT; });
  D.coach_clients.forEach(function (r) { if (r.client_id === 'u-tyler' && r.data && !(r.data.sessions || {})['demo-tyler-1']) { var b0 = new Date(); b0.setUTCHours(0, 0, 0, 0); r.data.calls = Object.assign({}, r.data.calls || {}, { 'first-2026-10-20': { at: '2026-10-20T04:00:00Z', title: 'Discovery call', summary: "This was a discovery call between Savannah and Tyler about the Breakthrough Program. Tyler shared his struggles with procrastination, perfectionism, social anxiety and overthinking, and how they get in the way of deeper connection. Savannah described the program and shared her own experience with social anxiety and overthinking.\n\nSocial Anxiety Goals: Tyler wants to talk more deeply with strangers, go beyond small talk at work, reduce procrastination and overthinking, and make more social connections outside work. Savannah explained that neurodivergence itself isn't the problem, it's the conditioning layered on top of it.\n\nFive-Year Vision: Asked what life would look like in five years without procrastination and perfectionism, Tyler described exponential growth in learning and experience while keeping his core values, though he was sceptical he could get there.\n\nProgram Discussion and Considerations: Tyler wanted time to think and talk it through with his psychologist before committing, and they booked a follow-up call.\n\nNext steps:\n• Savannah: Send Tyler a PDF with the payment options and a link to the payment page.\n• Savannah: Send Tyler testimonials from previous Breakthrough clients.\n• Tyler: Review the payment options and decide whether to enrol.\n• Tyler: Attend the follow-up call on Saturday.", zoom: Date.now() } }); r.data.sessions = Object.assign({}, r.data.sessions || {}, { 'demo-tyler-1': { at: new Date(b0.getTime() - 2 * 3600000).toISOString(), zoom: Date.now(), summary: "This was the first coaching session between Savannah and Tyler, getting to know his goals and how the app program is going. Tyler shared that he joined to feel more at ease around people and build more connection in his small town, and talked about procrastination, perfectionism and overthinking, especially around learning to cook and setting boundaries at work. Savannah noted that Tyler’s thinking style is auditory-digital (logic and steps), which is different from most of her clients, and that it works well for him.\n\nApp Program Progress Discussion: Tyler and Savannah went over his progress through Week 1 and his reasons for joining. Tyler wants to connect with more people and sees social anxiety as the main barrier.\n\nProcrastination and Perfectionism: Tyler shared that he puts off things like cooking because of fatigue and overthinking. Savannah explained that home life is messier than work, where systems make priorities clear, and introduced the good, better, best framework.\n\nToward and Away Drivers: Savannah explained toward and away-from drivers and suggested Tyler link cooking to his toward goal of building connection and finding a partner.\n\nWorkplace Confidence: Tyler talked about a recent work situation that has made him more cautious socially. Savannah reassured him that Weeks 2 and 3 give him tools for reframing situations and understanding how others see things.\n\nApp Feedback and Scheduling: They booked his next sessions and talked through the reminder emails and time zones. Tyler asked for a free-range journaling space in the app.\n\nNext steps:\n• Tyler: Finish the week one videos and content before the next coaching call.\n• Tyler: Forward the Zoom/app reminder emails to Savannah so she can review the frequency and timing.\n• Savannah: Fix the app issue where the link was broken between the dose and the next activity.\n• Savannah: Update the app's booking/calendar system to correctly reflect time zones and avoid confusion.\n• Savannah: Add a free-range journaling/note section to the app, both at the end of each lesson and within the Becoming book.\n• Tyler: Continue practicing the good, better, best framework when facing perfectionism.\n• Tyler: Use the toward driver to motivate himself to learn cooking.\n• Tyler: Bring any questions or reflections from the course content to the next coaching session." } }); } });
  function save() { try { raw.call(localStorage, K, JSON.stringify(D)); } catch (e) {} }

  // keep her on the page she was working on when the playground reloads
  try {
    if (!location.hash || location.hash === '#') { var lh = localStorage.getItem('__bt_lasthash'); if (lh && lh !== '#Dashboard' && !(window.BT_DEMO && window.BT_DEMO.file && !/app\.html/.test(window.BT_DEMO.file))) location.hash = lh; }
    window.addEventListener('hashchange', function () { try { if (/^#[A-Za-z]/.test(location.hash) && !/^#(ActDone|Back)-/.test(location.hash)) raw.call(localStorage, '__bt_lasthash', location.hash); } catch (e) {} });
  } catch (e) {}

  // "New client experience": start Sav's playground login from scratch, as a brand-new 1:1 client would
  if (window.BT_DEMO && window.BT_DEMO.fresh) {
    D.client_data = D.client_data.filter(function (r) { return r.user_id !== ME; });
    D.contracts = (D.contracts || []).filter(function (r) { return r.user_id !== ME; });
    var doorF = (window.BT_DEMO && window.BT_DEMO.door) || new URLSearchParams(location.search).get('door');
    D.profiles.forEach(function (p) { if (p.id === ME) p.program_start = iso(0).slice(0, 10); });
    if (doorF !== 'course') D.contracts.push({ user_id: ME, status: 'sent', terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(-3).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: false }, plan: 'in4', amount: 5100, coach: 'Savannah Barber', call: { zoom: 'https://zoom.us/j/0000000000', times: 'Tuesdays at 10am (your time)', upcoming: [iso(-3), iso(-10)], sessions: [{ start: iso(-3), zoom: 'https://zoom.us/j/0000000000' }, { start: iso(-10), zoom: 'https://zoom.us/j/0000000000' }] } } });
    try { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k0 = localStorage.key(i); if (k0 && !/^__bt_demo_db$/.test(k0)) ks.push(k0); } ks.forEach(function (k) { localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) {}
    // start part-way: after the profile set-up, or straight at the agreement
    var skip = window.BT_DEMO.skip || '';
    if (skip) { try { localStorage.setItem('bt-profile', JSON.stringify({ onboarded: Date.now(), tz: 'Australia/Brisbane', country: 'AU', phone: '0400 000 000' })); if (skip === 'contract') localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true }));
      // straight to step 5, the welcome module: app saved, agreement signed, WhatsApp joined, tests left for later
      if (skip === 'welcome' || skip === 'ready') {
        localStorage.setItem('bt-profile', JSON.stringify({ onboarded: Date.now(), tz: 'Australia/Brisbane', country: 'AU', phone: '0400 000 000', startDone: Date.now() }));
        localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true, wa: true }));
        var c0 = D.contracts[D.contracts.length - 1], cl = { name: 'Sav (playground)', email: 'you@playground', phone: '0400 000 000', address: '12 Example St, Noosa QLD', consent: 'anon', notesAgreed: true, termsAgreed: true, signedName: 'Sav (playground)', tz: 'Australia/Brisbane' };
        c0.status = 'signed'; c0.signed_at = new Date().toISOString(); c0.signed = { client: cl, terms: c0.terms };
        // all set up: tests done and the welcome module finished, so everything's unlocked
        if (skip === 'ready') {
          var dd = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
          localStorage.setItem('cmn-1to1-dashboard', JSON.stringify({ homeSaved: true, wa: true, repDone: true, repSent: true, hd: { type: 'sent', sent: true, date: dd }, disc: { type: 'sent', sent: true, date: dd } }));
          localStorage.setItem('bt-course', JSON.stringify({ done: { i1: Date.now(), i3: Date.now(), i2: Date.now() }, pct: {} }));
        }
      } } catch (e) {} }
  }
  // "Everything unlocked": skip every first-time step (without wiping what she's already played with)
  if (window.BT_DEMO && window.BT_DEMO.unlock && !window.BT_DEMO.fresh) {
    try {
      var rj = function (k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
      var pf = rj('bt-profile'); pf.onboarded = pf.onboarded || Date.now(); pf.startDone = pf.startDone || Date.now(); pf.termsAt = pf.termsAt || Date.now(); pf.tz = pf.tz || 'Australia/Brisbane'; pf.country = pf.country || 'AU'; pf.phone = pf.phone || '0400 000 000'; pf.tourDone = pf.tourDone || Date.now(); pf.nbTour = pf.nbTour || Date.now();
      localStorage.setItem('bt-profile', JSON.stringify(pf));
      var dd0 = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), ob = rj('cmn-1to1-dashboard');
      ob.homeSaved = true; ob.wa = true; ob.repDone = true; ob.repSent = true; ob.hd = ob.hd || { type: 'sent', sent: true, date: dd0 }; ob.disc = ob.disc || { type: 'sent', sent: true, date: dd0 };
      localStorage.setItem('cmn-1to1-dashboard', JSON.stringify(ob));
      var cp = rj('bt-course'); cp.done = cp.done || {}; ['i1', 'i2', 'i3'].forEach(function (id) { cp.done[id] = cp.done[id] || Date.now(); }); cp.pct = cp.pct || {}; localStorage.setItem('bt-course', JSON.stringify(cp));
      var mine = (D.contracts || []).filter(function (r) { return r.user_id === ME; });
      if (!mine.length) { D.contracts.push({ user_id: ME, status: 'sent', terms: { package: '1:1', programs: ['Breakthrough'], weeks: 8, start: iso(-3).slice(0, 10), group: { n: 2, per: 'Month' }, one: { n: 1, per: 'Week' }, inclusions: { privateChat: true, groupChats: true, modules: true, library: true }, plan: 'in4', amount: 5100, coach: 'Savannah Barber', call: { zoom: 'https://zoom.us/j/0000000000', times: 'Tuesdays at 10am (your time)', upcoming: [iso(-3), iso(-10)], sessions: [{ start: iso(-3), zoom: 'https://zoom.us/j/0000000000' }, { start: iso(-10), zoom: 'https://zoom.us/j/0000000000' }] } } }); mine = [D.contracts[D.contracts.length - 1]]; }
      mine.forEach(function (c1) { if (c1.status !== 'signed') { var cl1 = { name: 'Sav (playground)', email: 'you@playground', phone: '0400 000 000', address: '12 Example St, Noosa QLD', consent: 'anon', notesAgreed: true, termsAgreed: true, signedName: 'Sav (playground)', tz: 'Australia/Brisbane' }; c1.status = 'signed'; c1.signed_at = new Date().toISOString(); c1.signed = { client: cl1, terms: c1.terms }; } });
    } catch (e) {}
  }
  // Which version am I looking at? ?door=private (1:1) or ?door=course (self-paced)
  // Made-up leads so the Leads tab has something to show (sample.test emails, nobody real)
  if (!D.leads) {
    var LA = function (d, o) { return Object.assign({ id: 'lead-ex' + d + '-' + (o.first_name || '').toLowerCase(), created_at: iso(d), tags: ['waitlist'], interests: ['community'], source: 'waitlist page', welcomed_at: iso(d) }, o); };
    D.leads = [
      LA(1, { first_name: 'Example: Jade', last_name: 'Sample', email: 'jade.lead@sample.test', phone: '+61 400 000 101', country: 'Australia', interests: ['community', 'group'], tags: ['waitlist', 'group enquiry'], applied_at: iso(0),
        application: { age: '34', location: 'Geelong, Australia', work: 'Primary school teacher', diagnosis: 'AuDHD', pronouns: 'She/Her', kids: '2 boys (6 and 9) and a staffy called Pickle', partner: 'Yes, pretty sure he is ADHD too', partnerWork: 'Electrician', challenges: 'Overwhelm every single afternoon. I mask all day at work then fall apart at home and snap at the kids. I start a million things and finish none of them.', tried: 'Psychologist, meds, every Instagram hack going', wand: 'Being calm when everything is loud', future: 'Light, calm, proud of herself, actually present with her family', worth: 'Priceless - I\'m ready to invest in becoming HER', commitment: 'I am so ready. I have been watching your stories for a year and I am all in, whatever it takes. I need this for me and for my boys.' } }),
      LA(2, { first_name: 'Example: Priya', last_name: 'Sample', email: 'priya.lead@sample.test', phone: '+44 7700 900123', country: 'United Kingdom', interests: ['1:1'], tags: ['waitlist', '1:1 enquiry'], applied_at: iso(2),
        application: { age: '41', location: 'Bristol, UK', work: 'Runs her own marketing agency', diagnosis: 'ADHD', pronouns: 'She/Her', partner: 'Married, not ND', challenges: 'Procrastination and rejection sensitivity are costing me clients and sleep.', wand: 'Following through', future: 'Confident and steady', worth: '$3,000 - $4,000 USD', commitment: 'Committed, I want to start asap.' } }),
      LA(3, { first_name: 'Example: Mel', last_name: 'Sample', email: 'mel.lead@sample.test', phone: '+61 400 000 303', country: 'Australia', interests: ['community', 'group'], tags: ['waitlist', 'group enquiry'], applied_at: iso(3),
        application: { age: '29', location: 'Perth, Australia', work: 'Nurse', diagnosis: 'Autism', pronouns: 'They/Them', partner: 'No', challenges: 'Burnout', wand: 'Boundaries', future: 'Less tired', worth: '$1,000 - $2,000 USD', commitment: 'Pretty committed' } }),
      LA(4, { first_name: 'Example: Sophie', email: 'sophie.lead@sample.test', phone: '+1 555 0100', country: 'United States' }),
      LA(6, { first_name: 'Example: Kate', email: 'kate.lead@sample.test', phone: '+64 21 000 0000', country: 'New Zealand' }),
      LA(9, { first_name: 'Example: Anna', last_name: 'Example', email: 'example.anna@sample.test', phone: '+61 400 000 909', country: 'Australia', interests: ['1:1'], tags: ['waitlist', '1:1 enquiry'], source: 'Instagram' })
    ];
    if (window.BT_LEADSCORE) D.leads.forEach(function (l) { var sc = window.BT_LEADSCORE.score(l); l.score = sc.score; l.heat = sc.heat; });
    else D.leads.forEach(function (l) { l.score = l.applied_at ? 60 : 5; l.heat = l.applied_at ? 'hot' : 'cold'; });
  }
  var door = (window.BT_DEMO && window.BT_DEMO.door) || new URLSearchParams(location.search).get('door');
  var me = D.profiles.filter(function (p) { return p.id === ME; })[0];
  if (me && me.email === 'you@playground') me.email = 'sav@playground.app'; // a real-looking address so the welcome steps accept it
  if (me && door) { me.tier = door === 'private' ? 'private' : 'self_paced'; }
  save();

  function Q(t) { this.t = t; this.f = []; this.op = 'select'; }
  Q.prototype.select = function () { this.ret = true; return this; };
  Q.prototype.eq = function (c, v) { this.f.push(function (r) { return r[c] === v; }); return this; };
  Q.prototype.in = function (c, v) { this.f.push(function (r) { return v.indexOf(r[c]) >= 0; }); return this; };
  Q.prototype.order = function () { return this; };
  Q.prototype.maybeSingle = function () { this.single = true; return this; };
  Q.prototype.upsert = function (rows) { this.op = 'upsert'; this.rows = [].concat(rows); return this; };
  Q.prototype.insert = function (rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; };
  Q.prototype.update = function (v) { this.op = 'update'; this.val = v; return this; };
  Q.prototype.delete = function () { this.op = 'delete'; return this; };
  Q.prototype.then = function (res, rej) {
    var self = this, T = D[this.t] || (D[this.t] = []), out;
    var m = function (r) { return self.f.every(function (f) { return f(r); }); };
    if (this.op === 'select') { out = T.filter(m).map(function (r) { return Object.assign({}, r); }); if (this.single) out = out[0] || null; }
    else if (this.op === 'upsert') {
      var pk = this.t === 'client_data' ? ['user_id', 'key'] : this.t === 'invites' ? ['email'] : this.t === 'profiles' ? ['id'] : this.t === 'contracts' ? ['user_id'] : this.t === 'coach_clients' ? ['client_id'] : this.t === 'leads' ? ['email'] : ['key'];
      this.rows.forEach(function (r) { var ex = T.filter(function (x) { return pk.every(function (k) { return x[k] === r[k]; }); })[0]; if (ex) Object.assign(ex, r); else T.push(Object.assign({ created_at: new Date().toISOString() }, r)); });
      out = this.rows;
    }
    else if (this.op === 'insert') { this.rows.forEach(function (r) { r.id = D.seq++; r.created_at = new Date().toISOString(); T.push(r); }); out = this.rows; }
    else if (this.op === 'update') { T.filter(m).forEach(function (r) { Object.assign(r, self.val); }); out = null; }
    else if (this.op === 'delete') { D[this.t] = T.filter(function (r) { return !m(r); }); out = null; }
    save();
    return Promise.resolve({ data: out, error: null }).then(res, rej);
  };
  var session = { access_token: 'playground', user: { id: ME, email: 'you@playground' } };
  window.supabase = { createClient: function () { return {
    from: function (t) { return new Q(t); },
    rpc: function (name, args) {
      if (name === 'sign_my_contract') { var row = (D.contracts || []).filter(function (x) { return x.user_id === ME; })[0]; if (!row || row.status !== 'sent') return Promise.resolve({ data: null, error: { message: 'No agreement waiting to be signed' } }); var t = new Date().toISOString(); row.signed = { client: args.sig, terms: row.terms }; row.signed_at = t; row.status = 'signed'; row.updated_at = t; save(); return Promise.resolve({ data: t, error: null }); }
      if (me && name === 'update_my_profile' && args && args.new_name) me.full_name = args.new_name;
      if (me) { me.last_seen_at = new Date().toISOString(); save(); }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getSession: function () { return Promise.resolve({ data: { session: session } }); },
      signInWithOtp: function () { return Promise.resolve({ error: null }); },
      verifyOtp: function () { return Promise.resolve({ data: { session: session }, error: null }); },
      signOut: function () { return Promise.resolve({}); },
      signInWithPassword: function () { return Promise.resolve({ data: { session: session }, error: null }); },
      updateUser: function (u) { if (u && u.email && me) { me.email = u.email; save(); } return Promise.resolve({ data: {}, error: null }); }
    }
  }; } };

  // Pretend Google Calendar: weekly 1:1s with Example: Anna (one missing next booking), plus a couple of other appointments
  var realFetch = window.fetch;
  window.fetch = function (url, opts) {
    // Pretend "lead" function: the waitlist page + application save into the pretend leads list (no emails really sent)
    if (String(url).indexOf('/.netlify/functions/lead') >= 0) {
      var L = D.leads || (D.leads = []), reply = function (o, code) { save(); return Promise.resolve(new Response(JSON.stringify(o), { status: code || 200, headers: { 'content-type': 'application/json' } })); };
      if (!opts || !opts.method || opts.method === 'GET') { var lid = new URL(String(url), location.href).searchParams.get('l'); var hit = L.filter(function (x) { return x.id === lid; })[0]; return reply(hit ? { ok: true, lead: hit } : { ok: false }, hit ? 200 : 404); }
      var b = {}; try { b = JSON.parse(opts.body || '{}'); } catch (e) {}
      var em = String(b.email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return reply({ ok: false, error: 'Please check your email address.' }, 400);
      var cur = L.filter(function (x) { return (b.id && x.id === b.id) || x.email === em; })[0];
      if (!cur) { cur = { id: 'lead-' + (D.seq++) + '-' + Math.random().toString(16).slice(2, 10), email: em, tags: [], interests: [], created_at: new Date().toISOString(), source: b.kind === 'apply' ? 'application' : 'waitlist page' }; L.unshift(cur); }
      ['first_name', 'last_name', 'phone', 'country'].forEach(function (k) { if (b[k]) cur[k] = String(b[k]).trim(); }); cur.email = em;
      (b.interests || []).forEach(function (x) { if (cur.interests.indexOf(x) < 0) cur.interests.push(x); });
      var TF = { community: 'waitlist', group: 'group enquiry', '1:1': '1:1 enquiry' };
      if (b.kind !== 'apply' && cur.tags.indexOf('waitlist') < 0) cur.tags.push('waitlist');
      cur.interests.forEach(function (x) { if (TF[x] && cur.tags.indexOf(TF[x]) < 0) cur.tags.push(TF[x]); });
      if (b.kind === 'apply') { cur.application = b.answers || {}; cur.applied_at = new Date().toISOString(); } else if (!cur.welcomed_at) cur.welcomed_at = new Date().toISOString();
      if (window.BT_LEADSCORE) { var sc = window.BT_LEADSCORE.score(cur); cur.score = sc.score; cur.heat = sc.heat; }
      return reply({ ok: true, id: cur.id, apply: 'apply.html?l=' + cur.id, demo: true });
    }
    if (String(url).indexOf('/.netlify/functions/calendar') >= 0) {
      var ev = [], day = 86400000, base = new Date(); base.setUTCHours(0, 0, 0, 0);
      [-15, -8, -1].forEach(function (d, i) { var t = new Date(base.getTime() + d * day + 0 * 3600000); ev.push({ id: 'demo-anna-' + i, start: t.toISOString(), end: new Date(t.getTime() + 3600000).toISOString(), title: '1:1 Breakthrough session: Anna', attendees: ['example.anna@sample.test'], location: 'Zoom' }); });
      ev.push({ id: 'demo-tyler-1', start: new Date(base.getTime() - 2 * 3600000).toISOString(), end: new Date(base.getTime() - 1 * 3600000).toISOString(), title: '1:1 Breakthrough session: Tyler Auld', attendees: ['tylerwilliamauld@hotmail.com'], location: 'Zoom' });
      ev.push({ id: 'demo-tyler-2', start: new Date(base.getTime() + 7 * day - 2 * 3600000).toISOString(), end: new Date(base.getTime() + 7 * day - 1 * 3600000).toISOString(), title: '1:1 Breakthrough session: Tyler Auld', attendees: ['tylerwilliamauld@hotmail.com'], location: 'Zoom' });
      ev.push({ id: 'demo-group-1', start: new Date(base.getTime() + 2 * day + 7 * 3600000).toISOString(), end: new Date(base.getTime() + 2 * day + 8 * 3600000).toISOString(), title: 'Breakthrough group coaching call', attendees: [], location: 'Zoom' });
      ev.push({ id: 'demo-me-1', start: new Date(base.getTime() + 1 * day + 23 * 3600000).toISOString(), end: new Date(base.getTime() + 1 * day + 24 * 3600000).toISOString(), title: '1:1 session: Sav (playground)', attendees: ['you@playground'], location: 'Zoom' });
      return Promise.resolve(new Response(JSON.stringify({ events: ev, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    // Pretend Stripe + Shopify: Anna's first instalment paid, her second one failed, plus a couple of course sales
    // Pretend Vimeo: three videos named like lessons, with captions
    if (String(url).indexOf('/.netlify/functions/vimeo') >= 0) {
      var vids = [{ id: '910000000', name: '0. Setting up for success - INTRO', link: 'https://vimeo.com/910000000', duration: 120 }, { id: '910000001', name: '1. Setting up for success -  STEP 1 - Visual Anchors', link: 'https://vimeo.com/910000001', duration: 150 }, { id: '910000002', name: '2. Setting up for success - Time Block', link: 'https://vimeo.com/910000002', duration: 180 }, { id: '910000003', name: '3. Setting up for success - Habit Stack', link: 'https://vimeo.com/910000003', duration: 210 }, { id: '910000004', name: '4. Setting up for success -  Road Block', link: 'https://vimeo.com/910000004', duration: 240 }, { id: '910000005', name: '5. Setting up for success -  Accountability', link: 'https://vimeo.com/910000005', duration: 270 }, { id: '910000006', name: '6. Setting up for success - Gold Stars', link: 'https://vimeo.com/910000006', duration: 300 }, { id: '910000007', name: '7. Setting up for success - Be kind', link: 'https://vimeo.com/910000007', duration: 330 }, { id: '910000008', name: '8. Setting up for success - Ripple Effect', link: 'https://vimeo.com/910000008', duration: 360 }, { id: '900000001', name: 'Lesson 1: Welcome', link: 'https://vimeo.com/900000001', duration: 545 }, { id: '900000002', name: 'WEEK 1 - 1. Brain and Body', link: 'https://vimeo.com/900000002', duration: 1320 }, { id: '900000003', name: 'WEEK 1 - 2 Concious + Unconscious', link: 'https://vimeo.com/900000003', duration: 1105 }, { id: '900000004', name: 'BT. Diaphragmatic breathing Exercise - Voiceover', link: 'https://vimeo.com/900000004', duration: 300 }];
      var tr = { '900000001': 'Welcome to Breakthrough. I am so proud of you for being here. In this program we rewire the beliefs that keep you stuck, so you can finally follow through without burning out.', '900000002': 'Your brain and body are one system. When you feel overwhelmed, your nervous system is trying to keep you safe. Today we look at why procrastination is protection, not laziness.', '900000003': 'Your unconscious mind runs most of your day. The programs you picked up as a kid still drive your choices, especially around money, rest and saying no.' };
      var want = []; try { want = JSON.parse((opts && opts.body) || '{}').want || []; } catch (e) {}
      var tsx = {}; want.forEach(function (id) { if (tr[id]) tsx[id] = tr[id]; });
      return Promise.resolve(new Response(JSON.stringify({ videos: vids, transcripts: tsx, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    // Pretend Zoom: summaries, transcripts and recordings for Anna's past sessions
    if (String(url).indexOf('/.netlify/functions/zoom') >= 0) {
      var ss = []; try { ss = JSON.parse((opts && opts.body) || '{}').sessions || []; } catch (e) {}
      var found = {}; ss.forEach(function (x, i) { found[x.key] = { topic: '1:1 Breakthrough session', video: 'https://zoom.us/rec/share/demo-' + i, summary: 'Quick recap\nAnna worked through her biggest roadblock: starting things late at night when her energy dips. We reframed it as her nervous system looking for safety, not laziness.\n\nNext steps:\n• Anna: try the 5-minute start before 3pm on 3 days\n• Anna: notice and write down the “I’ll do it later” thought\n• Sav: send the vagal tone exercise', transcript: 'Savannah: How did this week go?\nAnna: Honestly, better than I thought. I did the reps three times.\nSavannah: Amazing. What got in the way on the other days?' }; });
      return Promise.resolve(new Response(JSON.stringify({ found: found, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    if (String(url).indexOf('/.netlify/functions/payments') >= 0) {
      var dd = function (n, h) { var t = new Date(Date.now() - n * 86400000); t.setHours(h || 10, 0, 0, 0); return t.toISOString(); };
      var items = [
        { id: 'ch_demo1', src: 'Stripe', date: dd(16), amount: 1275, currency: 'AUD', status: 'paid', email: 'example.anna@sample.test', name: 'Anna Example', desc: 'Breakthrough 1:1 · payment 1 of 4' },
        { id: 'ch_demo2', src: 'Stripe', date: dd(2), amount: 1275, currency: 'AUD', status: 'failed', email: 'example.anna@sample.test', name: 'Anna Example', desc: 'Breakthrough 1:1 · payment 2 of 4', reason: 'Your card was declined.' },
        { id: 'ch_demo3', src: 'Stripe', date: dd(5), amount: 297, currency: 'AUD', status: 'paid', email: 'jess.course@sample.test', name: 'Jess Sample', desc: 'Breakthrough self-paced course (Stan Store)' },
        { id: 'shp_demo4', src: 'Shopify', date: dd(9), amount: 47, currency: 'AUD', status: 'paid', email: 'kim.shop@sample.test', name: 'Kim Sample', desc: '#1042 · Money Magic' },
        { id: 'shp_demo5', src: 'Shopify', date: dd(9, 14), amount: 47, currency: 'AUD', status: 'paid', email: 'lee.shop@sample.test', name: 'Lee Sample', desc: '#1043 · Money Magic' },
        { id: 'shp_demo6', src: 'Shopify', date: dd(9, 19), amount: 29, currency: 'AUD', status: 'paid', email: 'max.shop@sample.test', name: 'Max Sample', desc: '#1044 · Journal prompts' },
        { id: 'shp_demo7', src: 'Shopify', date: dd(3, 11), amount: 47, currency: 'AUD', status: 'paid', email: 'ola.shop@sample.test', name: 'Ola Sample', desc: '#1045 · Money Magic' },
        { id: 'shp_demo8', src: 'Shopify', date: dd(40), amount: 94, currency: 'AUD', status: 'paid', email: 'pip.shop@sample.test', name: 'Pip Sample', desc: '#1031 · Money Magic x2' },
        { id: 'ch_demo9', src: 'Stripe', date: dd(45), amount: 297, currency: 'AUD', status: 'paid', email: 'quinn.course@sample.test', name: 'Quinn Sample', desc: 'Breakthrough self-paced course' }
      ];
      return Promise.resolve(new Response(JSON.stringify({ stripe: { connected: true }, shopify: { connected: true }, items: items, demo: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return realFetch.apply(this, arguments);
  };

  // Wipe everything and start the playground fresh (used by the launcher)
  window.BT_DEMO_RESET = function () {
    var keep = [];
    for (var i = 0; i < localStorage.length; i++) keep.push(localStorage.key(i));
    keep.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  };

  // Links between app pages go back through the playground launcher, which shows the next page
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !window.parent || window.parent === window || !window.parent.BT_OPEN) return;
    var href = a.getAttribute('href') || '';
    // in-page links (#Course, #Lesson-…): the playground frame has a <base> tag, so do these by hand
    if (href.charAt(0) === '#') { if (href.length > 1) { e.preventDefault(); if (location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = href; } return; }
    if (/^(https?:|mailto:|tel:|data:|blob:)/.test(href) || /\.dc\.html$/.test(href)) return;
    if (!/(\.html|^\.{0,2}\/?)([?#].*)?$/.test(href)) return;
    e.preventDefault(); e.stopPropagation();
    var abs = new URL(href, document.baseURI).href, root = window.parent.BT_ROOT || '';
    window.parent.BT_OPEN(abs.indexOf(root) === 0 ? abs.slice(root.length) : href);
  }, true);

  // Videos can't play inside a Claude artifact, so open them in a new tab instead
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && /youtu\.?be|vimeo\.com|loom\.com|mediadelivery\.net/.test(a.href)) { e.stopPropagation(); a.target = '_blank'; a.rel = 'noopener'; }
  }, true);

  // Inside the playground launcher the bar at the top already leads back; on its own, show a small tag.
  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var a = document.createElement('span');
    a.textContent = 'PLAYGROUND';
    a.setAttribute('style', 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;padding:4px 14px;border-radius:0 0 12px 12px;background:#F4C2F7;color:#1F1412;font:600 11.5px Poppins,system-ui,sans-serif;letter-spacing:.05em;border:1px solid #1F1412;border-top:0;pointer-events:none');
    document.body.appendChild(a);
  });
})();
