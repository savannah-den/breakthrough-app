// Zoom, read-only, for the coach dashboard: after each 1:1, finds the Zoom meeting at that time and brings back
// the AI Companion summary, the transcript and the cloud recording link.
// Setup: marketplace.zoom.us → Develop → Build App → Server-to-Server OAuth. Add these scopes:
//   cloud_recording:read:list_user_recordings:admin, cloud_recording:read:list_recording_files:admin,
//   meeting:read:summary:admin (or meeting_summary:read:admin), meeting:read:list_summaries:admin
// Activate it, then add its three values in Netlify → Environment variables (never paste them anywhere else):
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
const { requireAdmin, json } = require('../lib/admin');
const Z = 'https://api.zoom.us/v2';
const WINDOW = 90 * 60000; // a meeting within 90 minutes of the booked time counts as that session

async function token() {
  const id = process.env.ZOOM_CLIENT_ID, secret = process.env.ZOOM_CLIENT_SECRET, acct = process.env.ZOOM_ACCOUNT_ID;
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(acct)}`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64') } });
  if (!r.ok) throw new Error('Zoom login failed (' + r.status + ')');
  return (await r.json()).access_token;
}
const day = d => new Date(d).toISOString().slice(0, 10);
const uuidPath = u => (/^\/|\/\//.test(u) ? encodeURIComponent(encodeURIComponent(u)) : encodeURIComponent(u));
function vtt(text) {
  const out = []; let who = '';
  String(text || '').split(/\r?\n/).forEach(l => {
    if (!l.trim() || /^WEBVTT/.test(l) || /-->/.test(l) || /^\d+$/.test(l.trim())) return;
    const m = /^([^:]{1,40}):\s*(.*)$/.exec(l.trim());
    if (m) { if (m[1] !== who) { who = m[1]; out.push('\n' + who + ': ' + m[2]); } else out.push(m[2]); } else out.push(l.trim());
  });
  return out.join(' ').replace(/ \n/g, '\n').trim();
}
function summaryText(s) {
  if (!s) return '';
  const parts = [];
  if (s.summary_overview) parts.push(s.summary_overview);
  (s.summary_details || []).forEach(d => parts.push((d.label ? d.label + ': ' : '') + (d.summary || '')));
  if (s.next_steps && s.next_steps.length) parts.push('Next steps:\n• ' + s.next_steps.join('\n• '));
  if (!parts.length && s.summary_content) parts.push(s.summary_content);
  return parts.join('\n\n').trim();
}

exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  if (!(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET)) return json({ setup: true, found: {} });
  let want = [];
  try { want = (JSON.parse(event.body || '{}').sessions || []).filter(s => s && s.key && s.start && Date.parse(s.start) < Date.now()).slice(0, 60); } catch (e) {}
  if (!want.length) return json({ found: {} });
  let tok; try { tok = await token(); } catch (e) { return json({ error: String(e.message || e), found: {} }); }
  const H = { Authorization: 'Bearer ' + tok };
  const first = Math.min(...want.map(s => Date.parse(s.start))) - 864e5, last = Math.min(Date.now(), Math.max(...want.map(s => Date.parse(s.start))) + 864e5);
  // Zoom only lists 30 days at a time
  const meetings = [], summaries = [];
  for (let a = first; a < last; a += 30 * 864e5) {
    const from = day(a), to = day(Math.min(last, a + 29 * 864e5));
    try {
      const r = await fetch(`${Z}/users/me/recordings?page_size=300&from=${from}&to=${to}`, { headers: H });
      if (r.ok) ((await r.json()).meetings || []).forEach(m => meetings.push(m));
    } catch (e) {}
    try {
      const r = await fetch(`${Z}/meetings/meeting_summaries?page_size=300&from=${from}T00:00:00Z&to=${to}T23:59:59Z`, { headers: H });
      if (r.ok) ((await r.json()).summaries || []).forEach(s => summaries.push(s));
    } catch (e) {}
  }
  const found = {};
  await Promise.all(want.map(async s => {
    const t = Date.parse(s.start), near = x => Math.abs(Date.parse(x) - t) <= WINDOW;
    const m = meetings.filter(m => near(m.start_time)).sort((a, b) => Math.abs(Date.parse(a.start_time) - t) - Math.abs(Date.parse(b.start_time) - t))[0];
    const sm = summaries.filter(x => near(x.meeting_start_time || x.summary_start_time)).sort((a, b) => Math.abs(Date.parse(a.meeting_start_time) - t) - Math.abs(Date.parse(b.meeting_start_time) - t))[0];
    if (!m && !sm) return;
    const rec = { topic: (m && m.topic) || (sm && sm.meeting_topic) || '' };
    if (m) {
      rec.video = m.share_url || '';
      const tr = (m.recording_files || []).find(f => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript');
      if (tr && tr.download_url && s.needTranscript !== false) {
        try { const r = await fetch(tr.download_url, { headers: H, redirect: 'follow' }); if (r.ok) rec.transcript = vtt(await r.text()).slice(0, 80000); } catch (e) {}
      }
    }
    const uuid = (sm && sm.meeting_uuid) || (m && m.uuid);
    if (uuid && s.needSummary !== false) {
      try { const r = await fetch(`${Z}/meetings/${uuidPath(uuid)}/meeting_summary`, { headers: H }); if (r.ok) rec.summary = summaryText(await r.json()).slice(0, 20000); } catch (e) {}
    }
    found[s.key] = rec;
  }));
  return json({ found });
};
