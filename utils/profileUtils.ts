import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/config";

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

export const fetchUsername = async (uid: string) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().username;
    }
    throw new Error("User document does not exist");
  } catch (error) {
    console.error("Error fetching username:", error);
    throw new Error("Failed to fetch username. Please try again.");
  }
};

export const fetchScores = async (uid: string) => {
  try {
    const scoresQuery = query(
      collection(db, "scores"),
      where("uid", "==", uid),
      orderBy("quizDate", "desc")
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    const scoresData = scoresSnapshot.docs.map((doc) => ({
      quizDate: new Date(doc.data().quizDate).toLocaleDateString("en-GB"),
      score: doc.data().score,
      tiebreaker: doc.data().tiebreaker,
    }));
    return scoresData;
  } catch (error) {
    console.error("Error fetching scores:", error);
    throw new Error("Failed to fetch scores. Please try again.");
  }
};

export const calculateAverages = (scores: Score[]) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const weeklyScores = scores.filter(
    (score) =>
      new Date(score.quizDate.split("/").reverse().join("-")) >= startOfWeek
  );
  const monthlyScores = scores.filter(
    (score) =>
      new Date(score.quizDate.split("/").reverse().join("-")) >= startOfMonth
  );
  const allTimeScores = scores;

  return {
    weeklyAverage: calculateAverage(weeklyScores),
    monthlyAverage: calculateAverage(monthlyScores),
    allTimeAverage: calculateAverage(allTimeScores),
  };
};

const calculateAverage = (scores: Score[]) => {
  if (scores.length === 0) return 0;
  const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
  return parseFloat((totalScore / scores.length).toFixed(2));
};
