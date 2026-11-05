// The "journey" emails Sav approved on 5 Nov 2026, sent by themselves (hourly, live site only):
//   4  App still waiting      2 days after the welcome email, if they still haven't logged in (once)
//   5  Agreement ready        when their agreement is sent, plus one reminder 3 days later if it's unsigned
//   6  Two sleeps to go       2 days before their first 1:1, only if their set-up isn't finished (once)
//   13 Your week              Sundays at 6pm their time, only if they were in the app that week
//   14 Week complete          each time they finish every lesson in a week (once per week)
//   15 Halfway                when half the lessons are done (once)
//   16 Checking in            7 days with nothing done; a softer one at 14 days; then emails stop (until they're back)
//   17 You finished           when every lesson is done (once)
// Rules: only between 9am and 7pm their time, at most one of these a day (the agreement doesn't count),
// and never anything made up: every number, win and quote comes from what they've done in the app.
// The very first run only takes notes (marks what's already true as sent), so nobody gets a pile of
// catch-up emails the day this switches on. What was sent lives in client_data 'bt-mail-log'.
const push = require('./push');
const E = require('./emails');
const j = (r) => r.json().catch(() => []);
const DAY = 864e5;
const FROM = () => process.env.EMAIL_FROM || 'Savannah <hello@colourmeneurospicy.com.au>';

function parse(v) { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { return null; } }
function first(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
function hourIn(tz, t) { try { return Number(new Intl.DateTimeFormat('en-AU', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date(t))); } catch (e) { return -1; } }
function dowIn(tz, t) { try { return new Intl.DateTimeFormat('en-AU', { timeZone: tz, weekday: 'short' }).format(new Date(t)); } catch (e) { return ''; } }
function dayIn(tz, t) { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t)); } catch (e) { return new Date(t).toISOString().slice(0, 10); } }
async function setting(key) { const r = await push.svc('app_settings?select=value&key=eq.' + key).then(j); return r && r[0] ? r[0].value : null; }
async function saveSetting(key, value) { return push.svc('app_settings?on_conflict=key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }]) }); }
async function sendMail(to, m) {
  if (!process.env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM(), to: [to], reply_to: 'savannah@colourmeneurospicy.com.au', subject: m.subject, html: m.html }) });
  return r.ok;
}

// ---- what someone has done, from their saved app data ----
function lessonsOf(course) {
  const out = [];
  ((course && course.weeks) || []).forEach(w => (w.lessons || []).forEach(l => { if (!l.optional) out.push({ w, l, act: /^Activity:/i.test(l.title || '') || (!l.vimeo && !l.video && (l.res || []).length > 0) }); }));
  return out;
}
function doneAt(prog, id) { const d = (prog.doneAt || {})[id] || (prog.done || {})[id]; return typeof d === 'number' ? d : d ? 1 : 0; }
function evidence(pd) { return ((pd && pd.evidence) || []).map(e => Object.assign({ at: Number(e.id) || Date.parse(e.date) || 0 }, e)).filter(e => e.text); }
function repDays(vw, from) {
  return Object.keys((vw && vw.days) || {}).filter(k => { const v = vw.days[k] || {}, t = Date.parse(k.replace(/-(\d)(?=-|$)/g, '-0$1')); return (!from || t >= from - DAY) && (v.filled || ['dose', 'breathe', 'pause', 'move', 'water', 'win'].some(p => v[p] && (v[p].done || v[p].ml || v[p].level))); }).length;
}
function streak(vw, tz, now) {
  const days = (vw && vw.days) || {}; let n = 0;
  for (let i = 0; i < 400; i++) {
    const t = now - i * DAY, k = dayIn(tz, t).split('-').map(Number).join('-'), v = days[k];
    const on = v && (v.filled || ['dose', 'breathe', 'pause', 'move', 'water', 'win'].some(p => v[p] && (v[p].done || v[p].ml || v[p].level)));
    if (on) n++; else if (i > 0) break;
  }
  return n;
}
function flipsOf(pd) { return ((pd && pd.ownBeliefs) || []).filter(b => b && b.b && b.t).slice(0, 3).map(b => [b.b, b.t]); }
function clip(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; }

async function run(opts) {
  opts = opts || {};
  const now = opts.now || Date.now(), dry = !!opts.dry;
  const baseline = !(await setting('mailBaseline'));
  const course = await setting('course');
  const L = lessonsOf(course), total = L.length || 1;
  const sent = [];

  // ---- 4: still waiting (added, welcome sent, never logged in) ----
  const [invites, profs] = await Promise.all([push.svc('invites?select=*').then(j), push.svc('profiles?select=id,email,full_name,tier,status,is_admin,program_start,created_at,last_seen_at').then(j)]);
  const haveProfile = {}; (profs || []).forEach(p => { if (p.email) haveProfile[p.email.toLowerCase()] = 1; });
  const invLog = (await setting('mailLogInvites')) || {};
  for (const i of invites || []) {
    const em = String(i.email || '').toLowerCase(); if (!em || haveProfile[em] || invLog[em] || !i.welcome_sent_at) continue;
    if (now - Date.parse(i.welcome_sent_at) < 2 * DAY) continue;
    if (!baseline) { const m = E.notOpenedEmail({ first: first(i.full_name), tier: i.tier === 'self_paced' ? 'self' : '', site: E.SITE }); if (!dry && await sendMail(em, m)) sent.push({ to: em, what: 'app still waiting' }); else if (dry) sent.push({ to: em, what: 'app still waiting (dry run)' }); }
    invLog[em] = now;
  }
  if (!dry) await saveSetting('mailLogInvites', invLog);

  // ---- everyone who's logged in ----
  const people = (profs || []).filter(p => !p.is_admin && p.status !== 'past' && p.email);
  if (!people.length) { if (baseline && !dry) await saveSetting('mailBaseline', now); return { baseline, sent }; }
  const ids = people.map(p => p.id);
  const [rows, contracts] = await Promise.all([
    push.svc('client_data?select=user_id,key,value&user_id=in.(' + ids.join(',') + ')&key=in.(bt-mail-log,bt-course,program-decoder-v1,bt-vwork,cmn-companion,cmn-1to1-dashboard,cmn-rep-results,bt-profile,bt-tz)').then(j),
    push.svc('contracts?select=user_id,status,terms,signed&user_id=in.(' + ids.join(',') + ')').then(j)
  ]);
  const data = {}; (rows || []).forEach(r => { (data[r.user_id] = data[r.user_id] || {})[r.key] = parse(r.value); });
  const ctOf = {}; (contracts || []).forEach(c => { ctOf[c.user_id] = c; });
  // first 1:1 calls, from Sav's calendar (for "two sleeps to go")
  let calls = [];
  if (process.env.GCAL_ICS_URL) { try { calls = await require('../functions/call-reminders').calls(now - 120 * DAY, now + 3 * DAY); } catch (e) { calls = []; } }

  for (const p of people) {
    const d = data[p.id] || {}, log = Object.assign({}, d['bt-mail-log'] || {}), prof = d['bt-profile'] || {};
    const tz = prof.tz || (typeof d['bt-tz'] === 'string' ? d['bt-tz'] : '') || 'Australia/Brisbane';
    const prog = d['bt-course'] || {}, pd = d['program-decoder-v1'] || {}, vw = d['bt-vwork'] || {}, comp = d['cmn-companion'] || {}, one = d['cmn-1to1-dashboard'] || {};
    const tier = p.tier === 'self_paced' ? 'self' : '', name = first(p.full_name), base = { first: name, tier, site: E.SITE, real: true };
    const hour = hourIn(tz, now), daytime = hour >= 9 && hour < 19, today = dayIn(tz, now);
    const due = [];   // [key, build, essential]
    const ct = ctOf[p.id];
    // 5: agreement ready (+ one reminder after 3 days)
    if (ct && ct.status === 'sent') {
      if (!log.agree) due.push(['agree', () => E.agreementEmail(Object.assign({}, base)), true]);
      else if (!log.agree2 && now - log.agree > 3 * DAY) due.push(['agree2', () => E.agreementEmail(Object.assign({ reminder: true }, base)), true]);
    }
    // progress
    const doneList = L.filter(x => doneAt(prog, x.l.id)), nDone = doneList.length;
    const ev = evidence(pd), wins = ev.filter(e => e.win);
    // 17: finished everything
    if (L.length && nDone >= L.length && !log.complete) due.push(['complete', () => E.completeEmail(Object.assign({ data: { lessons: L.filter(x => !x.act).length, acts: L.filter(x => x.act).length, proof: ev.length, reps: repDays(vw), then: [], now: [], flips: flipsOf(pd) } }, base))]);
    // 14: each week finished
    ((course && course.weeks) || []).forEach((w, wi) => {
      const ls = L.filter(x => x.w === w); if (!w.week || !ls.length || !ls.every(x => doneAt(prog, x.l.id)) || log['wk' + w.week]) return;
      const nxt = ((course.weeks || [])[wi + 1]) || null, from = Math.min.apply(null, ls.map(x => doneAt(prog, x.l.id) || now)) - 7 * DAY;
      const hl = ls.map(x => Object.keys(comp.j || {}).filter(k => k.indexOf(x.l.id + '_') === 0).map(k => comp.j[k]).filter(Boolean)[0]).filter(Boolean)[0];
      due.push(['wk' + w.week, () => E.moduleCompleteEmail(Object.assign({ data: {
        week: w.week, title: w.title || '', next: nxt ? 'Week ' + nxt.week + (nxt.title ? ' · ' + nxt.title : '') : '',
        lessons: ls.filter(x => !x.act).map(x => String(x.l.title || '').replace(/^Lesson \d+:\s*/i, '')), acts: ls.filter(x => x.act).map(x => [((x.l.res || [])[0]) || 'setup', String(x.l.title || '').replace(/^Activity:\s*/i, ''), '']),
        wins: wins.filter(e => e.at >= from).slice(0, 3).map(e => clip(e.text, 140)), reps: repDays(vw, from), proof: ev.filter(e => e.at >= from).length, streak: streak(vw, tz, now), highlight: hl ? clip(hl, 220) : '' } }, base))]);
    });
    // 15: halfway
    if (L.length > 4 && nDone >= L.length / 2 && nDone < L.length && !log.half) due.push(['half', () => E.milestoneEmail(Object.assign({ data: { done: nDone, total: L.length, proof: ev.length, flips: flipsOf(pd) } }, base))]);
    // 6: two sleeps until the first 1:1, if set-up isn't finished
    if (p.tier === 'private' && !log.prep) {
      const mine = calls.filter(c => c.kind === '1:1' && c.who.some(w => w.id === p.id)).sort((a, b) => a.ev.ms - b.ev.ms);
      const firstCall = mine[0];
      if (firstCall && firstCall.ev.ms > now + 36 * 3600e3 && firstCall.ev.ms < now + 60 * 3600e3) {
        const rep = d['cmn-rep-results'];
        const st = { home: !!one.homeSaved, agree: !!(ct && ct.status === 'signed'), wa: !!one.wa, tests: !!(((rep && rep.ranks) || one.repDone || one.repImg) && one.hd && one.disc), mini: !!doneAt(prog, 'i3'), intent: !!(comp.intention || comp.nsToward || comp.anchor) };
        if (Object.keys(st).some(k => !st[k])) due.push(['prep', () => E.firstCallPrepEmail(Object.assign({ start: firstCall.ev.start, tz, status: st }, base))]);
      }
    }
    // 16: checking in after 7 quiet days, softer at 14, then stop (resets when they're back)
    const lastAt = Math.max(Number(prog.lastAt) || 0, Date.parse(p.last_seen_at || '') || 0, ...ev.map(e => e.at || 0)) || Date.parse(p.created_at) || now;
    if (log.miss1 && lastAt > log.miss1) { delete log.miss1; delete log.miss2; }
    const quiet = Math.floor((now - lastAt) / DAY);
    if (quiet >= 7 && quiet < 14 && !log.miss1) due.push(['miss1', () => E.missYouEmail(Object.assign({ why: clip(comp.intention || '', 160) }, base))]);
    else if (quiet >= 14 && log.miss1 && !log.miss2) due.push(['miss2', () => E.missYouEmail(Object.assign({ why: clip(comp.intention || '', 160), second: true }, base))]);
    // 13: Sunday 6pm their time, if they were in the app this week
    if (dowIn(tz, now) === 'Sun' && hour === 18 && log.weekly !== today && now - lastAt < 7 * DAY) {
      const from = now - 7 * DAY, nx = L.find(x => !doneAt(prog, x.l.id));
      due.push(['weekly', () => E.weeklyEmail(Object.assign({ data: { done: nDone, total: L.length || 1, week: nx ? (nx.w.week === 0 ? 'Introduction' : 'Week ' + nx.w.week + (nx.w.title ? ' · ' + nx.w.title : '')) : 'All done!', next: nx ? nx.l.title : '',
        thisWeek: L.filter(x => doneAt(prog, x.l.id) >= from).length, reps: repDays(vw, from), proof: ev.filter(e => e.at >= from).length, win: (wins.filter(e => e.at >= from)[0] || {}).text || '' } }, base)), false, 'today']);
    }

    if (!due.length) continue;
    let changed = false, oneSent = log.lastDay === today;
    for (const job of due) {
      const key = job[0], essential = job[2];
      if (baseline && key !== 'weekly') { log[key] = now; if (key === 'miss1') log.miss2 = now; if (key === 'agree') log.agree2 = now; changed = true; continue; }   // first run: just take notes
      if (!daytime || (!essential && oneSent)) continue;
      const m = job[1]();
      log[key] = job[3] === 'today' ? today : now; changed = true;
      if (!essential) { oneSent = true; log.lastDay = today; }
      if (key === 'complete') { ((course && course.weeks) || []).forEach(w => { if (w.week) log['wk' + w.week] = log['wk' + w.week] || now; }); log.half = log.half || now; }   // the big one covers the week + halfway ones
      // save before sending, so a retry can never double-send
      if (!dry) {
        const sv = await push.svc('client_data?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ user_id: p.id, key: 'bt-mail-log', value: JSON.stringify(log), updated_at: new Date().toISOString() }]) });
        if (!sv.ok) break;
        changed = false;
        if (await sendMail(p.email, m)) sent.push({ to: p.full_name || p.email, what: key });
      } else sent.push({ to: p.full_name || p.email, what: key + ' (dry run)', subject: m.subject });
    }
    if (changed && !dry) await push.svc('client_data?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ user_id: p.id, key: 'bt-mail-log', value: JSON.stringify(log), updated_at: new Date().toISOString() }]) });
  }
  if (baseline && !dry) await saveSetting('mailBaseline', now);
  return { baseline, sent };
}
module.exports = { run, lessonsOf };
