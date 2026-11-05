// Coach-only: emails a 1:1 client their session recap (the design Sav approved, #11).
// Sav checks and edits the takeaways, their next steps and "Your coach will…" before it sends.
// POST { to: <client id>, n, points: [], todo: [], coach: [], test } . test sends it to Sav instead.
const { requireAdmin, json } = require('../lib/admin');
const push = require('../lib/push');
const { recapEmail, SITE } = require('../lib/emails');
const list = (a) => (Array.isArray(a) ? a : []).map(x => String(x || '').trim().slice(0, 400)).filter(Boolean).slice(0, 10);
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ error: 'POST only' }, 405);
  const w = await requireAdmin(event); if (w.error) return w.error;
  if (!process.env.RESEND_API_KEY) return json({ ok: false, setup: true, error: 'Email isn’t switched on yet (RESEND_API_KEY missing in Netlify).' });
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const prof = ((await (await push.svc('profiles?select=full_name,email,tier&id=eq.' + encodeURIComponent(String(b.to || '')))).json()) || [])[0];
  if (!prof || !prof.email) return json({ ok: false, error: 'Couldn’t find that client’s email.' }, 400);
  const points = list(b.points), todo = list(b.todo), coach = list(b.coach);
  if (!points.length && !todo.length) return json({ ok: false, error: 'Add at least one takeaway or next step.' }, 400);
  const m = recapEmail({ first: String(prof.full_name || '').split(' ')[0], n: Number(b.n) || 1, points, todo, coach, site: SITE, tier: prof.tier === 'self_paced' ? 'self' : '' });
  const to = b.test ? (w.profile.email || w.user.email) : prof.email;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Savannah <hello@colourmeneurospicy.com.au>', to: [to], reply_to: 'savannah@colourmeneurospicy.com.au', subject: (b.test ? '[TEST] ' : '') + m.subject, html: m.html }) });
  if (!r.ok) return json({ ok: false, error: 'The email service said no: ' + (await r.text()).slice(0, 200) });
  return json({ ok: true, to, test: !!b.test, at: new Date().toISOString() });
};
