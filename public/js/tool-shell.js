/* Runs one stand-alone tool page (public/tools/*.html):
   checks the client is logged in, loads/saves their answers to their account,
   then starts the tool. Shares login + saved answers with the main app. */
(function () {
  'use strict';
  var CFG = window.BT_CONFIG || {}, TOOL = window.BT_TOOL;
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  var sb = LIVE ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: '__bt_auth' }
  }) : null;
  var LOCAL_ONLY = /^(__bt|bt-return$|cmn-open-tab$|cmn-dash-focus$|sb-)/;
  var LS = window.localStorage, rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function lsGet(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { rawSet.call(LS, k, v); } catch (e) {} }
  function lsDel(k) { try { rawRemove.call(LS, k); } catch (e) {} }
  var user = null, queue = {}, timer = null, busy = false;
  try { queue = JSON.parse(lsGet('__bt_queue') || '{}') || {}; } catch (e) { queue = {}; }

  function queueWrite(k, v) {
    if (LOCAL_ONLY.test(k)) return;
    queue[k] = { v: v, t: new Date().toISOString() };
    lsSet('__bt_queue', JSON.stringify(queue));
    clearTimeout(timer); timer = setTimeout(flush, 900);
  }
  Storage.prototype.setItem = function (k, v) { rawSet.call(this, k, v); if (this === LS) queueWrite(String(k), String(v)); };
  Storage.prototype.removeItem = function (k) { rawRemove.call(this, k); if (this === LS) queueWrite(String(k), null); };

  function flush() {
    if (!LIVE || !user || busy) return Promise.resolve();
    var keys = Object.keys(queue); if (!keys.length || !navigator.onLine) return Promise.resolve();
    busy = true;
    var snap = {}; keys.forEach(function (k) { snap[k] = queue[k]; });
    var ups = [], dels = [];
    keys.forEach(function (k) { if (snap[k].v === null) dels.push(k); else ups.push({ user_id: user.id, key: k, value: snap[k].v, updated_at: snap[k].t }); });
    var jobs = [];
    if (ups.length) jobs.push(sb.from('client_data').upsert(ups, { onConflict: 'user_id,key' }));
    if (dels.length) jobs.push(sb.from('client_data').delete().eq('user_id', user.id).in('key', dels));
    return Promise.all(jobs).then(function (res) {
      if (res.some(function (r) { return r && r.error; })) throw new Error('sync');
      keys.forEach(function (k) { if (queue[k] && queue[k].t === snap[k].t) delete queue[k]; });
      lsSet('__bt_queue', JSON.stringify(queue));
    }).catch(function () { clearTimeout(timer); timer = setTimeout(flush, 15000); })
      .then(function () { busy = false; });
  }
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  function appKeys() { var out = []; for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && !LOCAL_ONLY.test(k)) out.push(k); } return out; }

  /* AI coach + downloads, same as the main app */
  window.claude = { use: function (name) {
    if (name === 'sample' && CFG.aiEnabled && LIVE) {
      var call = function (p, o, json) {
        return sb.auth.getSession().then(function (s) {
          return fetch('/.netlify/functions/ai', { method: 'POST', signal: o && o.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.data.session.access_token }, body: JSON.stringify({ prompt: String(p), json: !!json }) });
        }).then(function (r) { if (!r.ok) throw new Error('AI ' + r.status); return r.json(); }).then(function (d) { return json ? d.json : { text: d.text || '' }; });
      };
      var fn = function (p, o) { return call(p, o, false); }; fn.json = function (p, o) { return call(p, o, true); };
      return Promise.resolve(fn);
    }
    return Promise.resolve(null);
  } };

  /* Videos play inside the app */
  function embedUrl(u) {
    var m, url; try { url = new URL(u, location.href); } catch (e) { return null; }
    var h = url.hostname.replace(/^www\./, '');
    if (h === 'youtu.be') return 'https://www.youtube-nocookie.com/embed/' + url.pathname.slice(1) + '?rel=0&playsinline=1';
    if (/youtube\.com$/.test(h)) { var id = url.searchParams.get('v') || ((m = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)) && m[1]); if (id) return 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&playsinline=1'; }
    if (h === 'vimeo.com' && (m = url.pathname.match(/^\/(\d+)(?:\/(\w+))?/))) return 'https://player.vimeo.com/video/' + m[1] + (m[2] ? '?h=' + m[2] : '');
    if (h === 'player.vimeo.com') return u;
    if (/mediadelivery\.net$/.test(h)) return u.replace('/play/', '/embed/');
    if (h === 'loom.com' && (m = url.pathname.match(/\/share\/(\w+)/))) return 'https://www.loom.com/embed/' + m[1];
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var src = embedUrl(a.getAttribute('href'));
    if (src) {
      e.preventDefault(); e.stopPropagation();
      var bg = document.createElement('button'); bg.className = 'bt-vbg'; bg.setAttribute('aria-label', 'Close video');
      var box = document.createElement('div'); box.className = 'bt-vbox';
      box.innerHTML = '<div class="bt-vframe"><iframe allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Video"></iframe></div><button class="bt-btn">Close video</button>';
      box.querySelector('iframe').src = src;
      var close = function () { bg.remove(); box.remove(); };
      bg.onclick = close; box.querySelector('button').onclick = close;
      document.body.appendChild(bg); document.body.appendChild(box);
      return;
    }
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '/' && a.target === '_blank') { e.preventDefault(); location.href = href; return; }
    // other websites open in a new tab/window
    if (!window.BT_DEMO && /^https?:/i.test(a.href) && a.origin !== location.origin) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); }
  }, true);

  function start() {
    var host = document.getElementById('app');
    var inst = new TOOL.cls(Object.assign({}, TOOL.props));
    window.BT_TOOL_INST = inst;
    inst._root = host; inst._tpl = Array.prototype.slice.call(document.getElementById('t-main').content.childNodes);
    inst._render();
    if (inst.componentDidMount) inst.componentDidMount();
    // the app's top navigation, so the menu is always at the top
    var nav = document.createElement('nav'); nav.className = 'bt-top'; nav.id = 'bt-top'; nav.setAttribute('aria-label', 'Main');
    var brand = document.createElement('div'); brand.className = 'bt-brand'; brand.setAttribute('aria-hidden', 'true'); brand.innerHTML = '<span class="bt-brand-n">Colour Me Neurospicy</span><span class="bt-brand-s">Neurodivergent breakthrough program</span>'; nav.appendChild(brand);
    var inner = document.createElement('div'); inner.className = 'bt-top-in'; nav.appendChild(inner);
    [['Home', '/#Dashboard'], ['Course', '/#Course'], ['My Book', '/#Book'], ['Resources', '/#Resources']].forEach(function (n) {
      var a = document.createElement('a'); a.className = 'bt-top-i' + (n[0] === 'Resources' ? ' on' : ''); a.href = n[1]; a.textContent = n[0]; inner.appendChild(a);
    });
    var av = document.createElement('a'); av.className = 'bt-top-av'; av.href = '/#Profile'; av.setAttribute('aria-label', 'My profile');
    var avs = document.createElement('span'); avs.className = 'bt-av';
    var html = window.BT_COURSE && window.BT_COURSE.avatarHtml ? window.BT_COURSE.avatarHtml() : '';
    if (html) avs.innerHTML = html; else { var i = document.createElement('span'); i.className = 'bt-av-i'; i.textContent = '★'; avs.appendChild(i); }
    av.appendChild(avs); inner.appendChild(av);
    document.body.insertBefore(nav, document.body.firstChild);
    // came from the course or Resources? offer the way back (and on to the next lesson)
    try {
      var RES_OF = { 'what-if-workout': 'whatif', 'rewind': 'rewind', 'coming-home': 'comehome', 'emotional-blueprint': 'blueprint', 'understanding-bridge': 'ub' };
      var rid = RES_OF[TOOL.slug], ret = JSON.parse(localStorage.getItem('bt-return') || 'null');
      if (rid && ret && ret.at && Date.now() - ret.at < 6 * 3600000 && (!ret.res || ret.res === rid) && /^#(Course|Lesson-|Resources)/.test(ret.from)) {
        var fromCourse = /^#(Course|Lesson-)/.test(ret.from);
        if (fromCourse) { inner.querySelectorAll('.bt-top-i').forEach(function (x) { x.classList.toggle('on', x.textContent === 'Course'); }); }
        var strip = document.createElement('div'); strip.className = 'bt-ret'; strip.setAttribute('role', 'navigation'); strip.setAttribute('aria-label', 'Back to where you were');
        var bk = document.createElement('a'); bk.className = 'bt-ret-b'; bk.href = '/#Back-' + rid; bk.textContent = fromCourse ? '← Back to the course' : '← Back to resources';
        var dn = document.createElement('a'); dn.className = 'bt-btn lime bt-ret-d'; dn.href = '/#ActDone-' + rid; dn.textContent = fromCourse ? 'Done · back to the course' : 'Done';
        strip.appendChild(bk); strip.appendChild(dn);
        document.body.insertBefore(strip, nav.nextSibling);
      }
    } catch (e) {}
    document.body.classList.add('bt-has-top');
    // why we're doing this: links the tool back to its lesson (the What If Workout has its own, inside the page)
    try { var RID = { 'rewind': 'rewind', 'coming-home': 'comehome', 'emotional-blueprint': 'blueprint', 'understanding-bridge': 'ub' }[TOOL.slug]; var why = RID && window.BT_COURSE && window.BT_COURSE.resIntro(RID); if (why) { why.classList.add('bt-why-tool'); host.parentNode.insertBefore(why, host); } } catch (e) {}
    if (window.BT_SAVES) window.BT_SAVES.mount(TOOL.slug);
    try { scrollTour(TOOL.slug); } catch (e) {}
  }

  /* first time in a tool: little bubbles pop up as they scroll to each part */
  var TOOL_TOURS = {
    'what-if-workout': [
      ['[data-tour="intro"]', 'Start here', 'When to come back to this, and how to chunk a big worry down into something you can actually do today.'],
      ['[data-tour="length"]', 'Long or short?', 'There are two versions. Use the long one during the program, every time. The short one is for after the program, or for little things.'],
      ['[data-tour="step1"]', 'One step at a time', 'Work your way down the page. Your answers save as you go, so you can stop and come back.'],
      ['[data-tour="save"]', 'Keep it', 'Save it to your Becoming Book, download it as a picture, or both. This is to remind you next time you have the same thoughts.']
    ]
  };
  function scrollTour(slug) {
    var steps = TOOL_TOURS[slug], key = 'bt-tt-' + slug; if (!steps) return;
    try { if (localStorage.getItem(key)) return; } catch (e) { return; }
    var i = 0, bub = null, lit = null, shown = -1;
    function clear() { if (bub) { bub.remove(); bub = null; } if (lit) { lit.classList.remove('bt-tt-on'); lit = null; } }
    function show(k) {
      clear(); shown = k; var st = steps[k], el = document.querySelector(st[0]); if (!el) return;
      lit = el; el.classList.add('bt-tt-on');
      bub = document.createElement('div'); bub.className = 'bt-tt'; bub.setAttribute('role', 'dialog'); bub.setAttribute('aria-label', st[1]);
      bub.innerHTML = '<span class="bt-tt-k"></span><b></b><p></p><div class="bt-tt-btns"><button type="button" class="bt-tt-x">Skip the tips</button><button type="button" class="bt-tt-ok">Got it</button></div>';
      bub.querySelector('.bt-tt-k').textContent = 'Tip ' + (k + 1) + ' of ' + steps.length; bub.querySelector('b').textContent = st[1]; bub.querySelector('p').textContent = st[2];
      bub.querySelector('.bt-tt-ok').onclick = function () { clear(); i = k + 1; if (i >= steps.length) end(); else check(); };
      bub.querySelector('.bt-tt-x').onclick = function () { clear(); end(); };
      document.body.appendChild(bub);
    }
    function end() { i = steps.length; try { localStorage.setItem(key, String(Date.now())); } catch (e) {} window.removeEventListener('scroll', check); }
    function check() {
      if (i >= steps.length || shown === i) return;
      var el = document.querySelector(steps[i][0]); if (!el) { i++; return check(); }
      var r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 0.7 && r.bottom > 60) show(i);
    }
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 900);
  }

  if (!LIVE) { start(); return; }
  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session;
    if (!s) { location.replace('/?next=' + encodeURIComponent(location.pathname)); return; }
    user = s.user;
    var prev = lsGet('__bt_uid');
    if (prev && prev !== user.id) { appKeys().forEach(lsDel); queue = {}; lsSet('__bt_queue', '{}'); }
    lsSet('__bt_uid', user.id);
    var checks = [sb.from('client_data').select('key,value').eq('user_id', user.id), sb.from('app_settings').select('key,value')];
    if (TOOL.access === 'private') checks.push(sb.from('profiles').select('tier,is_admin').eq('id', user.id).maybeSingle());
    return flush().then(function () { return Promise.all(checks); }).then(function (res) {
      (res[1].data || []).forEach(function (row) { if (row.key === 'props' && row.value && row.value['tool:' + TOOL.slug]) { var o = row.value['tool:' + TOOL.slug]; Object.keys(o).forEach(function (k) { if (o[k]) TOOL.props[k] = o[k]; }); } });
      if (TOOL.access === 'private') { var p = res[2].data; if (!p || (p.tier !== 'private' && !p.is_admin)) { location.replace('/'); return; } }
      (res[0].data || []).forEach(function (row) { if (!queue[row.key]) { if (row.value == null) lsDel(row.key); else lsSet(row.key, row.value); } });
      sb.rpc('touch_last_seen').then(function () {}, function () {});
      start();
    }, function () { start(); });
  });
})();
