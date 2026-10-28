// Sends phone notifications (Web Push). Needs, in Netlify → Environment variables:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   made with the "Make my notification keys" button in the coach dashboard → Settings
//   SUPABASE_SERVICE_ROLE_KEY             Supabase → Project Settings → API → service_role (secret). Lets the server
//                                         read everyone's notification settings. Never put it in the app or a chat.
const webpush = require('web-push');
const { SB_URL } = require('./admin');

function ready() { return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY); }
function svc(path, opts) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, opts || {}, { headers: Object.assign({ apikey: k, Authorization: 'Bearer ' + k, 'content-type': 'application/json' }, (opts || {}).headers || {}) }));
}
async function send(rows, payload) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:savannah@colourmeneurospicy.com.au', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  let sent = 0;
  await Promise.all(rows.map(async r => {
    try { await webpush.sendNotification(r.sub, JSON.stringify(payload), { TTL: 6 * 3600 }); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await svc('push_subs?endpoint=eq.' + encodeURIComponent(r.endpoint), { method: 'DELETE' }); }
  }));
  return sent;
}
module.exports = { ready, svc, send };
