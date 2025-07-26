import { db } from "@/app/firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

/**
 * Fetches all leaderboard data and funny answers for a given quiz and part.
 * @param quizId The quiz ID
 * @param part The part number
 * @param currentPubId The current user's pubId
 * @returns {Promise<{pubEntries, allEntries, pubAverages, funnyAnswers}>}
 */
export async function fetchLiveLeaderboardData(
  quizId: string,
  part: number,
  currentPubId: string
) {
  // 1. Fetch all scores for this quiz+part
  const q = query(
    collection(db, "liveScores"),
    where("quizId", "==", quizId),
    where("part", "==", part)
  );
  const snap = await getDocs(q);

  interface LiveScore {
    quizId: string;
    part: number;
    pubId: string;
    pubName?: string;
    targetUsername?: string;
    targetUid?: string;
    userId?: string;
    score: number;
    funnyFlags?: { [roundName: string]: boolean[] };
    // Add other fields as needed
  }

  const allScores = snap.docs.map((doc) => ({
    ...(doc.data() as LiveScore),
    id: doc.id,
  }));

  // 2. Your pub's entries (sorted highest first)
  const pubEntries = allScores
    .filter((s) => s.pubId === currentPubId)
    .map((s) => ({
      name: s.targetUsername || s.targetUid || s.userId || "Anonymous",
      score: s.score,
      pubName: s.pubName || s.pubId,
    }))
    .sort((a, b) => b.score - a.score);

  // 3. Top 10 overall (sorted highest first)
  const allEntries = allScores
    .map((s) => ({
      name: s.targetUsername || s.targetUid || s.userId || "Anonymous",
      score: s.score,
      pubName: s.pubName || s.pubId,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 4. Calculate pub averages
  const pubTotals: Record<
    string,
    { total: number; count: number; name: string }
  > = {};
  allScores.forEach((s) => {
    const id = s.pubId;
    if (!pubTotals[id])
      pubTotals[id] = { total: 0, count: 0, name: s.pubName || id };
    pubTotals[id].total += s.score;
    pubTotals[id].count += 1;
  });
  const pubAverages = Object.values(pubTotals)
    .map((data) => ({
      name: data.name,
      score: +(data.total / data.count).toFixed(2),
    }))
    .sort((a, b) => b.score - a.score);

  // 5. Calculate overall average (for admin panel)
  const overallAverage =
    allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length
      : 0;

  // 6. FUNNY ANSWERS: Collect and fetch answers from liveAnswers
  const funnyRequests: {
    targetUid: string;
    targetUsername?: string;
    pubId: string;
    roundName: string;
    questionIndex: number; // zero-based!
    part: number;
  }[] = [];
  for (const s of allScores) {
    if (!s.funnyFlags) continue;
    for (const roundName in s.funnyFlags) {
      const flags = s.funnyFlags[roundName] || [];
      flags.forEach((flag, idx) => {
        if (flag) {
          funnyRequests.push({
            targetUid: s.targetUid || s.userId || "Unknown",
            targetUsername: s.targetUsername || s.userId,
            pubId: s.pubId,
            roundName,
            questionIndex: idx,
            part: s.part || part, // fallback to function arg if missing
          });
        }
      });
    }
  }

  // Fetch all answers
  const funnyAnswers: {
    round: string;
    question: number;
    answer: string;
    team: string;
  }[] = [];

  for (const req of funnyRequests) {
    // Build answer doc ID: quizId_pubId_userId_partX
    const answerDocId = `${quizId}_${req.pubId}_${req.targetUid}_part${req.part}`;
    const ansSnap = await getDoc(doc(db, "liveAnswers", answerDocId));
    let answerText = "(No answer found)";
    if (ansSnap.exists()) {
      const answers = ansSnap.data().answers?.[req.roundName] || [];
      answerText = answers[req.questionIndex] ?? "(No answer found)";
    }
    funnyAnswers.push({
      round: req.roundName,
      question: req.questionIndex,
      answer: answerText,
      team: req.targetUsername || req.targetUid || "Unknown",
    });
  }

  return {
    pubEntries,
    allEntries,
    pubAverages,
    overallAverage,
    funnyAnswers,
  };
}
export async function fetchCombinedLeaderboardData(
  quizId: string,
  currentPubId: string
) {
  // 1. Fetch all scores for this quiz (all parts!)
  const q = query(
    collection(db, "liveScores"),
    where("quizId", "==", quizId)
    // No "part" filter
  );
  const snap = await getDocs(q);

  // Combine all scores per user
  interface UserScore {
    name: string;
    pubId: string;
    pubName?: string;
    totalScore: number;
    parts: number[]; // scores for each part (if you want to show details)
    funnyFlags?: { [roundName: string]: boolean[] };
    part?: number;
    targetUid?: string;
    targetUsername?: string;
  }
  const userMap: Record<string, UserScore> = {};

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const userKey = data.targetUid || data.userId;
    if (!userMap[userKey]) {
      userMap[userKey] = {
        name: data.targetUsername || userKey,
        pubId: data.pubId,
        pubName: data.pubName,
        totalScore: 0,
        parts: [],
        funnyFlags: {},
        part: data.part,
        targetUid: data.targetUid,
        targetUsername: data.targetUsername,
      };
    }
    userMap[userKey].totalScore += data.score;
    userMap[userKey].parts.push(data.score);
    if (data.funnyFlags) {
      // Merge all funnyFlags (across all parts!)
      for (const round in data.funnyFlags) {
        userMap[userKey].funnyFlags![round] = data.funnyFlags[round];
      }
    }
  });

  // Prepare leaderboards
  const allEntries = Object.values(userMap)
    .map((u) => ({
      name: u.name,
      score: u.totalScore,
      pubName: u.pubName || u.pubId,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Your pub's entries
  const pubEntries = Object.values(userMap)
    .filter((u) => u.pubId === currentPubId)
    .map((u) => ({
      name: u.name,
      score: u.totalScore,
      pubName: u.pubName || u.pubId,
    }))
    .sort((a, b) => b.score - a.score);

  // Calculate pub averages
  const pubTotals: Record<
    string,
    { total: number; count: number; name: string }
  > = {};
  Object.values(userMap).forEach((u) => {
    const id = u.pubId;
    if (!pubTotals[id])
      pubTotals[id] = { total: 0, count: 0, name: u.pubName || id };
    pubTotals[id].total += u.totalScore;
    pubTotals[id].count += 1;
  });
  const pubAverages = Object.values(pubTotals)
    .map((data) => ({
      name: data.name,
      score: +(data.total / data.count).toFixed(2),
    }))
    .sort((a, b) => b.score - a.score);

  // Calculate overall average
  const allScores = Object.values(userMap).map((u) => u.totalScore);
  const overallAverage =
    allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : 0;

  // === NEW: FUNNY ANSWERS ACROSS ALL PARTS ===
  // (Collect from every user's funnyFlags and every part)
  const funnyRequests: {
    targetUid: string;
    targetUsername?: string;
    pubId: string;
    roundName: string;
    questionIndex: number;
    part: number;
  }[] = [];
  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.funnyFlags) return;
    const partNum = data.part || 1;
    const pubId = data.pubId;
    for (const roundName in data.funnyFlags) {
      const flags = data.funnyFlags[roundName] || [];
      flags.forEach((flag: boolean, idx: number) => {
        if (flag) {
          funnyRequests.push({
            targetUid: data.targetUid || data.userId || "Unknown",
            targetUsername: data.targetUsername || data.userId,
            pubId,
            roundName,
            questionIndex: idx,
            part: partNum,
          });
        }
      });
    }
  });

  // Fetch all funny answers
  const funnyAnswers: {
    round: string;
    question: number;
    answer: string;
    team: string;
  }[] = [];

  for (const req of funnyRequests) {
    // Build answer doc ID: quizId_pubId_userId_partX
    const answerDocId = `${quizId}_${req.pubId}_${req.targetUid}_part${req.part}`;
    const ansSnap = await getDoc(doc(db, "liveAnswers", answerDocId));
    let answerText = "(No answer found)";
    if (ansSnap.exists()) {
      const answers = ansSnap.data().answers?.[req.roundName] || [];
      answerText = answers[req.questionIndex] ?? "(No answer found)";
    }
    funnyAnswers.push({
      round: req.roundName,
      question: req.questionIndex,
      answer: answerText,
      team: req.targetUsername || req.targetUid || "Unknown",
    });
  }

  return {
    pubEntries,
    allEntries,
    pubAverages,
    overallAverage,
    funnyAnswers,
  };
}
