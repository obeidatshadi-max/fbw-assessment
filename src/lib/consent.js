// Bump this string whenever the consent notice text changes materially.
// A returning user whose fbw_consents.notice_version doesn't match this
// value is re-prompted for consent before their next save (see
// authAdapter.saveAssessment and App.jsx's attemptSave).
export const CURRENT_NOTICE_VERSION = '2026-08-30';
