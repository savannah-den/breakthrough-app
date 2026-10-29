// Coach-only: set a new password for a client (passwords are stored scrambled, so they can't be read, only replaced).
// Needs SUPABASE_SERVICE_ROLE_KEY in Netlify's environment variables (already set for notifications).
const { requireAdmin, json, SB_URL } = require('../lib/admin');
exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return json({ ok: false, error: 'the service key isn’t set up in Netlify' });
  if (b.action !== 'password' || !/^[0-9a-f-]{36}$/i.test(String(b.id || '')) || String(b.password || '').length < 8) return json({ ok: false, error: 'bad request' }, 400);
  const r = await fetch(SB_URL + '/auth/v1/admin/users/' + b.id, { method: 'PUT', headers: { apikey: k, Authorization: 'Bearer ' + k, 'content-type': 'application/json' }, body: JSON.stringify({ password: String(b.password) }) });
  if (!r.ok) return json({ ok: false, error: (await r.text()).slice(0, 160) });
  return json({ ok: true });
};
