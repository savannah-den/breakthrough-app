# Activities return to where they were opened from (course -> next lesson, resources -> resources). Intentions works like Set-up. Idempotent.
P='public/js/course.js'
s=open(P,encoding='utf-8').read()
if 'function activityDone' in s: print('already patched'); raise SystemExit
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)

# Intentions + Set-up: the lesson IS the activity page (video at the top, activity underneath)
rep("  function lessonHref(l) {\n", "  var IN_PAGE = { intent: 1, setup: 1 };\n  function lessonHref(l) {\n    if ((l.res || []).length && IN_PAGE[l.res[0]]) { var ri = resource(l.res[0]); if (ri) return resHref(ri); }\n")
rep("href: hasVid ? '#Lesson-' + l.id : resHref(r),", "href: hasVid && !IN_PAGE[r.id] ? '#Lesson-' + l.id : resHref(r),")
rep("""      host.querySelectorAll('[data-slot="home-top"]').forEach(function (el) { if (!el.__filled) { el.__filled = true; fillHomeTop(el); } });""",
"""      host.querySelectorAll('[data-slot="home-top"]').forEach(function (el) { if (!el.__filled) { el.__filled = true; fillHomeTop(el); } });
      host.querySelectorAll('[data-slot="act-video"]').forEach(function (el) { if (!el.__filled) { el.__filled = true; var f = findLesson(el.getAttribute('data-lesson')); if (f && (tx(f.l.video) || tx(f.l.vimeo))) { el.appendChild(videoBlock(f.l, f.l.id)); if (tx(f.l.desc)) el.appendChild(h('p', { class: 'bt-act-desc', text: f.l.desc })); } } });""")

RET = r'''
  /* ---------------- coming back from an activity ----------------
     Remember where an activity was opened from: the course (Done takes her to the next lesson)
     or Resources (Done takes her back there). Anywhere else, the activity's own buttons apply. */
  var RETK = 'bt-return';
  function retGet(resId) {
    var r = rd(RETK); if (!r || !r.at || Date.now() - r.at > 6 * 3600000) return null;
    if (resId && r.res && r.res !== resId) return null;
    return r;
  }
  function retKind(r) { return !r ? '' : /^#(Course|Lesson-)/.test(r.from) ? 'course' : /^#Resources/.test(r.from) ? 'res' : ''; }
  function resForHref(href) {
    href = String(href || '').replace(/^(\.\.\/)?app\.html/, '').replace(/^\//, '');
    return (window.BT_RESOURCES || []).filter(function (r) { var x = resHref(r).replace(/^\//, ''); return x && x !== '#' && (href === x || href === x.replace(/^\.\.\//, '')); })[0] || null;
  }
  function watchReturns() {
    window.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      var r = resForHref(a.getAttribute('href')); if (!r) return;
      var from = location.hash || '#Dashboard';
      if (/^#(Course|Lesson-|Resources)/.test(from)) wr(RETK, { from: from, res: r.id, at: Date.now() }); else wr(RETK, null);
    }, true);
  }
  function lessonForRes(resId) { var hit = null; allLessons().forEach(function (x) { if (!hit && (x.l.res || [])[0] === resId) hit = x; }); return hit; }
  function nextAfter(id) {
    var all = allLessons(), i = -1; all.forEach(function (x, k) { if (x.l.id === id) i = k; });
    for (var k = i + 1; k < all.length; k++) { var l = all[k].l; if (lessonOpen(l.id) && !prog().done[l.id]) return l; }
    return null;
  }
  function goHref(href) {
    if (href.charAt(0) === '#') { if (location.hash === href) APP.reload(); else location.hash = href; return; }
    if (/\.dc\.html$/.test(href)) { APP.go(href); return; }
    if (window.parent !== window && window.parent.BT_OPEN) window.parent.BT_OPEN(href.replace(/^\//, '')); else location.href = href;
  }
  function doneLabel(resId, dflt) { var k = retKind(retGet(resId)); return k === 'course' ? 'Done · on to the next lesson →' : k === 'res' ? 'Done, back to resources' : dflt; }
  function backLabel(resId, dflt) { var k = retKind(retGet(resId)); return k === 'course' ? '← Back to the course' : k === 'res' ? '← Back to resources' : dflt; }
  // returns true when it took her somewhere
  function activityDone(resId) {
    var r = retGet(resId), k = retKind(r), f = lessonForRes(resId);
    if (f && lessonOpen(f.l.id) && !prog().done[f.l.id]) { markDone(f.l.id, true); setTimeout(celebrate, 600); }
    wr(RETK, null);
    if (k === 'course') {
      var nx = f ? nextAfter(f.l.id) : null;
      if (nx) { var hr = lessonHref(nx); if (hr.charAt(0) !== '#' || IN_PAGE[(nx.res || [])[0]]) wr(RETK, { from: '#Course', res: (nx.res || [])[0] || '', at: Date.now() }); goHref(hr); }
      else goHref('#Course');
      return true;
    }
    if (k === 'res') { goHref('#Resources'); return true; }
    return false;
  }
  function activityBack(resId) {
    var r = retGet(resId), k = retKind(r);
    if (k === 'course' || k === 'res') { wr(RETK, null); goHref(r.from); return true; }
    return false;
  }
  // a little bar at the top of in-app activities (Breaking Out, STAR) when she came from the course or Resources
  var RET_ROUTES = { 'BreakingOut.dc.html': 'box', 'StarHome.dc.html': 'star' };
  function retStrip(resId) {
    var k = retKind(retGet(resId)); if (!k) return null;
    return h('div', { class: 'bt-ret', role: 'navigation', 'aria-label': 'Back to where you were' }, [
      h('button', { class: 'bt-ret-b', type: 'button', text: backLabel(resId, '← Back'), onclick: function () { activityBack(resId); } }),
      h('button', { class: 'bt-btn lime bt-ret-d', type: 'button', text: k === 'course' ? 'Done · next lesson →' : 'Done', onclick: function () { activityDone(resId); } })
    ]);
  }
  function ActDoneView(root, resId) {
    root.appendChild(h('div', { class: 'bt-wrap' }, [h('p', { class: 'bt-sub', text: 'Saving your progress…' })]));
    setTimeout(function () { if (!activityDone(resId)) goHref('#Dashboard'); }, 30);
  }
'''
rep("  var mo = null;\n  function watchSlots() {", RET + "  var mo = null;\n  function watchSlots() {")
rep("Profile: ProfileView,", "Profile: ProfileView, ActDone: ActDoneView, Back: function (root, resId) { setTimeout(function () { if (!activityBack(resId)) goHref('#Resources'); }, 30); },")
rep("init: function (app) { APP = app; h = app.h; try { migrateWins(); backfillProof(); } catch (e) {} watchSlots(); watchJournal(); },",
    "init: function (app) { APP = app; h = app.h; try { migrateWins(); backfillProof(); } catch (e) {} watchSlots(); watchJournal(); watchReturns(); },")
rep("      renderTopNav(route);\n", "      renderTopNav(route);\n      var oldR = document.getElementById('bt-ret'); if (oldR) oldR.remove();\n      if (RET_ROUTES[route]) { var rs = retStrip(RET_ROUTES[route]); if (rs) { rs.id = 'bt-ret'; var top = document.getElementById('bt-top'); if (top && top.nextSibling) top.parentNode.insertBefore(rs, top.nextSibling); else document.body.insertBefore(rs, document.body.firstChild); } }\n")
rep("    unlockedWeek: function () { return APP ? unlockedWeek() : 1; },",
    "    unlockedWeek: function () { return APP ? unlockedWeek() : 1; },\n    activityDone: function (r) { return APP ? activityDone(r) : false; }, activityBack: function (r) { return APP ? activityBack(r) : false; },\n    doneLabel: function (r, d) { return APP ? doneLabel(r, d) : d; }, backLabel: function (r, d) { return APP ? backLabel(r, d) : d; }, returnKind: function (r) { return retKind(retGet(r)); },")
open(P,'w',encoding='utf-8').write(s); print('ok')
