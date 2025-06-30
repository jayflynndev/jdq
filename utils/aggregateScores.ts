type Score = {
  username: string;
  score: number;
  tiebreaker: number;
};

export const aggregateScores = (scores: Score[]) => {
  const userScores: {
    [key: string]: {
      totalScore: number;
      totalTiebreaker: number;
      count: number;
    };
  } = {};

  scores.forEach((score) => {
    const { username, score: userScore, tiebreaker } = score;
    if (!userScores[username]) {
      userScores[username] = { totalScore: 0, totalTiebreaker: 0, count: 0 };
    }
    userScores[username].totalScore += userScore;
    userScores[username].totalTiebreaker += tiebreaker;
    userScores[username].count += 1;
  });

  return Object.keys(userScores)
    .map((username) => {
      const { totalScore, totalTiebreaker, count } = userScores[username];
      return {
        username,
        score: totalScore / count,
        tiebreaker: totalTiebreaker / count,
        quizzesPlayed: count,
      };
    })
    .sort((a, b) => {
      if (a.score === b.score) {
        return a.tiebreaker - b.tiebreaker;
      }
      return b.score - a.score;
    });
};
