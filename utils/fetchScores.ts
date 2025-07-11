import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

export async function fetchScores(
  uid: string,
  quizType?: string
): Promise<Score[]> {
  const db = getFirestore();
  let scoresQuery = query(collection(db, "scores"), where("uid", "==", uid));

  if (quizType) {
    scoresQuery = query(scoresQuery, where("quizType", "==", quizType));
  }

  const querySnapshot = await getDocs(scoresQuery);
  const scores: Score[] = [];
  querySnapshot.forEach((doc) => scores.push(doc.data() as Score));
  return scores;
}
