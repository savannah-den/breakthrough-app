// Runs every hour (see netlify.toml). Sends each client their gentle daily reminder at the hour they picked,
// in their own timezone. Scheduled runs only happen on the live site, not on previews.
const push = require('../lib/push');
const LINES = [
  ['Your 1% for today 💛', 'Five minutes counts. Open Breakthrough and do one small thing.'],
  ['Hey you ✨', 'Today’s reps are waiting. Small and done beats big and someday.'],
  ['Gold star time ⭐', 'Do the tiniest version of today’s lesson or activity. That’s the whole job.'],
  ['Come back to you 🌿', 'A few minutes in Breakthrough today. Slower and deeper always wins.']
];
function hourIn(tz) { try { return Number(new Intl.DateTimeFormat('en-AU', { timeZone: tz || 'Australia/Brisbane', hour: 'numeric', hourCycle: 'h23' }).format(new Date())); } catch (e) { return -1; } }

exports.handler = async () => {
  if (!push.ready()) return { statusCode: 200, body: 'not set up' };
  const rows = await (await push.svc('push_subs?select=endpoint,sub,tz,remind_hour&remind_hour=not.is.null')).json();
  const due = (rows || []).filter(r => hourIn(r.tz) === Number(r.remind_hour));
  const day = Math.floor(Date.now() / 864e5), l = LINES[day % LINES.length];
  const sent = await push.send(due, { title: l[0], body: l[1], url: '/#Dashboard' });
  return { statusCode: 200, body: 'sent ' + sent };
};
