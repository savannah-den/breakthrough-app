/* BT_TIME: the app's "day" follows the timezone she picked in her profile (falls back to the device's).
   key(t)      -> day key ("2026-10-28") for a real timestamp, in her timezone
   wallKey(d)  -> day key for a calendar Date built from today() (its local fields already are her date)
   today()     -> a Date at local midnight whose fields are today's date in her timezone
   now()       -> "wall clock" ms in her timezone (use for comparing with dates built from today()) */
(function () {
  var fmts = {};
  function deviceTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function tz() { try { var p = JSON.parse(localStorage.getItem('bt-profile') || 'null'); if (p && p.tz) return p.tz; } catch (e) {} return deviceTz(); }
  function wallUTC(t, z) {
    var f = fmts[z] || (fmts[z] = new Intl.DateTimeFormat('en-US', { timeZone: z, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    var o = {}; f.formatToParts(new Date(t)).forEach(function (p) { o[p.type] = p.value; });
    return Date.UTC(+o.year, +o.month - 1, +o.day, (+o.hour) % 24, +o.minute, +o.second);
  }
  function delta(t) {
    var z = tz(); if (!z || z === deviceTz()) return 0;
    try { var localWall = t - new Date(t).getTimezoneOffset() * 60000; return Math.round((wallUTC(t, z) - localWall) / 60000) * 60000; } catch (e) { return 0; }
  }
  function wallKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function key(t) { t = t == null ? Date.now() : +t; return wallKey(new Date(t + delta(t))); }
  function now() { var t = Date.now(); return t + delta(t); }
  function today() { var d = new Date(now()); d.setHours(0, 0, 0, 0); return d; }
  window.BT_TIME = { tz: tz, deviceTz: deviceTz, key: key, wallKey: wallKey, now: now, today: today };
})();
