#!/usr/bin/env python3
"""ECT page: Tahlia's ECT journey (like the Breakthrough landing page's Meet Tahlia) + more ECT testimonials. Idempotent."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(root, 'src/one-on-one.html')
s = open(P, encoding='utf-8').read()
if 'ET_TAHLIA_V1' in s: raise SystemExit(0)
a = s.index('<template id="t-ect">'); b = s.index('</template>', a)
t = s[a:b]
I = 'img/landing/'
def shot(step, img, alt, cls=''):
    return f'<figure class="et-slide{cls}"><span class="et-step{cls}">{step}</span><img src="{I}{img}" alt="{alt}" loading="lazy"></figure>'
slides = ''.join([
    shot('Before', 'et-tahlia-before.jpg', 'Tahlia: Before I signed up for Sav’s breakthrough program I was feeling stuck, I kept going around in a burnout cycle. I would take on way too much, be physically and emotionally exhausted, quit and start the process all over again.'),
    shot('Starting ECT', 't-tahlia-nervous.jpg', 'Tahlia: I was initially a bit nervous, I had some big emotions from past trauma, and thought nothing else I had tried had worked, so I may as well give it a go! For the last 6 years I have had panic attacks, nightmares, and avoided situations that reminded me of the trauma.'),
    shot('Session one', 'et-tahlia-did.jpg', 'Tahlia: I did ECT today!'),
    shot('Two sessions in', 'et-tahlia-2sessions.jpg', 'Tahlia: Now I have done 2 sessions of ECT, the question I brought up in this call doesn’t feel as heavy.'),
    shot('What she learnt', 'et-tahlia-learnt.jpg', 'Tahlia: What I learnt throughout the program and through ECT is that I was holding onto a lot of anger. That anger was making it harder for me to be in my body and releasing and feeling other emotions.', ' learnt'),
    shot('Then: just another day', 't-tahlia-ptsd.jpg', 'Tahlia: This year I didn’t have a big PTSD flare up. Every year since, I have had panic attacks, flashbacks and pain. This year was just another day. I never thought I would be able to say that. I thought I would have to carry around this trauma forever.', ' win'),
    shot('Then: no panic attack', 't-tahlia-date.jpg', 'Tahlia: I went on a date kinda thing and she drove to the place it happened. I haven’t been there in 6 years. I didn’t have a panic attack. Did I freak out a little bit? Yes, but not in full panic.', ' win'),
    shot('Now', 'et-tahlia-thanks.jpg', 'Tahlia: Thank you Sav for showing me I can have my body back. I am in control of my life and my decisions.', ' win'),
])
sec = ('<!-- ET_TAHLIA_V1 --><section class="sec et-meet">'
       f'<img class="et-face" src="{I}av-tahlia.jpg" alt="Tahlia">'
       '<span class="hand" style="font-size: 17px; color: #F1F9A6">Meet Tahlia · 🇦🇺 Australia · her ECT journey</span>'
       '<h2 class="h2" style="color: #FFF4EE">“Thank you Sav for showing me I can have my body back.”</h2>'
       '<p class="lead" style="color: #FBE6FC">Six years of panic attacks, nightmares and avoiding anything that reminded her of the trauma. Then six sessions of ECT. Here’s her journey in her own words, in the order she wrote them. Scroll →</p>'
       '<sc-if value="{{etVid}}" hint-placeholder-val="{{ false }}"><div class="et-vid"><iframe src="https://player.vimeo.com/video/1243967602?autoplay=1&amp;title=0&amp;byline=0&amp;portrait=0&amp;dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Tahlia talks about her journey with Sav"></iframe></div></sc-if>'
       '<sc-if value="{{etNoVid}}" hint-placeholder-val="{{ true }}"><button type="button" class="et-vid et-vbtn" aria-label="Play Tahlia’s video" onClick="{{etPlay}}">'
       f'<img class="et-vface" src="{I}av-tahlia.jpg" alt=""><span class="et-vplay" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="#4E0C08"><path d="M8 5.5v13l11-6.5z"></path></svg></span>'
       '<span class="et-vt"><span class="hand" style="font-size: 16px; color: #F1F9A6">Tap to watch</span><strong>Tahlia, in her own words</strong></span></button></sc-if>'
       f'<div class="et-scroll" tabindex="0" aria-label="Tahlia’s ECT journey, scroll sideways">{slides}</div>'
       '<div style="display: flex; flex-wrap: wrap; gap: 10px"><a class="primary lime" href="#ect-enquire">I want this too</a></div>'
       '</section>')
# 1. insert after the From Sav story section
k = t.index('class="ectstory"'); e = t.index('</section>', k) + len('</section>')
t = t[:e] + '\n\n' + sec + t[e:]
# 2. Tahlia's pair moves into her journey, so take it off the wall
i = t.index('<figure class="testi pair2">'); j = t.index('</figure>', i) + len('</figure>')
t = t[:i] + t[j:]
# 3. more on the wall
def fig(img, alt): return f'<figure class="testi"><img src="{I}{img}" alt="{alt}" loading="lazy"></figure>'
more = ''.join([
    fig('et-fear.jpg', 'Client message: “Had ECT this morning and released a lot of fear and hurt. Slept for 1.5 hrs afterwards, woke up super refreshed and the most energetic I’ve been in days.”'),
    fig('et-grief.jpg', 'Client message: “After ECT, and being able to move through my grief, I have found myself having a bigger container for compassion and empathy. And once I let it go, it felt like this thing that was so far behind me.”'),
    fig('et-grateful.jpg', 'Client message: “You held space for me in ECT and helped get me to where I wanted to be and to let go. I have felt an incredible change in myself.”'),
    fig('et-anna-last.jpg', 'Anna: “Had my last ECT call. Was a really good one, and also a bit sad since it was the last one. It has helped me loads to become more rooted and understand more about myself as well as letting go of many things.”'),
    fig('et-anna-celebrate.jpg', 'Anna: “Celebrating my last ECT. I’m curious to experiencing life.” Reply: “Proud of you Anna!!! The changes I’ve witnessed in you have been very heart warming.”'),
])
w = t.index('<div class="testis">') + len('<div class="testis">')
t = t[:w] + more[:0] + t[w:]
we = t.index('</div>\n</section>', w)
t = t[:we] + more + t[we:]
# 4. styles
css = ('\n/* ET_TAHLIA_V1 */\n.et-meet{background:#4E0C08;color:#FFF4EE;border-radius:30px;padding:30px 22px;gap:14px;align-items:flex-start;overflow:hidden}'
       '\n.et-face{width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #F1F9A6;box-shadow:0 8px 20px rgba(0,0,0,.25)}'
       '\n.et-meet .h2{font-style:italic}'
       '\n.et-vid{width:100%;max-width:760px;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#2A0806;border:2px solid rgba(255,244,238,.25)}'
       '\n.et-vid iframe{width:100%;height:100%;border:0;display:block}'
       '\n.et-vbtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;font:inherit;color:#FFF4EE;background:radial-gradient(circle at 50% 42%,#7A1A12,#2A0806 78%);padding:0}'
       '\n.et-vface{position:relative;width:104px;height:104px;border-radius:50%;object-fit:cover;border:3px solid #F4C2F7}'
       '\n.et-vplay{margin-top:-46px;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#F1F9A6;border:2px solid #1F1412;position:relative;z-index:1;animation:etpulse 2.4s ease-in-out infinite}'
       '\n.et-vplay svg{margin-left:3px}.et-vt{display:flex;flex-direction:column;align-items:center;gap:2px}.et-vt strong{font-size:17px}'
       '\n@keyframes etpulse{0%,100%{box-shadow:0 0 0 0 rgba(241,249,166,.55)}50%{box-shadow:0 0 0 12px rgba(241,249,166,0)}}'
       '\n@media (prefers-reduced-motion: reduce){.et-vplay{animation:none}}'
       '\n.et-scroll{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;width:calc(100% + 44px);margin:4px -22px 0;padding:14px 22px 18px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}'
       '\n.et-slide{flex:0 0 min(78%,380px);scroll-snap-align:start;margin:0;position:relative;display:flex;flex-direction:column;justify-content:center;padding:30px 10px 12px;border-radius:22px;background:#FFF4EE;border:1.5px solid rgba(255,244,238,.6);box-shadow:0 10px 26px rgba(0,0,0,.22)}'
       '\n.et-slide img{display:block;width:100%;height:auto;border-radius:14px}'
       '\n.et-step{position:absolute;top:-10px;left:14px;padding:4px 12px;border-radius:999px;background:#F4C2F7;color:#4E0C08;font-family:"Patrick Hand SC","Trebuchet MS",sans-serif;font-size:15px;letter-spacing:.04em;border:1.5px solid #1F1412;white-space:nowrap}'
       '\n.et-step.win{background:#F1F9A6}.et-step.learnt{background:#FFFFFF}'
       '\n.et-scroll:focus-visible{outline:3px solid #F1F9A6;outline-offset:2px;border-radius:12px}'
       '\n@media (max-width: 560px){.et-meet{padding:26px 16px}.et-scroll{width:calc(100% + 32px);margin:4px -16px 0;padding:14px 16px 18px}.et-slide{flex-basis:84%}}\n')
st = t.index('</style>')
t = t[:st] + css + t[st:]
s = s[:a] + t + s[b:]
old = "      ectVideo: vid, hasEctVideo: /^https?:\\/\\//.test(vid), noEctVideo: !/^https?:\\/\\//.test(vid)\n"
assert s.count(old) == 1, 'ECT renderVals not found'
s = s.replace(old, "      etVid: !!s.etVid, etNoVid: !s.etVid, etPlay: function () { self.setState({ etVid: true }); },\n" + old, 1)
open(P, 'w', encoding='utf-8').write(s)
print('patched ECT: Tahlia journey + 5 testimonials')
