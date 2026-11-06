// Public: the waitlist page and the Breakthrough application save people into Sav's leads list (Supabase "leads" table).
//   POST { kind: 'waitlist', first_name, email, phone, country, interests: ['community'|'group'|'1:1'] }
//        → saves/updates the lead, tags them, and (first time only) sends the waitlist welcome email with the application link.
//   POST { kind: 'apply', id?, first_name, last_name, email, phone, country, interests, answers: {...} }
//        → saves their application, works out how warm they are (cold → on fire).
//   GET ?l=<lead id> → their name/email/country so the application form can fill those in for them.
// Needs SUPABASE_SERVICE_ROLE_KEY (already set for reminders). Email needs RESEND_API_KEY + EMAIL_FROM.
const { SB_URL } = require('../lib/admin');
const { waitlistEmail, SITE } = require('../lib/emails');
const { score } = require('../../public/js/lead-score.js');

const OK_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*(colourmeneurospicy\.com\.au|netlify\.app|myshopify\.com)$/i;
// segments: everyone who signs up is on the Breakthrough waitlist, then they pick which program(s) to hear about
const TAG_FOR = { mini: 'mini course waitlist', self: 'self-paced waitlist', community: 'community waitlist', group: 'group waitlist', '1:1': '1:1 waitlist' };
const INTERESTS = Object.keys(TAG_FOR);

function cors(event) {
  const o = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  return OK_ORIGIN.test(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', Vary: 'Origin' } : {};
}
function out(event, body, code) { return { statusCode: code || 200, headers: Object.assign({ 'content-type': 'application/json', 'cache-control': 'no-store' }, cors(event)), body: JSON.stringify(body) }; }
function svc(path, opts) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opts || {}, { headers: Object.assign({ apikey: k, Authorization: 'Bearer ' + k, 'content-type': 'application/json' }, (opts || {}).headers || {}) }));
}
const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n || 200);
const uniq = (a) => a.filter((x, i) => x && a.indexOf(x) === i);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(event), body: '' };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return out(event, { ok: false, error: 'Not set up yet' }, 503);

  if (event.httpMethod === 'GET') {
    const id = String((event.queryStringParameters || {}).l || '');
    if (!UUID.test(id)) return out(event, { ok: false }, 400);
    const r = await svc('leads?id=eq.' + id + '&select=id,first_name,last_name,email,phone,country,interests');
    const row = r.ok ? (await r.json())[0] : null;
    return out(event, row ? { ok: true, lead: row } : { ok: false }, row ? 200 : 404);
  }
  if (event.httpMethod !== 'POST') return out(event, { error: 'POST only' }, 405);

  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) { return out(event, { ok: false, error: 'Bad request' }, 400); }
  if (b.website) return out(event, { ok: true }); // honeypot: bots fill in the hidden field
  const email = clip(b.email, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out(event, { ok: false, error: 'Please check your email address.' }, 400);
  const kind = b.kind === 'apply' ? 'apply' : 'waitlist';
  const interests = uniq([].concat(b.interests || []).filter(x => INTERESTS.indexOf(x) >= 0));

  // what we already know about them (by link id, or by email)
  const id = UUID.test(String(b.id || '')) ? b.id : null;
  let r = await svc('leads?' + (id ? 'id=eq.' + id : 'email=eq.' + encodeURIComponent(email)) + '&select=*');
  let cur = r.ok ? (await r.json())[0] : null;
  if (cur && cur.email !== email) { // they changed their email on the form: keep the row, update the address
    const clash = await svc('leads?email=eq.' + encodeURIComponent(email) + '&select=id').then(x => x.ok ? x.json() : []);
    if (clash.length) cur = null;
  }
  const isNew = !cur; cur = cur || {};

  const row = {
    email,
    first_name: clip(b.first_name, 60) || cur.first_name || null,
    last_name: clip(b.last_name, 60) || cur.last_name || null,
    phone: clip(b.phone, 40) || cur.phone || null,
    country: clip(b.country, 80) || cur.country || null,
    interests: uniq((cur.interests || []).concat(interests)),
    source: cur.source || (kind === 'apply' ? 'application' : clip(b.source, 60) || 'waitlist page'),
    updated_at: new Date().toISOString()
  };
  const tags = (cur.tags || []).slice();
  tags.push('breakthrough waitlist');
  if (kind === 'apply') tags.push('applied');
  row.interests.forEach(i => tags.push(TAG_FOR[i]));
  // the "find your fit" quiz on the waitlist page: what it suggested
  const QZ = { self: 'self-paced', community: 'community', group: 'group', one: '1:1', mini: 'mini course' };
  if (b.quiz && QZ[b.quiz.rec]) tags.push('quiz: ' + QZ[b.quiz.rec]);
  row.tags = uniq(tags);

  if (kind === 'apply') {
    const a = b.answers || {}, keep = {};
    ['age', 'location', 'work', 'diagnosis', 'otherDiagnosis', 'pronouns', 'kids', 'partner', 'partnerWork', 'challenges', 'tried', 'wand', 'future', 'worth', 'commitment', 'instagram']
      .forEach(k => { if (a[k] != null && String(a[k]).trim()) keep[k] = clip(a[k], 3000); });
    row.application = keep; row.applied_at = new Date().toISOString();
  } else { row.application = cur.application || null; row.applied_at = cur.applied_at || null; }
  const sc = score(row); row.score = sc.score; row.heat = sc.heat;

  r = cur.id
    ? await svc('leads?id=eq.' + cur.id, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) })
    : await svc('leads', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
  if (!r.ok) { console.error('lead save', r.status, await r.text()); return out(event, { ok: false, error: 'Couldn’t save that. Please try again.' }, 500); }
  const saved = (await r.json())[0];
  const applyLink = SITE + '/apply.html?l=' + saved.id;

  // first time on the waitlist: the welcome email with the application (win-win: early access + first pick)
  if (kind === 'waitlist' && !saved.welcomed_at && process.env.RESEND_API_KEY) {
    const m = waitlistEmail({ first: row.first_name || 'friend', applyLink });
    const e = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Savannah <hello@colourmeneurospicy.com.au>', to: [email], reply_to: 'savannah@colourmeneurospicy.com.au', subject: m.subject, html: m.html })
    });
    if (e.ok) await svc('leads?id=eq.' + saved.id, { method: 'PATCH', body: JSON.stringify({ welcomed_at: new Date().toISOString() }) });
    else console.error('waitlist email', e.status, (await e.text()).slice(0, 200));
  }
  return out(event, { ok: true, id: saved.id, apply: applyLink, isNew });
};
