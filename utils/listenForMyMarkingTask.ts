// utils/listenForMyMarkingTask.ts
import { Firestore, doc, onSnapshot, Unsubscribe } from "firebase/firestore";

type MarkingTask = {
  answerDocId: string;
  targetUid: string;
  targetUsername: string;
  sheetNumber: number;
  // add other properties as needed
};

export function listenForMyMarkingTask(
  db: Firestore,
  quizId: string,
  part: number,
  pubId: string,
  uid: string,
  cb: (task: MarkingTask | null) => void
): Unsubscribe {
  const ref = doc(db, "markingTasks", `${quizId}_part${part}`);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    const task = data?.pubs?.[pubId]?.assignments?.[uid] ?? null; // { answerDocId, targetUid, targetUsername, sheetNumber, ... }
    cb(task);
  });
}
