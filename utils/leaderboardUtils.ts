// leaderboardUtils.ts

// Helper to get 1st, 2nd, 3rd etc
export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Helper to get position in leaderboard array
export function getPosition(
  entries: { [key: string]: unknown }[],
  value: string,
  key = "name"
) {
  const idx = entries.findIndex((e) => e[key] === value);
  return idx >= 0 ? idx + 1 : null;
}
