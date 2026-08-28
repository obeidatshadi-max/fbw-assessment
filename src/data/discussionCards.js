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
    { en: 'This room delivers. Where have you personally held back from a hard call recently?', ar: 'هذه المجموعة تنجز جيداً. أين تراجعت شخصياً عن اتخاذ قرار صعب مؤخراً؟' },
    { en: 'Think of a decision you avoided because it felt risky. What was the actual risk?', ar: 'فكّر بقرار تجنبته لأنه بدا محفوفاً بالمخاطر. ما هي المخاطرة الفعلية؟' },
    { en: 'What would change if "good enough" stopped being the safe choice here?', ar: 'ماذا سيتغير لو توقف "الجيد بما يكفي" عن كونه الخيار الآمن هنا؟' },
    { en: 'Name one thing this team keeps deferring to "next quarter."', ar: 'اذكر أمراً واحداً يواصل هذا الفريق تأجيله إلى "الربع القادم".' },
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
    { en: 'Name one small commitment you can close out by next week.', ar: 'اذكر التزاماً صغيراً واحداً يمكنك إنجازه بحلول الأسبوع القادم.' },
    { en: 'What gets in the way of turning agreement into action here?', ar: 'ما الذي يعيق تحويل الاتفاق إلى فعل هنا؟' },
  ],
  'B-W': [
    { en: 'People here read each other well. What is a hard truth this team avoids saying out loud?', ar: 'الأشخاص هنا يفهمون بعضهم جيداً. ما هي الحقيقة الصعبة التي يتجنب هذا الفريق قولها بصوت مسموع؟' },
    { en: 'Think of a disagreement you smoothed over instead of resolving. What did that cost?', ar: 'فكّر بخلاف قمت بتلطيفه بدلاً من حله. ما الذي كلّفه ذلك؟' },
    { en: 'What would it take for this room to disagree openly and still stay close?', ar: 'ما الذي يتطلبه أن تختلف هذه المجموعة علناً وتبقى مترابطة؟' },
    { en: 'Name one boundary you have not set that you need to.', ar: 'اذكر حداً واحداً لم تضعه بعد وتحتاج إلى وضعه.' },
  ],
  'W-F': [
    { en: 'This room does not back down. Where does that courage outrun the plan behind it?', ar: 'هذه المجموعة لا تتراجع. أين تسبق هذه الشجاعة الخطة التي تدعمها؟' },
    { en: 'Think of a bold call that did not have the follow-through to match. What was missing?', ar: 'فكّر بقرار جريء لم يحظَ بالمتابعة المناسبة. ما الذي كان ناقصاً؟' },
    { en: 'What is one place where more structure would make your courage go further?', ar: 'أين يمكن لمزيد من التنظيم أن يجعل شجاعتك أكثر فاعلية؟' },
    { en: 'Name a commitment made here that still needs a concrete next step.', ar: 'اذكر التزاماً تم هنا وما زال يحتاج إلى خطوة تالية ملموسة.' },
  ],
  'W-B': [
    { en: 'This team pushes hard. Who might feel pushed past, not just forward?', ar: 'هذا الفريق يدفع بقوة. من قد يشعر بأنه دُفع بعيداً، لا فقط إلى الأمام؟' },
    { en: 'Think of a moment you were right but the room still felt bruised afterward. What happened?', ar: 'فكّر بلحظة كنت فيها محقاً لكن المجموعة شعرت بالأذى بعدها. ماذا حدث؟' },
    { en: 'What would it look like to pair your next hard stand with one honest check-in?', ar: 'كيف سيبدو أن تقرن موقفك الصعب القادم بلقاء صادق واحد؟' },
    { en: 'Name someone here you have not really checked on lately.', ar: 'اذكر شخصاً هنا لم تطمئن عليه فعلاً مؤخراً.' },
  ],
  balanced: [
    { en: 'No single pattern dominates this room — where is that a strength, and where might it blur ownership?', ar: 'لا يهيمن نمط واحد على هذه المجموعة — أين تكمن قوة ذلك، وأين قد يُضعف وضوح المسؤولية؟' },
    { en: 'When the room needs to move fast, who normally steps up? Is that by design or by default?', ar: 'حين تحتاج المجموعة للتحرك بسرعة، من يتقدم عادة؟ هل ذلك بتصميم أم بحكم العادة؟' },
    { en: 'What is one decision this group made recently that used all three — planning, people, and courage?', ar: 'ما هو قرار اتخذته هذه المجموعة مؤخراً واستخدم الثلاثة معاً — التخطيط والناس والشجاعة؟' },
    { en: 'Where could this balance tip if the workload doubled tomorrow?', ar: 'أين قد يختل هذا التوازن لو تضاعف حجم العمل غداً؟' },
  ],
};

export function getDiscussionCardKey(imbalance) {
  return imbalance ? `${imbalance.high}-${imbalance.low}` : 'balanced';
}
