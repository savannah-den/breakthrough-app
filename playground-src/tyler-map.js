// Playground example: Tyler's back-of-house map, built from his discovery call (20 Oct), Session 1 (5 Nov)
// and what he's written in the app so far. On the live app, "Build the map" makes this with AI from his real data.
window.BT_TYLER_MAP = {
  made: '2026-11-05T03:00:00.000Z', by: 'ai',
  summary: 'Tyler’s beliefs circle one fear: if people really saw him, they’d judge or reject him, so he holds back, overthinks and stays busy alone. Underneath sits “I’m not enough as I am”, and every time he hesitates he collects more proof that he’s “lazy”.',
  themes: ['Connection', 'Social anxiety', 'Perfectionism', 'Procrastination', 'Self-worth', 'Logic-led (Ad)'],
  sources: ['call · Discovery call · 20 Oct 2026', 'call · Session 1 · 5 Nov 2026', 'app · Becoming Notebook (Week 1)', 'app · North Star + intentions', 'app · Set yourself up for success'],
  manual: [], hidden: [],
  beliefs: [
    { id: 'b1', text: 'People will judge or reject me', theme: 'Connection', strength: 5, root: 'safe',
      how: 'Holds back from strangers and keeps work chats short, then replays every interaction afterwards.',
      items: [
        { type: 'memory', text: 'Bullied at school after the family’s autism diagnoses became known in a small town; homeschooled for four years.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'memory', text: 'An anonymous complaint at work has made him more careful in social situations.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'emotion', core: 'fear', feel: 'Anxious', text: 'Fear of judgment, rejection and being misunderstood', quote: 'Fear of judgment, rejection, getting a negative reputation, fear of being misunderstood.', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'proof', text: 'Ends conversations early and judges himself harshly after.', quote: 'Moving too quickly at work, ending conversations early… Judging myself harshly after an interaction.', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'proof', text: 'Worries whether his face matched the feeling he meant to show.', quote: 'Stressing whether my face matched the feeling I was trying to display.', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'self', text: 'Wants to talk more deeply with strangers and go beyond small talk at work.', quote: '', src: 'call', told: true, where: 'Discovery call · 20 Oct' },
        { type: 'counter', text: 'Gave an emotional speech as man of honour at his sister’s wedding, and it gave him the confidence to join a course.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'counter', text: 'Asked a vulnerable question in front of a room at a recent workshop Q&A.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'concept', text: 'Weeks 2 and 3: reframing situations and understanding how others see things (the Understanding Bridge).', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' }
      ] },
    { id: 'b2', text: 'I’m lazy and pathetic, I waste so much time', theme: 'Procrastination', strength: 4, root: 'capable',
      how: 'Calls himself lazy when fatigue and overthinking stop him starting, especially at home where there’s no system.',
      items: [
        { type: 'self', text: 'His own words about himself.', quote: 'I am lazy and pathetic I waste so much time', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'proof', text: 'Puts off learning to cook and other personal goals.', quote: '', src: 'call', told: true, where: 'Discovery call · 20 Oct' },
        { type: 'proof', text: 'Takeaway, chocolate, doom scrolling and binge watching when depleted.', quote: '', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 4' },
        { type: 'emotion', core: 'other', feel: 'Fatigue', text: 'Fatigue', quote: 'maybe fatigue', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 3' },
        { type: 'counter', text: 'Finished the whole set-up mini course in one day and ticked his first full DOSE.', quote: '', src: 'app', told: false, where: 'App · progress · 1–4 Nov' },
        { type: 'counter', text: 'Wants his friend Steven to check in weekly, so he isn’t “disappearing all the time”.', quote: 'I would have more time to connect with you rather than disappearing all the time.', src: 'app', told: false, where: 'App · Set yourself up for success · Accountability' },
        { type: 'concept', text: 'Toward driver: link cooking to the connection and partner he wants.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'concept', text: 'Good, better, best for perfectionism and decisions.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' }
      ] },
    { id: 'b3', text: 'I’m not good enough', theme: 'Self-worth', strength: 4, root: 'good',
      how: 'Second-guesses himself even after thinking things through, and doubts the bigger future he wants.',
      items: [
        { type: 'self', text: 'Listed in his limiting beliefs.', quote: 'I’m not good enough', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'emotion', core: 'shame', feel: 'Inadequate', text: 'Self doubt, lack of competence', quote: 'Loneliness, people pleasing, lack of competence, self doubt', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'proof', text: 'Second-guesses himself after he’s already thought it through.', quote: 'Second guessing myself after I have thought it through thoroughly.', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'self', text: 'Sceptical he could really have exponential growth in five years.', quote: '', src: 'call', told: true, where: 'Discovery call · 20 Oct' },
        { type: 'counter', text: 'Chose “Bold” as his anchor word.', quote: 'Bold', src: 'app', told: false, where: 'App · Intentions' },
        { type: 'concept', text: 'Proof portfolio (Week 2): his workshop question is first proof to add.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' }
      ] },
    { id: 'b4', text: 'I’m too different, I can be too much', theme: 'Belonging', strength: 3, root: 'loved',
      how: 'Grew up feeling treated differently; still wants to be met by standard expectations, not special treatment.',
      items: [
        { type: 'self', text: 'His own words.', quote: 'I can be too much… I am too different', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'memory', text: 'Treated differently at school because of autism; went from shame to embracing his differences.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'emotion', core: 'shame', feel: 'Self-conscious', text: 'Shame (earlier), now more acceptance', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'counter', text: 'Wants to live authentically with people who love him as he is.', quote: 'I want to live truly authentically and be connected to people around me who love me as I am.', src: 'app', told: false, where: 'App · North Star' },
        { type: 'concept', text: 'Neurodivergence isn’t the problem, the conditioning layered on top is.', quote: '', src: 'call', told: true, where: 'Discovery call · 20 Oct' }
      ] },
    { id: 'b5', text: 'I’m unworthy of finding love', theme: 'Love', strength: 3, root: 'worthy',
      how: 'Wants a partner and deeper connection but doubts he’s attractive or worthy of love coming back to him.',
      items: [
        { type: 'self', text: 'His own words.', quote: 'I am not attractive… I am unworthy of finding love', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'self', text: 'Talked about feeling unworthy of receiving love in return.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'emotion', core: 'sadness', feel: 'Lonely', text: 'Loneliness', quote: 'Loneliness', src: 'app', told: false, where: 'App · Becoming Notebook · Week 1 Lesson 2' },
        { type: 'counter', text: 'Close with his dad, sister and best friend; now co-owns a home with his dad as equals.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' },
        { type: 'concept', text: 'Self-love first: it changes who he attracts.', quote: '', src: 'call', told: true, where: 'Session 1 · 5 Nov' }
      ] }
  ],
  emotions: [
    { core: 'fear', feel: 'Anxious', text: 'Fear of judgment', src: 'app', told: false, where: 'App · Notebook' }, { core: 'sadness', feel: 'Lonely', text: 'Loneliness', src: 'app', told: false, where: 'App · Notebook' },
    { core: 'shame', feel: 'Inadequate', text: 'Self doubt', src: 'app', told: false, where: 'App · Notebook' }, { core: 'other', feel: 'Fatigue', text: 'Fatigue', src: 'app', told: false, where: 'App · Notebook' },
    { core: 'shame', feel: 'Embarrassed', text: 'Shame (school years)', src: 'call', told: true, where: 'Session 1' }, { core: 'grief', feel: 'Gratitude', text: 'Gratitude (memories of his mum)', src: 'call', told: true, where: 'Session 1' }
  ]
};
