#!/usr/bin/env python3
"""Rebuild public/index.html: merge the two source artifacts, then drop the result into the page template.
Run from the project folder:  python3 tools/build.py
"""
import os, subprocess, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
subprocess.check_call([sys.executable, 'tools/merge_artifacts.py', 'src/companion.html', 'src/one-on-one.html', 'src/app-bundle.html'])
tpl = open('src/index.template.html', encoding='utf-8').read()
bundle = open('src/app-bundle.html', encoding='utf-8').read()
assert '<!--APP-BUNDLE-->' in tpl
open('public/index.html', 'w', encoding='utf-8').write(tpl.replace('<!--APP-BUNDLE-->', bundle))
print('built public/index.html')
