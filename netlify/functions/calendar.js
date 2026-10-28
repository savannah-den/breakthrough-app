// Sav's Google Calendar, read-only, for the coach dashboard (matches 1:1 sessions to clients).
// Setup: in Google Calendar → Settings → your calendar → "Secret address in iCal format". Copy it and add it in
// Netlify → Site configuration → Environment variables as GCAL_ICS_URL. (Never paste it anywhere else.)
// Only logged-in admins can call this.
const PUB = require('./supabase-public.json');
const SB_URL = process.env.SUPABASE_URL || PUB.url;
const SB_ANON = process.env.SUPABASE_ANON_KEY || PUB.anonKey;

function unfold(t) { return t.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, ''); }
function unesc(v) { return String(v || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\'); }
// wall-clock time in an IANA zone -> UTC ms
function zoned(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const o = {}; f.formatToParts(new Date(guess)).forEach(p => { o[p.type] = p.value; });
    const asUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second);
    return guess - (asUtc - guess);
  } catch (e) { return guess; }
}
function parseDT(line) {
  const m = /^[^:;]+((?:;[^:]*)?):(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/.exec(line);
  if (!m) return null;
  const [, params, y, mo, d, h, mi, s, z] = m;
  if (!h) return { ms: Date.UTC(+y, +mo - 1, +d), allDay: true };
  if (z) return { ms: Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) };
  const tz = (/TZID=([^;:]+)/.exec(params || '') || [])[1];
  return { ms: tz ? zoned(+y, +mo, +d, +h, +mi, +s, tz) : Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) };
}

exports.handler = async (event) => {
  const auth = event.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return { statusCode: 401, body: 'Log in first' };
  const who = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SB_ANON } });
  if (!who.ok) return { statusCode: 401, body: 'Log in first' };
  const user = await who.json();
  const pr = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_admin`, { headers: { Authorization: auth, apikey: SB_ANON } });
  const rows = pr.ok ? await pr.json() : [];
  if (!rows[0] || !rows[0].is_admin) return { statusCode: 403, body: 'Coach only' };
  const url = process.env.GCAL_ICS_URL;
  if (!url) return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: [], setup: true }) };
  const r = await fetch(url);
  if (!r.ok) return { statusCode: 502, body: 'Couldn’t read the calendar' };
  const text = unfold(await r.text());
  const now = Date.now(), from = now - 120 * 864e5, to = now + 200 * 864e5, out = [];
  text.split('BEGIN:VEVENT').slice(1).forEach(block => {
    const body = block.split('END:VEVENT')[0], lines = body.split(/\r?\n/);
    const get = k => lines.find(l => l.startsWith(k + ':') || l.startsWith(k + ';'));
    if (/^STATUS:CANCELLED/m.test(body)) return;
    const ds = get('DTSTART'), de = get('DTEND'); if (!ds) return;
    const st = parseDT(ds); if (!st || st.ms < from || st.ms > to) return;
    const en = de ? parseDT(de) : null;
    const att = lines.filter(l => /^ATTENDEE/.test(l)).map(l => ((/mailto:([^\s;]+)/i.exec(l) || [])[1] || '').toLowerCase()).filter(Boolean);
    const val = l => l ? unesc(l.slice(l.indexOf(':') + 1)) : '';
    const recId = get('RECURRENCE-ID');
    out.push({ id: val(get('UID')) + (recId ? '_' + val(recId) : ''), start: new Date(st.ms).toISOString(), end: en ? new Date(en.ms).toISOString() : null, allDay: !!st.allDay,
      title: val(get('SUMMARY')).slice(0, 200), attendees: att, location: val(get('LOCATION')).slice(0, 200), desc: val(get('DESCRIPTION')).slice(0, 400), recurring: !!get('RRULE') });
  });
  out.sort((a, b) => a.start.localeCompare(b.start));
  return { statusCode: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ events: out }) };
};
