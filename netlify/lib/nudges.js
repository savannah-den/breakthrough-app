// What each client gets at their reminder hour: ONE notification a day at most, chosen kindly.
//   1. Come back to the course: only on day 3, 7, 14, 21 and 30 since they last opened a lesson,
//      then every 15 days. Uses their own why, North Star and anchor word, so it feels like a hug, not a nag.
//   2. In their Energy Audit week (the 7 days after they finish the Energy Audit lesson, w2a2): if they haven't
//      logged at least 3 blocks today, a reminder to add their day in. Tapping it opens the Energy Audit.
//   2b. New patterns in their Energy Audit they haven't looked at: a nudge that opens the Audit tab.
//   2c. Coming Home: every 3rd day, a nudge about the few-times-a-month things on their plan they haven't done yet this month.
//   3. Otherwise, Today's reps: once their reps have switched on and they haven't ticked any off today.
//      Tapping it opens Home at the reps card.
//   4. Otherwise (reps not switched on yet, early Week 1): a gentle 1% nudge, unless they've already been in a lesson today.
// Shared by the hourly sender and the coach dashboard preview, so what Sav sees is what clients get.
const COMEBACK_DAYS = [3, 7, 14, 21, 30];
const REPS = [
  ['Today’s reps 💪', 'One tap each: DOSE, breathe, pause, move. That’s you rewiring, one rep at a time.'],
  ['Have you done your reps? ✨', 'Thirty seconds to tick off what you did today. Every tick is proof you’re growing.'],
  ['Little reps, big change 🌱', 'Even one counts. Open your reps and tick off what you did today.'],
  ['Your daily evidence 💛', 'Tick today’s reps and watch your calendar fill up. You’re doing the work.']
];
const ENERGY = [
  ['Add your day in 🔋', 'Day {d} of your Energy Audit. What drained you and what filled you back up? Log your blocks, then see if you can balance your day.'],
  ['How’s your battery? 🔋', 'Day {d} of 7. Pop today’s blocks into your Energy Audit. Every day you log makes your patterns sharper.'],
  ['Can you balance your day? ⚖️', 'Day {d} of your Energy Audit. Log what you did, and I’ll suggest a 20-minute recharge if you need one.']
];
function padKey(t, tz) { try { const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(t)); const g = k => p.find(x => x.type === k).value; return g('year') + '-' + g('month') + '-' + g('day'); } catch (e) { return new Date(t).toISOString().slice(0, 10); } }
const GENTLE = [
  ['Your 1% for today 💛', 'Five minutes counts. Open Breakthrough and do one small thing.'],
  ['Hey you ✨', 'Small and done beats big and someday. Your next step is waiting.'],
  ['Come back to you 🌿', 'A few minutes in Breakthrough today. Slower and deeper always wins.']
];
// the Coming Home activities people pick for a few times a month (the longer ones)
const CH_NAMES = {"sigh": "Physiological sigh", "ribs": "Rib cage breath", "box": "Box breathing", "legs": "Leg strokes", "fingers": "Fingertip press", "energyreel": "My quick energy reset", "handrub": "Hand massage", "feet": "Feet on the floor", "five": "Five senses check-in", "fivefour": "5-4-3-2-1", "sip": "Taste the sip", "narrate": "Narrate the room", "mug": "Warm hands", "shoulders": "Shoulder rolls", "redlight": "Red-light reset", "pocket": "Texture in your pocket", "scent": "Scent anchor", "hum": "Hum it out", "brush": "Toothbrush sway", "microdance": "Microwave dance", "shake": "Shake it off", "stretch": "Big stretch and yawn", "heart": "Hand on heart", "conveyor": "Conveyor belt meditation", "dump": "Brain dump page", "humbreak": "Hum-along brain break", "grass": "Barefoot on the grass", "walk": "Five-senses walk", "clouds": "Cloud watching", "cuppa": "Mindful cuppa", "disco": "Kitchen disco", "sing": "Sing at full volume", "floorstretch": "Floor stretch flow", "lotion": "Lotion massage", "pat": "Pat an animal", "weighted": "Weighted blanket rest", "colouring": "Colouring in", "doodle": "Doodle or zentangle", "clay": "Clay or playdough", "yarn": "Knit, crochet or stitch", "cook": "Cook with your hands", "garden": "Hands in the dirt", "yoga": "Yoga class", "pilates": "Pilates class", "workout": "Gym or home workout", "danceclass": "Dance class", "swim": "Swim or ocean dip", "bushwalk": "Nature walk or bushwalk", "massage": "Massage", "bodywork": "Reiki, acupuncture or acupressure", "bath": "Long bath", "breathwork": "Guided breathwork session", "soundbath": "Sound bath", "longmed": "20-minute meditation", "creativeclass": "Creative class"};
function clip(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; }
function comebackDue(days) { if (days < 3) return false; if (COMEBACK_DAYS.indexOf(days) >= 0) return true; return days > 30 && (days - 30) % 15 === 0; }
function comeback(days, who) {
  const first = who.first ? who.first + ', ' : '', why = clip(who.why, 90), toward = clip(who.toward, 80), anchor = clip(who.anchor, 30);
  if (days <= 3) return { title: first + 'your next lesson is waiting ✨', body: why ? 'Remember why you started: “' + why + '”. Five minutes is enough.' : 'Five minutes is enough to keep the momentum going. Pick up right where you left off.' };
  if (days <= 7) return { title: 'Future you says hi 💛', body: toward ? 'Remember who you’re becoming: “' + toward + '”. That person is built one small step at a time. Ready for the next one?' : 'Who you’re becoming is built one small step at a time. Ready for the next one?' };
  if (days <= 14) return { title: 'No catching up needed 🌿', body: 'No guilt, no pressure. Just the next small step.' + (anchor ? ' Your word: ' + anchor + '.' : '') };
  if (days <= 21) return { title: 'Still cheering for you 📣', body: why ? '“' + why + '” still matters. Your course is right where you left it.' : 'Your course is right where you left it, whenever you’re ready.' };
  return { title: 'Whenever you’re ready 💌', body: 'Life gets full. That’s okay. Your next lesson is here when you are' + (why ? ', and so is your why: “' + clip(why, 60) + '”' : '') + '.' };
}
function parse(v) { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { return null; } }
function dayKey(t, tz) { try { const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Australia/Brisbane', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(t)); const g = k => Number(p.find(x => x.type === k).value); return g('year') + '-' + g('month') + '-' + g('day'); } catch (e) { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); } }
// data: { 'bt-course': {...}, 'bt-vwork': {...}, 'bt-dose': {...}, 'cmn-companion': {...} }, name, created (ms), tz, now (ms)
function pick(data, opts) {
  const now = opts.now || Date.now(), tz = opts.tz, prog = parse(data['bt-course']) || {}, vw = parse(data['bt-vwork']) || {}, dose = parse(data['bt-dose']) || {}, comp = parse(data['cmn-companion']) || {};
  const last = Number(prog.lastAt) || opts.created || now;
  const days = Math.floor((now - last) / 864e5);
  const who = { first: String(opts.name || '').split(' ')[0], why: comp.intention, toward: comp.nsToward, anchor: comp.anchor };
  const n = Math.floor(now / 864e5);
  if (comebackDue(days)) { const m = comeback(days, who); return { kind: 'comeback', days, title: m.title, body: m.body, url: '/#Course' }; }
  const done = prog.done || {};
  // Energy Audit week: the 7 days after they finish the Energy Audit lesson
  const eaAt = Number((prog.doneAt || {}).w2a2) || 0;
  if (eaAt) {
    const eDay = Math.round((Date.parse(padKey(now, tz)) - Date.parse(padKey(eaAt, tz))) / 864e5) + 1;
    const ea = parse(data['bt-energy-v1']) || {}, eToday = (((ea.days || {})[padKey(now, tz)] || {}).blocks || []).length;
    if (eDay >= 1 && eDay <= 7 && eToday < 3) { const l = ENERGY[n % ENERGY.length]; return { kind: 'energy', title: l[0], body: l[1].replace('{d}', eDay), url: '/#Energy' }; }
  }
  // new patterns in their Energy Audit they haven't looked at yet: opens straight onto the Audit tab
  { const ea = parse(data['bt-energy-v1']) || {}, logged = Object.keys(ea.days || {}).filter(k => ((ea.days[k] || {}).blocks || []).length >= 3).length;
    if (logged >= 3 && (Number(ea.patSeen) || 0) < logged) return { kind: 'energy-patterns', title: 'I found patterns in your energy 👀', body: 'Your Energy Audit has something to show you: what drains you, what fills you up, and where your nervous system spent the week.', url: '/?go=ea-audit#Energy' }; }
  // Coming Home: the few-times-a-month things on their plan ("you wanted to go to pilates this month"), every 3rd day until they've done it once this month
  { const ch = parse(data['coming-home-v3']) || {}, mon = (padKey(now, tz) || '').slice(0, 7).split('-'), mk = Number(mon[0]) + '-' + Number(mon[1]);
    const sd = (parse(data['bt-ch-sched']) || {}).d || {}, booked = id => Object.keys(sd).some(k => k.indexOf(mk + '-') === 0 && sd[k] && (id in sd[k]));
    const left = ((ch.plan || {}).monthly || []).filter(id => !booked(id) && !(ch.monthKey === mk && [0, 1, 2].some(x => (ch.ticks || {})['m|' + mk + '|' + id + '|' + x])));
    const todayK = (padKey(now, tz) || '').split('-').map(Number).join('-'), bookedToday = Object.keys(sd[todayK] || {}).filter(id => sd[todayK][id] !== 1);
    if (bookedToday.length) { const nm = CH_NAMES[bookedToday[0]] || 'your Coming Home treat'; return { kind: 'coming-home-today', title: 'Today’s the day: ' + nm.toLowerCase() + ' 💛', body: 'You booked it in for today. Enjoy it, then tick it off in Your day.', url: '/#Dashboard' }; }
    if (left.length && n % 3 === 0) { const nm = CH_NAMES[left[n % left.length]] || 'your Coming Home treat'; return { kind: 'coming-home', title: 'You wanted to do ' + nm.toLowerCase() + ' this month 💛', body: 'It’s on your Coming Home plan. Have you booked it in yet? Pick a day on your month calendar so future you doesn’t have to remember.', url: '/#Dashboard' }; } }
  const repsOn = !!(vw.repsUnlocked || (dose.plan || []).length || done.w1a4 || done.w1a3 || done.w1a5 || done.w1a6);
  const today = (vw.days || {})[dayKey(now, tz)] || {};
  const ticked = ['dose', 'breathe', 'pause', 'move', 'water', 'win'].some(p => today[p] && (today[p].done || today[p].ml || today[p].level)) || !!today.filled;
  if (repsOn && !ticked) { const l = REPS[n % REPS.length]; return { kind: 'reps', title: l[0], body: l[1], url: '/?go=reps#Dashboard' }; }
  if (repsOn && ticked) return null; // already did their reps today: nothing to say
  if (days === 0) return null; // already opened a lesson today: nothing to nudge
  const g = GENTLE[n % GENTLE.length]; return { kind: 'gentle', title: g[0], body: g[1], url: '/#Course' };
}
module.exports = { pick, comeback, comebackDue, REPS, ENERGY, GENTLE, COMEBACK_DAYS };
