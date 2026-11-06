// Coach-only, runs in the background (can take a couple of minutes): Sav's back-of-house map of one client.
// Reads everything this person has shared: their call summaries + transcripts (discovery/first call and every 1:1),
// the WhatsApp chats Sav has imported, and what they've done in the app (beliefs, proof, notebook answers, notes, tools).
// Writes coach_clients.data.map: their key limiting beliefs, and for each one the memories, emotions, what they believe
// about themselves, the proof that built it, and the new proof against it. Every item says where it came from, so Sav can
// see only what they told her (calls + messages) or everything. Body: { clientId }. Needs ANTHROPIC_API_KEY.
const { SB_URL, SB_ANON, requireAdmin } = require('../lib/admin');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const SYSTEM = `You help Savannah (Sav), a neurodivergent-affirming coach (NLP, nervous system, beliefs, emotions, identity) who runs the Breakthrough program. You build her private, back-of-house map of one client, never shown to the client.
Find the client's KEY limiting beliefs (usually 3 to 6, the ones that keep coming up), and for each one link everything that built it and everything that is changing it.
Rules:
- Only use what is in the sources. Never invent, never diagnose, never add detail they didn't give. Short, plain Australian English. No em dashes.
- Use their own words where you can (put them in "quote").
- Every item has a source: "call" (a Zoom call with Sav), "message" (WhatsApp or other messages to Sav), or "app" (something they wrote or did in the app). "told" is true for call and message, false for app.
- "where" says exactly where: e.g. "Discovery call · 20 Oct", "Session 1 · 5 Nov", "WhatsApp · 3 Nov", "App · Becoming Notebook · Lesson 4", "App · Proof portfolio".
- Item types: "memory" (a past event or story that built the belief), "emotion" (a feeling tied to it), "self" (what they believe or say about themselves), "proof" (evidence they've used to prove the belief true, how it shows up now), "counter" (new proof against it: wins, shifts, things they did differently), "concept" (a Breakthrough concept or tool that applies, e.g. RAS filter, toward/away drivers, good-better-best).
- Every belief also gets "root": which of the Fierce 5 it grows from: "worthy" (I'm not worthy), "good" (I'm not good enough), "loved" (I'm not loved), "safe" (I'm not safe), "capable" (I'm not capable).
- Every emotion (both "emotion" items and the emotions list) also gets "core" and "feel" from the Energy in Motion wheel. Cores and their words: anger (Furious, Resentful, Frustrated, Jealous, Irritated, Defensive, Annoyed, Critical), sadness (Despair, Lonely, Hopeless, Isolated, Down, Disconnected, Apathetic, Unmotivated), fear (Panicked, Anxious, Overwhelmed, Threatened, Nervous, Worried, Unsettled, Insecure), hurt (Betrayed, Rejected, Abandoned, Excluded, Disappointed, Unseen, Let down, Misunderstood), guilt (Remorseful, Regretful, Self-blaming, Burdened, Sorry, Torn, Uneasy, Obligated), shame (Humiliated, Embarrassed, Worthless, Exposed, Inadequate, Awkward, Like a fraud, Self-conscious), grief (Bereft, Longing, Empty, Numb, Missing, Nostalgic, Homesick, Wistful), joy (Excited, Playful, Happy, Proud, Hopeful, Free, Cheerful, Content), love (Devoted, Connected, Tender, Intimate, Valued, Accepted, Warm, Trusting). "feel" is the closest wheel word. If it isn't really an emotion on the wheel (e.g. tiredness), use core "other" and feel = their word.
- Leave out sexual details and anything about other people that isn't needed to understand the belief. Health and diagnoses only as the client described them, and only if they matter for the belief.
Return ONLY JSON in exactly this shape:
{"summary":"2 sentences: the big pattern across their beliefs",
"beliefs":[{"id":"b1","text":"the belief in their words, e.g. I'm not good enough","theme":"one or two words","how":"1-2 sentences on how it shows up for them now","strength":1-5,"root":"worthy|good|loved|safe|capable",
 "items":[{"type":"memory|emotion|self|proof|counter|concept","text":"short, under 30 words","quote":"their exact words if available, else empty","src":"call|message|app","told":true,"where":"...","core":"only for emotion items","feel":"only for emotion items"}]}],
"emotions":[{"text":"emotion","core":"anger|sadness|fear|hurt|guilt|shame|grief|joy|love|other","feel":"closest wheel word","where":"...","src":"call|message|app","told":true}],
"themes":["4-8 short tags"]}`;

async function gather(w, id) {
  const h = { Authorization: w.auth, apikey: SB_ANON };
  const get = (q) => fetch(`${SB_URL}/rest/v1/${q}`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []);
  const [prof, rows, co] = await Promise.all([
    get(`profiles?id=eq.${id}&select=full_name,email`),
    get(`client_data?user_id=eq.${id}&select=key,value`),
    get(`coach_clients?client_id=eq.${id}&select=data`)
  ]);
  const mine = (co[0] && co[0].data) || {};
  const parts = [];
  const clip = (t, n) => String(t || '').slice(0, n);
  const when = (t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); };
  // calls: discovery/first call + every 1:1 with a summary or transcript
  Object.keys(mine.calls || {}).forEach(k => { const c = mine.calls[k]; parts.push(['call', (c.title || 'First call') + ' · ' + when(c.at), clip(c.summary, 14000) + (c.transcript ? '\n\nTRANSCRIPT:\n' + clip(c.transcript, 40000) : '')]); });
  const ses = Object.keys(mine.sessions || {}).map(k => mine.sessions[k]).filter(s => s && (s.summary || s.transcript || s.notes)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  ses.forEach((s, i) => parts.push(['call', 'Session ' + (i + 1) + ' · ' + when(s.at), clip(s.summary, 14000) + (s.notes ? '\n\nSAV’S NOTES:\n' + clip(s.notes, 4000) : '') + (s.transcript ? '\n\nTRANSCRIPT:\n' + clip(s.transcript, 40000) : '')]));
  (mine.wa || []).forEach(x => parts.push(['message', 'WhatsApp chat (imported ' + when(x.at) + ')', clip(x.text, 60000)]));
  // the app: skip big images and bookkeeping keys
  const SKIP = /^(bt-mail-log|bt-call-log|bt-wk-told|bt-tz|bt-profile|__|sb-|bt-return|cmn-open-tab|cmn-dash-focus)/;
  (rows || []).forEach(r => {
    if (SKIP.test(r.key)) return;
    let v = String(r.value || ''); v = v.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[image]');
    if (v.length < 20) return;
    parts.push(['app', 'App data: ' + r.key, clip(v, 12000)]);
  });
  return { name: (prof[0] && prof[0].full_name) || '', parts, keep: mine.map || null };
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
  let q = {}; try { q = JSON.parse(event.body || '{}'); } catch (e) { return; }
  const id = String(q.clientId || ''); if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const started = new Date().toISOString();
  try {
    const b = await gather(w, id);
    if (!b.parts.length) throw new Error('Nothing to map yet: no calls, messages or app answers.');
    let budget = 180000;
    const text = b.parts.map(p => { const s = '=== SOURCE: ' + p[0].toUpperCase() + ' · ' + p[1] + ' ===\n' + p[2]; const out = s.slice(0, Math.max(0, budget)); budget -= out.length; return out; }).filter(Boolean).join('\n\n');
    const prompt = 'Client first name: ' + String(b.name || 'the client').split(' ')[0] + '\n\n' + text + '\n\nWrite the JSON now.';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': String(process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, ''), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, system: SYSTEM, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error('AI ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    const out = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    if (data.stop_reason === 'max_tokens') throw new Error('AI reply was cut off (too long)');
    const map = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
    // keep what Sav did by hand: items she added stay, items she removed stay removed
    const keep = b.keep || {};
    map.manual = keep.manual || []; map.hidden = keep.hidden || [];
    map.made = new Date().toISOString(); map.by = 'ai'; map.sources = b.parts.map(p => p[0] + ' · ' + p[1]).slice(0, 60);
    await save(w, id, { map, mapJob: { state: 'done', at: map.made, started } });
  } catch (e) {
    await save(w, id, { mapJob: { state: 'error', at: new Date().toISOString(), started, error: String(e.message || e).slice(0, 300) } });
  }
};
