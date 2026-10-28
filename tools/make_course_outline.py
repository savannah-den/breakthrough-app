#!/usr/bin/env python3
"""Writes src/course-outline.json: the starting course (weeks, lessons, descriptions, journal
questions, resources, placeholder videos) taken from Sav's Stan course on 28 Oct 2026.

Journal questions for the intro, week 1 and week 3 come from the companion's JOURNAL (same
lesson ids, so students' saved answers still line up). Week 2 and week 4 were added from Stan.
"video" = the lesson's current video file on Stan, used until Sav adds a Vimeo link in the
coach dashboard. Lessons marked optional don't need finishing to unlock the next one.
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
STAN = 'https://assets.stanwith.me/live/msc/28154850/'
src = open('src/companion.html', encoding='utf-8').read()
J = json.loads(re.search(r'var JOURNAL = (\[.*?\]);?\n', src).group(1))
JQ = {l['id']: l for w in J for l in w.get('lessons', [])}

def L(id, title, video='', desc='', prompts=None, res=None, optional=False, notes=False):
    j = JQ.get(id, {})
    return {'id': id, 'title': title, 'video': (STAN + video) if video else '', 'vimeo': '', 'desc': desc.strip(),
            'prompts': prompts if prompts is not None else j.get('qs', []), 'res': res if res is not None else ([j['res']] if j.get('res') else []),
            'notes': notes or bool(j.get('notes')), 'optional': optional, 'transcript': '', 'tip': j.get('tip', '')}

weeks = [
 {'week': 0, 'title': 'Introduction', 'res': ['setup', 'intent'], 'lessons': [
   L('i1', 'Lesson 1: Welcome', 'tvfpn/intro1infull.mp4', 'Nothing changes if nothing changes. So let’s start changing your thoughts, beliefs and actions so you can change your f**king life!'),
   L('i3', 'Activity: Set yourself up for success', '', 'Watch the set-up video, then work through the seven set-up steps one by one. Come back to it any time you’ve been avoiding the course or you’ve lapsed.', prompts=[], res=['setup']),
   L('i2', 'Activity: Setting Intentions', 'xhnk5/activitysettingintentions.mp4', 'Set your intentions in the Intentions activity below.\n\nRemember, the more we write something down, the more important our brain deems it to be, and the deeper it locks into place.', res=['intent']),
 ]},
 {'week': 1, 'title': 'The Foundations', 'res': ['whatif'], 'lessons': [
   L('w1l1', 'Lesson 1: Brain + Body', '5lni7/bt1brainandbody.mp4', 'Heads up: this course is a replay of the live Breakthrough Program, so you’ll hear me mention the group chat. If you’d like to join the next live round or 1:1 program, email me at savannah@colourmeneurospicy.com.au. There’s a discount because you’ve already invested in the self-paced course.\n\nFor now, keep watching!'),
   L('w1l2', 'Lesson 2: Conscious + Unconscious Mind', '49hvg/bt2conciousunconscious.mp4'),
   L('w1l3', 'Lesson 3: Nervous System', '3i2jf/bt3nervoussystem.mp4'),
   L('w1l4', 'Lesson 4: Neurotransmitters + Hormones', 'ze8yt/bt4neurotransmittershormones.mp4'),
   L('w1a4', 'Activity: Your daily DOSE', '', 'Pick everything you’d love from the DOSE menu, build a quick daily DOSE routine, and get a fun plan whenever you want one.', res=['dose']),
   L('w1l5', 'Lesson 5: Anxiety', 'ufk3q/bt5anxiety.mp4', 'Write a list of the situations that make you anxious, then work through each one with the What If Workout.', res=['whatif']),
   L('w1a1', 'Activity: What If Workout', '', 'For when your brain starts spiralling into the future. Get it out of your head and onto the page.', res=['whatif']),
   L('w1l6', 'Lesson 6: Fight or Flight', 'majdl/bt6fightorflight.mp4', 'Knowing what your states are, in what situations, and around which people you tend to use each one, is super helpful for changing the way you respond. Sometimes just becoming aware of it is enough.'),
   L('w1a5', 'Activity: Pause', '', 'Little pockets of slow so your nervous system can catch up. Build your own pause menu.', res=['pause']),
   L('w1l7', 'Lesson 7: Body', 'mr9yq/bt7body.mp4', 'Keys to a happy body: it might not be easy, but it is simple!\n\n🔑 Drink water\n🔑 Eat more energy than you burn (and regularly)\n🔑 Move your body (we weren’t designed to be stationary beings)\n🔑 Rest: your eyes after screens, your brain after thinking hard, your legs after running\n🔑 Sleep: a good night-time routine, no screens, read to tire your eyes, empty your mind into a journal\n\nWhere have you neglected yourself and your needs, and how can you improve them by just 1% today, and every day?\n\nYour body sends signals. Headaches, an aching back, tummy troubles, tight shoulders, a clenched jaw, a stiff neck, tired eyes, sore feet, aching hands, trouble sleeping, exhaustion: each has a practical side (water, posture, screens, sleep) and a question worth asking (What am I carrying? What am I avoiding? Where do I need more support?).\n\nYou don’t have to force a meaning. Sometimes an aching back needs a different chair, and sometimes the question about support opens an important conversation. Both deserve attention.'),
   L('w1a6', 'Activity: Move', '', 'Why moving matters for stress, and your own move menu at every energy level.', res=['move']),
   L('w1l8', 'Lesson 8: Neuroplasticity', 'b8kr2/bt8neuroplasticity.mp4'),
   L('w1l9', 'Lesson 9: Breathing', '71uw9/breakthroughbreathingnew.mp4', 'Minimum once a day, ideally two or three times.\n\nThis is the main key to building a resilient nervous system! Only 5 to 15 minutes a day, and you’ll strengthen that spindly tree into a stable, reliable one.', res=['breathe']),
   L('w1a3', 'Activity: Breathwork', '', 'Your two go-to breaths (the 5-minute daily breath and the physiological sigh), a guided breathing tool with soothing sounds, and what to do for the state you’re in.', res=['breathe']),
   L('w1a2', 'Embodiment: Vagal Tone Workout', '', 'Small daily practices to support regulation, recovery and resilience.\n\nEverything in this program is designed to build a more resilient nervous system. Like building a muscle, small repetitions add up.\n\nYour four daily practices (write them on a sticky note for your mirror or computer):\n1. DOSE: get your daily dose of dopamine, oxytocin, serotonin and endorphins.\n2. BREATHE: your five-minute breathing practice, at least once a day.\n3. PAUSE: little pauses through the day.\n4. MOVE: get your body moving.\n\nMissed one? Pick it up at the next opportunity. No catching up required. It’s about the 1% actions.', res=['vagal']),
 ]},
 {'week': 2, 'title': 'The Reality Framework', 'res': ['box'], 'lessons': [
   L('w2l0', 'Intro', 'rcu2w/week20intro.mp4', 'This video will probably feel overwhelming, and because you’re AuDHD, you want to know why you’re learning everything before I actually teach you the thing… I see you, because I am you!\n\nYou’re probably thinking, I didn’t sign up for this. Chill, it’s exactly what you didn’t know you needed. Trust me. It will all make sense soon.', prompts=[]),
   L('w2l1', 'Lesson 1: Your Experience of the World', 'fvo7b/week21experienceoftheworld.mp4', prompts=[
     ['What does your current experience of the world look like?', 'Family, friends, upbringing (childhood), genetics, environment, choices and desires. Make a heading for each and jot down a few things that come to mind.'],
     ['How do you feel about your experience of the world?', 'Are you grateful for the life you’ve lived so far? Sad? Wish it were different? A bit of both? It’s okay if you’re not there yet. By the end of the program you may feel differently about the cards you’ve been dealt.']]),
   L('w2l2', 'Lesson 2: Your Memories + RAS Filter', 'dwhm2/week22memories.mp4', '⭐️ PAUSE activity: add PAUSE to your DOSE and Breathe sticky notes.\n\nA reminder to take a five-minute pause, or even a few physiological breaths, throughout the day. Stop rushing everything and everywhere, and give all that information your brain is processing a second to catch up.', prompts=[
     ['Your truth, my truth, not THE truth. Where in life has that been true for you?', 'Have there been moments where you remembered an event differently from someone else, and you each thought the other was lying? What if two things could be true at once, and the bits your brain saved as “important” were just different to theirs?'],
     ['Can you recall more “negative” memories than positive ones?', 'The heavier emotions like anger, fear and sadness feel more important to our survival than joy or love, so the brain saves them to protect us, and then ends up looking for more of them.']]),
   L('w2s1', 'Side Quest: Synaptic Pruning (our super computer brain)', '19f6r/week2sidequestsynapticpruning.mp4', prompts=[
     ['What information has your brain kept? And what synapses did it prune?', 'Remember how, if you don’t ride a bike for a few years, it only takes a few minutes to feel confident again? Your brain re-opened a weaker pathway and strengthened it back up now it knows you need it.']]),
   L('w2s2', 'Side Quest: Overstimulation (introducing the energy audit)', 'l1m9z/week2sidequestoverstimulation.mp4', 'You’ll find the energy audit in the Energy Audit lesson later this week.', prompts=[]),
   L('w2l3', 'Lesson 3: Proof Portfolio', 'zqhxc/week23proofportfolio.mp4', 'Your RAS filter is what you use to collect “proof”, and you can train it to see the positive instead of the negative. For now, start noticing when you’re seeing the negative frame, and how you could see the positive intention instead.\n\n⭐️ Start a journal of daily wins: something you enjoyed, something beautiful you saw, something you’re grateful for. Watch how much more of the good stuff you begin to notice.', prompts=[
     ['Are you a glass-half-full or glass-half-empty person naturally? (Be honest with yourself)', 'Example: “That day was shit, EVERYTHING went wrong. I spilled my coffee, my boss was rude, I got a parking ticket”, completely forgetting you finished a big project, got a free gift voucher, and your partner made a beautiful dinner.']]),
   L('w2a0', 'Activity: Start your proof portfolio', '', 'Add your first piece of proof, then have a look around the proof part of your Becoming Book.', res=['proof']),
   L('w2l4', 'Lesson 4: Beliefs', 'w9dta/week24limitingbeliefs.mp4', '❤️ Before you begin: your wellbeing comes first.\n\nThese questions may bring up difficult memories or emotions. You don’t need to revisit, describe or share traumatic experiences to benefit from this. Keep things at a level that feels manageable, skip any question, or stop altogether. There’s nothing to prove by pushing through distress.\n\nThis program offers education, coaching and self-reflection. It is not therapy, trauma treatment or a substitute for personalised mental health care.\n\nIf you feel overwhelmed, disconnected or unsafe, pause. Look around, notice your surroundings, feel your feet on the floor, and reach out to someone you trust.\n\nIf you have thoughts of self-harm or suicide, stop and get support straight away. In Australia, call Lifeline on 13 11 14 (24/7) or text 0477 13 11 14. If you’re in immediate danger, call 000. Outside Australia, contact your local crisis line or emergency number. Program messages are not a crisis service, so please don’t wait for a reply from me to get help.', prompts=[
     ['Childhood conditioning: what sort of behaviour was or wasn’t modelled to you growing up?', 'Money, confidence, self-worth, love, communication, values, behaviour. What do you catch yourself thinking or doing and wonder why? Likely you picked it up from what was modelled to you.'],
     ['Reflect on the significant people you looked up to or grew up around. What behaviours did they pass to you? What was their upbringing like?', 'This isn’t about blame. They likely did the best they could with the resources they had. Just notice, note it down and leave it be for now.'],
     ['What limiting beliefs have you collected over your life from past “trauma”, negative memories or labels given to you?', 'Go gentle here. You don’t need to go to the depths of anything that doesn’t feel safe. Examples: “I’m not a confident person.” “Travelling isn’t safe.” “I’m socially awkward because I’m autistic.” “I’m ADHD, so I can’t focus.” Each of these is a choice of belief, and there are empowering ones you can hold instead.']]),
   L('w2l5', 'Lesson 5: Programs', 'y7bph/week25programs.mp4', 'Open Breaking Out of Your Box (it used to be called the Program Decoder) in the activity after this lesson.', prompts=[], res=['box']),
   L('w2a1', 'Activity: Breaking Out of Your Box', '', 'Open Breaking Out of Your Box below. Your answers save to your account automatically.', prompts=[], res=['box']),
   L('w2l6', 'Lesson 6: Thoughts + Feelings + Actions = Reality', 'wd6cb/week26thoughtsfeelingsactions.mp4', 'Map this across every area of your life: business or career, relationships, health, wealth, self-care. All of it.', prompts=[
     ['What do you not like about your reality right now? (Make a big list)', 'Example: I hate all the blackheads I have.'],
     ['What am I currently doing (thoughts, feelings, actions) that is contributing to the reality I don’t want?', 'Example: I’m not putting effort into my skincare routine. I’d need to wash my face twice a day.'],
     ['What small action can I take toward the reality I want that feels manageable right now?', 'Example: wash my face once a day to start.']]),
   L('w2q', 'Bonus: Live Q+A replay', '9qb8e/week2qa.mp4', 'A replay of this week’s live group Q+A call.', prompts=[], optional=True),
   L('w2a2', 'Embodiment: Energy Audit', 'qhgio/energyaudit.mp4', 'Week 1: track your energy and activities for one week, so you collect data and spot patterns.\n\nWeek 2: look at the patterns, find your likely energy lows and highs, and plan your week to support more sustained energy.\n\nChange your state, change your life. To feel joy, put yourself in the state of joy. To break an overthinking loop, change your state. If you take one thing from this course, make it this: practise changing your state.', prompts=[]),
 ]},
 {'week': 3, 'title': 'Looking Deeper', 'res': ['ub', 'rewind'], 'lessons': [
   L('w3l0', 'Intro', 'djc52/week3intro.mp4', prompts=[]),
   L('w3l1', 'Lesson 1: Model of the World', 'k1hf6/week31modeloftheworld.mp4', 'Try stepping into the shoes of your mum, dad, siblings, partner, friends, colleagues, even people you have big negative feelings about (these work even better).'),
   L('w3l2', 'Lesson 2: Perspectives', 'ojstu/week32perspective.mp4'),
   L('w3l3', 'Lesson 3: Resources + Behaviour', 'xzn7i/week33resourcesandbehaviour.mp4', 'You can use this for everyday things too: a friend not messaging back, someone forgetting your birthday, a stranger cutting you off in traffic. Seeing that they might not have had the resources to handle it better lets you release the emotion and move on.'),
   L('w3l4', 'Lesson 4: Triggers', 'anwcp/week34triggers.mp4', 'Next time you’re emotionally triggered by what someone says or does, notice: it says more about the bullets in your gun than about the person delivering them.'),
   L('w3l5', 'Lesson 5: Perception is Projection', '6tjo1/week35perceptionisprojection.mp4', 'This might take some time to land. If you felt neutral about something, your RAS filter wouldn’t have saved it as important. So whatever annoys you is showing you a mirror worth cleaning up.'),
   L('w3l6', 'Lesson 6: Cause and Effect', 't7wxo/week36causeandeffect.mp4'),
   L('w3a1', 'Activity: The Understanding Bridge', '', 'A bridge between your perspective, their perspective, and a new understanding that lets you move forward.', res=['ub']),
   L('w3a2', 'Activity: Pause and Rewind', '', 'Reach for REWIND when you realise you reacted in a way you wish you could take back or do differently next time. Maybe you got defensive, reacted overly emotionally, or it happened so fast on autopilot you barely noticed.', res=['rewind']),
   L('w3b1', 'Bonus: Nervous System Regulation (RSD edition)', '', 'My reset steps for RSD or big-emotion moments. You don’t need a fancy device.\n\n1. Breathe 5 seconds in, 5 seconds out. Slow belly breathing, reminding your body “hey babe, we’re safe”.\n2. Sway and check in with your body. Jaw tight? Shoulders up? Consciously relax them.\n3. Hand flapping. Stimming releases energy instead of bottling it up.\n4. Left and right arm tapping.\n5. Ground yourself: lie down and let your body feel supported.\n6. Weight on your chest: a weighted blanket (or a pet!). Deep pressure helps your body feel safe.\n7. Gratitude and reality checking: I am here. I am safe. I am in control of what I do next.\n8. Reconnect with your purpose.\n9. Somatic dancing to move leftover emotion out of your body.\n10. More swaying and movement.\n\nMusic matters too. Find songs that remind you who you are. Take what works, leave what doesn’t.', optional=True),
   L('w3q', 'Bonus: Live Q+A replay', 'viqfl/week3qa.mp4', 'A replay of this week’s live group Q+A call.', prompts=[], optional=True),
 ]},
 {'week': 4, 'title': 'Emotions', 'res': ['comehome', 'blueprint'], 'lessons': [
   L('w4l1', 'Lesson 1: Association vs Disassociation', '', 'If you’re in your head, you’re dead!', prompts=[
     ['Where in your life have you been, or are you, disassociating?', 'When are you disconnecting from the reality around you and living in your head, in your thoughts?']]),
   L('w4a1', 'Activity: Coming Home (into your body)', '', 'For when you’re stuck in your head, overthinking, ruminating, or halfway down the dark doom hole, and you want to come back to the land of the living. Including what to do in a meltdown or a fight-or-flight amygdala hijack.\n\nThis is an experiment, not homework. Try things, keep what feels good, ditch what doesn’t.', prompts=[], res=['comehome']),
   L('w4l2', 'Lesson 2: Emotions', '', 'The other end of the spectrum: we also suppress excitement, happiness and joy out of fear of being too much, too loud or too dramatic. We’re taught to stay small.', prompts=[
     ['What moments in your life did you suppress an emotion because it wasn’t okay to express it out loud?', 'Anger, sadness, fear, hurt, guilt, shame and grief are the big 7 we tend to suppress.']]),
   L('w4a2', 'Activity: What am I feeling?', '', 'Do this one before Lesson 4.', prompts=[]),
   L('w4l3', 'Lesson 3: Meltdowns', '', '', prompts=[
     ['What are the key signs you’re weeks, days, hours or minutes away from a meltdown?', 'Becoming aware helps you, and the people who love you, release the emotions before the unplanned, potentially messy explosion.'],
     ['What do you need to be doing regularly to avoid meltdowns?', '']]),
   L('w4l4', 'Lesson 4: Processing Emotions', '', 'Stop: before you start this, complete the What am I feeling? activity first.', prompts=[]),
   L('w4a3', 'Activity: Emotional Blueprint', '', 'Map your emotional patterns and start rewriting them.', prompts=[], res=['blueprint']),
 ]},
 {'week': 5, 'title': 'Coming soon', 'res': [], 'lessons': []},
 {'week': 6, 'title': 'Coming soon', 'res': [], 'lessons': []},
 {'week': 7, 'title': 'Coming soon', 'res': ['star'], 'lessons': []},
 {'week': 8, 'title': 'Coming soon', 'res': [], 'lessons': []},
]
open('src/course-outline.json', 'w', encoding='utf-8').write(json.dumps({'weeks': weeks}, ensure_ascii=False, indent=1))
print('wrote src/course-outline.json:', sum(len(w['lessons']) for w in weeks), 'lessons')
