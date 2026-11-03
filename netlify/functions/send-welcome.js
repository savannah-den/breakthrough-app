// Coach-only: sends a client the branded welcome email (1:1 version, or the self-paced version when tier is 'self_paced') (download the app, set-up steps,
// Set yourself up for success, Setting Intentions). { test: true } sends it to Sav instead, with the client's name.
// Needs RESEND_API_KEY and EMAIL_FROM in Netlify's environment variables (same as the other emails).
const { requireAdmin, json } = require('../lib/admin');
const { welcomeEmail, welcomeSelfEmail, SITE } = require('../lib/emails');

function siteFrom(event) {
  const o = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  return /^https:\/\/([a-z0-9-]+\.)*(colourmeneurospicy\.com\.au|netlify\.app)$/i.test(o) ? o : SITE;
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ error: 'POST only' }, 405);
  const w = await requireAdmin(event); if (w.error) return w.error;
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'No email address for this client' }, 400);
  if (!process.env.RESEND_API_KEY) return json({ ok: false, setup: true, error: 'Email isn’t switched on yet (RESEND_API_KEY missing in Netlify).' });
  const first = String(b.name || '').trim().split(/\s+/)[0].slice(0, 40);
  const to = b.test ? (w.profile.email || w.user.email) : email;
  const site = siteFrom(event);
  // 1:1 clients get the 1:1 welcome; self-paced and group clients get the course welcome
  const m = b.tier === 'self_paced' ? welcomeSelfEmail({ first, site, tier: 'self' }) : welcomeEmail({ first, site, link: site + '/1to1' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Savannah <hello@colourmeneurospicy.com.au>', to: [to], reply_to: 'savannah@colourmeneurospicy.com.au', subject: (b.test ? '[TEST] ' : '') + m.subject, html: m.html })
  });
  if (!r.ok) return json({ ok: false, error: 'The email service said no: ' + (await r.text()).slice(0, 200) });
  return json({ ok: true, to, test: !!b.test, at: new Date().toISOString() });
};
