// Runs every 5 minutes (see netlify.toml). Looks at Sav's Google Calendar for 1:1 and group calls and reminds
// each client who's invited:
//   24 hours before: phone notification + email      2 hours before: phone notification + email
//   15 minutes before: phone notification + email
// Each email has a big "Join on Zoom" button using the Zoom link from the calendar invite.
// A client is matched to a call when their email is on the invite (or the match words Sav set on their page).
// Every reminder is logged on the client (client_data 'bt-call-log') so nobody gets the same one twice.
// Needs: GCAL_ICS_URL, SUPABASE_SERVICE_ROLE_KEY. Phone: VAPID keys. Email: RESEND_API_KEY + EMAIL_FROM.
// Scheduled runs only happen on the live site.
const push = require('../lib/push');
const { occurrences } = require('../lib/ics');
const { reminderEmail, whenText, SITE } = require('../lib/emails');

// Sav's group coaching room (used for every "CMS group" call in her calendar)
const GROUP_ROOM = '2567750438';
const GROUP_ZOOM = 'https://us06web.zoom.us/j/2567750438?pwd=pSXpuUGvDMULpFCMsaymxX3aywhMZ5.1&omn=86104303435';
const LEADS = [
  { k: '24h', ms: 24 * 3600e3, win: 40 * 60e3, email: true },
  { k: '2h', ms: 2 * 3600e3, win: 30 * 60e3, email: true },
  { k: '15m', ms: 15 * 60e3, win: 12 * 60e3, email: true }
];
const j = (r) => r.json().catch(() => []);

// every call between from and to, with the clients it belongs to
async function calls(from, to) {
  const r = await fetch(process.env.GCAL_ICS_URL); if (!r.ok) throw new Error('calendar ' + r.status);
  const evs = occurrences(await r.text(), from, to);
  if (!evs.length) return [];
  const [profs, coaches, contracts] = await Promise.all([
    push.svc('profiles?select=id,email,full_name,is_admin,status,tier,tags').then(j),
    push.svc('coach_clients?select=client_id,data').then(j),
    push.svc('contracts?select=user_id,terms,signed').then(j)
  ]);
  const match = {}; (coaches || []).forEach(c => { const m = ((c.data || {}).cal || {}).match; if (m) match[c.client_id] = String(m).toLowerCase().trim(); });
  const zoomOf = {}; (contracts || []).forEach(c => { const t = (c.signed && c.signed.terms) || c.terms || {}; if (t.call && t.call.zoom) zoomOf[c.user_id] = t.call.zoom; });
  const people = (profs || []).filter(p => !p.is_admin && p.status !== 'past' && p.email);
  // which clients are in the group calls: a Group or 1:1 program that's on now, or an agreement that includes group calls
  const termsOf = {}; (contracts || []).forEach(c => { termsOf[c.user_id] = (c.signed && c.signed.terms) || c.terms || {}; });
  const inGroup = p => (Array.isArray(p.tags) && p.tags.some(x => x && x.on && /^(group|1:1)$/i.test(String(x.t || '')))) || Number(((termsOf[p.id] || {}).group || {}).n) > 0;
  return evs.map(ev => {
    const t = ev.title.toLowerCase();
    // the CMS group call: "CMS group" in the title, or Sav's group Zoom room
    if (/cms\s*group/.test(t) || (ev.zoom || '').indexOf(GROUP_ROOM) >= 0) {
      const who = people.filter(p => ev.attendees.indexOf(p.email.toLowerCase()) >= 0 || inGroup(p));
      return { ev, who, kind: 'Group', zoom: ev.zoom || GROUP_ZOOM, zoomOf: {} };
    }
    const who = people.filter(p => {
      const em = p.email.toLowerCase(), ow = match[p.id], name = String(p.full_name || '').toLowerCase().trim();
      if (ow) return t.indexOf(ow) >= 0 || ev.attendees.indexOf(ow) >= 0;
      return ev.attendees.indexOf(em) >= 0 || (name.indexOf(' ') > 0 && t.indexOf(name) >= 0);
    });
    const kind = who.length > 1 || /group/.test(t) ? 'Group' : '1:1';
    return { ev, who, kind, zoom: ev.zoom || (who[0] && zoomOf[who[0].id]) || '', zoomOf };
  }).filter(c => c.who.length);
}
async function plan(now) {
  const list = await calls(now, now + 24 * 3600e3 + 5 * 60e3), jobs = [];
  list.forEach(c => LEADS.forEach(L => {
    const due = c.ev.ms - L.ms;
    if (now < due || now >= due + L.win) return;
    c.who.forEach(p => jobs.push({ ev: c.ev, L, p, kind: c.kind, zoom: c.ev.zoom || c.zoomOf[p.id] || '' }));
  }));
  return { jobs };
}

async function sendEmail(to, m) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Savannah <hello@colourmeneurospicy.com.au>', to: [to], reply_to: 'savannah@colourmeneurospicy.com.au', subject: m.subject, html: m.html }) });
  return r.ok;
}
function pushText(job, tz) {
  const w = whenText(job.ev.start, tz), what = job.kind === 'Group' ? 'group call' : '1:1 with Sav';
  const first = String(job.p.full_name || '').split(' ')[0];
  if (job.L.k === '24h') return { title: '📅 Tomorrow: your ' + what, body: w.time + ' ' + w.day + '. Tap for your Zoom link.' };
  if (job.L.k === '2h') return { title: '⏰ In 2 hours: your ' + what, body: 'At ' + w.time + '. Find a quiet spot' + (first ? ', ' + first : '') + '. Tap for your Zoom link.' };
  return { title: '🎥 Starting in 15 minutes', body: 'Your ' + what + ' is at ' + w.time + '. Tap to join on Zoom.' };
}

exports.calls = calls; exports.plan = plan; exports.pushText = pushText; exports.sendEmail = sendEmail;
exports.handler = async () => {
  if (!process.env.GCAL_ICS_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { statusCode: 200, body: 'not set up' };
  const now = Date.now();
  const { jobs } = await plan(now);
  if (!jobs.length) return { statusCode: 200, body: 'none due' };
  const ids = Array.from(new Set(jobs.map(x => x.p.id)));
  const [rows, subs] = await Promise.all([
    push.svc('client_data?select=user_id,key,value&user_id=in.(' + ids.join(',') + ')&key=in.(bt-call-log,bt-tz)').then(j),
    push.ready() ? push.svc('push_subs?select=endpoint,sub,tz,user_id&user_id=in.(' + ids.join(',') + ')').then(j) : []
  ]);
  const log = {}, tzOf = {};
  (rows || []).forEach(r => { if (r.key === 'bt-call-log') { try { log[r.user_id] = JSON.parse(r.value) || {}; } catch (e) { log[r.user_id] = {}; } } else if (r.value) tzOf[r.user_id] = r.value; });
  (subs || []).forEach(s => { if (s.tz && !tzOf[s.user_id]) tzOf[s.user_id] = s.tz; });
  const changed = {}, todo = []; let nPush = 0, nMail = 0;
  jobs.forEach(job => {
    const uid = job.p.id, key = job.ev.id + '|' + job.L.k, L = (log[uid] = log[uid] || {});
    if (L[key]) return;
    L[key] = now; changed[uid] = true; todo.push(job);
  });
  if (!todo.length) return { statusCode: 200, body: 'already sent' };
  // save the log BEFORE sending, so a retry can never double-send
  const upd = Object.keys(changed).map(uid => {
    const L = log[uid]; Object.keys(L).forEach(k => { if (now - L[k] > 4 * 864e5) delete L[k]; });
    return { user_id: uid, key: 'bt-call-log', value: JSON.stringify(L), updated_at: new Date().toISOString() };
  });
  const sv = await push.svc('client_data?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(upd) });
  if (!sv.ok) return { statusCode: 500, body: 'couldn’t save the reminder log, nothing sent' };
  for (const job of todo) {
    const uid = job.p.id, tz = tzOf[uid] || 'Australia/Brisbane', mine = (subs || []).filter(s => s.user_id === uid);
    if (mine.length) { const t = pushText(job, tz); nPush += await push.send(mine, { title: t.title, body: t.body, url: job.zoom || '/#Profile', tag: 'call-' + job.ev.id }); }
    if (job.L.email && process.env.RESEND_API_KEY) {
      const m = reminderEmail({ first: String(job.p.full_name || '').split(' ')[0], kind: job.kind, lead: job.L.k, start: job.ev.start, tz, zoom: job.zoom, site: SITE });
      if (await sendEmail(job.p.email, m)) nMail++;
    }
  }
  return { statusCode: 200, body: 'push ' + nPush + ', email ' + nMail };
};
