interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

interface UserWithAverages {
  uid: string;
  username: string;
  weeklyAverage: number;
  monthlyAverage: number;
  allTimeAverage: number;
  tiebreaker: number;
}

export const calculateAverages = (scores: Score[]) => {
  console.log("Calculating averages for scores:", scores);

  if (!scores || scores.length === 0) {
    return {
      weeklyAverage: 0,
      monthlyAverage: 0,
      allTimeAverage: 0,
    };
  }

  const weeklyScores = scores.slice(-7);
  const monthlyScores = scores.slice(-30);
  const allTimeScores = scores;

  const calculateAverage = (scores: Score[]) =>
    scores.reduce((acc, score) => acc + score.score, 0) / scores.length;

  const weeklyAverage =
    weeklyScores.length > 0 ? calculateAverage(weeklyScores) : 0;
  const monthlyAverage =
    monthlyScores.length > 0 ? calculateAverage(monthlyScores) : 0;
  const allTimeAverage =
    allTimeScores.length > 0 ? calculateAverage(allTimeScores) : 0;

  console.log("Weekly average:", weeklyAverage);
  console.log("Monthly average:", monthlyAverage);
  console.log("All time average:", allTimeAverage);

  return {
    weeklyAverage,
    monthlyAverage,
    allTimeAverage,
  };
};

export const sortUsers = (
  users: UserWithAverages[],
  key: "weeklyAverage" | "monthlyAverage" | "allTimeAverage"
) => {
  return users.sort((a, b) => {
    if (b[key] !== a[key]) {
      return b[key] - a[key];
    }
    return a.tiebreaker - b.tiebreaker;
  });
};
