// REVIEW: Arabic role labels below are a first draft — Shadi is the
// domain/language owner and should review before ship.

// A role's `id` is the key used in scenarioSets.js's SCENARIO_SETS map.
// Every role below has its own dedicated scenario set (see scenarioSets.js);
// an id that isn't in ROLES at all (shouldn't happen in normal use) falls
// back to the neutral "general" set via getScenariosForRole().
//
// Kept deliberately small: three pharma/medtech/diagnostics-flavored
// functions (the product's edge — Shadi is a pharmacist and this is his
// target market) plus one neutral catch-all for anyone outside that
// industry. Collapsed from an earlier 6-role list where half the roles
// (medical_msl, market_access, country_manager) had no real content of
// their own and silently reused the generic set anyway.
export const ROLES = [
  { id: 'sales', label: { en: 'Sales / Medical Rep', ar: 'المبيعات / المندوب العلمي' } },
  { id: 'marketing', label: { en: 'Marketing / Product (Pharma)', ar: 'التسويق / إدارة المنتج (الأدوية)' } },
  { id: 'management', label: { en: 'Management / Team Lead (Pharma)', ar: 'الإدارة / قيادة الفريق (الأدوية)' } },
  { id: 'general', label: { en: 'General (Non-Pharma)', ar: 'عام (غير أدوية)' } },
];

export const DEFAULT_ROLE = 'sales';
