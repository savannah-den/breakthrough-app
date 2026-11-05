// Coach-only: Sav just opened a new week for a 1:1 client. Raise the self-paced limit to match (never lower it)
// and tell every self-paced client whose week is now open, straight away.
// Body: { week }
const { requireAdmin, json } = require('../lib/admin');
const push = require('../lib/push');
const { run } = require('../lib/week-unlocks');
exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY isn’t set in Netlify yet.' });
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const week = Math.floor(Number(b.week) || 0);
  if (week >= 2) {
    const cur = await push.svc('app_settings?select=value&key=eq.spCap').then(r => r.json()).catch(() => []);
    const now = Number(cur && cur[0] && cur[0].value) || 1;
    if (week > now) await push.svc('app_settings?on_conflict=key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ key: 'spCap', value: week, updated_at: new Date().toISOString() }]) });
  }
  const r = await run();
  return json(Object.assign({ ok: true }, r));
};
