// REVIEW: Arabic role labels below are a first draft — Shadi is the
// domain/language owner and should review before ship.

// A role's `id` is the key used in scenarioSets.js's SCENARIO_SETS map.
// Roles without a drafted set of their own fall back to the generic
// ("medical_rep") scenarios via getScenariosForRole() — see scenarioSets.js.
export const ROLES = [
  { id: 'medical_rep', label: { en: 'Medical Rep', ar: 'مندوب طبي' } },
  { id: 'first_line_manager', label: { en: 'First-line Manager', ar: 'مدير الخط الأول' } },
  { id: 'product_manager', label: { en: 'Product Manager', ar: 'مدير المنتج' } },
  { id: 'medical_msl', label: { en: 'Medical / MSL', ar: 'الشؤون الطبية / MSL' } },
  { id: 'market_access', label: { en: 'Market Access', ar: 'الوصول إلى السوق' } },
  { id: 'country_manager', label: { en: 'Country Manager', ar: 'مدير الدولة' } },
];

export const DEFAULT_ROLE = 'medical_rep';
