// utils/fetchScoresByType.ts
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Score } from "@/types/Score"; // Adjust path if needed

export async function fetchScoresByType(quizType: string): Promise<Score[]> {
  const db = getFirestore();

  const scoresQuery = query(
    collection(db, "scores"),
    where("quizType", "==", quizType)
  );

  const querySnapshot = await getDocs(scoresQuery);

  const scores: Score[] = [];
  querySnapshot.forEach((doc) => {
    scores.push(doc.data() as Score);
  });

  return scores;
}
