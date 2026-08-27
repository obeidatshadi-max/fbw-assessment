// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// Parallel Likert version of ORG_ITEMS/COMPLIANCE_ITEMS, answered by a rater
// ABOUT the leader instead of about the workplace. Same 1-3 (Rarely/
// Sometimes/Often) scale, 3 items per dimension so scoring/normalization
// stays consistent with the rest of the app. "C" = compliance courage.

export const RATER_ITEMS = [
  { t: { en: 'Gets things done reliably, even under pressure.', ar: 'ينجز المهام بشكل موثوق حتى تحت الضغط.' }, d: 'F' },
  { t: { en: 'Delivers high-quality work.', ar: 'يقدّم عملاً بجودة عالية.' }, d: 'F' },
  { t: { en: 'Follows through on commitments.', ar: 'يفي بالتزاماته.' }, d: 'F' },
  { t: { en: 'Is genuine and consistent — the same person in different situations.', ar: 'صادق ومتّسق — الشخص نفسه في مواقف مختلفة.' }, d: 'B' },
  { t: { en: 'Makes people feel respected and heard.', ar: 'يجعل الآخرين يشعرون بالاحترام والاستماع إليهم.' }, d: 'B' },
  { t: { en: 'Builds trust with the people around them.', ar: 'يبني الثقة مع من حوله.' }, d: 'B' },
  { t: { en: 'Takes initiative without being asked.', ar: 'يبادر دون أن يُطلب منه ذلك.' }, d: 'W' },
  { t: { en: 'Stays committed to goals even when things get hard.', ar: 'يبقى ملتزماً بالأهداف حتى عندما تصعب الأمور.' }, d: 'W' },
  { t: { en: 'Makes brave decisions when it matters.', ar: 'يتخذ قرارات جريئة عند الحاجة.' }, d: 'W' },
  { t: { en: 'Speaks up about questionable behavior, even when it is uncomfortable.', ar: 'يتحدث بصراحة عن السلوك المشكوك فيه حتى عندما يكون ذلك غير مريح.' }, d: 'C' },
  { t: { en: 'Reports problems honestly instead of hiding them.', ar: 'يبلّغ عن المشكلات بصدق بدلاً من إخفائها.' }, d: 'C' },
  { t: { en: 'Holds the line on doing things the right way, even under pressure to cut corners.', ar: 'يتمسك بفعل الأمور بالطريقة الصحيحة حتى تحت ضغط الاختصار.' }, d: 'C' },
];
