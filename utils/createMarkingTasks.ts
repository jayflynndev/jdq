// utils/createMarkingTasks.ts
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  arrayUnion,
  Firestore,
} from "firebase/firestore";

/** Simple derangement-ish shuffle so nobody marks their own sheet */
function derange<T extends { markerUid: string }>(arr: T[]): T[] {
  if (arr.length < 2) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  for (let tries = 0; tries < 10; tries++) {
    let ok = true;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].markerUid === shuffled[i].markerUid) {
        ok = false;
        break;
      }
    }
    if (ok) return shuffled;
    // rotate and retry
    shuffled.push(shuffled.shift() as T);
  }
  // fallback swap last two
  if (shuffled.length > 1) {
    const last = shuffled.length - 1;
    [shuffled[last], shuffled[last - 1]] = [shuffled[last - 1], shuffled[last]];
  }
  return shuffled;
}

/**
 * Build & save marking tasks for this quiz/part.
 * Writes ONE doc: markingTasks/{quizId}_part{part}
 * Also whitelists each marker on:
 *   1) the markingTasks doc (allowedViewers map)
 *   2) each target liveAnswers doc (allowedMarkers array)
 */
export async function createMarkingTasks(
  db: Firestore,
  quizId: string,
  part: number
) {
  // 1. fetch all submitted answers for this quiz/part
  const answersSnap = await getDocs(
    query(
      collection(db, "liveAnswers"),
      where("quizId", "==", quizId),
      where("currentPart", "==", part)
    )
  );

  type AnswerDoc = {
    pubId: string;
    userId: string;
    username: string;
    sheetNumber?: number;
  };

  // group answers by pub
  const byPub: Record<
    string,
    Array<{
      answerDocId: string;
      markerUid: string;
      username: string;
      sheetNumber: number;
    }>
  > = {};

  answersSnap.forEach((d) => {
    const data = d.data() as AnswerDoc;
    const pubId = data.pubId;
    if (!byPub[pubId]) byPub[pubId] = [];
    byPub[pubId].push({
      answerDocId: d.id,
      markerUid: data.userId,
      username: data.username,
      sheetNumber: data.sheetNumber ?? 0,
    });
  });

  // 2. build assignments and whitelists
  const pubs: Record<
    string,
    {
      assignments: Record<
        string,
        {
          answerDocId: string;
          targetUid: string;
          targetUsername: string;
          sheetNumber: number;
          completed: boolean;
          score?: number;
        }
      >;
    }
  > = {};

  const whitelistWrites: Promise<void>[] = [];
  const allowedViewers: Record<string, boolean> = {};

  for (const [pubId, arr] of Object.entries(byPub)) {
    if (arr.length === 0) continue;

    const receivers = derange(arr);
    const assignments: Record<
      string,
      {
        answerDocId: string;
        targetUid: string;
        targetUsername: string;
        sheetNumber: number;
        completed: boolean;
        score?: number;
      }
    > = {};

    arr.forEach((marker, i) => {
      const target = receivers[i];

      assignments[marker.markerUid] = {
        answerDocId: target.answerDocId,
        targetUid: target.markerUid,
        targetUsername: target.username,
        sheetNumber: target.sheetNumber,
        completed: false,
      };

      // whitelist this marker on the markingTasks doc
      allowedViewers[marker.markerUid] = true;

      // whitelist this marker on the target's liveAnswers doc
      const ansRef = doc(db, "liveAnswers", target.answerDocId);
      whitelistWrites.push(
        updateDoc(ansRef, {
          allowedMarkers: arrayUnion(marker.markerUid),
        }).catch(async () => {
          // if field doesn't exist yet, create it
          await setDoc(
            ansRef,
            { allowedMarkers: [marker.markerUid] },
            { merge: true }
          );
        })
      );
    });

    pubs[pubId] = { assignments };
  }

  // 3. write the single markingTasks doc with allowedViewers
  const taskRef = doc(db, "markingTasks", `${quizId}_part${part}`);
  await setDoc(
    taskRef,
    {
      quizId,
      part,
      createdAt: new Date().toISOString(),
      pubs,
      allowedViewers,
    },
    { merge: true }
  );

  // 4. wait for all the per-answer whitelists to finish
  await Promise.all(whitelistWrites);
}
