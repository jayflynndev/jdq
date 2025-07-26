"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/app/firebase/config";
import { doc, onSnapshot, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { PubRoom } from "@/components/liveQuiz/PubRoom";
import { listenForMyMarkingTask } from "@/utils/listenForMyMarkingTask";
import {
  fetchLiveLeaderboardData,
  fetchCombinedLeaderboardData,
} from "@/utils/fetchLiveLeaderboardData";

type QuizStage =
  | "waiting"
  | "countdown"
  | "answering"
  | "locking"
  | "locked"
  | "swapping"
  | "marking"
  | "submitting-marks"
  | "loading-leaderboard"
  | "leaderboard"
  | "waiting-for-others"
  | "collecting"
  | "finished";

export default function PubRoomPage() {
  const { quizId, pubId } = useParams() as { quizId: string; pubId: string };
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [pub, setPub] = useState<any>(null);
  const [pubUsernames, setPubUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<{
    username: string;
    uid: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);

  type LeaderboardData = {
    pubEntries: any[];
    allEntries: any[];
    pubAverages: any[];
  };

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    pubEntries: [],
    allEntries: [],
    pubAverages: [],
  });

  const lastStatus = useRef<string | null>(null);

  // --- MARKING STATE ---
  const [myTask, setMyTask] = useState<any | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [targetAnswers, setTargetAnswers] = useState<any | null>(null);
  const [markSubmitting, setMarkSubmitting] = useState(false);
  const [collectCountdown, setCollectCountdown] = useState<number | null>(null);
  // Removed unused autoSubmitted state

  // --- NEW STATE FOR UI HIDE AFTER SUBMIT ---
  const [markSubmitted, setMarkSubmitted] = useState(false);

  const currentPart = quiz?.currentPart || 1;

  // AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (!user) {
          setCurrentUser(null);
          setAuthChecked(true);
          router.replace("/sign-in");
        } else {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          let username = user.displayName || "Anonymous";
          if (userDoc.exists()) username = userDoc.data().username || username;
          setCurrentUser({ username, uid: user.uid });
          setAuthChecked(true);
        }
      }
    );
    return () => unsubscribe();
  }, [router]);

  // Quiz + Pub
  useEffect(() => {
    setLoading(true);
    const unsubQuiz = onSnapshot(doc(db, "liveQuizzes", quizId), (snap) => {
      setQuiz(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    const unsubPub = onSnapshot(
      doc(db, "liveQuizzes", quizId, "pubs", pubId),
      async (snap) => {
        if (!snap.exists()) {
          setPub(null);
          setPubUsernames([]);
          return;
        }
        const snapData = snap.data();
        const pubData: { pubId: string; members?: string[] | string } = {
          pubId: snap.id,
          ...snapData,
        };
        setPub(pubData);

        const memberUIDs: string[] = Array.isArray(pubData.members)
          ? pubData.members
          : pubData.members
          ? [pubData.members]
          : [];
        if (memberUIDs.length === 0) {
          setPubUsernames([]);
        } else {
          const usernames: string[] = [];
          await Promise.all(
            memberUIDs.map(async (uid) => {
              const userSnap = await getDoc(doc(db, "users", uid));
              if (userSnap.exists()) {
                const username = userSnap.data().username || uid;
                usernames.push(username);
              } else {
                usernames.push(uid);
              }
            })
          );
          setPubUsernames(usernames);
        }
      }
    );
    return () => {
      unsubQuiz();
      unsubPub();
    };
  }, [quizId, pubId]);

  // Stage timers
  const quizStage: QuizStage = quiz?.status || "waiting";

  useEffect(() => {
    if (quizStage === "countdown" && lastStatus.current !== "countdown") {
      setStartCountdown(30);
    }
    if (quizStage !== "countdown") setStartCountdown(null);
    lastStatus.current = quizStage;
  }, [quizStage, collectCountdown]);

  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown === 0) return;
    const interval = setInterval(() => {
      setStartCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [startCountdown]);

  useEffect(() => {
    if (quizStage === "locking" && lockCountdown === null) setLockCountdown(30);
    if (quizStage !== "locking") setLockCountdown(null);
  }, [quizStage, lockCountdown]);

  useEffect(() => {
    if (lockCountdown === null) return;
    if (lockCountdown === 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockCountdown]);

  useEffect(() => {
    if (quizStage === "collecting" && collectCountdown === null) {
      setCollectCountdown(30);
      // Removed setAutoSubmitted(false);
    }
    if (quizStage !== "collecting" && collectCountdown !== null) {
      setCollectCountdown(null);
    }
  }, [quizStage, collectCountdown]);

  useEffect(() => {
    if (collectCountdown === null) return;
    if (collectCountdown === 0) {
      setCollectCountdown(null);
      return;
    }
    const iv = setInterval(() => {
      setCollectCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearInterval(iv);
  }, [collectCountdown]);

  // Reset markSubmitted when stage or part changes!
  useEffect(() => {
    setMarkSubmitted(false);
  }, [quizStage, currentPart]);

  // ----- LISTEN FOR MARKING TASK WHEN status === "marking" -----
  useEffect(() => {
    if (
      quizStage !== "marking" ||
      !currentUser ||
      !quizId ||
      !pubId ||
      !currentPart
    ) {
      return;
    }
    setTaskLoading(true);
    const unsub = listenForMyMarkingTask(
      db,
      quizId,
      currentPart,
      pubId,
      currentUser.uid,
      (task) => {
        setMyTask(task);
        setTaskLoading(false);
      }
    );
    return () => unsub();
  }, [quizStage, currentUser, quizId, pubId, currentPart]);

  // When task appears, fetch answers
  useEffect(() => {
    const fetchAnswers = async () => {
      if (!myTask?.answerDocId) {
        setTargetAnswers(null);
        return;
      }
      try {
        const ansSnap = await getDoc(
          doc(db, "liveAnswers", myTask.answerDocId)
        );
        if (ansSnap.exists()) {
          setTargetAnswers(ansSnap.data());
        } else {
          setTargetAnswers(null);
        }
      } catch (e) {
        console.error("Failed to fetch target answers", e);
        setTargetAnswers(null);
      }
    };
    fetchAnswers();
  }, [myTask]);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (quizStage === "leaderboard") {
        // If quiz has more than one part, use combined function
        if (quiz?.parts?.length > 1) {
          const data = await fetchCombinedLeaderboardData(quizId, pubId);
          setLeaderboardData(data);
        } else {
          const data = await fetchLiveLeaderboardData(
            quizId,
            currentPart,
            pubId
          );
          setLeaderboardData(data);
        }
      }
    };
    fetchLeaderboard();
  }, [quizStage, quizId, pubId, currentPart, quiz?.parts?.length]);

  // Submit marking handler
  const handleSubmitMarking = async (
    marks: { [round: string]: boolean[] },
    funnyFlags: { [round: string]: boolean[] }
  ) => {
    if (!myTask || !currentUser) return;
    setMarkSubmitting(true);
    try {
      // 1) Calculate score (# of true in marks)
      let score = 0;
      Object.values(marks).forEach((arr) =>
        arr.forEach((b) => {
          if (b) score++;
        })
      );

      // 2) Mark the task as completed, save score & funnyFlags in markingTasks
      await updateDoc(doc(db, "markingTasks", `${quizId}_part${currentPart}`), {
        [`pubs.${pubId}.assignments.${currentUser.uid}.completed`]: true,
        [`pubs.${pubId}.assignments.${currentUser.uid}.score`]: score,
        [`pubs.${pubId}.assignments.${currentUser.uid}.funnyFlags`]: funnyFlags,
        [`pubs.${pubId}.assignments.${currentUser.uid}.marks`]: marks,
      });

      // 3) Also write a liveScores doc for overall leaderboard
      await setDoc(
        doc(
          db,
          "liveScores",
          `${quizId}_${currentUser.uid}_part${currentPart}`
        ),
        {
          quizId,
          part: currentPart,
          markerUid: currentUser.uid,
          markerUsername: currentUser.username,
          targetUid: myTask.targetUid,
          targetUsername: myTask.targetUsername, // assuming task contains this!
          pubId,
          pubName: pub?.name || "", // ← add pub name
          score,
          funnyFlags,
          submittedAt: new Date().toISOString(),
          userId: currentUser.uid,
        }
      );

      setMarkSubmitting(false);
      setMarkSubmitted(true); // <<--- ADD THIS HERE
    } catch (e) {
      console.error("Failed to submit marks", e);
      setMarkSubmitting(false);
    }
  };

  // AUTH / loading guards
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-700 text-lg">
        Loading quiz and pub…
      </div>
    );
  }
  if (!quiz || !pub) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        Quiz or pub not found.
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        Not signed in.
      </div>
    );
  }

  // rounds for this part (for answer entry & marking)
  const partObj =
    quiz &&
    quiz.parts &&
    Array.isArray(quiz.parts) &&
    quiz.parts.length >= currentPart
      ? quiz.parts[currentPart - 1]
      : quiz?.parts?.[0] || null;

  const rounds = partObj?.rounds || [];

  // Build marking props if ready
  const markingSheetProps =
    (quizStage === "marking" || quizStage === "collecting") &&
    myTask &&
    targetAnswers
      ? {
          teamName: myTask.targetUsername,
          rounds,
          userAnswers: targetAnswers.answers || {},
          correctAnswers: {},
          onSubmit: handleSubmitMarking,
          markCountdown:
            quizStage === "collecting" ? collectCountdown : undefined,
        }
      : undefined;

  // decide what to show during marking
  let quizStageForUI: QuizStage = quizStage;

  if (quizStage === "marking" || quizStage === "collecting") {
    if (markSubmitting) {
      quizStageForUI = "submitting-marks";
    } else if (taskLoading || !myTask) {
      quizStageForUI = "loading-leaderboard";
    } else if (myTask && !targetAnswers) {
      quizStageForUI = "loading-leaderboard";
    } else if (markSubmitted || myTask?.completed) {
      quizStageForUI = "loading-leaderboard";
    }
  }
  console.log("Leaderboard data for PubLeaderboards:", leaderboardData);

  return (
    <PubRoom
      quiz={quiz}
      pub={{ ...pub, members: pubUsernames.map((username) => ({ username })) }}
      currentUser={currentUser}
      isAdmin={false}
      quizStage={quizStageForUI}
      startCountdown={quizStage === "countdown" ? startCountdown : null}
      lockCountdown={quizStage === "locking" ? lockCountdown : null}
      part1Rounds={rounds}
      markingSheetProps={markingSheetProps}
      leaderboardData={leaderboardData}
      currentPart={currentPart}
      collectCountdown={quizStage === "collecting" ? collectCountdown : null}
    />
  );
}
