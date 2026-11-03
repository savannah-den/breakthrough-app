// Reads Sav's Google Calendar (the secret iCal address in GCAL_ICS_URL) on the server and returns real
// occurrences in a time window, with repeating events expanded, cancelled ones dropped and moved ones moved.
function unfold(t) { return t.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, ''); }
function unesc(v) { return String(v || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\'); }
function zoned(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const o = {}; f.formatToParts(new Date(guess)).forEach(p => { o[p.type] = p.value; });
    const asUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second);
    return guess - (asUtc - guess);
  } catch (e) { return guess; }
}
// "DTSTART;TZID=Australia/Brisbane:20261105T100000" -> { y, mo, d, h, mi, s, tz, utc, allDay, ms }
function parseDT(line) {
  const m = /^[^:;]+((?:;[^:]*)?):(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/.exec(line);
  if (!m) return null;
  const [, params, y, mo, d, h, mi, s, z] = m;
  const w = { y: +y, mo: +mo, d: +d, h: +(h || 0), mi: +(mi || 0), s: +(s || 0), allDay: !h, utc: !!z, tz: (/TZID=([^;:]+)/.exec(params || '') || [])[1] || null };
  w.ms = toMs(w);
  return w;
}
function toMs(w) { return w.utc || !w.tz ? Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) : zoned(w.y, w.mo, w.d, w.h, w.mi, w.s, w.tz); }
function dayAdd(w, n) { const t = new Date(Date.UTC(w.y, w.mo - 1, w.d + n)); return Object.assign({}, w, { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() }); }
function dow(w) { return new Date(Date.UTC(w.y, w.mo - 1, w.d)).getUTCDay(); }
const DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

// all start times of a repeating event between from and to (ms)
function expand(st, rule, from, to) {
  const r = {}; rule.split(';').forEach(p => { const [k, v] = p.split('='); r[k] = v; });
  const freq = r.FREQ, iv = Math.max(1, +(r.INTERVAL || 1)), count = r.COUNT ? +r.COUNT : Infinity;
  const until = r.UNTIL ? (parseDT('X:' + r.UNTIL) || {}).ms : Infinity;
  const out = []; let n = 0;
  const take = (w) => { const ms = toMs(w); if (ms < st.ms) return true; if (ms > until || n >= count) return false; n++; if (ms >= from && ms <= to) out.push(ms); return ms <= to; };
  if (freq === 'DAILY') { for (let i = 0; i < 3000; i++) { if (!take(dayAdd(st, i * iv))) break; } }
  else if (freq === 'WEEKLY') {
    const by = (r.BYDAY ? r.BYDAY.split(',') : [Object.keys(DAYS)[dow(st)]]).map(x => DAYS[x.slice(-2)]).sort();
    const wk0 = dayAdd(st, -((dow(st) - 1 + 7) % 7)); // Monday of the first week
    outer: for (let k = 0; k < 600; k++) {
      for (const dd of by) { const w = dayAdd(wk0, k * 7 * iv + ((dd - 1 + 7) % 7)); if (!take(w)) break outer; }
    }
  } else if (freq === 'MONTHLY') {
    const bd = r.BYDAY && /^(-?\d)?([A-Z]{2})$/.exec(r.BYDAY);
    for (let k = 0; k < 400; k++) {
      const t = new Date(Date.UTC(st.y, st.mo - 1 + k * iv, 1)); let w = Object.assign({}, st, { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: 1 });
      if (bd) {
        const want = DAYS[bd[2]], nth = +(bd[1] || 1), first = (want - dow(w) + 7) % 7 + 1;
        const dim = new Date(Date.UTC(w.y, w.mo, 0)).getUTCDate(); let day = nth > 0 ? first + (nth - 1) * 7 : first + Math.floor((dim - first) / 7) * 7 + (nth + 1) * 7;
        if (day < 1 || day > dim) continue; w.d = day;
      } else { const dim = new Date(Date.UTC(w.y, w.mo, 0)).getUTCDate(); if (st.d > dim) continue; w.d = st.d; }
      if (!take(w)) break;
    }
  } else if (st.ms >= from && st.ms <= to) out.push(st.ms);
  return out;
}
const ZOOM_RE = /https:\/\/[a-z0-9.-]*zoom\.us\/(?:j|my|w)\/[^\s"'<>\\),]+/i;
function findZoom(...texts) { for (const t of texts) { const m = ZOOM_RE.exec(String(t || '')); if (m) return m[0].replace(/[.;]+$/, ''); } return ''; }

function occurrences(ics, from, to) {
  const text = unfold(ics), base = [], moved = {};
  text.split('BEGIN:VEVENT').slice(1).forEach(block => {
    const body = block.split('END:VEVENT')[0], lines = body.split(/\r?\n/);
    const get = k => lines.find(l => l.startsWith(k + ':') || l.startsWith(k + ';'));
    const val = l => l ? unesc(l.slice(l.indexOf(':') + 1)) : '';
    const ds = get('DTSTART'); if (!ds) return;
    const st = parseDT(ds); if (!st || st.allDay) return;
    const de = get('DTEND'), en = de ? parseDT(de) : null;
    const ev = {
      uid: val(get('UID')), title: val(get('SUMMARY')).slice(0, 200), cancelled: /^STATUS:CANCELLED/m.test(body), st, dur: en ? en.ms - st.ms : 3600e3,
      attendees: lines.filter(l => /^ATTENDEE/.test(l) && !/PARTSTAT=DECLINED/i.test(l)).map(l => ((/mailto:([^\s;]+)/i.exec(l) || [])[1] || '').toLowerCase()).filter(Boolean),
      zoom: findZoom(val(get('LOCATION')), lines.filter(l => /^(CONFERENCE|X-GOOGLE-CONFERENCE)/.test(l)).map(val).join(' '), val(get('DESCRIPTION'))),
      rrule: val(get('RRULE')), exdates: lines.filter(l => /^EXDATE/.test(l)).flatMap(l => { const pre = l.slice(0, l.indexOf(':')); return l.slice(l.indexOf(':') + 1).split(',').map(v => (parseDT(pre + ':' + v) || {}).ms); })
    };
    const rid = get('RECURRENCE-ID');
    if (rid) { const r = parseDT(rid); (moved[ev.uid] = moved[ev.uid] || {})[r ? r.ms : 0] = ev; }
    base.push(Object.assign(ev, { isOverride: !!rid }));
  });
  const out = [];
  base.forEach(ev => {
    if (ev.isOverride) { if (!ev.cancelled && ev.st.ms >= from && ev.st.ms <= to) out.push(pack(ev, ev.st.ms)); return; }
    if (ev.cancelled) return;
    const starts = ev.rrule ? expand(ev.st, ev.rrule, from, to) : (ev.st.ms >= from && ev.st.ms <= to ? [ev.st.ms] : []);
    starts.forEach(ms => { if (ev.exdates.indexOf(ms) >= 0) return; if (moved[ev.uid] && moved[ev.uid][ms]) return; out.push(pack(ev, ms)); });
  });
  return out.sort((a, b) => a.ms - b.ms);
}
function pack(ev, ms) { return { id: ev.uid + '@' + ms, uid: ev.uid, ms, start: new Date(ms).toISOString(), title: ev.title, attendees: ev.attendees, zoom: ev.zoom }; }

module.exports = { occurrences, findZoom, parseDT, expand };
