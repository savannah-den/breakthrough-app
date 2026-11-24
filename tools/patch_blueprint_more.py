#!/usr/bin/env python3
"""Emotional Blueprint (24 Nov 2026): the Start here tab is gone, and the mini course (six modules, exactly as it was
in the full version) is back at the top of More tools. Copies the course markup from src/canvases/blueprint-full.dc.html.
Idempotent (marker EB_MORE1). Runs after patch_blueprint_wheel.py, then tools/import_canvas.py."""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/canvases/blueprint.dc.html')
s = open(P, encoding='utf-8').read()
if 'EB_MORE1' in s: print('blueprint mini course already in More tools'); raise SystemExit
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
full = open(os.path.join(root, 'src/canvases/blueprint-full.dc.html'), encoding='utf-8').read()
a = full.index('<section class="sec" id="home-course">'); b = full.index('</section>', a) + len('</section>')
course = full[a:b]
rep("var MENUTABS = [['home', 'Start here', 'door'], ['tune', 'What am I feeling?', 'other'],", "var MENUTABS = [['tune', 'What am I feeling?', 'other'],")
rep('<!-- ================= MORE TOOLS ================= -->\n<sc-if value="{{tabMore}}" hint-placeholder-val="{{ false }}">\n',
    '<!-- ================= MORE TOOLS ================= -->\n<sc-if value="{{tabMore}}" hint-placeholder-val="{{ false }}">\n<!-- EB_MORE1 -->\n' + course + '\n')
rep("cOpenCourse: function () { self.setState({ tab: 'home', cShow: true }); eScrollTo('home-course'); },", "cOpenCourse: function () { self.setState({ tab: 'more', cShow: true }); eScrollTo('home-course'); },")
rep("eGoLearn: function () { self.setState({ tab: 'home', cShow: true }); eScrollTo('home-course'); },", "eGoLearn: function () { self.setState({ tab: 'more', cShow: true }); eScrollTo('home-course'); },")
rep("goHome: function () { self.goTab('home'); },", "goHome: function () { self.goTab('tune'); },")
rep("var TABMAP = { learn: 'home', guide: 'wheel', mega: 'levels' };", "var TABMAP = { learn: 'more', home: 'more', guide: 'wheel', mega: 'levels' };")
rep("return TABS.some(function (x) { return x[0] === t; }) ? t : 'home'; }", "return TABS.some(function (x) { return x[0] === t; }) ? t : 'tune'; }")
rep("indexOf(qt) >= 0 && (qt === 'tune' || EB_FULL(this.state))) this.setState({ tab: qt,", "indexOf(qt) >= 0 && (qt === 'tune' || EB_FULL(this.state))) this.setState({ tab: qt === 'home' ? 'more' : qt,")
open(P, 'w', encoding='utf-8').write(s)
print('blueprint: Start here tab gone, mini course in More tools')
