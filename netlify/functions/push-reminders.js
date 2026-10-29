// Runs every hour (see netlify.toml). At the hour each client picked (in their own timezone) it sends
// at most ONE kind notification: come back to the course, today's reps, or a gentle 1% nudge.
// The rules live in netlify/lib/nudges.js. Scheduled runs only happen on the live site, not on previews.
const push = require('../lib/push');
const { pick } = require('../lib/nudges');
function hourIn(tz) { try { return Number(new Intl.DateTimeFormat('en-AU', { timeZone: tz || 'Australia/Brisbane', hour: 'numeric', hourCycle: 'h23' }).format(new Date())); } catch (e) { return -1; } }
const KEYS = ['bt-course', 'bt-vwork', 'bt-dose', 'cmn-companion'];

exports.handler = async () => {
  if (!push.ready()) return { statusCode: 200, body: 'not set up' };
  const rows = await (await push.svc('push_subs?select=endpoint,sub,tz,remind_hour,user_id&remind_hour=not.is.null')).json();
  const due = (rows || []).filter(r => hourIn(r.tz) === Number(r.remind_hour));
  if (!due.length) return { statusCode: 200, body: 'none due' };
  const ids = Array.from(new Set(due.map(r => r.user_id)));
  const [data, profs] = await Promise.all([
    push.svc('client_data?select=user_id,key,value&user_id=in.(' + ids.join(',') + ')&key=in.(' + KEYS.map(encodeURIComponent).join(',') + ')').then(r => r.json()),
    push.svc('profiles?select=id,full_name,created_at,is_admin&id=in.(' + ids.join(',') + ')').then(r => r.json())
  ]);
  const by = {}; (data || []).forEach(d => { (by[d.user_id] = by[d.user_id] || {})[d.key] = d.value; });
  const pr = {}; (profs || []).forEach(p => { pr[p.id] = p; });
  let sent = 0;
  for (const uid of ids) {
    const p = pr[uid] || {}; if (p.is_admin) continue;
    const subs = due.filter(r => r.user_id === uid);
    const msg = pick(by[uid] || {}, { name: p.full_name, created: p.created_at ? Date.parse(p.created_at) : null, tz: subs[0].tz });
    if (msg) sent += await push.send(subs, { title: msg.title, body: msg.body, url: msg.url });
  }
  return { statusCode: 200, body: 'sent ' + sent };
};
