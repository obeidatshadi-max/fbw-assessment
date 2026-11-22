// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// Discussion cards for facilitator/workshop mode (Prompt 7). Keyed by the
// same "high-low" pair computeImbalance() (src/lib/teamScoring.js,
// Prompt 5) already produces from a session's aggregated distribution,
// plus 'balanced' for a null (no strong imbalance) result. 4 short,
// simple-English prompts per key — a facilitator reads these aloud to
// the room, not a script to follow word-for-word.
export const DISCUSSION_CARDS = {
  'F-W': [
    { en: 'This group gets things done. When did you recently avoid a hard decision?', ar: 'هذه المجموعة تنجز جيداً. أين تراجعت شخصياً عن اتخاذ قرار صعب مؤخراً؟' },
    { en: 'Think of a decision you avoided because it felt risky. What was the actual risk?', ar: 'فكّر بقرار تجنبته لأنه بدا محفوفاً بالمخاطر. ما هي المخاطرة الفعلية؟' },
    { en: 'What would change if "good enough" stopped being the safe choice here?', ar: 'ماذا سيتغير لو توقف "الجيد بما يكفي" عن كونه الخيار الآمن هنا؟' },
    { en: 'Name one thing this team keeps delaying until "next quarter."', ar: 'اذكر أمراً واحداً يواصل هذا الفريق تأجيله إلى "الربع القادم".' },
  ],
  'F-B': [
    { en: 'We are strong on getting things done. When did you last really listen without planning your reply?', ar: 'نحن أقوياء في إنجاز الأمور. متى كانت آخر مرة استمعت فيها حقاً دون التخطيط لردك؟' },
    { en: 'Think of a colleague you know less than you should. What is one question you could ask them this week?', ar: 'فكّر بزميل تعرفه أقل مما ينبغي. ما هو سؤال واحد يمكنك طرحه عليه هذا الأسبوع؟' },
    { en: 'Where does "busy" get used as an excuse to skip a real conversation here?', ar: 'أين تُستخدم كلمة "مشغول" هنا كعذر لتجنب محادثة حقيقية؟' },
    { en: 'What would it look like to slow down for five minutes in your next meeting?', ar: 'كيف سيبدو التمهل لخمس دقائق في اجتماعك القادم؟' },
  ],
  'B-F': [
    { en: 'This room connects well. What is one task everyone agrees on but nobody has finished?', ar: 'هذه المجموعة تتواصل جيداً. ما هي مهمة واحدة يتفق عليها الجميع لكن لم ينهها أحد؟' },
    { en: 'Where do good conversations here not turn into clear next steps?', ar: 'أين لا تتحول المحادثات الجيدة هنا إلى خطوات تالية واضحة؟' },
    { en: 'Name one small promise you can complete by next week.', ar: 'اذكر التزاماً صغيراً واحداً يمكنك إنجازه بحلول الأسبوع القادم.' },
    { en: 'What gets in the way of turning agreement into action here?', ar: 'ما الذي يعيق تحويل الاتفاق إلى فعل هنا؟' },
  ],
  'B-W': [
    { en: 'People here read each other well. What is a hard truth this team avoids saying out loud?', ar: 'الأشخاص هنا يفهمون بعضهم جيداً. ما هي الحقيقة الصعبة التي يتجنب هذا الفريق قولها بصوت مسموع؟' },
    { en: 'Think of a disagreement you covered up instead of solving. What did that cost?', ar: 'فكّر بخلاف قمت بتلطيفه بدلاً من حله. ما الذي كلّفه ذلك؟' },
    { en: 'What would it take for this room to disagree openly and still stay close?', ar: 'ما الذي يتطلبه أن تختلف هذه المجموعة علناً وتبقى مترابطة؟' },
    { en: 'Name one boundary you have not set that you need to.', ar: 'اذكر حداً واحداً لم تضعه بعد وتحتاج إلى وضعه.' },
  ],
  'W-F': [
    { en: 'This group does not give up easily. Where does your courage move faster than your plan?', ar: 'هذه المجموعة لا تتراجع. أين تسبق هذه الشجاعة الخطة التي تدعمها؟' },
    { en: 'Think of a bold decision that was not followed by enough action. What was missing?', ar: 'فكّر بقرار جريء لم يحظَ بالمتابعة المناسبة. ما الذي كان ناقصاً؟' },
    { en: 'What is one place where more structure would make your courage go further?', ar: 'أين يمكن لمزيد من التنظيم أن يجعل شجاعتك أكثر فاعلية؟' },
    { en: 'Name a commitment made here that still needs a concrete next step.', ar: 'اذكر التزاماً تم هنا وما زال يحتاج إلى خطوة تالية ملموسة.' },
  ],
  'W-B': [
    { en: 'This team pushes hard. Who might feel left behind, not moved forward?', ar: 'هذا الفريق يدفع بقوة. من قد يشعر بأنه دُفع بعيداً، لا فقط إلى الأمام؟' },
    { en: 'Think of a time you were right, but people still felt hurt afterward. What happened?', ar: 'فكّر بلحظة كنت فيها محقاً لكن المجموعة شعرت بالأذى بعدها. ماذا حدث؟' },
    { en: 'Next time you take a hard position, how could you also check in honestly with people?', ar: 'كيف سيبدو أن تقرن موقفك الصعب القادم بلقاء صادق واحد؟' },
    { en: 'Name someone here you have not really checked on lately.', ar: 'اذكر شخصاً هنا لم تطمئن عليه فعلاً مؤخراً.' },
  ],
  balanced: [
    { en: 'No single style leads in this group. Where is that a strength? Where might it make it unclear who is responsible?', ar: 'لا يهيمن نمط واحد على هذه المجموعة — أين تكمن قوة ذلك، وأين قد يُضعف وضوح المسؤولية؟' },
    { en: 'When the group needs to move fast, who usually steps up? Is that planned, or does it just happen?', ar: 'حين تحتاج المجموعة للتحرك بسرعة، من يتقدم عادة؟ هل ذلك بتصميم أم بحكم العادة؟' },
    { en: 'What is one decision this group made recently that used all three — planning, people, and courage?', ar: 'ما هو قرار اتخذته هذه المجموعة مؤخراً واستخدم الثلاثة معاً — التخطيط والناس والشجاعة؟' },
    { en: 'If the workload doubled tomorrow, where could this balance break?', ar: 'أين قد يختل هذا التوازن لو تضاعف حجم العمل غداً؟' },
  ],
};

export function getDiscussionCardKey(imbalance) {
  return imbalance ? `${imbalance.high}-${imbalance.low}` : 'balanced';
}
