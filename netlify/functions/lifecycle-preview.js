// Coach-only: who would get which journey email right now, without sending anything (a dry run).
const { requireAdmin, json } = require('../lib/admin');
const lifecycle = require('../lib/lifecycle');
exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY isn’t set in Netlify yet.' });
  try { return json(Object.assign({ ok: true }, await lifecycle.run({ dry: true }))); } catch (e) { return json({ ok: false, error: String(e.message || e) }); }
};
