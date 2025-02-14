import { getFirestore, doc, getDoc } from "firebase/firestore";

export async function fetchUsername(uid: string): Promise<string> {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data().username;
  } else {
    throw new Error("User not found");
  }
}
