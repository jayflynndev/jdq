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

export async function fetchScores(uid: string): Promise<Score[]> {
  const db = getFirestore();
  const scoresQuery = query(collection(db, "scores"), where("uid", "==", uid));
  const querySnapshot = await getDocs(scoresQuery);
  const scores: Score[] = [];
  querySnapshot.forEach((doc) => {
    scores.push(doc.data() as Score);
  });
  return scores;
}
