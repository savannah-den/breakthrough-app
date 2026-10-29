// Coach-only: tells one client something happened, by phone notification and email.
// Used when Sav unlocks the next week for a 1:1 client from the coach dashboard.
// Email needs RESEND_API_KEY (and EMAIL_FROM, e.g. "Sav <hello@colourmeneurospicy.com.au>") in Netlify's environment variables.
const { requireAdmin, json } = require('../lib/admin');
const push = require('../lib/push');
const SITE = 'https://app.colourmeneurospicy.com.au';
function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function weekEmail(first, week, title) {
  return '<div style="background:#4E0C08;padding:32px 16px;font-family:Helvetica,Arial,sans-serif">'
    + '<div style="max-width:520px;margin:0 auto;background:#FFF4EE;border-radius:24px;border:2px solid #1F1412;overflow:hidden">'
    + '<div style="background:#2A0806;padding:10px;text-align:center;color:#F1F9A6;font-size:15px;letter-spacing:1px">Colour Me Neurospicy<br><span style="color:#F4C2F7;font-size:10px;letter-spacing:2px">NEURODIVERGENT BREAKTHROUGH PROGRAM</span></div>'
    + '<div style="padding:28px 26px">'
    + '<p style="margin:0 0 6px;color:#A8231F;font-size:15px">Hey ' + esc(first || 'you') + ' ✨</p>'
    + '<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#4E0C08">Week ' + week + ' is open for you' + (title ? ': ' + esc(title) : '') + '</h1>'
    + '<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#3A2A27">I’ve just unlocked your next week. Go at your own pace, one small step at a time. I’m so proud of the work you’re putting in.</p>'
    + '<a href="' + SITE + '/#Course" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#F1F9A6;border:2px solid #1F1412;color:#1F1412;font-weight:bold;text-decoration:none">Open Week ' + week + ' →</a>'
    + '<p style="margin:22px 0 0;font-size:14px;color:#6A5A57">Sav x</p></div></div></div>';
}
exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  if (!b.to || b.type !== 'week') return json({ ok: false, error: 'bad request' }, 400);
  const prof = ((await (await push.svc('profiles?select=full_name,email&id=eq.' + encodeURIComponent(b.to))).json()) || [])[0] || {};
  const first = String(prof.full_name || '').split(' ')[0], week = Number(b.week) || '', title = String(b.title || '').slice(0, 80);
  const out = { push: 0, email: false };
  if (push.ready()) {
    const subs = await (await push.svc('push_subs?select=endpoint,sub&user_id=eq.' + encodeURIComponent(b.to))).json();
    out.push = await push.send(subs || [], { title: '🔓 Week ' + week + ' is open!', body: (first ? first + ', y' : 'Y') + 'our next week is ready for you. One small step at a time.', url: '/#Course' });
  }
  if (process.env.RESEND_API_KEY && prof.email) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Sav <hello@colourmeneurospicy.com.au>', to: [prof.email], subject: 'Week ' + week + ' is open for you ✨', html: weekEmail(first, week, title) }) });
    out.email = r.ok; if (!r.ok) out.emailError = (await r.text()).slice(0, 200);
  } else out.emailSetup = !process.env.RESEND_API_KEY;
  return json(out);
};
