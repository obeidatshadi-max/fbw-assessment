// Copy text to the clipboard, resolving true/false instead of throwing.
// navigator.clipboard is missing on non-secure origins and some older mobile
// WebViews, and writeText() rejects when permission is denied, so the bare
// `navigator.clipboard?.writeText(x).then(...)` pattern used to throw a
// TypeError (or leave an unhandled rejection) and give the user no feedback.
// Falls back to a hidden textarea + execCommand('copy') for those cases.
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
