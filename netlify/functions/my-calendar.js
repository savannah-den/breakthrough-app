// A client's own calendar, read-only, for the Energy Audit plan: their next 7 days of events, so the plan starts
// with what's already booked. They paste their calendar's private iCal link (Google, Apple/iCloud or Outlook) in the app.
// The link is only used to read the calendar right now. It's never stored or logged here.
// Only logged-in people can call this, and only calendar hosts are allowed (so it can't be used to fetch anything else).
const PUB = require('./supabase-public.json');
const { occurrences } = require('../lib/ics');
const SB_URL = process.env.SUPABASE_URL || PUB.url;
const SB_ANON = process.env.SUPABASE_ANON_KEY || PUB.anonKey;
const HOSTS = [/^calendar\.google\.com$/, /^([a-z0-9-]+\.)*icloud\.com$/, /^outlook\.(office365|live|office)\.com$/, /^([a-z0-9-]+\.)*calendar\.yahoo\.com$/, /^([a-z0-9-]+\.)*fastmail\.com$/, /^([a-z0-9-]+\.)*proton\.me$/];
const hits = new Map();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const auth = event.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return { statusCode: 401, body: 'Log in first' };
  const who = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SB_ANON } });
  if (!who.ok) return { statusCode: 401, body: 'Log in first' };
  const user = await who.json();
  const k = user.id + new Date().toISOString().slice(0, 10), n = (hits.get(k) || 0) + 1; hits.set(k, n);
  if (n > 30) return { statusCode: 429, body: 'Try again tomorrow' };

  let body; try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Bad request' }; }
  let raw = String(body.url || '').trim().replace(/^webcals?:\/\//i, 'https://');
  let u; try { u = new URL(raw); } catch (e) { return { statusCode: 400, body: 'That doesn’t look like a calendar link' }; }
  if (u.protocol === 'http:') u.protocol = 'https:';
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !HOSTS.some(re => re.test(u.hostname.toLowerCase())))
    return { statusCode: 400, body: 'Use the private iCal link from Google, Apple (iCloud) or Outlook' };

  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  let text = '';
  try {
    const r = await fetch(u.toString(), { signal: ctl.signal, redirect: 'follow', headers: { accept: 'text/calendar' } });
    if (!r.ok) return { statusCode: 502, body: 'Couldn’t open that calendar. Check the link is the private (secret) iCal one.' };
    text = (await r.text()).slice(0, 6e6);
  } catch (e) { return { statusCode: 504, body: 'That calendar took too long to answer' }; }
  finally { clearTimeout(t); }
  if (!/BEGIN:VCALENDAR/.test(text)) return { statusCode: 502, body: 'That link isn’t a calendar' };

  const from = Date.now() - 864e5, to = Date.now() + 8 * 864e5;
  const events = occurrences(text, from, to).slice(0, 300).map(e => ({ id: e.id, start: e.start, end: new Date(e.ms + (e.dur || 3600e3)).toISOString(), title: e.title || 'Busy' }));
  return { statusCode: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ events }) };
};
