// REVIEW: Arabic translations below are a first draft — Shadi is the
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
      { en: 'Pick one task you repeat often. Write the exact steps as a simple checklist.', ar: 'اختر مهمة تكررها كثيراً. اكتب خطواتها الدقيقة كقائمة تحقق بسيطة.' },
      { en: 'Ask a colleague who is strong here to show you their method, once.', ar: 'اطلب من زميل بارع في هذا المجال أن يُريك طريقته، مرة واحدة.' },
    ],
    day60: [
      { en: 'Set one measurable weekly target and track it for two weeks.', ar: 'ضع هدفاً أسبوعياً قابلاً للقياس وتتبعه لأسبوعين.' },
      { en: 'Finish one task fully before starting the next, even if tempted to jump ahead.', ar: 'أنهِ مهمة كاملة قبل بدء التالية، حتى لو راودتك رغبة التنقل بينها.' },
    ],
    day90: [
      { en: 'Review your checklist. Update it based on what actually worked.', ar: 'راجع قائمة التحقق. حدّثها بناءً على ما نجح فعلاً.' },
      { en: 'Take ownership of one small project, start to finish, on your own.', ar: 'تولَّ مسؤولية مشروع صغير، من البداية للنهاية، بمفردك.' },
    ],
  },
  B: {
    day30: [
      { en: 'In one conversation this week, ask a real question and just listen — do not fix.', ar: 'في محادثة واحدة هذا الأسبوع، اطرح سؤالاً صادقاً واستمع فقط — دون أن تحاول حل المشكلة.' },
      { en: 'Notice one moment you rushed past someone\'s feelings. Just name it to yourself.', ar: 'لاحظ لحظة تجاوزت فيها مشاعر أحدهم بسرعة. سمِّها لنفسك فقط.' },
    ],
    day60: [
      { en: 'Have one honest conversation you have been avoiding — kindly and directly.', ar: 'أجرِ محادثة صادقة كنت تتجنبها — بلطف ومباشرة.' },
      { en: 'Ask someone close: "What is one thing I do that makes you feel unseen?"', ar: 'اسأل شخصاً مقرباً: "ما الشيء الذي أفعله ويجعلك تشعر بأنك غير مرئي؟"' },
    ],
    day90: [
      { en: 'Before a hard meeting, check your own state — are you grounded or reactive?', ar: 'قبل اجتماع صعب، تحقق من حالتك — هل أنت متزن أم رد فعلك متسرع؟' },
      { en: 'Make it a habit: one real, unhurried check-in with your team each week.', ar: 'اجعلها عادة: لقاء صادق وغير متسرع مع فريقك كل أسبوع.' },
    ],
  },
  W: {
    day30: [
      { en: 'Write down one goal you have been avoiding committing to. Set a date.', ar: 'اكتب هدفاً واحداً كنت تتجنب الالتزام به. حدد له موعداً.' },
      { en: 'Say one hard "yes" or "no" this week that you have been putting off.', ar: 'قل "نعم" أو "لا" صعبة هذا الأسبوع كنت تؤجلها.' },
    ],
    day60: [
      { en: 'Take one visible, courageous stand on something you believe in at work.', ar: 'اتخذ موقفاً شجاعاً وواضحاً تجاه أمر تؤمن به في العمل.' },
      { en: 'Push through one setback this month without giving up on the goal.', ar: 'تجاوز نكسة واحدة هذا الشهر دون التخلي عن الهدف.' },
    ],
    day90: [
      { en: 'Look back: where did you show real courage this quarter? Name it.', ar: 'انظر إلى الخلف: أين أظهرت شجاعة حقيقية هذا الفصل؟ سمِّها.' },
      { en: 'Set your next 90-day goal out loud, to someone who will hold you to it.', ar: 'أعلن هدفك القادم لتسعين يوماً بصوت مسموع، لشخص سيحاسبك عليه.' },
    ],
  },
};
