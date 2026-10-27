// AI Coach Sav: lets logged-in clients use the AI buttons in the app.
// Needs one Netlify environment variable: ANTHROPIC_API_KEY (Supabase details come from supabase-public.json)
// Optional: ANTHROPIC_MODEL (defaults below), AI_DAILY_LIMIT (per person, default 40)
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const PUB = require('./supabase-public.json'); // public project URL + anon key (safe to commit)
const SB_URL = process.env.SUPABASE_URL || PUB.url;
const SB_ANON = process.env.SUPABASE_ANON_KEY || PUB.anonKey;
const hits = new Map(); // simple per-instance limiter

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const auth = event.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return { statusCode: 401, body: 'Log in first' };

  // Check the person is really logged in to your app
  const who = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: SB_ANON }
  });
  if (!who.ok) return { statusCode: 401, body: 'Log in first' };
  const user = await who.json();

  const day = new Date().toISOString().slice(0, 10), k = user.id + day;
  const n = (hits.get(k) || 0) + 1; hits.set(k, n);
  if (n > Number(process.env.AI_DAILY_LIMIT || 40)) return { statusCode: 429, body: 'Daily AI limit reached' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Bad request' }; }
  const prompt = String(body.prompt || '').slice(0, 20000);
  if (!prompt) return { statusCode: 400, body: 'Empty prompt' };

  const system = 'You are AI Coach Sav, the in-app coaching helper for Savannah Denny\'s Breakthrough program for neurodivergent, high-achieving women. Be warm, direct and encouraging. You are a coaching tool, not a therapist or medical service.'
    + (body.json ? ' Reply with ONLY a single valid JSON object, no prose and no code fences.' : '');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': String(process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, '').replace(/^["']|["']$/g, ''), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) { console.error('anthropic', r.status, 'keyLen', String(process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, '').length, 'looksRight', /^sk-ant-/.test(String(process.env.ANTHROPIC_API_KEY || '').trim()), await r.text()); return { statusCode: 502, body: 'AI unavailable' }; }
  const data = await r.json();
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');

  let json = null;
  if (body.json) {
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    try { json = JSON.parse(text.slice(s, e + 1)); } catch (err) { json = null; }
  }
  return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, json }) };
};
