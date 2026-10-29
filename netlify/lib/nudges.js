// What each client gets at their reminder hour: ONE notification a day at most, chosen kindly.
//   1. Come back to the course: only on day 3, 7, 14, 21 and 30 since they last opened a lesson,
//      then every 15 days. Uses their own why, North Star and anchor word, so it feels like a hug, not a nag.
//   2. Otherwise, Today's reps: once their reps have switched on and they haven't ticked any off today.
//      Tapping it opens Home at the reps card.
//   3. Otherwise (reps not switched on yet, early Week 1): a gentle 1% nudge, unless they've already been in a lesson today.
// Shared by the hourly sender and the coach dashboard preview, so what Sav sees is what clients get.
const COMEBACK_DAYS = [3, 7, 14, 21, 30];
const REPS = [
  ['Today’s reps 💪', 'One tap each: DOSE, breathe, pause, move. That’s you rewiring, one rep at a time.'],
  ['Have you done your reps? ✨', 'Thirty seconds to tick off what you did today. Every tick is proof you’re growing.'],
  ['Little reps, big change 🌱', 'Even one counts. Open your reps and tick off what you did today.'],
  ['Your daily evidence 💛', 'Tick today’s reps and watch your calendar fill up. You’re doing the work.']
];
const GENTLE = [
  ['Your 1% for today 💛', 'Five minutes counts. Open Breakthrough and do one small thing.'],
  ['Hey you ✨', 'Small and done beats big and someday. Your next step is waiting.'],
  ['Come back to you 🌿', 'A few minutes in Breakthrough today. Slower and deeper always wins.']
];
function clip(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; }
function comebackDue(days) { if (days < 3) return false; if (COMEBACK_DAYS.indexOf(days) >= 0) return true; return days > 30 && (days - 30) % 15 === 0; }
function comeback(days, who) {
  const first = who.first ? who.first + ', ' : '', why = clip(who.why, 90), toward = clip(who.toward, 80), anchor = clip(who.anchor, 30);
  if (days <= 3) return { title: first + 'your next lesson is waiting ✨', body: why ? 'Remember why you started: “' + why + '”. Five minutes is enough.' : 'Five minutes is enough to keep the momentum going. Pick up right where you left off.' };
  if (days <= 7) return { title: 'Future you says hi 💛', body: toward ? 'Remember who you’re becoming: “' + toward + '”. She’s built one small step at a time. Ready for the next one?' : 'Who you’re becoming is built one small step at a time. Ready for the next one?' };
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
  const repsOn = !!(vw.repsUnlocked || (dose.plan || []).length || done.w1a4 || done.w1a3 || done.w1a5 || done.w1a6);
  const today = (vw.days || {})[dayKey(now, tz)] || {};
  const ticked = ['dose', 'breathe', 'pause', 'move', 'water', 'win'].some(p => today[p] && (today[p].done || today[p].ml || today[p].level)) || !!today.filled;
  if (repsOn && !ticked) { const l = REPS[n % REPS.length]; return { kind: 'reps', title: l[0], body: l[1], url: '/?go=reps#Dashboard' }; }
  if (repsOn && ticked) return null; // already did their reps today: nothing to say
  if (days === 0) return null; // already opened a lesson today: nothing to nudge
  const g = GENTLE[n % GENTLE.length]; return { kind: 'gentle', title: g[0], body: g[1], url: '/#Course' };
}
module.exports = { pick, comeback, comebackDue, REPS, GENTLE, COMEBACK_DAYS };
