// Self-paced clients get a new week every 7 days from their start date, but never past the week Sav has
// opened for her 1:1 clients (app setting "spCap", Week 1 until she opens Week 2 for a 1:1 client). When a week opens for someone
// (by date, or because Sav just opened it for her 1:1 clients) they get a phone notification and an email, once.
// Each client's last "you've got a new week" is kept in client_data 'bt-wk-told' so nobody hears twice.
const push = require('./push');
const { weekUnlockedEmail, SITE } = require('./emails');
const j = (r) => r.json().catch(() => []);
const DAY = 864e5;

function startOf(p) { const d = new Date(p.program_start ? p.program_start + 'T00:00:00+10:00' : p.created_at || Date.now()); return isNaN(d) ? Date.now() : d.getTime(); }
async function setting(key) { const r = await push.svc('app_settings?select=value&key=eq.' + key).then(j); return r && r[0] ? r[0].value : null; }

async function run(opts) {
  opts = opts || {};
  const cap = Number(await setting('spCap')) || 1, unlocks = (await setting('unlocks')) || {}, course = (await setting('course')) || null;
  const profs = (await push.svc('profiles?select=id,email,full_name,tier,status,program_start,created_at,is_admin&tier=eq.self_paced').then(j) || []).filter(p => !p.is_admin && p.status !== 'past' && p.email);
  if (!profs.length) return { cap, checked: 0, told: [] };
  const ids = profs.map(p => p.id);
  const [rows, subs] = await Promise.all([
    push.svc('client_data?select=user_id,value&key=eq.bt-wk-told&user_id=in.(' + ids.join(',') + ')').then(j),
    push.ready() ? push.svc('push_subs?select=endpoint,sub,user_id&user_id=in.(' + ids.join(',') + ')').then(j) : []
  ]);
  const told = {}; (rows || []).forEach(r => { told[r.user_id] = Number(r.value) || 1; });
  const out = [];
  for (const p of profs) {
    const ov = unlocks[p.id]; if (ov === 'all') continue;
    const byDate = 1 + Math.floor((Date.now() - startOf(p)) / (7 * DAY));
    let open = Math.min(byDate, cap); if (typeof ov === 'number') open = Math.max(open, ov);
    const last = told[p.id] || 1;
    if (open < 2 || open <= last) continue;
    const wk = ((course && course.weeks) || []).filter(w => w.week === open)[0] || {};
    const first = String(p.full_name || '').split(' ')[0];
    // save first, so a retry can never double-send
    const sv = await push.svc('client_data?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ user_id: p.id, key: 'bt-wk-told', value: String(open), updated_at: new Date().toISOString() }]) });
    if (!sv.ok) continue;
    let pushed = 0, mailed = false;
    const mine = (subs || []).filter(s => s.user_id === p.id);
    if (mine.length) pushed = await push.send(mine, { title: '🔓 Week ' + open + ' is open!', body: (first ? first + ', y' : 'Y') + 'our next week is ready for you. One small step at a time.', url: '/#Course', tag: 'week-' + open });
    if (process.env.RESEND_API_KEY) {
      const m = weekUnlockedEmail({ first, week: open, title: wk.title || '', lessons: (wk.lessons || []).filter(l => !l.optional).map(l => String(l.title || '').replace(/^Activity:\s*/, '')).slice(0, 8), tier: 'self', site: SITE });
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Savannah <savannah@colourmeneurospicy.com.au>', to: [p.email], reply_to: 'savannah@colourmeneurospicy.com.au', subject: m.subject, html: m.html }) });
      mailed = r.ok;
    }
    out.push({ name: p.full_name || p.email, week: open, push: pushed, email: mailed });
  }
  return { cap, checked: profs.length, told: out };
}
module.exports = { run };
