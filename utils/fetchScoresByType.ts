// utils/fetchScoresByType.ts
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Define the Score type or import it from the appropriate module
type Score = {
  // Replace these fields with the actual structure of your Score documents
  id?: string;
  quizType: string;
  // Add other fields as needed
};

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
