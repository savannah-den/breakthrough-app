// Pings Sav's phone when a client adds a win or signs their agreement. Called by the app; the client must be logged in.
// GET ?key=1 hands the app the public notification key so phones can sign up.
const { whoIs, json } = require('../lib/admin');
const push = require('../lib/push');

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') return json({ key: process.env.VAPID_PUBLIC_KEY || '' });
  if (!push.ready()) return json({ setup: true });
  const w = await whoIs(event); if (!w) return { statusCode: 401, body: 'Log in first' };
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const first = String(w.profile.full_name || w.profile.email || 'A client').split(' ')[0];
  const text = String(b.text || '').replace(/\s+/g, ' ').trim().slice(0, 110);
  const msg = b.type === 'signed' ? { title: '✍️ ' + first + ' signed their agreement', body: 'Their package is locked in. Time to welcome them!', url: '/admin.html' }
    : b.type === 'waiting' ? { title: '📝 ' + first + ' is waiting for their agreement', body: 'They can’t go any further until you send it. Open their profile to send it.', url: '/admin.html' }
    : b.type === 'win' ? { title: '🏆 ' + first + ' added a win', body: text ? '“' + text + '”' : 'Go celebrate it in the group chat!', url: '/admin.html' } : null;
  if (!msg) return json({ ok: false });
  const admins = await (await push.svc('profiles?is_admin=eq.true&select=id')).json();
  const ids = (admins || []).map(a => a.id).filter(id => id !== w.user.id);
  if (!ids.length) return json({ sent: 0 });
  const rows = await (await push.svc('push_subs?select=endpoint,sub&user_id=in.(' + ids.join(',') + ')')).json();
  return json({ sent: await push.send(rows || [], msg) });
};
