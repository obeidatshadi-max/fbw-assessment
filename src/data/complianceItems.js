// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.
//
// A small, dedicated "compliance courage" sub-scale inside Will (Prompt 3).
// Same shape and 1–3 Likert scale as ORG_ITEMS (see orgItems.js), scored
// separately via scoreCompliance() in lib/scoring.js — it is NOT mixed into
// the F/B/W forced-choice ranking. `d` is always "W" here (documents that
// this sub-scale lives inside Will); scoreCompliance() ignores it and just
// sums the three answers.
//
// This is self-reflection, not a compliance audit — see COMPLIANCE_ITEMS
// framing and the report.compliance.* copy in translations.js, which are
// deliberately non-judgmental (a low score is "an area to build", never a
// finding or a violation).
export const COMPLIANCE_ITEMS = [
  { t: { en: 'I speak up when I notice an HCP interaction that feels off, even if no one else raises it.', ar: 'أُعبّر عن رأيي عندما ألاحظ تفاعلاً مع طبيب أو صيدلاني يبدو غير سليم، حتى لو لم يُثِر أحد آخر الأمر.' }, d: 'W' },
  { t: { en: 'I report an adverse event promptly, even when it is inconvenient or slows things down.', ar: 'أُبلّغ عن حدث دوائي ضار فوراً، حتى لو كان ذلك غير مريح أو يُبطئ الأمور.' }, d: 'W' },
  { t: { en: 'I escalate it when I see a colleague or distributor cutting corners to hit a number.', ar: 'أُصعّد الأمر عندما أرى زميلاً أو موزّعاً يتحايل لتحقيق رقم مستهدف.' }, d: 'W' },
];
