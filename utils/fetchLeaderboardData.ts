import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { aggregateScores } from "@/utils/aggregateScores";

type DataItem = {
  username: string;
  score: number;
  tiebreaker: number;
  quizzesPlayed?: number;
};

export const fetchLeaderboardData = async (
  selectedDate: string,
  startOfWeek: Date,
  startOfMonth: Date,
  endOfMonth: Date,
  startOfAllTime: Date,
  today: Date
) => {
  const dailyData: DataItem[] = [];
  const weeklyData: DataItem[] = [];
  const monthlyData: DataItem[] = [];
  const allTimeData: DataItem[] = [];

  try {
    // Fetch daily data
    const dailyQuery = query(
      collection(db, "scores"),
      where("quizDate", "==", selectedDate),
      orderBy("score", "desc"),
      orderBy("tiebreaker", "asc"),
      limit(10)
    );
    const dailySnapshot = await getDocs(dailyQuery);
    const dailyScores = dailySnapshot.docs.map(
      (doc) =>
        doc.data() as {
          username: string;
          score: number;
          tiebreaker: number;
        }
    );
    dailyData.push(...dailyScores);

    // Fetch weekly data
    const weeklyQuery = query(
      collection(db, "scores"),
      where("quizDate", ">=", startOfWeek.toISOString().split("T")[0]),
      where("quizDate", "<=", today.toISOString().split("T")[0])
    );
    const weeklySnapshot = await getDocs(weeklyQuery);
    const weeklyScores = weeklySnapshot.docs.map(
      (doc) =>
        doc.data() as {
          username: string;
          score: number;
          tiebreaker: number;
        }
    );
    const weeklyAggregated = aggregateScores(weeklyScores);
    weeklyData.push(...weeklyAggregated);

    // Fetch monthly data
    const monthlyQuery = query(
      collection(db, "scores"),
      where("quizDate", ">=", startOfMonth.toISOString().split("T")[0]),
      where("quizDate", "<=", endOfMonth.toISOString().split("T")[0])
    );
    const monthlySnapshot = await getDocs(monthlyQuery);
    const monthlyScores = monthlySnapshot.docs.map(
      (doc) =>
        doc.data() as {
          username: string;
          score: number;
          tiebreaker: number;
        }
    );
    const monthlyAggregated = aggregateScores(monthlyScores);
    monthlyData.push(...monthlyAggregated);

    // Fetch all-time data
    const allTimeQuery = query(
      collection(db, "scores"),
      where("quizDate", ">=", startOfAllTime.toISOString().split("T")[0])
    );
    const allTimeSnapshot = await getDocs(allTimeQuery);
    const allTimeScores = allTimeSnapshot.docs.map(
      (doc) =>
        doc.data() as {
          username: string;
          score: number;
          tiebreaker: number;
        }
    );
    const allTimeAggregated = aggregateScores(allTimeScores);
    allTimeData.push(...allTimeAggregated);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch data. Please try again.");
  }

  return { dailyData, weeklyData, monthlyData, allTimeData };
};
