// REVIEW: Arabic/French translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// A one-page "manager debrief guide" (Prompt 6): questions a line manager
// can use to discuss the report with the person, not a script to follow
// word-for-word. {dominant} and {developArea} are interpolated at render
// time (see ReportScreen.jsx) with the person's actual dimension labels via
// interpolate() from i18n/translations.js — same {placeholder} mechanism as
// the UI dictionary's tf().
export const MANAGER_DEBRIEF_QUESTIONS = [
  { en: 'Does your {dominant} profile feel accurate to you? Give one recent example.', ar: 'هل يبدو ملفك في {dominant} دقيقاً بالنسبة لك؟ أعطِ مثالاً حديثاً واحداً.', fr: 'Votre profil {dominant} vous semble-t-il exact ? Donnez un exemple récent.' },
  { en: 'Tell me about a moment where using {developArea} more would have helped.', ar: 'حدّثني عن لحظة كان استخدام {developArea} أكثر سيساعد فيها.', fr: "Racontez-moi un moment où utiliser davantage {developArea} aurait aidé." },
  { en: 'What gets in the way of using {developArea} — skill, confidence, or the environment?', ar: 'ما الذي يعيق استخدام {developArea} — المهارة، أم الثقة، أم البيئة المحيطة؟', fr: "Qu'est-ce qui empêche d'utiliser {developArea} — la compétence, la confiance, ou l'environnement ?" },
  { en: 'What is one thing I could do differently to support you here?', ar: 'ما الشيء الذي يمكنني فعله بشكل مختلف لدعمك في هذا الجانب؟', fr: "Qu'est-ce que je pourrais faire différemment pour vous soutenir ici ?" },
  { en: 'What would growth in {developArea} look like for you over the next 90 days?', ar: 'كيف سيبدو النمو في {developArea} بالنسبة لك خلال التسعين يوماً القادمة؟', fr: "À quoi ressemblerait une progression en {developArea} pour vous d'ici 90 jours ?" },
  { en: 'What is one thing from today you want to check back on in 90 days?', ar: 'ما الشيء الواحد من اليوم الذي تريد العودة إليه بعد تسعين يوماً؟', fr: "Quel est un point d'aujourd'hui que vous voulez revoir dans 90 jours ?" },
];
