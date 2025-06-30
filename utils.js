export const filterAndSortData = (data, startDate, endDate) => {
  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });

  return filteredData.sort((a, b) => {
    if (b.score === a.score) {
      return a.tiebreaker - b.tiebreaker; // Sort by lowest tiebreaker if scores are equal
    }
    return b.score - a.score; // Sort by highest score
  });
};

export const calculateAverage = (data, period) => {
  const userScores = {};

  data.forEach((item) => {
    if (!userScores[item.username]) {
      userScores[item.username] = {
        totalScore: 0,
        totalTiebreaker: 0,
        count: 0,
      };
    }
    userScores[item.username].totalScore += item.score;
    userScores[item.username].totalTiebreaker += item.tiebreaker;
    userScores[item.username].count += 1;
  });

  const averageData = Object.keys(userScores).map((username) => ({
    username,
    score: userScores[username].totalScore / period,
    tiebreaker: userScores[username].totalTiebreaker / period,
  }));

  return averageData.sort((a, b) => {
    if (b.score === a.score) {
      return a.tiebreaker - b.tiebreaker; // Sort by lowest tiebreaker if scores are equal
    }
    return b.score - a.score; // Sort by highest score
  });
};

export const calculateAllTimeAverage = (data) => {
  const userScores = {};

  data.forEach((item) => {
    if (!userScores[item.username]) {
      userScores[item.username] = {
        totalScore: 0,
        totalTiebreaker: 0,
        count: 0,
      };
    }
    userScores[item.username].totalScore += item.score;
    userScores[item.username].totalTiebreaker += item.tiebreaker;
    userScores[item.username].count += 1;
  });

  const averageData = Object.keys(userScores).map((username) => ({
    username,
    score: userScores[username].totalScore / userScores[username].count,
    tiebreaker:
      userScores[username].totalTiebreaker / userScores[username].count,
  }));

  return averageData.sort((a, b) => {
    if (b.score === a.score) {
      return a.tiebreaker - b.tiebreaker; // Sort by lowest tiebreaker if scores are equal
    }
    return b.score - a.score; // Sort by highest score
  });
};

export const calculateMonthlyAverage = (data, startDate, endDate) => {
  const filteredData = filterAndSortData(data, startDate, endDate);
  return calculateAllTimeAverage(filteredData);
};
