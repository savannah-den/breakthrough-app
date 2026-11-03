// Coach-only, runs in the background (can take a minute): reads a client's Human Design chart, DISC result and
// Rep System scores and writes Sav a coaching profile: each one broken down, plus how to coach them.
// The result is saved on the client's coach record (coach_clients.data.insight); the dashboard checks for it.
// Body: { clientId, name, hd: dataURL|null, disc: dataURL|null, hdNotes, discNotes, rep: { V, A, K, Ad } | null, north }
// Needs ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL).
const { SB_URL, SB_ANON, requireAdmin } = require('../lib/admin');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const SYSTEM = `You help Savannah (Sav), a neurodivergent-affirming coach (NLP, nervous system, beliefs, emotions, identity) who runs the Breakthrough program, understand her 1:1 clients. You write private, back-of-house notes for her, never for the client.
Read the client's Human Design chart (image or PDF), DISC result (image, PDF or notes) and Rep System scores (out of 20: V visual, A auditory, K kinesthetic, Ad auditory digital).
Be accurate: only state chart details you can actually read (type, strategy, authority, profile, definition, defined/open centres, channels from pairs of activated gates, cross, not-self, signature, digestion, environment, sense). If something isn't visible, leave it out. Treat Human Design, DISC and rep systems as lenses for curiosity, not labels or facts.
Write in Australian English, warm, plain and practical. Short sentences. No em dashes. Use the client's first name and their pronouns if clear (DISC often shows gender), otherwise they/them.
Every point has: t (short title), b (what it means for this person), c (what it means for coaching them, concrete).
Return ONLY JSON in exactly this shape:
{"snapshot":"3 sentences on who they are and how to work with them","chips":["6-8 short tags"],
"glance":{"type":"Human Design type or empty","profile":"e.g. 6/2","authority":"e.g. Emotional","strategy":"e.g. Inform","discTop":"top one or two DISC letters, e.g. S + C","centres":{"head":false,"ajna":false,"throat":false,"g":false,"heart":false,"spleen":false,"sacral":false,"sp":false,"root":false}},
"dials":[{"l":"left end","r":"right end","v":0,"why":"which results put them here"}],
"flow":{"before":["before a session"],"during":["in the session"],"after":["after the session"]},
"hd":{"headline":"1 sentence","points":[{"t":"","b":"","c":""}]},
"disc":{"headline":"1 sentence","scores":{"D":0,"I":0,"S":0,"C":0},"points":[{"t":"","b":"","c":""}]},
"rep":{"headline":"1 sentence","points":[{"t":"","b":"","c":""}]},
"coach":{"headline":"1 sentence","themes":[{"i":"one emoji","t":"","b":"which signals across the three tools point here","c":"what to do"}],"setup":["how to set up sessions"],"use":["phrases that land, in quotes"],"avoid":["what to avoid"],"questions":["powerful questions for them"],"watch":["signs they're struggling"]}}
centres: true = defined (coloured) in the chart. dials: exactly 6 spectrums, v is 0 (fully left) to 100 (fully right), use: Head first/Body first, Decides fast/Decides over days, Wants guidance/Needs autonomy, Moved by hype/Moved by evidence, Recharges with people/Recharges alone, Loves change/Loves steadiness. flow: 2 before, 4 during, 3 after, each under 8 words.\nAim for: hd 8-11 points (type+strategy, authority, profile, not-self/signature, definition, notable open and defined centres, key channels, cross, digestion/environment/sense), disc 4-5 points (each high factor, low factor, under stress), rep 4-5 points, coach 6-7 themes (look for where the tools agree or pull against each other), 5 setup, 6 use, 6 avoid, 7 questions, 6 watch. Omit a section's points (empty array) if that tool is missing.`;

function block(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  if (m[1] === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: m[2] } };
  if (/^image\/(png|jpeg|gif|webp)$/.test(m[1])) return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } };
  return null;
}
async function save(w, clientId, patch) {
  const h = { Authorization: w.auth, apikey: SB_ANON, 'content-type': 'application/json' };
  const cur = await fetch(`${SB_URL}/rest/v1/coach_clients?client_id=eq.${clientId}&select=data`, { headers: h }).then(r => r.json()).catch(() => []);
  const data = Object.assign({}, (cur[0] && cur[0].data) || {}, patch);
  await fetch(`${SB_URL}/rest/v1/coach_clients?on_conflict=client_id`, { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates' }, h),
    body: JSON.stringify({ client_id: clientId, data, updated_at: new Date().toISOString() }) });
}

exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) { return; }
  const id = String(b.clientId || ''); if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const started = new Date().toISOString();
  try {
    const content = [];
    const hd = block(b.hd), disc = block(b.disc);
    if (hd) content.push({ type: 'text', text: 'Human Design chart:' }, hd);
    if (b.hdNotes) content.push({ type: 'text', text: 'Sav’s Human Design notes: ' + String(b.hdNotes).slice(0, 2000) });
    if (disc) content.push({ type: 'text', text: 'DISC result:' }, disc);
    if (b.discNotes) content.push({ type: 'text', text: 'Sav’s DISC notes: ' + String(b.discNotes).slice(0, 2000) });
    const r = b.rep || null;
    content.push({ type: 'text', text: 'Client first name: ' + String(b.name || 'the client').split(' ')[0]
      + '\nRep System scores: ' + (r ? `Visual ${r.V}/20, Auditory ${r.A}/20, Kinesthetic ${r.K}/20, Auditory digital ${r.Ad}/20` : 'not done yet')
      + (b.north ? '\nTheir own words from the app (North Star / what they are done with): ' + String(b.north).slice(0, 1500) : '')
      + '\nWrite the JSON now.' });
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': String(process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, ''), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content }] })
    });
    if (!res.ok) throw new Error('AI ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const out = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    out.made = new Date().toISOString(); out.by = 'ai';
    await save(w, id, { insight: out, insightJob: { state: 'done', at: out.made, started } });
  } catch (e) {
    console.error('coach-profile', e);
    await save(w, id, { insightJob: { state: 'error', at: new Date().toISOString(), started, error: String(e.message || e).slice(0, 200) } });
  }
};
