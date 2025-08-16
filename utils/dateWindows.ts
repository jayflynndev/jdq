// utils/dateWindows.ts
export function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Month window for the month that includes "at" (local time ok)
export function monthWindow(at = new Date()) {
  const from = new Date(at.getFullYear(), at.getMonth(), 1);
  const to = new Date(at.getFullYear(), at.getMonth() + 1, 0);
  return { from: toISO(from), to: toISO(to) };
}

// ISO week window (Mon..Sun) for week that includes "at"
export function weekWindow(at = new Date()) {
  const d = new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()));
  const dow = d.getUTCDay() || 7; // 1..7 (Mon..Sun)
  if (dow !== 1) d.setUTCDate(d.getUTCDate() - dow + 1); // back to Monday
  const from = new Date(d);
  const to = new Date(d);
  to.setUTCDate(to.getUTCDate() + 6);
  return { from: toISO(from), to: toISO(to) };
}
