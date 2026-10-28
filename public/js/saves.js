/* "Saved" for the resources: at the end of a tool, students can save that run, start a fresh one,
   and look back at past ones, inside the tool and in their profile. Stored in "bt-saves"
   (syncs to their account like everything else, so Sav sees them in the coach dashboard). */
(function () {
  'use strict';
  var KEY = 'bt-saves';
  var TOOLS = {
    'what-if-workout': { name: 'The What If Workout', keys: ['what-if-workout-v1'], href: '/tools/what-if-workout.html' },
    'rewind': { name: 'REWIND', keys: ['rewind-v1'], href: '/tools/rewind.html' },
    'coming-home': { name: 'Coming Home', keys: ['coming-home-v3'], href: '/tools/coming-home.html' },
    'emotional-blueprint': { name: 'Emotional Blueprint', keys: ['emotional-blueprint-v1', 'what-am-i-feeling-v1'], href: '/tools/emotional-blueprint.html' },
    'breaking-out': { name: 'Breaking Out of Your Box', keys: ['program-decoder-v1'], href: 'BreakingOut.dc.html' }
  };

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function parse(v) { try { return JSON.parse(v); } catch (e) { return v; } }
  function all() { var d = parse(localStorage.getItem(KEY) || 'null'); return d && d.items ? d : { items: [] }; }
  function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { alertMsg('Couldn’t save that one. Your phone might be out of space.'); } }
  function list(slug) { return all().items.filter(function (x) { return !slug || x.tool === slug; }).sort(function (a, b) { return b.at - a.at; }); }
  function fmt(t) { return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function snapshot(slug) {
    var out = {}; (TOOLS[slug].keys || []).forEach(function (k) { var v = localStorage.getItem(k); if (v != null) out[k] = parse(v); });
    return out;
  }
  function hasContent(v) {
    if (v == null || v === '' || v === false) return false;
    if (typeof v === 'string') return !!v.trim();
    if (typeof v !== 'object') return true;
    if (Array.isArray(v)) return v.some(hasContent);
    return Object.keys(v).some(function (k) { return !UI_KEY.test(k) && hasContent(v[k]); });
  }
  function alertMsg(m) { var t = h('div', { class: 'bt-toast', role: 'status', text: m }); document.body.appendChild(t); setTimeout(function () { t.classList.add('out'); }, 2600); setTimeout(function () { t.remove(); }, 3200); }

  /* readable view of a saved run (same idea as the coach dashboard) */
  var UI_KEY = /^(_.*|tab|tabs|step|t?Step|pStep|qi|cur|current|open|opened|closed|filter|focus|view|mode|screen|page|idx|index|scroll|expanded|collapsed|show.*|flash|err|.*Err|ex|viewer|editing|edit|draft.*|sel|selected|active|modal|menu|sheet|panel|ui|seen.*|exportUrl|hover|playing|timer|anim.*|lessonsDone|v|version)$/i;
  function human(k) { return String(k).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }); }
  function value(v, label) {
    if (!hasContent(v)) return null;
    if (v === true) return h('span', { class: 'bs-tick', text: '✓' });
    if (typeof v === 'number') return h('span', { class: 'bs-pill', text: String(v) });
    if (typeof v === 'string') {
      if (/^data:image\//.test(v)) return h('img', { class: 'bs-img', src: v, alt: label || '' });
      if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(v)) return h('span', { class: 'bs-pill', text: fmt(new Date(v).getTime()) });
      return v.length > 48 || /\n/.test(v) ? h('blockquote', { class: 'bs-quote', text: v }) : h('span', { class: 'bs-pill', text: v });
    }
    if (Array.isArray(v)) {
      var items = v.filter(hasContent);
      if (items.every(function (x) { return typeof x !== 'object'; }) && items.every(function (x) { return String(x).length <= 60; }))
        return h('div', { class: 'bs-chips' }, items.map(function (x) { return h('span', { class: 'bs-pill', text: String(x) }); }));
      return h('div', { class: 'bs-stack' }, items.slice(0, 40).map(function (x) { return h('div', { class: 'bs-entry' }, [value(x, label)]); }));
    }
    var keys = Object.keys(v).filter(function (k) { return !UI_KEY.test(k) && hasContent(v[k]); });
    if (keys.every(function (k) { return v[k] === true || v[k] === 1; })) return h('div', { class: 'bs-chips' }, keys.map(function (k) { return h('span', { class: 'bs-pill on', text: '✓ ' + human(k) }); }));
    return h('div', { class: 'bs-obj' }, keys.map(function (k) { return h('div', { class: 'bs-row' }, [h('span', { class: 'bs-k', text: human(k) }), value(v[k], human(k))]); }));
  }

  /* sheets */
  function sheet(title, body, actions) {
    var close = function () { bg.remove(); };
    var bg = h('div', { class: 'bs-bg', onclick: function (e) { if (e.target === bg) close(); } }, [
      h('div', { class: 'bs-sheet', role: 'dialog', 'aria-label': title }, [
        h('div', { class: 'bs-head' }, [h('b', { text: title }), h('button', { class: 'bs-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })]),
        h('div', { class: 'bs-body' }, [body]),
        actions ? h('div', { class: 'bs-acts' }, actions(close)) : null
      ])
    ]);
    document.body.appendChild(bg);
    return close;
  }
  function openItem(item, after) {
    var t = TOOLS[item.tool] || { name: 'Saved' };
    var body = h('div', { class: 'bs-view' }, [h('span', { class: 'bs-k2', text: t.name + ' · saved ' + fmt(item.at) })]);
    var keys = Object.keys(item.data || {});
    var any = false, ans = item.img ? h('details', { class: 'bs-more' }, [h('summary', { text: 'See all my answers' })]) : body;
    if (item.img) body.appendChild(h('img', { class: 'bs-shot', src: item.img, alt: (item.title || t.name) + ', as saved' }));
    keys.forEach(function (k) { var r = value(item.data[k]); if (r) { any = true; ans.appendChild(r); } });
    if (item.img && any) body.appendChild(ans);
    if (!any && !item.img) body.appendChild(h('p', { class: 'bs-muted', text: 'Nothing written in this one.' }));
    sheet(item.title || t.name, body, function (close) {
      var del = h('button', { class: 'bt-btn ghost', type: 'button', text: 'Delete', onclick: function () {
        if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'Tap again to delete'; return; }
        var d = all(); d.items = d.items.filter(function (x) { return x.id !== item.id; }); write(d); close(); if (after) after();
      } });
      return [del, h('button', { class: 'bt-btn lime', type: 'button', text: 'Close', onclick: close })];
    });
  }
  function listView(slug, after) {
    var items = list(slug);
    var body = items.length ? h('div', { class: 'bs-list' }, items.map(function (x) {
      return h('button', { class: 'bs-item', type: 'button', onclick: function () { closeList(); openItem(x, after); } }, [
        h('span', { class: 'bs-dot', 'aria-hidden': 'true' }),
        h('span', { class: 'bs-it' }, [h('b', { text: x.title || (TOOLS[x.tool] || {}).name || 'Saved' }), h('span', { text: (slug ? '' : ((TOOLS[x.tool] || {}).name + ' · ')) + fmt(x.at) })]),
        h('span', { class: 'bs-go', text: 'Open →' })
      ]);
    })) : h('p', { class: 'bs-muted', text: 'Nothing in your book from this one yet. When you finish, tap “Save to my Becoming Book”.' });
    var closeList = sheet(slug ? TOOLS[slug].name + ' in your book' : 'Your saved activities', body);
  }

  /* the same picture the tool's "Download JPEG" makes, kept with the save so the book shows exactly that */
  function captureImage(cb) {
    var inst = window.BT_TOOL_INST || window.BT_VIEW_INST, done = false;
    var fin = function (v) { if (done) return; done = true; if (inst && orig) inst.saveJpeg = orig; cb(v); };
    if (!inst || typeof inst.saveJpeg !== 'function' || typeof inst.renderVals !== 'function') { cb(null); return; }
    var orig = inst.saveJpeg, vals = null;
    try { vals = inst.renderVals(); } catch (e) {}
    var dl = vals && (vals.download || vals.downloadBeliefs);
    if (typeof dl !== 'function') { cb(null); return; }
    inst.saveJpeg = function (cv) {
      try { var W = Math.min(900, cv.width), c = document.createElement('canvas'); c.width = W; c.height = Math.round(cv.height * W / cv.width); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height); fin(c.toDataURL('image/jpeg', 0.78)); } catch (e) { fin(null); }
    };
    try { dl(); } catch (e) { fin(null); return; }
    setTimeout(function () { fin(null); }, 5000);
  }

  function backfill(slug) {
    var inst = window.BT_TOOL_INST || window.BT_VIEW_INST; if (!inst || typeof inst.saveJpeg !== 'function' || !TOOLS[slug]) return;
    var todo = all().items.filter(function (x) { return x.tool === slug && !x.img && !x.noImg; }); if (!todo.length) return;
    var keys = TOOLS[slug].keys, main = keys[0], keep = {}, curState = Object.assign({}, inst.state);
    keys.forEach(function (k) { keep[k] = localStorage.getItem(k); });
    var restore = function () { try { inst.setState(curState); } catch (e) {} setTimeout(function () { keys.forEach(function (k) { try { if (keep[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, keep[k]); } catch (e) {} }); }, 50); };
    (function next(i) {
      if (i >= todo.length) { restore(); return; }
      var it = todo[i], st = it.data && it.data[main];
      if (!st || typeof st !== 'object') { next(i + 1); return; }
      try { inst.setState(st); } catch (e) { next(i + 1); return; }
      setTimeout(function () { captureImage(function (img) { var d = all(); d.items.forEach(function (x) { if (x.id === it.id) { if (img) x.img = img; else x.noImg = 1; } }); write(d); next(i + 1); }); }, 60);
    })(0);
  }
  function saveFlow(slug, onFresh, after) {
    var data = snapshot(slug);
    if (!Object.keys(data).some(function (k) { return hasContent(data[k]); })) { alertMsg('Fill a bit in first, then you can save it.'); return; }
    var title = h('input', { class: 'bt-in', id: 'bs-title', value: TOOLS[slug].name + ' · ' + fmt(Date.now()), 'aria-label': 'Name this one' });
    var body = h('div', { class: 'bs-view' }, [h('label', { class: 'bs-k2', for: 'bs-title', text: 'Give this one a name' }), title,
      h('p', { class: 'bs-muted', text: 'It goes into your Becoming Book with today’s date, so you can look back and see how far you’ve come.' })]);
    sheet('Save to your Becoming Book', body, function (close) {
      return [h('button', { class: 'bt-btn lime', type: 'button', text: 'Save', onclick: function () {
        var btn = this; btn.disabled = true; btn.textContent = 'Saving…';
        captureImage(function (img) {
        var d = all(), it = { id: Date.now().toString(36), tool: slug, title: title.value.trim() || TOOLS[slug].name, at: Date.now(), data: data }; if (img) it.img = img; d.items.push(it); write(d);
        close(); if (after) after();
        var done = h('div', { class: 'bs-view' }, [h('p', { class: 'bs-big', text: 'In your book ✓' }), h('p', { class: 'bs-muted', text: 'It’s in your Becoming Book now. Want a blank one for next time?' })]);
        sheet('Saved', done, function (c2) {
          return [h('button', { class: 'bt-btn ghost', type: 'button', text: 'Keep this one open', onclick: c2 }),
            h('button', { class: 'bt-btn lime', type: 'button', text: 'Start a fresh one', onclick: function () {
              TOOLS[slug].keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
              c2(); if (onFresh) onFresh(); else location.reload();
            } })];
        });
        });
      } })];
    });
  }

  /* the bar inside a tool */
  var bar = null;
  function mount(slug, onFresh) {
    unmount();
    if (!TOOLS[slug]) return;
    var count = h('span', { class: 'bs-n' });
    var refresh = function () { var n = list(slug).length; count.textContent = n ? String(n) : ''; count.hidden = !n; };
    bar = h('div', { class: 'bs-bar', role: 'toolbar', 'aria-label': 'Saved' }, [
      h('button', { class: 'bs-btn', type: 'button', onclick: function () { listView(slug, refresh); } }, ['In my book ', count]),
      h('button', { class: 'bs-btn lime', type: 'button', text: '♥ Save to my Becoming Book', onclick: function () { saveFlow(slug, onFresh, refresh); } })
    ]);
    refresh();
    document.body.appendChild(bar);
    setTimeout(function () { try { backfill(slug); } catch (e) {} }, 1200);
    document.body.classList.add('bs-on');
  }
  function unmount() { if (bar) { bar.remove(); bar = null; } document.body.classList.remove('bs-on'); }

  /* profile section */
  function profileSection() {
    var items = list();
    var wrap = h('section', { class: 'bt-card2 bs-prof' }, [h('h2', { text: 'Your Becoming Book' }), h('p', { class: 'bt-sub', text: 'Your milestones, saved activities, journal, wins and proof, all dated.' }), h('a', { class: 'bt-btn lime', href: '#Book', style: 'align-self:flex-start', text: 'Open my Becoming Book' }), h('p', { class: 'bs-k2', text: 'Saved activities' })]);
    if (!items.length) { wrap.appendChild(h('p', { class: 'bt-sub', text: 'When you finish an activity (like the What If Workout or REWIND), tap “Save this one” at the bottom and it shows up here.' })); return wrap; }
    var groups = {};
    items.forEach(function (x) { (groups[x.tool] = groups[x.tool] || []).push(x); });
    Object.keys(groups).forEach(function (slug) {
      wrap.appendChild(h('p', { class: 'bs-k2', text: (TOOLS[slug] || {}).name || slug }));
      wrap.appendChild(h('div', { class: 'bs-list' }, groups[slug].map(function (x) {
        return h('button', { class: 'bs-item', type: 'button', onclick: function () { openItem(x, function () { var nw = profileSection(); wrap.replaceWith(nw); }); } }, [
          h('span', { class: 'bs-dot', 'aria-hidden': 'true' }), h('span', { class: 'bs-it' }, [h('b', { text: x.title }), h('span', { text: fmt(x.at) })]), h('span', { class: 'bs-go', text: 'Open →' })]);
      })));
    });
    return wrap;
  }

  window.BT_SAVES = { tools: TOOLS, mount: mount, unmount: unmount, list: list, profileSection: profileSection, open: openItem, save: function (slug, onFresh) { saveFlow(slug, onFresh); }, value: value };
  // buttons inside the tools ("Save to my Becoming Book") point at #bt-book-save
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#bt-book-save"]') : null;
    if (!a) return; e.preventDefault(); e.stopPropagation();
    var slug = (window.BT_TOOL && window.BT_TOOL.slug) || a.getAttribute('data-tool');
    if (slug && TOOLS[slug]) saveFlow(slug);
  }, true);
})();
