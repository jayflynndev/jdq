import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

export async function fetchUserPosition(uid: string): Promise<number> {
  const db = getFirestore();
  const leaderboardQuery = query(
    collection(db, "users"),
    orderBy("allTimeAverage", "desc")
  );
  const querySnapshot = await getDocs(leaderboardQuery);
  let position = 1;
  for (const doc of querySnapshot.docs) {
    if (doc.id === uid) {
      return position;
    }
    position++;
  }
  throw new Error("User not found in leaderboard");
}
