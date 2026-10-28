// Shared helpers for the coach-only connectors (payments, Vimeo, Zoom).
// Every call must come from a logged-in admin; the keys themselves live only in Netlify's environment variables.
const PUB = require('../functions/supabase-public.json');
const SB_URL = process.env.SUPABASE_URL || PUB.url;
const SB_ANON = process.env.SUPABASE_ANON_KEY || PUB.anonKey;

async function whoIs(event) {
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SB_ANON } });
  if (!r.ok) return null;
  const user = await r.json();
  const pr = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_admin,full_name,email`, { headers: { Authorization: auth, apikey: SB_ANON } });
  const rows = pr.ok ? await pr.json() : [];
  return { user, auth, profile: rows[0] || {} };
}
async function requireAdmin(event) {
  const w = await whoIs(event);
  if (!w) return { error: { statusCode: 401, body: 'Log in first' } };
  if (!w.profile.is_admin) return { error: { statusCode: 403, body: 'Coach only' } };
  return w;
}
function json(body, code) { return { statusCode: code || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) }; }

module.exports = { SB_URL, SB_ANON, whoIs, requireAdmin, json };
