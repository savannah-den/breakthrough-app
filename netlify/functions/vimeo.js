// Vimeo, read-only, for the coach dashboard's Course tab: finds each lesson's video, its length and its
// auto-captions (turned into a transcript that powers the in-app search).
// Setup: vimeo.com → Settings → Apps → Create an app → Generate an access token with the Private + Video Files scopes off,
// just "Public" and "Private" read. Add it in Netlify → Environment variables as VIMEO_TOKEN (never paste it anywhere else).
const { requireAdmin, json } = require('../lib/admin');
const V = 'https://api.vimeo.com';

function vtt(text) {
  // keep only the spoken words: drop the header, cue numbers, timings and tags, then join into paragraphs
  const lines = String(text || '').split(/\r?\n/), out = [];
  lines.forEach(l => {
    if (!l.trim() || /^WEBVTT/.test(l) || /-->/.test(l) || /^\d+$/.test(l.trim()) || /^(NOTE|STYLE|Kind:|Language:)/.test(l)) return;
    const t = l.replace(/<[^>]+>/g, '').trim(); if (t && t !== out[out.length - 1]) out.push(t);
  });
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  const token = process.env.VIMEO_TOKEN;
  if (!token) return json({ setup: true, videos: [] });
  const H = { Authorization: 'bearer ' + token, Accept: 'application/vnd.vimeo.*+json;version=3.4' };
  let want = [];
  try { want = (JSON.parse(event.body || '{}').want || []).map(String).filter(x => /^\d+$/.test(x)).slice(0, 40); } catch (e) {}
  // every video on the account (newest first), up to 500
  const videos = []; let url = `${V}/me/videos?per_page=100&fields=uri,name,link,duration,created_time,status&sort=date&direction=desc`;
  for (let i = 0; url && i < 5; i++) {
    const r = await fetch(url, { headers: H }); if (!r.ok) return json({ error: 'Vimeo said ' + r.status, videos: [] });
    const d = await r.json();
    (d.data || []).forEach(v => videos.push({ id: (v.uri || '').split('/').pop(), name: v.name || '', link: v.link || '', duration: v.duration || 0, created: v.created_time, status: v.status }));
    url = d.paging && d.paging.next ? V + d.paging.next : '';
  }
  // transcripts for the ones asked for (from their captions; auto-captions count)
  const transcripts = {};
  await Promise.all(want.map(async id => {
    try {
      const r = await fetch(`${V}/videos/${id}/texttracks`, { headers: H }); if (!r.ok) return;
      const tracks = ((await r.json()).data || []).filter(t => t.link);
      const t = tracks.find(t => t.active && /^en/i.test(t.language || '')) || tracks.find(t => /^en/i.test(t.language || '')) || tracks[0];
      if (!t) return;
      const f = await fetch(t.link); if (!f.ok) return;
      const words = vtt(await f.text()); if (words) transcripts[id] = words.slice(0, 60000);
    } catch (e) {}
  }));
  return json({ videos, transcripts });
};
