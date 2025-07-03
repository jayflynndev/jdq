// utils/calculateAveragesJVQ.ts

export interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

/**
 * Calculate the user’s average JVQ score on Thursdays,
 * Saturdays, and combined (all JVQ entries).
 */
export const calculateAveragesJVQ = (scores: Score[]) => {
  if (!scores || scores.length === 0) {
    return {
      thursdayAverage: 0,
      saturdayAverage: 0,
      combinedAverage: 0,
    };
  }

  // Helper to compute arithmetic mean
  const avg = (arr: number[]) =>
    arr.length > 0
      ? arr.reduce((sum, v) => sum + v, 0) / arr.length
      : 0;

  // Partition scores by day of week
  const thursdayScores = scores.filter((s) => {
    const d = new Date(s.quizDate).getDay(); // Sunday=0… Saturday=6
    return d === 4; // Thursday
  }).map((s) => s.score);

  const saturdayScores = scores.filter((s) => {
    const d = new Date(s.quizDate).getDay();
    return d === 6; // Saturday
  }).map((s) => s.score);

  const combinedScores = scores.map((s) => s.score);

  return {
    thursdayAverage: avg(thursdayScores),
    saturdayAverage: avg(saturdayScores),
    combinedAverage: avg(combinedScores),
  };
};
