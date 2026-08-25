export function applyChoice(current, kind, idx) {
  const next = { ...current };
  if (kind === 'most') {
    next.most = current.most === idx ? null : idx;
    if (next.least === idx) next.least = null;
  } else {
    next.least = current.least === idx ? null : idx;
    if (next.most === idx) next.most = null;
  }
  return next;
}
