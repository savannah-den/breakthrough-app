// Coach-only. Lets Sav see and test the call reminders.
//   GET  -> the next 7 days of calls from her Google Calendar, who each one will remind, and whether
//           that client has phone notifications on (so she knows the reminders will land).
//   POST { what: 'push' | 'email', lead: '24h' | '2h' | '15m' } -> sends HER a sample reminder right now,
//           using her next real call if there is one.
const { requireAdmin, json } = require('../lib/admin');
const push = require('../lib/push');
const R = require('./call-reminders');
const { reminderEmail, SITE } = require('../lib/emails');

exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  const env = { calendar: !!process.env.GCAL_ICS_URL, server: !!process.env.SUPABASE_SERVICE_ROLE_KEY, push: push.ready(), email: !!process.env.RESEND_API_KEY };
  if (!env.server) return json({ ok: false, env, error: 'SUPABASE_SERVICE_ROLE_KEY isn’t set in Netlify yet.' });
  const now = Date.now();
  let list = [];
  if (env.calendar) { try { list = await R.calls(now, now + 7 * 864e5); } catch (e) { return json({ ok: false, env, error: 'Couldn’t read your Google Calendar just now.' }); } }

  if (event.httpMethod === 'GET') {
    const ids = Array.from(new Set([].concat(...list.map(c => c.who.map(p => p.id)))));
    const subs = ids.length ? await (await push.svc('push_subs?select=user_id&user_id=in.(' + ids.join(',') + ')')).json() : [];
    const on = {}; (subs || []).forEach(s => { on[s.user_id] = true; });
    return json({ ok: true, env, calls: list.slice(0, 40).map(c => ({ start: c.ev.start, title: c.ev.title, kind: c.kind, zoom: !!c.zoom,
      who: c.who.map(p => ({ name: p.full_name || p.email, email: p.email, push: !!on[p.id] })) })) });
  }

  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const lead = ['24h', '2h', '15m'].indexOf(b.lead) >= 0 ? b.lead : '2h';
  const c = list[0], start = c ? c.ev.start : new Date(now + (lead === '24h' ? 24 * 3600e3 : lead === '2h' ? 2 * 3600e3 : 15 * 60e3)).toISOString();
  const first = String(w.profile.full_name || 'Savannah').split(' ')[0];
  const subs = await (await push.svc('push_subs?select=endpoint,sub,tz,user_id&user_id=eq.' + w.user.id)).json();
  const tz = (subs && subs[0] && subs[0].tz) || 'Australia/Brisbane';
  const job = { ev: { start, id: 'test' }, L: { k: lead }, p: { full_name: first }, kind: c ? c.kind : '1:1' };
  const zoom = (c && c.zoom) || 'https://zoom.us/';
  if (b.what === 'email') {
    if (!env.email) return json({ ok: false, env, error: 'Email isn’t switched on yet (RESEND_API_KEY missing in Netlify).' });
    const m = reminderEmail({ first, kind: job.kind, lead: lead, start, tz, zoom, site: SITE });
    m.subject = '[TEST] ' + m.subject;
    const ok = await R.sendEmail(w.profile.email || w.user.email, m);
    return json({ ok, to: w.profile.email || w.user.email, error: ok ? '' : 'The email service said no.' });
  }
  if (!env.push) return json({ ok: false, env, error: 'Phone notifications aren’t set up yet (VAPID keys missing in Netlify).' });
  if (!subs || !subs.length) return json({ ok: false, env, error: 'Your login has no phone with notifications on yet. On your phone: open the app from your home screen, go to Profile, and switch on notifications.' });
  const t = R.pushText(job, tz);
  const n = await push.send(subs, { title: '[Test] ' + t.title, body: t.body, url: zoom, tag: 'call-test' });
  return json({ ok: n > 0, devices: subs.length, sent: n, error: n ? '' : 'Your phone didn’t accept it. Turn notifications off and on again in Profile, then retry.' });
};
