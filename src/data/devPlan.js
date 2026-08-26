// REVIEW: Arabic/French translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// A personalized 30/60/90-day plan (Prompt 6), keyed by dimension (F/B/W).
// buildReportData() picks DEV_PLAN[developArea] — the person's growth-edge
// dimension — so the plan always targets the source they use least, not
// whichever dimension is dominant. Each phase is 2 concrete, simple actions;
// deliberately short sentences (non-native English readers use this tool).
export const DEV_PLAN = {
  F: {
    day30: [
      { en: 'Pick one task you repeat often. Write the exact steps as a simple checklist.', ar: 'اختر مهمة تكررها كثيراً. اكتب خطواتها الدقيقة كقائمة تحقق بسيطة.', fr: 'Choisissez une tâche que vous répétez souvent. Notez les étapes exactes sous forme de liste simple.' },
      { en: 'Ask a colleague who is strong here to show you their method, once.', ar: 'اطلب من زميل بارع في هذا المجال أن يُريك طريقته، مرة واحدة.', fr: "Demandez à un collègue solide sur ce point de vous montrer sa méthode, une fois." },
    ],
    day60: [
      { en: 'Set one measurable weekly target and track it for two weeks.', ar: 'ضع هدفاً أسبوعياً قابلاً للقياس وتتبعه لأسبوعين.', fr: 'Fixez un objectif hebdomadaire mesurable et suivez-le pendant deux semaines.' },
      { en: 'Finish one task fully before starting the next, even if tempted to jump ahead.', ar: 'أنهِ مهمة كاملة قبل بدء التالية، حتى لو راودتك رغبة التنقل بينها.', fr: "Terminez une tâche complètement avant de passer à la suivante, même si vous êtes tenté de sauter en avant." },
    ],
    day90: [
      { en: 'Review your checklist. Update it based on what actually worked.', ar: 'راجع قائمة التحقق. حدّثها بناءً على ما نجح فعلاً.', fr: 'Relisez votre liste. Mettez-la à jour selon ce qui a vraiment fonctionné.' },
      { en: 'Take ownership of one small project, start to finish, on your own.', ar: 'تولَّ مسؤولية مشروع صغير، من البداية للنهاية، بمفردك.', fr: "Prenez la responsabilité d'un petit projet, du début à la fin, seul." },
    ],
  },
  B: {
    day30: [
      { en: 'In one conversation this week, ask a real question and just listen — do not fix.', ar: 'في محادثة واحدة هذا الأسبوع، اطرح سؤالاً صادقاً واستمع فقط — دون أن تحاول حل المشكلة.', fr: "Dans une conversation cette semaine, posez une vraie question et écoutez seulement — sans chercher à résoudre." },
      { en: 'Notice one moment you rushed past someone\'s feelings. Just name it to yourself.', ar: 'لاحظ لحظة تجاوزت فيها مشاعر أحدهم بسرعة. سمِّها لنفسك فقط.', fr: "Repérez un moment où vous avez ignoré les émotions de quelqu'un. Nommez-le simplement pour vous-même." },
    ],
    day60: [
      { en: 'Have one honest conversation you have been avoiding — kindly and directly.', ar: 'أجرِ محادثة صادقة كنت تتجنبها — بلطف ومباشرة.', fr: "Ayez une conversation honnête que vous évitiez — avec bienveillance et franchise." },
      { en: 'Ask someone close: "What is one thing I do that makes you feel unseen?"', ar: 'اسأل شخصاً مقرباً: "ما الشيء الذي أفعله ويجعلك تشعر بأنك غير مرئي؟"', fr: '« Demandez à un proche : "Qu\'est-ce que je fais qui te donne l\'impression de ne pas être vu ?" »' },
    ],
    day90: [
      { en: 'Before a hard meeting, check your own state — are you grounded or reactive?', ar: 'قبل اجتماع صعب، تحقق من حالتك — هل أنت متزن أم رد فعلك متسرع؟', fr: "Avant une réunion difficile, vérifiez votre état — êtes-vous ancré ou réactif ?" },
      { en: 'Make it a habit: one real, unhurried check-in with your team each week.', ar: 'اجعلها عادة: لقاء صادق وغير متسرع مع فريقك كل أسبوع.', fr: "Faites-en une habitude : un vrai temps d'échange, sans précipitation, chaque semaine avec votre équipe." },
    ],
  },
  W: {
    day30: [
      { en: 'Write down one goal you have been avoiding committing to. Set a date.', ar: 'اكتب هدفاً واحداً كنت تتجنب الالتزام به. حدد له موعداً.', fr: "Notez un objectif auquel vous évitiez de vous engager. Fixez une date." },
      { en: 'Say one hard "yes" or "no" this week that you have been putting off.', ar: 'قل "نعم" أو "لا" صعبة هذا الأسبوع كنت تؤجلها.', fr: 'Dites un « oui » ou un « non » difficile cette semaine, que vous repoussiez.' },
    ],
    day60: [
      { en: 'Take one visible, courageous stand on something you believe in at work.', ar: 'اتخذ موقفاً شجاعاً وواضحاً تجاه أمر تؤمن به في العمل.', fr: "Prenez une position visible et courageuse sur quelque chose auquel vous croyez au travail." },
      { en: 'Push through one setback this month without giving up on the goal.', ar: 'تجاوز نكسة واحدة هذا الشهر دون التخلي عن الهدف.', fr: "Traversez un revers ce mois-ci sans abandonner l'objectif." },
    ],
    day90: [
      { en: 'Look back: where did you show real courage this quarter? Name it.', ar: 'انظر إلى الخلف: أين أظهرت شجاعة حقيقية هذا الفصل؟ سمِّها.', fr: "Regardez en arrière : où avez-vous montré un vrai courage ce trimestre ? Nommez-le." },
      { en: 'Set your next 90-day goal out loud, to someone who will hold you to it.', ar: 'أعلن هدفك القادم لتسعين يوماً بصوت مسموع، لشخص سيحاسبك عليه.', fr: "Annoncez votre prochain objectif à 90 jours à voix haute, à quelqu'un qui vous tiendra responsable." },
    ],
  },
};
