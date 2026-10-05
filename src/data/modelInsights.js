// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// Report copy drawn from the "Anatomy: Function · Being · Will" course deck
// (Part 04). Self-report scores are ipsative (forced-choice, sum to 15), so
// nothing here claims an absolute High/Low level — everything is keyed by
// the person's *least-used* dimension (developArea), which the ipsative
// ranking does support. Archetype names are deliberately NOT used here; they
// need absolute scores and live in archetypes.js (360-only).
//
// Entries marked "derived" are not on the slides verbatim — the deck gives no
// example for that combination, so the line was written to match the
// adjacent slide content. Review those first.

// Deck slides 26/40 "Pair two / Remove one", keyed by developArea: the two
// dimensions the person leans on are the other two.
export const PAIRING = {
  W: {
    pair: { en: 'Function + Being → a good manager.', ar: 'الوظيفة + الكينونة ← مدير جيد.' },
    missing: { en: 'When Will is under-used: stability without direction.', ar: 'حين تقلّ الإرادة: استقرار بلا اتجاه.' },
  },
  B: {
    pair: { en: 'Function + Will → a strong performer.', ar: 'الوظيفة + الإرادة ← مؤدٍّ قوي.' },
    missing: { en: 'When Being is under-used: results with instability.', ar: 'حين تقلّ الكينونة: نتائج مع عدم استقرار.' },
  },
  F: {
    pair: { en: 'Being + Will → an inspirational figure.', ar: 'الكينونة + الإرادة ← شخصية مُلهِمة.' },
    missing: { en: 'When Function is under-used: good intentions, poor results.', ar: 'حين تقلّ الوظيفة: نوايا حسنة ونتائج ضعيفة.' },
  },
};

export const PAIRING_ALL = {
  en: 'Function + Being + Will together → the transformational leader: understands, decides, and acts.',
  ar: 'الوظيفة + الكينونة + الإرادة معاً ← القائد التحويلي: يفهم، ويقرر، ويتصرف.',
};

// Deck slides 24/38 "Sales fall 30%". F and B entries are from the slide;
// the W entry is derived (slide 22: "stable and trusted, but waits for direction").
export const CRISIS = {
  B: {
    reflex: { en: '"Who caused this? We need action now!"', ar: '"من تسبب في هذا؟ نحتاج إلى تحرك الآن!"' },
    team: { en: 'Fear and blame. Short-term recovery, long-term damage.', ar: 'خوف ولوم. تعافٍ قصير المدى، وضرر طويل المدى.' },
  },
  F: {
    reflex: { en: '"We can overcome this together."', ar: '"نستطيع تجاوز هذا معاً."' },
    team: { en: 'Morale holds, but there is no real plan. Execution stalls.', ar: 'تصمد المعنويات، لكن لا توجد خطة حقيقية. يتعثر التنفيذ.' },
  },
  W: {
    reflex: { en: '"Let\'s analyse this carefully and wait for a clear direction."', ar: '"لنحلل الأمر بعناية وننتظر توجيهاً واضحاً."' },
    team: { en: 'The team stays calm and trusts you, but the response is slow.', ar: 'يبقى الفريق هادئاً ويثق بك، لكن الاستجابة بطيئة.' },
  },
};

export const CRISIS_FULL = {
  reflex: { en: '"Let\'s understand the causes, involve the team, build options, and move fast."', ar: '"لنفهم الأسباب، ونُشرك الفريق، ونبني الخيارات، ونتحرك بسرعة."' },
  team: { en: 'Trust and confidence rise.', ar: 'ترتفع الثقة والاطمئنان.' },
};

// Deck slides 25/39 "Two more pressure tests". B and W are from the slide;
// F entries are derived (slide 35: "poor execution, over-promises").
export const FEEDBACK_RISK = {
  B: { en: '"You don\'t understand the situation." — defending instead of listening.', ar: '"أنت لا تفهم الموقف." — الدفاع بدلاً من الإصغاء.' },
  W: { en: '"You may be right…" — and then nothing changes. Reflection without action.', ar: '"قد تكون محقاً…" — ثم لا يتغير شيء. تأمل بلا فعل.' },
  F: { en: '"I will fix it." — agreeing warmly, without a concrete plan for what will change.', ar: '"سأصلح ذلك." — موافقة ودودة، دون خطة ملموسة لما سيتغير.' },
};

export const FEEDBACK_MATURE = {
  en: '"Tell me more. What can I learn?"',
  ar: '"أخبرني المزيد. ماذا يمكنني أن أتعلم؟"',
};

export const CHANGE_RISK = {
  B: { en: 'You may push too hard, create resistance, and read disagreement as disloyalty.', ar: 'قد تدفع بقوة مفرطة، وتخلق مقاومة، وتفسّر الاختلاف على أنه عدم ولاء.' },
  W: { en: 'You may empathise with everyone and avoid the hard call — the change quietly stalls.', ar: 'قد تتعاطف مع الجميع وتتجنب القرار الصعب — فيتوقف التغيير بهدوء.' },
  F: { en: 'You may build energy for the change while the plan and milestones lag behind — and over-promise.', ar: 'قد تبني الحماس للتغيير بينما تتأخر الخطة والمراحل — وقد تَعِد بأكثر مما يتحقق.' },
};

export const CHANGE_BALANCE = {
  en: 'High Will needs Being to bring people along. High Being needs Will to make the call.',
  ar: 'الإرادة العالية تحتاج الكينونة لتأخذ الناس معها. والكينونة العالية تحتاج الإرادة لاتخاذ القرار.',
};

// Strength activation for the DOMINANT dimension: where to use it on purpose.
// Grounded in each dimension's "Remember" line on deck slides 19-21.
export const ACTIVATION = {
  F: [
    { en: 'Use your delivery strength to free up time for people — Function is the entry ticket, not the destination.', ar: 'استخدم قوتك في الإنجاز لتوفير وقت للناس — الوظيفة هي تذكرة الدخول، لا الوجهة النهائية.' },
    { en: 'Turn your know-how into a simple method others can use, so your impact grows beyond your own work.', ar: 'حوّل خبرتك إلى طريقة بسيطة يستخدمها الآخرون، ليمتد أثرك أبعد من عملك الشخصي.' },
  ],
  B: [
    { en: 'Use your calm on purpose in the hardest moments — be the steady voice in a tense meeting.', ar: 'استخدم هدوءك عن قصد في أصعب اللحظات — كن الصوت الثابت في الاجتماع المتوتر.' },
    { en: 'People follow Being first — so point the trust you build toward one clear goal.', ar: 'يتبع الناس الكينونة أولاً — فوجّه الثقة التي تبنيها نحو هدف واحد واضح.' },
  ],
  W: [
    { en: 'Give your drive a named destination: say what you are building and why, so others can join.', ar: 'امنح دافعك وجهة واضحة: قل ما الذي تبنيه ولماذا، ليتمكن الآخرون من الانضمام.' },
    { en: 'Use your courage for one hard call each month — made with the team, not over them.', ar: 'استخدم شجاعتك في قرار صعب واحد كل شهر — تتخذه مع الفريق، لا فوقه.' },
  ],
};

// Deck slides 19-21 "Fast diagnostic questions", rephrased to second person
// for a manager-and-person conversation.
export const DIAGNOSTIC_QUESTIONS = {
  F: [
    { en: 'Where are you fully able to do the job today, and where not yet?', ar: 'أين تستطيع أداء العمل بالكامل اليوم، وأين ليس بعد؟' },
    { en: 'Which complex problem did you solve recently, and how?', ar: 'ما المشكلة المعقدة التي حللتها مؤخراً، وكيف؟' },
    { en: 'Where does your execution slip from consistent to occasional?', ar: 'أين يتحول تنفيذك من ثابت إلى متقطع؟' },
  ],
  B: [
    { en: 'How do you behave under pressure — what would your team say?', ar: 'كيف تتصرف تحت الضغط — ماذا سيقول فريقك؟' },
    { en: 'How did you handle the last criticism you received?', ar: 'كيف تعاملت مع آخر انتقاد تلقيته؟' },
    { en: 'Do people trust you — and how do you know?', ar: 'هل يثق بك الناس — وكيف تعرف ذلك؟' },
  ],
  W: [
    { en: 'What truly drives you at work?', ar: 'ما الذي يحركك حقاً في العمل؟' },
    { en: 'What are you trying to build?', ar: 'ما الذي تحاول أن تبنيه؟' },
    { en: 'What are you willing to sacrifice for it?', ar: 'ما الذي أنت مستعد للتضحية به من أجله؟' },
  ],
};
