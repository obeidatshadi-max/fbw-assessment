// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// The eight Function · Being · Will archetypes from the course deck's
// "Diagnostic Grid" (slide 35 naming, chosen by Shadi). Keyed by a High/Low
// code in F-B-W order, e.g. "HLH" = High Function, Low Being, High Will.
// `sentence` is only set where the deck's "four you will meet most often"
// slide gives one; the deck's "Sage" (B↑ F~ W↓) has no High/Low code and is
// therefore not mapped.
//
// Only shown from 360 rater scores (absolute Likert), never from the
// ipsative self-score — see lib/archetype.js.
export const ARCHETYPES = {
  HHH: {
    name: { en: 'Transformational Leader', ar: 'القائد التحويلي' },
    sentence: { en: '"Understand, decide, act."', ar: '"افهم، قرّر، تصرّف."' },
    strength: { en: 'Inspires, executes, develops others', ar: 'يُلهم، وينفّذ، ويطوّر الآخرين' },
    shadow: { en: 'Can overextend', ar: 'قد يُجهد نفسه أكثر من طاقته' },
    develop: { en: 'Sustain & mentor others', ar: 'الاستدامة وتوجيه الآخرين' },
  },
  HHL: {
    name: { en: 'Wise Administrator', ar: 'الإداري الحكيم' },
    strength: { en: 'Reliable, balanced, objective', ar: 'موثوق، متوازن، موضوعي' },
    shadow: { en: 'Avoids major change', ar: 'يتجنب التغيير الكبير' },
    develop: { en: 'Purpose & vision', ar: 'الهدف والرؤية' },
  },
  HLH: {
    name: { en: 'Forceful Driver', ar: 'المحرّك الحازم' },
    sentence: { en: '"Let\'s win."', ar: '"لنفُز."' },
    strength: { en: 'Fast execution, strong initiative', ar: 'تنفيذ سريع، ومبادرة قوية' },
    shadow: { en: 'Burnout, politics, conflict', ar: 'الإنهاك، والصراعات السياسية، والنزاع' },
    develop: { en: 'Being', ar: 'الكينونة' },
  },
  HLL: {
    name: { en: 'Technical Expert', ar: 'الخبير التقني' },
    sentence: { en: '"I know how."', ar: '"أعرف كيف."' },
    strength: { en: 'Competent specialist', ar: 'متخصص كفء' },
    shadow: { en: 'Detached, low leadership impact', ar: 'منفصل، وأثر قيادي محدود' },
    develop: { en: 'Being & Will', ar: 'الكينونة والإرادة' },
  },
  LHH: {
    name: { en: 'Visionary Influencer', ar: 'المؤثر صاحب الرؤية' },
    strength: { en: 'Inspires, creates possibilities', ar: 'يُلهم، ويصنع الإمكانات' },
    shadow: { en: 'Poor execution, over-promises', ar: 'تنفيذ ضعيف، ووعود تفوق الواقع' },
    develop: { en: 'Function', ar: 'الوظيفة' },
  },
  LHL: {
    name: { en: 'Trusted Supporter', ar: 'الداعم الموثوق' },
    strength: { en: 'Stable, ethical, respected', ar: 'مستقر، أخلاقي، محترم' },
    shadow: { en: 'Passive, avoids responsibility', ar: 'سلبي، يتجنب المسؤولية' },
    develop: { en: 'Function & Will', ar: 'الوظيفة والإرادة' },
  },
  LLH: {
    name: { en: 'Ambitious Opportunist', ar: 'الطموح المغتنم للفرص' },
    strength: { en: 'Energetic, aggressive', ar: 'نشيط، مندفع' },
    shadow: { en: 'Ego-driven, risky decisions', ar: 'تحركه الأنا، وقرارات محفوفة بالمخاطر' },
    develop: { en: 'Being first', ar: 'الكينونة أولاً' },
  },
  LLL: {
    name: { en: 'Disengaged Manager', ar: 'المدير غير المنخرط' },
    strength: { en: 'Minimal risk, status quo', ar: 'مخاطرة دنيا، والحفاظ على الوضع القائم' },
    shadow: { en: 'Stagnation, low impact', ar: 'الركود، وأثر محدود' },
    develop: { en: 'All dimensions', ar: 'جميع الأبعاد' },
  },
};
