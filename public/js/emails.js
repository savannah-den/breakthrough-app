// Branded emails (welcome + call reminders). Same look as the 1:1 invite email: maroon, cream, lime, pink.
// Lives in public/js so the coach dashboard can preview it; the Netlify functions load it via netlify/lib/emails.js.
// img: a function that turns an image name into its URL (the live site by default).
(function () {
const SITE = 'https://app.colourmeneurospicy.com.au';
const C = { bg: '#3A0E0C', card: '#4A1210', line: '#6A2420', lime: '#F2F7AE', pink: '#EFC6EE', cream: '#FCF3EF', ink: '#1E1414', soft: '#F3DCD6', red: '#A3302A' };
const HAND = "'Patrick Hand SC','Trebuchet MS',Arial,sans-serif", SERIF = "'Playfair Display',Georgia,'Times New Roman',serif", SANS = "'Poppins',Arial,Helvetica,sans-serif";
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const defImg = (site) => (n) => (n === 'logo' ? site + '/icons/icon-192.png' : site + '/img/email/' + n + (/^icons\//.test(n) ? '.png' : '.jpg')); // welcome step pictures: 'welcome/home' etc.

// email apps differ: give every coloured table/cell a bgcolor attribute too, so the maroon/cream always shows
function solid(html) {
  return html.replace(/<(table|td)([^>]*?)style="([^"]*?)background:(#[0-9A-Fa-f]{6})/g, function (m, tag, pre, st, col) { return '<' + tag + ' bgcolor="' + col + '"' + pre + 'style="' + st + 'background-color:' + col; });
}
function shell(o) { return solid(shell0(o)); }
function shell0(o) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>' + esc(o.title) + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">'
    + '<style>body{margin:0;padding:0;background:' + C.bg + '}img{border:0;display:block}a{color:' + C.card + '}@media (max-width:620px){.wrap{width:100%!important}.pad{padding-left:22px!important;padding-right:22px!important}.stack{display:block!important;width:100%!important}.h1{font-size:34px!important}.ph{width:100%!important;max-width:280px!important;height:auto!important;margin:0 auto 18px!important}}</style></head>'
    + '<body bgcolor="' + C.bg + '" style="margin:0;padding:0;background:' + C.bg + '">'
    + '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">' + esc(o.pre) + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C.bg + '"><tr><td align="center" style="padding:24px 10px">'
    + '<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;background:' + C.card + ';border-radius:24px;overflow:hidden;font-family:' + SANS + '">'
    + '<tr><td class="pad" style="padding:22px 36px 18px;border-bottom:1px solid ' + C.line + '"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td width="46" style="padding-right:12px"><img src="' + o.img('logo') + '" width="40" height="40" alt="" style="width:40px;height:40px;border-radius:10px"></td>'
    + '<td style="font-family:' + HAND + ';font-size:21px;letter-spacing:2px;color:' + C.lime + '">Colour Me Neurospicy</td>'
    + '<td align="right"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr><td style="background:' + C.lime + ';color:' + C.card + ';font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;white-space:nowrap">' + esc(o.pill) + '</td></tr></table></td>'
    + '</tr></table></td></tr>'
    + o.body
    + '<tr><td align="center" style="border-top:1px solid ' + C.line + ';padding:20px 36px 26px;font-family:' + SANS + ';font-size:13px;line-height:1.8;color:#D9B9B2">'
    + '<a href="https://www.instagram.com/colour_me_neurospicy/" style="color:' + C.lime + ';text-decoration:none;font-weight:600">Instagram</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="mailto:savannah@colourmeneurospicy.com.au" style="color:' + C.lime + ';text-decoration:none;font-weight:600">Email Sav</a>'
    + '<div style="font-family:' + HAND + ';font-size:15px;letter-spacing:2px;margin-top:6px">Colour Me Neurospicy &middot; Breakthrough</div></td></tr>'
    + '</table></td></tr></table></body></html>';
}
function button(href, label, big) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:' + C.lime + ';border:2px solid ' + C.ink + ';border-radius:999px">'
    + '<a href="' + esc(href) + '" style="display:inline-block;padding:' + (big ? '18px 42px' : '15px 36px') + ';font-family:' + SANS + ';font-size:' + (big ? 20 : 18) + 'px;font-weight:600;color:#2A0A08;text-decoration:none">' + label + '</a></td></tr></table>';
}
function signoff(img, line) {
  return '<tr><td class="pad" align="center" style="padding:44px 40px 40px;text-align:center">'
    + '<img src="' + img('sav-face') + '" width="96" height="96" alt="Savannah" style="width:96px;height:96px;border-radius:48px;border:3px solid ' + C.lime + ';margin:0 auto 16px">'
    + '<p style="margin:0 0 6px;font-family:' + SERIF + ';font-style:italic;font-weight:700;font-size:22px;line-height:1.4;color:' + C.cream + '">' + line + '</p>'
    + '<p style="margin:14px 0 0;font-family:' + SERIF + ';font-weight:700;font-size:28px;color:' + C.pink + '">Savannah xx</p></td></tr>';
}

/* ---------- Welcome (new 1:1 client) ---------- */
function step(n, title, time, text, how, pic) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border:2px solid ' + C.ink + ';border-radius:18px;margin-bottom:12px"><tr>'
    + '<td width="58" valign="top" style="padding:18px 0 18px 16px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="42" height="42" align="center" valign="middle" style="width:42px;height:42px;border-radius:21px;background:' + C.card + ';color:' + C.lime + ';font-family:' + SERIF + ';font-weight:700;font-size:21px">' + n + '</td></tr></table></td>'
    + '<td style="padding:18px 18px 18px 8px">'
    + '<div style="font-family:' + HAND + ';font-size:16px;letter-spacing:1.5px;color:' + C.red + '">' + time + '</div>'
    + '<div style="font-family:' + SERIF + ';font-weight:800;font-size:21px;line-height:1.25;color:' + C.ink + ';margin:2px 0 6px">' + title + '</div>'
    + '<div style="font-size:15px;line-height:1.6;color:#4A3A38">' + text + '</div>'
    + (how ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px"><tr><td style="background:' + C.cream + ';border-radius:12px;padding:10px 14px;font-size:13.5px;line-height:1.6;color:#3A2A28">' + how + '</td></tr></table>' : '')
    + '</td></tr>'
    + (pic ? '<tr><td colspan="2" align="center" style="padding:0 18px 20px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="background:' + C.card + ';border-radius:22px;padding:8px">'
      + '<img src="' + pic.src + '" width="300" alt="' + esc(pic.alt) + '" style="display:block;width:300px;max-width:100%;height:auto;border-radius:16px"></td></tr></table>'
      + '<div style="font-family:' + HAND + ';font-size:15px;letter-spacing:1px;color:#6A5A57;margin-top:8px">' + pic.cap + '</div></td></tr>' : '')
    + '</table>';
}
function welcomeEmail(o) {
  o = o || {}; const site = o.site || SITE, img = o.img || defImg(site), link = o.link || site + '/1to1', first = esc(o.first || '');
  const body =
    '<tr><td class="pad" style="padding:36px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td class="stack" width="230" valign="middle" style="padding-right:24px"><img class="ph" src="' + img('sav-welcome') + '" width="210" alt="Savannah with her arms in the air, celebrating" style="width:210px;height:auto;border-radius:22px;border:4px solid ' + C.lime + '"></td>'
    + '<td class="stack" valign="middle">'
    + '<p style="margin:0 0 10px;font-family:' + HAND + ';font-size:21px;letter-spacing:2px;color:' + C.pink + '">Hiya' + (first ? ' ' + first : '') + '!! Welcome</p>'
    + '<h1 class="h1" style="margin:0 0 14px;font-family:' + SERIF + ';font-weight:800;font-size:38px;line-height:1.1;color:' + C.cream + '">You’re in. Let’s get you set up.</h1>'
    + '<p style="margin:0;font-size:16px;line-height:1.65;color:' + C.soft + '">I’m so excited to be working with you. Your private Breakthrough app is ready, and everything for our time together lives in there.</p>'
    + '</td></tr></table></td></tr>'
    + '<tr><td align="center" style="padding:28px 36px 36px">' + button(link, 'Download your app &rarr;', true)
    + '<p style="margin:10px 0 0;font-size:13px;color:#D9B9B2">' + esc(link.replace(/^https?:\/\//, '')) + '</p></td></tr>'
    + '<tr><td class="pad" style="background:' + C.cream + ';padding:40px 36px 36px;color:' + C.ink + '">'
    + '<p style="margin:0 0 6px;font-family:' + HAND + ';font-size:20px;letter-spacing:2px;color:' + C.red + '">Your game plan</p>'
    + '<h2 style="margin:0 0 8px;font-family:' + SERIF + ';font-weight:800;font-size:32px;line-height:1.15;color:' + C.ink + '">Before our first 1:1 call</h2>'
    + '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4A3A38">Four things, in this order. Doing them before we meet means we can skip the admin and go straight to the good stuff.</p>'
    + step(1, 'Download the app', 'About 5 minutes',
        'Tap the button above on your phone and log in with this email address. You’ll get a 6-digit code by email, no password needed.',
        '<strong>iPhone:</strong> open it in Safari, tap Share, then <em>Add to Home Screen</em>.<br><strong>Android:</strong> open it in Chrome, tap the ⋮ menu, then <em>Install app</em>.',
        { src: img('sav-phone'), alt: 'Savannah holding up her phone showing the Breakthrough app login screen', cap: 'Pop in your email, get your code, you’re in' })
    + step(2, 'Do your set-up steps', 'About 30 minutes',
        'They’re right on your Home screen: sign your agreement, connect with me on WhatsApp, and do your 3 quick tests (Representational System, Human Design and DISC). Your results save to your profile so I can see them too.',
        null, { src: img('welcome/steps'), alt: 'Before our first call: save the app, sign your agreement, join WhatsApp, your 3 tests, welcome module', cap: 'You’ll see this checklist on your Home screen' })
    + step(3, 'Set yourself up for success', 'Mini course &middot; about 2 hours',
        'Short videos with an activity under each one, so this is the program you actually finish. Find it in the <strong>Course</strong> tab, under Introduction.',
        null, { src: img('welcome/mini'), alt: 'The Set yourself up for success mini course: an intro and 8 short steps', cap: 'Course tab → Introduction' })
    + step(4, 'Setting Intentions', 'About 20 minutes',
        'Anchor into your why and your North Star, then turn them into your lock screen. This one sets you up beautifully for our first session.',
        null, { src: img('welcome/intentions'), alt: 'The Intentions activity: your North Star and your why', cap: 'Right after the mini course' })
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C.card + ';border-radius:18px;margin-top:8px"><tr><td style="padding:18px 22px">'
    + '<div style="font-weight:600;font-size:15px;color:' + C.lime + ';margin-bottom:4px">Turn on notifications</div>'
    + '<p style="margin:0;font-size:14px;line-height:1.6;color:' + C.soft + '">In the app, go to <strong style="color:' + C.cream + '">Profile</strong> and switch on notifications. The app will remind you about our calls the day before, 2 hours before and 15 minutes before.</p>'
    + '</td></tr></table>'
    + '</td></tr>'
    + signoff(img, 'I can’t wait to see you in there. Let’s go!');
  return { subject: 'Welcome to Breakthrough' + (o.first ? ', ' + o.first : '') + ' ✨ Here’s what to do before our first call', html: shell({ title: 'Welcome to Breakthrough', pre: 'Your private 1:1 app is ready. Here’s exactly what to do before our first call.', pill: '1:1 client', img, body }) };
}

/* ---------- Call reminder (24 hours / 2 hours before) ---------- */
// o: { first, kind: '1:1' | 'Group', start (ISO), tz, lead: '24h' | '2h', zoom, site, img }
function whenText(start, tz) {
  const d = new Date(start), opt = (x) => Object.assign({ timeZone: tz || 'Australia/Brisbane' }, x);
  let day, time, zone = '';
  try {
    day = new Intl.DateTimeFormat('en-AU', opt({ weekday: 'long', day: 'numeric', month: 'long' })).format(d);
    time = new Intl.DateTimeFormat('en-AU', opt({ hour: 'numeric', minute: '2-digit', hour12: true })).format(d).replace(/\s/g, '').toLowerCase();
    const p = new Intl.DateTimeFormat('en-AU', opt({ timeZoneName: 'short' })).formatToParts(d).find(x => x.type === 'timeZoneName');
    zone = p ? p.value : '';
  } catch (e) { day = d.toUTCString(); time = ''; }
  return { day, time, zone };
}
// "Australia/Sydney" + "AU" -> "Sydney, Australia"
function placeOf(tz, country) {
  let city = String(tz || '').split('/').pop().replace(/_/g, ' '), land = '';
  if (country) { try { land = new Intl.DisplayNames(['en'], { type: 'region' }).of(String(country).toUpperCase()) || ''; } catch (e) { land = ''; } }
  if (!land && /^Australia\//.test(tz || '')) land = 'Australia';
  return [city, land].filter(Boolean).join(', ');
}
// Sav's own time, shown small under the client's time
const COACH_TZ = 'Australia/Brisbane', COACH_PLACE = 'Queensland, Australia';
function reminderEmail(o) {
  o = o || {}; const site = o.site || SITE, img = o.img || defImg(site), first = esc(o.first || '');
  const group = o.kind === 'Group', what = group ? 'group call' : '1:1 call', w = whenText(o.start, o.tz), now = o.lead === '15m', soon = o.lead === '2h' || now;
  const cw = whenText(o.start, COACH_TZ), same = cw.time === w.time && cw.day === w.day, place = o.place || placeOf(o.tz || COACH_TZ, o.country);
  const head = group ? (now ? 'Group call starts in 15 minutes' : soon ? 'Group call in 2 hours' : 'Group coaching call tomorrow') : now ? 'We’re starting in 15 minutes' : soon ? 'Our ' + what + ' is in 2 hours' : 'Our ' + what + ' is tomorrow';
  const zoom = o.zoom || site + '/#Profile';
  const tips = group ? (now ? ['Grab a water and find your comfy spot.', 'Camera on if you can. It’s just us.', 'Tap the button and come say hi.'] : ['Bring one win from the last fortnight, big or tiny.', 'Bring one question or something you’re stuck on.', 'Camera on if you can. Nobody cares about your messy bun, I promise.'])
    : now ? ['Grab a water and find your quiet spot.', 'Tap the button below and you’re in.', 'Running late or can’t make it? Message me so I know.'] : soon
    ? ['Find a quiet, comfy spot where you can talk freely.', 'Grab water, a notebook and anything you want to bring to the call.', 'Laptop is best for Zoom. Your phone works too.']
    : ['Have a little think about what’s been coming up for you this week.', 'Pop it in your calendar if it isn’t already.', 'Anything you want to make sure we cover? Jot it down so it’s ready.'];
  const body =
    '<tr><td class="pad" style="padding:36px 36px 8px">'
    + '<p style="margin:0 0 10px;font-family:' + HAND + ';font-size:21px;letter-spacing:2px;color:' + C.pink + '">' + (group ? 'CMS group coaching 💬' : 'Hiya' + (first ? ' ' + first : '') + '!') + '</p>'
    + '<h1 class="h1" style="margin:0 0 20px;font-family:' + SERIF + ';font-weight:800;font-size:38px;line-height:1.1;color:' + C.cream + '">' + head + '</h1>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#6A1E1A;border-radius:18px"><tr>'
    + '<td width="80" valign="middle" style="padding:18px 0 18px 18px"><img src="' + img('sav-call') + '" width="64" height="64" alt="Savannah" style="width:64px;height:64px;border-radius:32px;border:3px solid ' + C.lime + '"></td>'
    + '<td valign="middle" style="padding:18px 20px">'
    + '<div style="font-family:' + HAND + ';font-size:16px;letter-spacing:1.5px;color:' + C.lime + '">' + (group ? 'CMS group call with Savannah' : '1:1 with Savannah') + '</div>'
    + '<div style="font-family:' + SERIF + ';font-weight:800;font-size:26px;line-height:1.2;color:' + C.cream + '">' + esc(w.time) + ' for you</div>'
    + '<div style="font-size:17px;font-weight:700;line-height:1.4;color:' + C.cream + '">' + esc(w.day) + '</div>'
    + '<div style="font-size:14px;font-weight:600;line-height:1.4;color:' + C.lime + '">' + esc([place, w.zone].filter(Boolean).join(' · ')) + ' · your time</div>'
    + (same ? '' : '<div style="margin-top:8px;font-size:12.5px;line-height:1.4;color:#D9B9B2">That’s ' + esc(cw.time) + (cw.day !== w.day ? ' on ' + esc(cw.day) : '') + ' for Sav (' + esc(COACH_PLACE) + (cw.zone ? ' · ' + esc(cw.zone) : '') + ')</div>')
    + '</td></tr></table></td></tr>'
    + '<tr><td align="center" style="padding:26px 36px 8px">' + button(zoom, '🎥&nbsp; Join on Zoom', true)
    + '<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#D9B9B2">One tap and you’re in. Save this email so the link’s handy.' + (o.zoom ? '<br><a href="' + esc(o.zoom) + '" style="color:#D9B9B2;word-break:break-all">' + esc(o.zoom) + '</a>' : '') + '</p></td></tr>'
    + '<tr><td class="pad" style="padding:26px 36px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C.cream + ';border-radius:18px"><tr><td style="padding:20px 22px">'
    + '<div style="font-family:' + HAND + ';font-size:18px;letter-spacing:1.5px;color:' + C.red + ';margin-bottom:8px">' + (now ? 'Right now' : soon ? 'Before we start' : 'To get ready') + '</div>'
    + tips.map(t => '<div style="font-size:15px;line-height:1.6;color:#3A2A28;margin:0 0 6px">&#10022;&nbsp; ' + t + '</div>').join('')
    + '</td></tr></table></td></tr>'
    + (group ? '<tr><td class="pad" style="padding:20px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:' + C.cream + ';border-radius:20px;padding:18px 20px">' + note(img, 'sav-sparkle', 'Why group calls are magic', 'Hearing someone else say the thing you thought only you felt? That’s where the shift happens. You’re not doing this alone.') + '</td></tr></table></td></tr>' : '')
    + signoff(img, now ? 'See you in a minute!' : soon ? 'See you very soon!' : group ? 'Can’t wait to see all your faces.' : 'Can’t wait to see you tomorrow.');
  const subject = group ? (now ? 'the CMS group call starts in 15 minutes 🎥 Your Zoom link' : soon ? 'CMS group call in 2 hours at ' + (w.time || '') + ' your time 💬' : 'CMS group coaching call tomorrow at ' + (w.time || '') + ' your time 💬') : now ? 'Starting in 15 minutes: our ' + what + ' 🎥 Your Zoom link' : (soon ? 'In 2 hours: ' : 'Tomorrow: ') + 'our ' + what + ' at ' + (w.time || '') + ' your time 🎥';
  return { subject, html: shell({ title: head, pre: (now ? 'We start in 15 minutes. ' : soon ? 'Starting in 2 hours. ' : 'See you tomorrow. ') + 'Your Zoom link is inside, one tap and you’re in.', pill: group ? 'Group call' : '1:1 client', img, body }) };
}



/* ---------- visual pieces: sketchy icons (same art as the app) and photos of Sav ---------- */
function ic(img, name, size) { return '<img src="' + img('icons/' + name).replace(/\.jpg$/, '.png') + '" width="' + (size || 26) + '" height="' + (size || 26) + '" alt="" style="display:inline-block;width:' + (size || 26) + 'px;height:' + (size || 26) + 'px;vertical-align:middle;border:0">'; }
// "4 lessons" as 4 play buttons, "9 reps" as 9 ticks, "5 proof" as 5 stars
function iconRow(img, name, count, label, max) {
  max = max || 14; var shown = Math.min(count, max), icons = '';
  for (var i = 0; i < shown; i++) icons += ic(img, name, 26) + '&nbsp;';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border:2px solid ' + C.ink + ';border-radius:18px;margin:0 0 10px"><tr>'
    + '<td width="70" align="center" valign="middle" style="padding:12px 0 12px 12px;font-family:' + SERIF + ';font-weight:800;font-size:34px;line-height:1;color:' + C.card + '">' + count + '</td>'
    + '<td valign="middle" style="padding:12px 14px 12px 8px"><div style="font-size:14px;font-weight:600;color:' + C.ink + ';margin-bottom:6px">' + label + '</div><div style="line-height:30px">' + (icons || '<span style="font-size:13px;color:#6A5A57">Not yet, and that’s okay</span>') + (count > max ? '<span style="font-size:13px;font-weight:600;color:' + C.red + '">+' + (count - max) + ' more</span>' : '') + '</div></td></tr></table>';
}
function visualStats(img, d) {
  return (d.lessons != null ? iconRow(img, 'play', d.lessons, d.lessons === 1 ? 'lesson watched' : 'lessons watched') : '')
    + (d.acts != null ? iconRow(img, 'setup', d.acts, d.acts === 1 ? 'activity done' : 'activities done') : '')
    + (d.reps != null ? iconRow(img, 'tick', d.reps, 'reps ticked off') : '')
    + (d.proof != null ? iconRow(img, 'sparkle', d.proof, d.proof === 1 ? 'piece of proof' : 'pieces of proof') : '')
    + (d.streak != null ? iconRow(img, 'flame', d.streak, 'day streak') : '');
}
// a little note from Sav with a photo of her
function note(img, photo, kick, text) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px"><tr>'
    + '<td class="stack" width="150" valign="top" style="padding-right:16px"><img class="ph" src="' + img(photo) + '" width="140" alt="Savannah" style="width:140px;height:auto;border-radius:20px;border:3px solid ' + C.ink + '"></td>'
    + '<td class="stack" valign="middle"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:' + C.pink + ';border:2px solid ' + C.ink + ';border-radius:20px;padding:16px 18px">'
    + '<div style="font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + ';margin-bottom:4px">' + kick + '</div>'
    + '<div style="font-size:15px;line-height:1.6;color:' + C.ink + '">' + text + '</div></td></tr></table></td></tr></table>';
}
function photoPair(img, a, b) { // [photo, label, alt] x2: a little "then / now" pair
  const cell = function (q, hot) {
    return '<td class="stack" width="50%" valign="top" align="center" style="padding:0 6px 10px">'
      + '<img src="' + img(q[0]) + '" width="230" alt="' + esc(q[2]) + '" style="display:block;width:230px;max-width:100%;height:auto;border-radius:22px;border:4px solid ' + (hot ? C.lime : '#A99A97') + '">'
      + '<div style="font-family:' + HAND + ';font-size:19px;letter-spacing:1.5px;color:' + (hot ? C.lime : C.soft) + ';margin-top:8px">' + q[1] + '</div></td>';
  };
  return '<tr><td class="pad" style="padding:26px 30px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + cell(a, false) + cell(b, true) + '</tr></table></td></tr>';
}
function bigPhoto(img, photo, alt) {
  return '<tr><td align="center" style="padding:26px 36px 0"><img src="' + img(photo) + '" width="320" alt="' + esc(alt || 'Savannah') + '" style="display:block;width:320px;max-width:100%;height:auto;border-radius:26px;border:4px solid ' + C.lime + '"></td></tr>';
}
function doneList(img, rows) { // [[icon, text, sub]]
  return rows.map(function (r) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px"><tr>'
      + '<td width="40" valign="middle" style="padding:4px 0">' + ic(img, r[0], 32) + '</td>'
      + '<td valign="middle" style="padding:4px 8px;font-size:15px;line-height:1.4;color:' + C.ink + '">' + r[1] + (r[2] ? '<br><span style="font-size:13px;color:#6A5A57">' + r[2] + '</span>' : '') + '</td>'
      + '<td width="34" align="right" valign="middle">' + ic(img, 'tick', 22) + '</td></tr></table>';
  }).join('');
}
function thenNow(then, now) { // [[label, then text, now text]]
  return then.map(function (r, i) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr>'
      + '<td class="stack" width="50%" valign="top" style="padding:0 6px 8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#FFFFFF;border:2px dashed #A99A97;border-radius:18px;padding:14px 16px">'
      + '<div style="font-family:' + HAND + ';font-size:15px;letter-spacing:1px;color:#6A5A57">' + r[0] + ' · when you started</div><div style="font-size:15px;line-height:1.55;color:#4A3A38;margin-top:4px">“' + r[1] + '”</div></td></tr></table></td>'
      + '<td class="stack" width="50%" valign="top" style="padding:0 0 8px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:' + C.lime + ';border:2px solid ' + C.ink + ';border-radius:18px;padding:14px 16px">'
      + '<div style="font-family:' + HAND + ';font-size:15px;letter-spacing:1px;color:' + C.red + '">' + r[0] + ' · now</div><div style="font-size:15px;line-height:1.55;font-weight:600;color:' + C.ink + ';margin-top:4px">“' + now[i] + '”</div></td></tr></table></td></tr></table>';
  }).join('');
}

/* ---------- The client journey: building blocks ---------- */
function hero(kick, h, p) {
  return '<tr><td class="pad" style="padding:36px 36px 8px">'
    + '<p style="margin:0 0 10px;font-family:' + HAND + ';font-size:21px;letter-spacing:2px;color:' + C.pink + '">' + kick + '</p>'
    + '<h1 class="h1" style="margin:0 0 14px;font-family:' + SERIF + ';font-weight:800;font-size:36px;line-height:1.12;color:' + C.cream + '">' + h + '</h1>'
    + (p ? '<p style="margin:0;font-size:16px;line-height:1.65;color:' + C.soft + '">' + p + '</p>' : '') + '</td></tr>';
}
function cta(href, label, note) {
  return '<tr><td align="center" style="padding:26px 36px 32px">' + button(href, label, true)
    + (note ? '<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#D9B9B2">' + note + '</p>' : '') + '</td></tr>';
}
function creamOpen(k, h) {
  return '<tr><td class="pad" style="background:' + C.cream + ';padding:34px 36px 30px;color:' + C.ink + '">'
    + (k ? '<p style="margin:0 0 6px;font-family:' + HAND + ';font-size:19px;letter-spacing:2px;color:' + C.red + '">' + k + '</p>' : '')
    + (h ? '<h2 style="margin:0 0 14px;font-family:' + SERIF + ';font-weight:800;font-size:28px;line-height:1.15;color:' + C.ink + '">' + h + '</h2>' : '');
}
const creamClose = '</td></tr>';
function para(t) { return '<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#3A2A28">' + t + '</p>'; }
function box(inner, bg, border) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + (bg || '#FFFFFF') + ';border:2px ' + (border || 'solid') + ' ' + C.ink + ';border-radius:18px;margin:0 0 12px"><tr><td style="padding:16px 18px;font-size:15px;line-height:1.6;color:' + C.ink + '">' + inner + '</td></tr></table>';
}
function checks(items) { // [[done, text, sub]]
  return items.map(function (x) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + (x[0] ? '#E4F3DF' : '#FFFFFF') + ';border:2px solid ' + C.ink + ';border-radius:16px;margin:0 0 8px"><tr>'
      + '<td width="44" align="center" valign="middle" style="padding:12px 0 12px 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" height="28" align="center" valign="middle" style="width:28px;height:28px;border-radius:14px;background:' + (x[0] ? '#2D6A22' : '#FFFFFF') + ';border:2px solid ' + C.ink + ';color:#FFFFFF;font-size:15px;font-weight:700">' + (x[0] ? '&#10003;' : '&nbsp;') + '</td></tr></table></td>'
      + '<td style="padding:12px 14px;font-size:15px;line-height:1.45;color:' + C.ink + '"><strong>' + x[1] + '</strong>' + (x[2] ? '<br><span style="font-size:13px;color:#6A5A57">' + x[2] + '</span>' : '') + '</td>'
      + '<td align="right" style="padding:12px 14px;font-size:12px;font-weight:600;white-space:nowrap;color:' + (x[0] ? '#2D6A22' : C.red) + '">' + (x[0] ? 'Done' : 'To do') + '</td></tr></table>';
  }).join('');
}
function bar(pct, label) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 6px"><tr>'
    + (pct ? '<td width="' + pct + '%" height="16" style="background:' + C.red + ';border-radius:8px 0 0 8px;font-size:1px;line-height:1px">&nbsp;</td>' : '')
    + (pct < 100 ? '<td height="16" style="background:#E9D9D4;border-radius:' + (pct ? '0 8px 8px 0' : '8px') + ';font-size:1px;line-height:1px">&nbsp;</td>' : '')
    + '</tr></table><p style="margin:0 0 16px;font-size:13px;color:#6A5A57">' + label + '</p>';
}
function stats(list) { // [[number, label]]
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr>' + list.map(function (s) {
    return '<td width="' + Math.floor(100 / list.length) + '%" align="center" style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:' + C.card + ';border-radius:16px;padding:14px 6px">'
      + '<div style="font-family:' + SERIF + ';font-weight:800;font-size:30px;line-height:1;color:' + C.lime + '">' + s[0] + '</div><div style="font-size:12px;line-height:1.35;color:' + C.soft + ';margin-top:6px">' + s[1] + '</div></td></tr></table></td>';
  }).join('') + '</tr></table>';
}
function quote(t, who) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr><td style="background:' + C.lime + ';border:2px solid ' + C.ink + ';border-radius:18px;padding:16px 20px">'
    + '<div style="font-family:' + SERIF + ';font-style:italic;font-weight:700;font-size:19px;line-height:1.45;color:' + C.ink + '">“' + t + '”</div>'
    + (who ? '<div style="font-family:' + HAND + ';font-size:15px;letter-spacing:1px;color:' + C.red + ';margin-top:6px">' + who + '</div>' : '') + '</td></tr></table>';
}
function flip(oldB, truth) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px"><tr><td style="background:#FFFFFF;border:2px solid ' + C.ink + ';border-radius:16px;padding:12px 16px">'
    + '<div style="font-size:15px;color:#6A5A57;text-decoration:line-through;text-decoration-color:#D3302B;text-decoration-thickness:2px">' + oldB + '</div>'
    + '<div style="font-family:' + HAND + ';font-size:22px;color:' + C.card + ';margin-top:2px">' + truth + '</div></td></tr></table>';
}
function J(o, kick) { o = o || {}; const site = o.site || SITE; return { o: o, site: site, img: o.img || defImg(site), first: esc(o.first || 'Bec'), app: site + (o.tier === 'self' ? '/course' : '/1to1') }; }

/* 1. Login code (paste into Supabase → Authentication → Emails → Magic link / OTP; {{ .Token }} is the code) */
function loginCodeEmail(o) {
  const x = J(o), code = (o && o.code) || '{{ .Token }}';
  const body = hero('Your login code', 'Here’s your code', 'Pop this into the app to log in. It works for the next hour, and only once.')
    + '<tr><td align="center" style="padding:20px 36px 34px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:' + C.lime + ';border:2px solid ' + C.ink + ';border-radius:20px;padding:18px 34px;font-family:' + SANS + ';font-size:40px;font-weight:600;letter-spacing:10px;color:' + C.ink + '">' + code + '</td></tr></table>'
    + '<p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:#D9B9B2">Didn’t ask for this? You can ignore it. Nobody can log in without this code.</p></td></tr>';
  return { subject: 'Your Breakthrough login code', html: shell({ title: 'Your login code', pre: 'Your code to log in to Breakthrough.', pill: 'Login', img: x.img, body: body }) };
}
/* 2b. Welcome for self-paced */
function welcomeSelfEmail(o) {
  const x = J(Object.assign({ tier: 'self' }, o));
  const body = hero('Hiya ' + x.first + '!! Welcome', 'You’re in. Let’s get started.', 'Your Breakthrough course lives in its own app: every lesson, every activity and your Becoming Book, all in one place. Go at your own pace. Small and done beats big and someday.')
    + cta(x.app, 'Open your app &rarr;', x.app.replace(/^https?:\/\//, ''))
    + bigPhoto(x.img, 'sav-phone-self', 'Savannah holding up her phone showing the Breakthrough app login screen') + creamOpen('Your first 30 minutes', 'Start here')
    + checks([[false, 'Save the app to your home screen', 'iPhone: Safari → Share → Add to Home Screen. Android: Chrome → ⋮ → Install app.'], [false, 'Watch Lesson 1: Welcome', 'Course tab → Introduction'], [false, 'Set yourself up for success', 'The 2-hour mini course, so this is the course you actually finish'], [false, 'Set your intentions', 'Your North Star and your why, turned into your lock screen']])
    + creamClose + signoff(x.img, 'So proud of you for investing in yourself.');
  return { subject: 'Welcome to Breakthrough, ' + x.first + ' ✨ Start here', html: shell({ title: 'Welcome to Breakthrough', pre: 'Your course app is ready. Here’s where to start.', pill: 'Self-paced', img: x.img, body: body }) };
}
/* Waitlist welcome (sent the moment someone joins the waitlist): the win-win nudge to fill in the application */
function waitlistEmail(o) {
  const x = J(o), link = (o && o.applyLink) || (x.site + '/apply.html');
  const go = function (want) { return link + (link.indexOf('?') >= 0 ? '&' : '?') + 'want=' + want; };
  const perk = function (icon, t, sub) { return box('<span style="font-size:22px;vertical-align:middle">' + icon + '</span>&nbsp; <strong>' + t + '</strong><br><span style="font-size:13.5px;color:#6A5A57">' + sub + '</span>'); };
  const body = hero('You’re on the list, ' + x.first + ' 🎉', 'Doors are closed. But you’re in the front row.', 'You’ll be the first to know the minute Breakthrough opens again. Spaces are limited, so here’s how to make sure one of them is yours.')
    + creamOpen('5 minutes now = first dibs later', 'Tell me about you, and skip the queue')
    + para('Fill in your Breakthrough application and you get:')
    + perk('🔑', 'Early access', 'Doors open for you before they open to everyone else.')
    + perk('🎟️', 'First pick of the spaces', 'The group program is small on purpose. Applicants get offered spots first.')
    + perk('💌', 'A personal reply from me', 'I read every single one. If group or 1:1 is right for you, I’ll invite you to a call.')
    + perk('🧠', 'A program built around you', 'Your answers shape what we cover, so it fits your brain, not someone else’s.')
    + para('Tick what you’re keen on inside the form: the community program, the intimate group program, or 1:1 with me. Not sure yet? Tick them all.')
    + creamClose
    + '<tr><td align="center" style="padding:30px 36px 6px">' + button(go('group'), 'Apply for group or 1:1 &rarr;', true) + '</td></tr>'
    + '<tr><td align="center" style="padding:12px 36px 30px">' + button(go('community'), 'Get early community access &rarr;') + '<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#D9B9B2">Same quick form. Takes about 5 minutes (or one dopamine hit).</p></td></tr>'
    + signoff(x.img, 'If nothing changes, nothing changes. So proud of you for raising your hand.');
  return { subject: 'You’re on the Breakthrough waitlist 🎉 (+ how to get in first)', html: shell({ title: 'You’re on the waitlist', pre: 'Doors are closed, but here’s how to get early access and first pick of the spaces.', pill: 'Waitlist', img: x.img, body: body }) };
}
/* 3. Haven't opened the app yet (2 days after the welcome, only if they haven't logged in) */
function notOpenedEmail(o) {
  const x = J(o);
  const body = hero('Hey ' + x.first + ' 👋', 'Your app’s still waiting for you', 'Totally normal for life to get in the way. It takes about 5 minutes to get in and save it to your phone, and then you’re set.')
    + cta(x.app, 'Open my app &rarr;', 'Log in with this email. You’ll get a 6-digit code, no password needed.')
    + bigPhoto(x.img, 'sav-phone', 'Savannah holding up her phone showing the Breakthrough app login screen')
    + creamOpen('', '') + note(x.img, 'sav-sparkle', 'Stuck?', 'If something isn’t working, just reply to this email and tell me what you see. I’ll sort it, promise.') + creamClose
    + signoff(x.img, 'Can’t wait to see you in there.');
  return { subject: x.first + ', your Breakthrough app is ready when you are', html: shell({ title: 'Your app is waiting', pre: 'Five minutes and you’re set up.', pill: '1:1 client', img: x.img, body: body }) };
}
/* 4. Agreement ready to sign (when Sav sends it; one reminder 3 days later if unsigned) */
function agreementEmail(o) {
  const x = J(o), again = o && o.reminder;
  const body = hero(again ? 'Quick reminder' : 'One last bit of admin', again ? 'Your agreement is still waiting' : 'Your coaching agreement is ready', 'It covers your package, our calls, payments and how we work together. Read it in the app, then sign with your name. It takes about 5 minutes.')
    + cta(x.app, 'Read and sign &rarr;', 'It opens as soon as you log in.')
    + creamOpen('', '') + para('Questions about anything in it? Message me before you sign. That’s exactly what I’m here for.') + creamClose
    + signoff(x.img, 'Then we’re all locked in. Yay!');
  return { subject: again ? 'Reminder: your Breakthrough agreement is ready to sign' : 'Your Breakthrough coaching agreement is ready ✍️', html: shell({ title: 'Your agreement', pre: 'Read it and sign in the app. About 5 minutes.', pill: '1:1 client', img: x.img, body: body }) };
}
/* 5. First call prep (2 days before the first 1:1, only if their set-up isn't finished) */
function firstCallPrepEmail(o) {
  const x = J(o), w = whenText((o && o.start) || new Date(Date.now() + 2 * 864e5).toISOString(), o && o.tz);
  const s = (o && o.status) || { home: true, agree: true, wa: true, tests: false, mini: false, intent: false };
  const left = ['home', 'agree', 'wa', 'tests', 'mini', 'intent'].filter(function (k) { return !s[k]; }).length;
  const body = hero('Two sleeps to go ✨', 'Our first call is ' + esc(w.day), 'At ' + esc(w.time) + (w.zone ? ' (' + esc(w.zone) + ', your time)' : '') + '. Here’s where you’re up to. ' + (left ? 'Just ' + left + ' thing' + (left === 1 ? '' : 's') + ' left, and you’ll walk in ready.' : 'You’re all done. Legend.'))
    + creamOpen('Before our first call', 'Your checklist')
    + checks([[s.home, 'Saved the app'], [s.agree, 'Signed your agreement'], [s.wa, 'Joined WhatsApp'], [s.tests, 'Your 3 tests', 'Rep System, Human Design and DISC'], [s.mini, 'Set yourself up for success', 'The mini course'], [s.intent, 'Setting Intentions', 'The one I really want done before we meet']])
    + note(x.img, 'sav-sparkle', 'See you on Zoom', 'Grab a cuppa, find a quiet spot and bring yourself exactly as you are. Laptop is best, but your phone works too.')
    + creamClose + cta(x.app, 'Finish my set-up &rarr;') + signoff(x.img, 'So excited for this one.');
  return { subject: 'Two sleeps until our first call ✨ Here’s your checklist', html: shell({ title: 'Before our first call', pre: 'Where you’re up to, and what’s left before we meet.', pill: '1:1 client', img: x.img, body: body }) };
}
/* 9. After the call: recap (when Sav adds the session summary in the coach dashboard) */
function recapEmail(o) {
  const x = J(o), n = (o && o.n) || 2;
  const pts = (o && o.points) || ['You noticed the “I have to earn rest” program running at work, not just at home.', 'The anger that shows up when the house gets loud is your nervous system asking for a pause, not you being a bad mum.', 'You already have proof you can say no: you did it twice this week.'];
  const todo = (o && o.todo) || ['Do the Pause activity once a day, even for 30 seconds.', 'Add 3 pieces of proof against “I’m not good enough”.', 'Watch Week 2, Lessons 1 and 2.'];
  const coach = (o && o.coach) || ['Send you the Pause and Rewind worksheet tonight.', 'Unlock Week 2 for you once you’ve finished Week 1.'];
  const body = hero('Session ' + n + ' recap', 'What we covered today', 'Here’s the summary so you can come back to it any time. It’s saved in your app too.')
    + creamOpen('Your big takeaways', '') + note(x.img, 'sav-laugh', 'From today', 'You showed up and did the real work. Here’s what I want you to hold on to.') + pts.map(function (p) { return box('✦&nbsp; ' + esc(p)); }).join('')
    + '<h2 style="margin:22px 0 12px;font-family:' + SERIF + ';font-weight:800;font-size:24px;color:' + C.ink + '">Before our next call</h2>'
    + checks(todo.map(function (t) { return [false, esc(t)]; }))
    + (coach.length ? '<h2 style="margin:22px 0 12px;font-family:' + SERIF + ';font-weight:800;font-size:24px;color:' + C.ink + '">Your coach will…</h2>' + coach.map(function (t) { return box('💛&nbsp; ' + esc(t), '#FBE6FC'); }).join('') : '')
    + creamClose
    + cta(x.app + '#Book', 'Open my notes &rarr;') + signoff(x.img, 'So proud of the work you did today.');
  return { subject: 'Your session ' + n + ' recap + what’s next 💛', html: shell({ title: 'Session recap', pre: 'What we covered, and your next steps before our next call.', pill: '1:1 client', img: x.img, body: body }) };
}
/* 10. Week unlocked (1:1, when Sav taps Unlock) */
function weekUnlockedEmail(o) {
  const x = J(o), wk = (o && o.week) || 2, title = o && o.title != null ? o.title : 'The Reality Framework', lessons = (o && o.lessons) || ['Your Experience of the World', 'Your Memories + RAS Filter', 'Proof Portfolio', 'Beliefs', 'Programs'];
  const body = hero('🔓 Unlocked', 'Week ' + wk + ' is open' + (title ? ': ' + esc(title) : ''), 'Go at your own pace, one small step at a time. I’m so proud of the work you’re putting in.')
    + (lessons.length ? creamOpen('What’s inside', '') + lessons.map(function (l, i) { return box('<strong>' + (i + 1) + '.</strong>&nbsp; ' + esc(l)); }).join('') + creamClose : '')
    + cta(x.app + '#Course', 'Start Week ' + wk + ' &rarr;') + signoff(x.img, 'Let’s go!');
  return { subject: '🔓 Week ' + wk + ' is open for you, ' + x.first, html: shell({ title: 'Week ' + wk + ' is open', pre: 'Your next week is ready. One small step at a time.', pill: (o && o.tier === 'self') ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}
/* 11. Weekly check-in: where you're up to (Sunday 6pm their time, only if they've started) */
function weeklyEmail(o) {
  const x = J(o), d = Object.assign(o && o.real ? { done: 0, total: 1, week: '', next: '', thisWeek: 0, reps: 0, proof: 0, win: '' } : { done: 12, total: 49, week: 'Week 1 · The Foundations', next: 'Lesson 6: Fight or Flight', thisWeek: 4, reps: 9, proof: 5, win: 'I said no to extra work without explaining myself.' }, (o && o.data) || {});
  const body = hero('Your week in Breakthrough', x.first + ', look what you did this week', 'A little Sunday snapshot of your progress. Every tick is your brain rewiring.')
    + creamOpen('Where you’re up to', esc(d.week)) + bar(100 * d.done / d.total, d.done + ' of ' + d.total + ' lessons done')
    + '<p style="margin:0 0 10px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">This week you…</p>'
    + visualStats(x.img, { lessons: d.thisWeek, reps: d.reps, proof: d.proof })
    + (d.win ? '<p style="margin:0 0 8px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">Your win this week</p>' + quote(esc(d.win)) : '')
    + (d.next ? box('<span style="font-family:' + HAND + ';font-size:16px;letter-spacing:1px;color:' + C.red + '">Up next</span><br><strong style="font-size:17px">' + esc(d.next) + '</strong>', C.lime) : '')
    + note(x.img, 'sav-sparkle', 'A note from me', 'Every tick, every lesson, every bit of proof is your brain learning a new way. I see you doing the work. Keep going, gorgeous.')
    + creamClose + cta(x.app + '#Course', 'Keep going &rarr;') + signoff(x.img, 'Slower and deeper always wins.');
  return { subject: (d.thisWeek || d.proof ? 'Your Breakthrough week: ' + (d.thisWeek ? d.thisWeek + ' lesson' + (d.thisWeek === 1 ? '' : 's') : '') + (d.thisWeek && d.proof ? ', ' : '') + (d.proof ? d.proof + ' piece' + (d.proof === 1 ? '' : 's') + ' of proof' : '') : 'Your week in Breakthrough') + ' ✨', html: shell({ title: 'Your week', pre: 'Where you’re up to, your win this week, and what’s next.', pill: o && o.tier === 'self' ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}
/* 12. Milestone: halfway (and the same shape for other big moments) */
function milestoneEmail(o) {
  const x = J(o), d = Object.assign(o && o.real ? { done: 0, total: 1, flips: [], proof: 0 } : { done: 25, total: 49, flips: [['I’m not good enough', 'I am good enough'], ['I have to earn rest', 'Rest is safe']], proof: 18 }, (o && o.data) || {});
  const body = hero('🎉 Halfway!', 'You’re halfway through Breakthrough', 'Most people never get this far with anything they start. You did. Take a second and actually let that land.')
    + bigPhoto(x.img, 'sav-welcome', 'Savannah celebrating with her arms in the air')
    + creamOpen('Look how far you’ve come', '') + visualStats(x.img, { lessons: d.done, proof: d.proof })
    + (d.flips.length ? '<p style="margin:0 0 10px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">Old stories you’ve been rewriting</p>' + d.flips.map(function (f) { return flip(esc(f[0]), esc(f[1])); }).join('') : '')
    + creamClose + cta(x.app + '#Proof', 'See my proof portfolio &rarr;') + signoff(x.img, 'I’m so bloody proud of you.');
  return { subject: '🎉 ' + x.first + ', you’re halfway through Breakthrough', html: shell({ title: 'Halfway', pre: 'Look how far you’ve come.', pill: o && o.tier === 'self' ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}
/* 13. We miss you (7 days quiet; a softer one at 14; then emails stop and only the app nudges carry on) */
function missYouEmail(o) {
  const x = J(o), second = o && o.second, why = (o && o.why) || (o && o.real ? '' : 'I want to stop living in survival mode and actually enjoy my kids');
  const body = hero(second ? 'No catching up needed 🌿' : 'Hey ' + x.first + ' 💛', second ? 'Whenever you’re ready, I’m here' : 'Just checking in on you', second ? 'Life gets full. That’s not failing, that’s being human. Your course is right where you left it, and so is your why.' : 'It’s been a week since you were last in. No guilt, no pressure. I just wanted to remind you why you started.')
    + creamOpen(why ? 'Your why' : 'Your next small step', '') + (why ? quote(esc(why), 'You wrote this in your intentions') : '')
    + note(x.img, 'sav-sparkle', 'From me', second ? 'I’m not going anywhere. When you’re ready, open the app and do one tiny thing. That’s a win.' : 'Five minutes counts. Open the app and do the next small thing, that’s it. And if something’s in the way, tell me.') + creamClose
    + cta(x.app + '#Course', 'Pick up where I left off &rarr;', second ? 'This is the last email like this. The app will still gently remind you.' : 'Feeling stuck or overwhelmed? Reply and tell me. That’s what I’m here for.')
    + signoff(x.img, 'Still cheering for you.');
  return { subject: second ? 'Whenever you’re ready, ' + x.first + ' 🌿' : x.first + ', remember why you started? 💛', html: shell({ title: 'Checking in', pre: 'No guilt, no pressure. Your next small step is waiting.', pill: o && o.tier === 'self' ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}
/* 13b. Module (week) complete: a big celebration with everything they've done so far */
function moduleCompleteEmail(o) {
  const x = J(o), d = Object.assign(o && o.real ? { week: 1, title: '', next: '', lessons: [], acts: [], wins: [], reps: 0, proof: 0, streak: 0, highlight: '' } : {
    week: 1, title: 'The Foundations', next: 'Week 2 · The Reality Framework',
    lessons: ['Brain + Body', 'Conscious + Unconscious Mind', 'Nervous System', 'Neurotransmitters + Hormones', 'Anxiety', 'Fight or Flight', 'Body', 'Neuroplasticity', 'Breathing'],
    acts: [['dose', 'Your daily DOSE', 'Your plan: music while you cook, morning sun, dance in the kitchen'], ['whatif', 'The What If Workout', 'Worst case → best case, 3 times'], ['pause', 'Pause', 'Your 30-second reset'], ['move', 'Move', 'Your daily movement menu'], ['breathe', 'Breathwork', 'The physiological sigh'], ['vagal', 'Vagal Tone Workout', '']],
    wins: ['I said no to extra work without explaining myself.', 'Did my breathwork before a hard conversation and stayed calm.', 'Danced in the kitchen with the kids instead of scrolling.'],
    reps: 23, proof: 7, streak: 5, highlight: 'My body tells me I’m overwhelmed before my head does. Tight jaw and shoulders.'
  }, (o && o.data) || {});
  const body = hero('🎉 Week ' + d.week + ' complete!', 'You finished ' + esc(d.title) + ', ' + x.first + '!', 'Hold on, stop scrolling for a second. You just finished a whole module of rewiring your brain. That deserves a proper celebration.')
    + bigPhoto(x.img, 'sav-jump', 'Savannah jumping in the air, celebrating')
    + creamOpen('Your Week ' + d.week + ' in pictures', 'Look at everything you did')
    + visualStats(x.img, { lessons: d.lessons.length, acts: d.acts.length, reps: d.reps, proof: d.proof, streak: d.streak })
    + (d.highlight ? '<p style="margin:16px 0 8px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">A moment from your notebook</p>' + quote(esc(d.highlight), 'You wrote this in Week ' + d.week) : '')
    + (d.wins.length ? '<p style="margin:16px 0 8px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">Your wins</p>' : '')
    + d.wins.map(function (w) { return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tr><td width="40" valign="top" style="padding-top:2px">' + ic(x.img, 'sparkle', 30) + '</td><td style="background:' + C.lime + ';border:2px solid ' + C.ink + ';border-radius:16px;padding:10px 14px;font-size:15px;font-weight:600;color:' + C.ink + '">' + esc(w) + '</td></tr></table>'; }).join('')
    + '<h2 style="margin:26px 0 12px;font-family:' + SERIF + ';font-weight:800;font-size:24px;color:' + C.ink + '">Everything you’ve completed so far</h2>'
    + doneList(x.img, d.lessons.map(function (l) { return ['play', esc(l)]; }).concat(d.acts.map(function (a) { return [a[0], '<strong>' + esc(a[1]) + '</strong>', a[2] ? esc(a[2]) : '']; })))
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px"><tr><td style="background:' + C.card + ';border-radius:20px;padding:20px 22px">'
    + '<div style="font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.lime + '">Make it official</div>'
    + '<div style="font-family:' + SERIF + ';font-weight:700;font-size:21px;line-height:1.3;color:' + C.cream + ';margin:4px 0 8px">Add “I finished Week ' + d.week + '” to your proof portfolio</div>'
    + '<div style="font-size:14px;line-height:1.6;color:' + C.soft + '">This is proof you finish things. Proof you’re capable. Proof the old story is out of date. Put it in your portfolio so your brain keeps the receipt.</div></td></tr></table>'
    + note(x.img, 'sav-sparkle', 'From me', 'I am doing a little happy dance for you right now.' + (d.next ? ' Next up: <strong>' + esc(d.next) + '</strong>.' : ''))
    + creamClose + cta(x.app + '#Proof', 'Add it to my proof &rarr;') + signoff(x.img, 'So bloody proud of you.');
  return { subject: '🎉 ' + x.first + ', you finished Week ' + d.week + '! Look at everything you did', html: shell({ title: 'Week ' + d.week + ' complete', pre: 'A whole module of rewiring your brain. Let’s celebrate.', pill: o && o.tier === 'self' ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}
/* 14. Program complete: where you started vs where you are now, a testimonial invite, and what's next */
function completeEmail(o) {
  const x = J(o), d = Object.assign(o && o.real ? { lessons: 0, acts: 0, proof: 0, reps: 0, then: [], now: [], flips: [] } : {
    lessons: 49, acts: 15, sessions: 8, proof: 41, reps: 212,
    then: [['Who I was', 'Done being the one who over-explains and apologises for taking up space.'], ['What I believed', 'I’m not good enough unless I’m busy.'], ['How I felt', 'Overwhelmed, anxious, burnt out, numb.']],
    now: ['I said no to extra work without explaining myself, and nothing bad happened.', 'I am good enough. I have 41 pieces of proof.', 'Calm most days. I catch it in my jaw before it takes over.'],
    flips: [['I’m not good enough', 'I am good enough'], ['I have to earn rest', 'Rest is safe'], ['I’m too much', 'I can take up space']]
  }, (o && o.data) || {});
  const body = hero('🎓 YOU. DID. IT.', x.first + ', you finished Breakthrough!', 'Every lesson. Every rep. Every hard, brave conversation with yourself. This is what it looks like when someone actually does the work. Let’s look at it properly.')
    + photoPair(x.img, ['sav-overwhelm', 'Day one', 'Savannah with her head in her hands, covered in sticky notes'], ['sav-sparkler', 'Now', 'Savannah laughing with a sparkler'])
    + creamOpen(d.then.length ? 'Then → now, in your own words' : 'Look how far you’ve come', d.then.length ? 'Look how far you’ve come' : '')
    + (d.then.length ? para('These are things you wrote in the app. On the left, when you started. On the right, you now.') + thenNow(d.then, d.now) : '')
    + (d.flips.length ? '<p style="margin:10px 0 10px;font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + '">The old stories, flipped</p>' + d.flips.map(function (f) { return flip(esc(f[0]), esc(f[1])); }).join('') : '')
    + '<h2 style="margin:24px 0 12px;font-family:' + SERIF + ';font-weight:800;font-size:24px;color:' + C.ink + '">Your Breakthrough, in pictures</h2>'
    + visualStats(x.img, { lessons: d.lessons, acts: d.acts, reps: d.reps, proof: d.proof })
    + creamClose
    // testimonial invite
    + '<tr><td class="pad" style="padding:36px 36px 8px">'
    + '<p style="margin:0 0 8px;font-family:' + HAND + ';font-size:20px;letter-spacing:2px;color:' + C.lime + '">Your story could change someone’s life</p>'
    + '<h2 style="margin:0 0 14px;font-family:' + SERIF + ';font-weight:800;font-size:30px;line-height:1.15;color:' + C.cream + '">I’d love you to write me a testimonial</h2>'
    + '<p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:' + C.soft + '">Somewhere out there is a person who feels exactly how you felt when you started. Overwhelmed, stuck, sure something’s wrong with them. Your words might be the thing that tells them it can change.</p>'
    + '<p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:' + C.soft + '">For me, it means everything. It’s how I know this works, and it’s how the next person finds me. And for you, writing it down locks in how far you’ve come. Win, win.</p>'
    + '</td></tr>'
    + '<tr><td class="pad" style="padding:8px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:' + C.cream + ';border-radius:20px;padding:20px 22px;color:' + C.ink + '">'
    + '<div style="font-family:' + HAND + ';font-size:17px;letter-spacing:1px;color:' + C.red + ';margin-bottom:8px">A few prompts, if you want them</div>'
    + ['Where were you when you started? What wasn’t working?', 'What changed? What do you do, think or feel differently now?', 'What would you say to someone thinking about joining?'].map(function (q, i) { return '<div style="font-size:15px;line-height:1.55;margin:0 0 8px">' + ic(x.img, 'sparkle', 18) + '&nbsp; ' + q + '</div>'; }).join('')
    + '<div style="font-size:13px;line-height:1.5;color:#6A5A57;margin-top:10px">I’ll only ever share it the way you chose in your agreement.</div></td></tr></table></td></tr>'
    + cta('mailto:savannah@colourmeneurospicy.com.au?subject=My%20Breakthrough%20story', 'Write my testimonial &rarr;', 'Or just hit reply. A few sentences is perfect.')
    // what's next
    + creamOpen('What’s next', 'Keep the momentum going')
    + box('<div style="font-family:' + SERIF + ';font-weight:800;font-size:20px;margin-bottom:4px">ECT with me</div>Emotional Change Technique: release the heaviest emotions and the two limiting beliefs holding you back most. Six fortnightly 1:1 sessions.', C.lime)
    + box('<div style="font-family:' + SERIF + ';font-weight:800;font-size:20px;margin-bottom:4px">Keep going 1:1</div>Ongoing monthly coaching with me, to keep building on everything you’ve started.')
    + box('<div style="font-family:' + SERIF + ';font-weight:800;font-size:20px;margin-bottom:4px">Group calls</div>Two live group calls a month with people doing the same work.')
    + note(x.img, 'sav-sparkle', 'From me', 'Want to chat about what’s right for you? Reply to this email and we’ll work it out together. Either way, your app stays yours. Keep adding proof and doing your reps.')
    + creamClose + signoff(x.img, 'I am so, so proud of you.');
  return { subject: '🎓 ' + x.first + ', you finished Breakthrough! Look how far you’ve come', html: shell({ title: 'You did it', pre: 'Then and now, in your own words. Plus a little favour to ask.', pill: o && o.tier === 'self' ? 'Self-paced' : '1:1 client', img: x.img, body: body }) };
}

/* Subject lines: always start with their name and end with "Savannah - Colour Me Neurospicy", so they're easy to find */
const BRAND_TAIL = ' | Savannah - Colour Me Neurospicy';
function nameFirst(subject, first) {
  let s = String(subject || '').trim(); first = String(first || '').trim();
  if (!first) return s + BRAND_TAIL;
  const lead = /^((?:[\u{1F300}-\u{1FAFF}\u2600-\u27BF]\uFE0F?\s*)*)/u.exec(s)[1] || '', rest = s.slice(lead.length);
  let body = rest;
  const re = new RegExp('^' + first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',?\\s*', 'i');
  if (re.test(body)) body = body.replace(re, '');
  else body = body.replace(new RegExp(',?\\s*' + first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[\\s!.?,]|$)', 'i'), '');
  if (!/^(I|I’m|Breakthrough|Week|Zoom)\b/.test(body) && !/^[A-Z]{2}/.test(body)) body = body.charAt(0).toLowerCase() + body.slice(1);
  return first + ', ' + (lead ? lead.trim() + ' ' : '') + body.replace(/\s+/g, ' ').trim() + BRAND_TAIL;
}
function withName(fn) { return function (o) { const m = fn(o); m.subject = nameFirst(m.subject, o && o.noName ? '' : (o && o.first) || (fn === loginCodeEmail ? '' : 'Bec')); return m; }; }
const API = { whenText, placeOf, SITE, nameFirst };
[welcomeEmail, reminderEmail, loginCodeEmail, welcomeSelfEmail, notOpenedEmail, agreementEmail, firstCallPrepEmail, recapEmail, weekUnlockedEmail, weeklyEmail, milestoneEmail, missYouEmail, completeEmail, moduleCompleteEmail, waitlistEmail].forEach(function (f) { API[f.name] = withName(f); });
if (typeof module !== 'undefined' && module.exports) module.exports = API; else window.BT_EMAILS = API;
})();
