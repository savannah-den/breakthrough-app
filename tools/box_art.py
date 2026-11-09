# Hand-drawn pictures for each Breaking Out of Your Box section (same wobbly style as the What If Workout).
# Each loops gently. Used by tools/patch_box_steps.py.
INK = '#4E0C08'
def wrap(fid, body):
    return ('<svg viewBox="0 0 150 110" role="img" aria-hidden="true"><defs><filter id="' + fid + '" x="-10%" y="-10%" width="120%" height="120%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"></feTurbulence><feDisplacementMap in="SourceGraphic" scale="2.6"></feDisplacementMap></filter></defs>'
            '<g filter="url(#' + fid + ')" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + body + '</g></svg>')

# a little person: head + body, at x,y (feet), with a face
def person(x, y, fill='#F4C2F7', cls=''):
    return ('<g class="' + cls + '"><path d="M' + str(x-13) + ' ' + str(y) + 'c0-18 5-26 13-26s13 8 13 26z" fill="' + fill + '"/>'
            '<circle cx="' + str(x) + '" cy="' + str(y-34) + '" r="9" fill="#FFF4EE"/>'
            '<circle cx="' + str(x-3) + '" cy="' + str(y-35) + '" r="1" fill="' + INK + '"/><circle cx="' + str(x+3) + '" cy="' + str(y-35) + '" r="1" fill="' + INK + '"/></g>')

ART = {
  # Self-worth & identity: someone looking in a mirror, the reflection unsure
  'self': wrap('pdA1', person(45, 96) +
      '<path d="M42 64q3 2 6 0"/>'
      '<rect x="80" y="18" width="46" height="74" rx="22" fill="#FFFFFF"/><rect x="86" y="24" width="34" height="62" rx="16" fill="#E8F1FB"/>'
      '<g class="pa-bob">' + person(103, 82, '#F4C2F7') + '<path d="M100 51q3-2 6 0"/></g>'
      '<path class="pa-tw" d="M118 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F1F9A6"/>'),
  # Relationships: two people, a heart that beats between them, one leaning away
  'rel': wrap('pdA2', person(42, 98, '#BFD7F2') + person(108, 98, '#F4C2F7') +
      '<path d="M39 66q3 2 6 0M105 66q3-2 6 0"/>'
      '<path class="pa-beat" d="M75 40c-5-8-17-4-13 5 3 6 13 12 13 12s10-6 13-12c4-9-8-13-13-5z" fill="#E8338A"/>'
      '<path d="M55 82q20-10 40 0" stroke-dasharray="4 5"/>'),
  # Achievement & productivity: someone on a hamster wheel that keeps spinning
  'ach': wrap('pdA3', '<g class="pa-spin" style="transform-origin:75px 58px"><circle cx="75" cy="58" r="40" fill="#FFFFFF"/><circle cx="75" cy="58" r="33"/>'
      '<path d="M75 18v80M35 58h80M47 30l56 56M103 30L47 86" stroke-width="1.6"/></g>'
      '<path d="M50 104l25-46 25 46"/>' + person(75, 95, '#F1F9A6', 'pa-run') +
      '<path class="pa-tw" d="M126 20h12M128 28h10" />'),
  # Perfectionism & failure: a pencil scribbling, an eraser rubbing it out, crumpled paper
  'perf': wrap('pdA4', '<rect x="20" y="20" width="74" height="78" rx="6" fill="#FFFFFF"/><path d="M30 38h50M30 50h44M30 62h50M30 74h30" stroke-width="1.6"/>'
      '<g class="pa-rub"><rect x="58" y="66" width="28" height="16" rx="4" fill="#F4C2F7" transform="rotate(-20 72 74)"/></g>'
      '<g class="pa-scrib"><path d="M104 22l20 6-36 52-14 4 2-14z" fill="#F1F9A6"/><path d="M76 70l12 8"/></g>'
      '<path d="M108 90c4-8 16-8 20 0s-4 14-10 12-12 0-10-12z" fill="#FFFFFF"/><path d="M112 92l6 4 4-6" stroke-width="1.6"/>'),
  # Visibility & being seen: someone hiding behind a curtain, peeking out
  'vis': wrap('pdA5', '<path d="M14 10h122"/><path d="M20 10c-4 30 6 60 0 96M38 10c-4 30 6 60 0 96" stroke-width="1.6"/>'
      '<path d="M20 10h56c6 30-6 64 4 96H20z" fill="#E8338A" fill-opacity=".55"/><path d="M40 12c2 30-4 60 2 92M58 12c2 30-6 62 0 92" stroke-width="1.4"/>'
      '<g class="pa-peek"><circle cx="86" cy="52" r="10" fill="#FFF4EE"/><circle cx="85" cy="51" r="1.2" fill="#4E0C08"/><circle cx="90" cy="51" r="1.2" fill="#4E0C08"/>'
      '<path d="M80 58c-2 0 0 0 0 0" /><path d="M78 64q-6 2-4 8" /></g>'
      '<path class="pa-tw" d="M118 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F1F9A6"/><path class="pa-tw b" d="M126 70l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#F1F9A6"/>'),
  # Safety & control: someone under an umbrella while the rain falls
  'safe': wrap('pdA6', '<g class="pa-rain" stroke-width="1.8"><path d="M24 12l-4 10M48 6l-4 10M104 8l-4 10M128 14l-4 10M36 30l-4 10M118 32l-4 10"/></g>'
      '<path d="M32 52c4-26 82-26 86 0-8-6-18-6-22 0-6-6-16-6-21 0-6-6-16-6-21 0-6-6-16-6-22 0z" fill="#BFD7F2"/>'
      '<path d="M75 50v40q0 8-8 8"/>' + person(70, 104, '#F4C2F7') + '<path d="M67 72q3 2 6 0"/>'),
}
