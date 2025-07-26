"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/app/firebase/config";
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
// top of LiveQuizDashboard.tsx
import { createMarkingTasks } from "@/utils/createMarkingTasks";

// --- Import your components
import { AdminQuizHeader } from "@/components/admin/AdminQuizHeader";
import { AdminPubList } from "@/components/admin/AdminPubList";
import { AdminStatsPanel } from "@/components/admin/AdminStatsPanel";
import { AdminControls } from "@/components/admin/AdminControls";
import { AdminRoundsInfo } from "@/components/admin/AdminRoundsInfo";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

interface Pub {
  id: string;
  name: string;
  members: { username: string }[];
}
interface Quiz {
  id: string;
  title: string;
  startTime: string;
  status: string;
  parts: { roundName: string; numQuestions: number }[];
  currentPart: number;
}
type Round = { roundName: string; numQuestions: number };
type Part = { name: string; rounds: Round[] };
function getPartsArray(quiz: any): Part[] {
  if (Array.isArray(quiz.parts) && quiz.parts.length && quiz.parts[0].rounds) {
    return quiz.parts as Part[];
  }
  if (Array.isArray(quiz.parts)) {
    return [
      {
        name: "All Rounds",
        rounds: quiz.parts as Round[],
      },
    ];
  }
  return [];
}

// Remove all answers and marking tasks for a quiz
async function cleanupQuizData(quizId: string) {
  // Remove all liveAnswers docs for this quiz
  const answersQuery = query(
    collection(db, "liveAnswers"),
    where("quizId", "==", quizId)
  );
  const answersSnap = await getDocs(answersQuery);
  for (const docSnap of answersSnap.docs) {
    await deleteDoc(doc(db, "liveAnswers", docSnap.id));
  }

  // Remove all markingTasks docs for this quiz (try for up to 10 parts)
  for (let partNum = 1; partNum <= 10; partNum++) {
    const taskId = `${quizId}_part${partNum}`;
    await deleteDoc(doc(db, "markingTasks", taskId));
  }
}

export default function LiveQuizDashboard() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Admin-only local timers
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState<number | null>(null);
  const lastStatus = useRef<string | null>(null);

  // === ADDED/CHANGED FOR COLLECTING COUNTDOWN ===
  const [collectCountdown, setCollectCountdown] = useState<number | null>(null);
  // === END ADDED ===

  // --- Auth check (unchanged)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAdmin(false);
        setAuthChecked(true);
        router.replace("/sign-in");
      } else if (user.uid !== ADMIN_UID) {
        setIsAdmin(false);
        setAuthChecked(true);
        router.replace("/");
      } else {
        setIsAdmin(true);
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, [router]);

  // --- Quiz data (unchanged)
  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "liveQuizzes", quizId), (snap) => {
      if (!snap.exists()) {
        setQuiz(null);
        setLoading(false);
      } else {
        setQuiz({
          id: snap.id,
          ...snap.data(),
        } as Quiz);
        setLoading(false);
      }
    });
    return unsub;
  }, [quizId]);

  // --- Pubs (unchanged)
  useEffect(() => {
    if (!authChecked || !isAdmin) return;
    const fetchPubs = async () => {
      const pubsSnap = await getDocs(
        collection(db, "liveQuizzes", quizId, "pubs")
      );
      const pubsArr = pubsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Pub[];
      setPubs(pubsArr);
    };
    fetchPubs();
  }, [authChecked, isAdmin, quizId]);

  // === ADMIN COUNTDOWN DISPLAY ONLY (unchanged except collectCountdown lines added) ===
  useEffect(() => {
    if (!quiz) return;
    if (
      quiz.status === "countdown" &&
      lastStatus.current !== "countdown" &&
      countdownDisplay === null
    ) {
      setCountdownDisplay(30);
    }
    if (
      quiz.status === "locking" &&
      lastStatus.current !== "locking" &&
      lockCountdown === null
    ) {
      setLockCountdown(30);
    }
    // === ADDED FOR COLLECTING COUNTDOWN ===
    if (
      quiz.status === "collecting" &&
      lastStatus.current !== "collecting" &&
      collectCountdown === null
    ) {
      setCollectCountdown(30);
    }
    if (quiz.status !== "collecting" && collectCountdown !== null) {
      setCollectCountdown(null);
    }
    // === END ADDED ===
    if (quiz.status !== "countdown" && countdownDisplay !== null) {
      setCountdownDisplay(null);
    }
    if (quiz.status !== "locking" && lockCountdown !== null) {
      setLockCountdown(null);
    }
    lastStatus.current = quiz.status;
  }, [quiz, countdownDisplay, lockCountdown, collectCountdown]);
  // ← added collectCountdown to dependencies

  useEffect(() => {
    if (countdownDisplay === null) return;
    if (countdownDisplay === 0) {
      updateDoc(doc(db, "liveQuizzes", quizId), { status: "answering" });
      setCountdownDisplay(null);
      return;
    }
    const iv = setInterval(() => {
      setCountdownDisplay((p) => (p === null ? null : p - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [countdownDisplay, quizId]);

  // ========== LOCKING COUNTDOWN AND FIRESTORE UPDATE (unchanged) ==========
  useEffect(() => {
    if (lockCountdown === null) return;
    if (lockCountdown === 0) {
      // Update Firestore status to 'locked'
      updateDoc(doc(db, "liveQuizzes", quizId), { status: "locked" });
      setLockCountdown(null);
      return;
    }
    const iv = setInterval(() => {
      setLockCountdown((p) => (p === null ? null : p - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [lockCountdown, quizId]);

  // ========== COLLECTING COUNTDOWN AND FIRESTORE UPDATE ==========
  // === ADDED FOR COLLECTING COUNTDOWN ===
  useEffect(() => {
    if (collectCountdown === null) return;
    if (collectCountdown <= 0) {
      setCollectCountdown(null); // Stop timer
      // (Optional: trigger next stage)
      return;
    }
    const iv = setInterval(() => {
      setCollectCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearInterval(iv);
  }, [collectCountdown]);

  // === END ADDED ===

  // ---- Render guards (unchanged) ----
  if (!authChecked) {
    return <div className="text-center py-16">Checking admin permissions…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="text-center text-red-600 font-bold py-20">
        Not authorized
      </div>
    );
  }
  if (loading) {
    return <div className="text-center py-16">Loading dashboard…</div>;
  }
  if (!quiz) {
    return <div className="text-red-500 py-8 text-center">Quiz not found.</div>;
  }

  // ---- Multi-part/Stage logic (unchanged) ----
  const totalParts = quiz.parts?.length || 1;
  const currentPart = quiz.currentPart || 1;
  const quizStatus = quiz.status;

  // --- Admin Button Logic (unchanged) ---
  const adminButtons: {
    label: string;
    disabled: boolean;
    visible: boolean;
    onClick: () => Promise<void>;
  }[] = [];

  // [unchanged buttons for waiting/countdown/answering/locking...]

  if (quizStatus === "countdown") {
    adminButtons.push({
      label:
        countdownDisplay !== null
          ? `Countdown in progress… (${countdownDisplay})`
          : "Countdown in progress…",
      disabled: true,
      visible: true,
      onClick: async () => {},
    });
  }
  if (quizStatus === "answering") {
    adminButtons.push({
      label: "Lock Answers",
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "locking",
        });
      },
    });
  }
  if (quizStatus === "locking") {
    adminButtons.push({
      label:
        lockCountdown !== null
          ? `Locking in progress… (${lockCountdown})`
          : "Locking in progress…",
      disabled: true,
      visible: true,
      onClick: async () => {},
    });
  }
  if (quizStatus === "locked") {
    // assign + start marking as before
    adminButtons.push({
      label: "Assign Sheets For Marking",
      disabled: false,
      visible: true,
      onClick: async () => {
        try {
          await createMarkingTasks(db, quizId, currentPart);
          alert("Sheets assigned!");
        } catch (err) {
          console.error("Failed to create marking tasks", err);
          alert("Failed to create marking tasks. Check console / rules.");
        }
      },
    });
    adminButtons.push({
      label: "Start Marking",
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "marking",
        });
      },
    });
  }

  // **NEW**: under "marking", first a "Close Marking" step
  if (quizStatus === "marking") {
    adminButtons.push({
      label: "Close Marking",
      disabled: false,
      visible: true,
      onClick: async () => {
        // flip into our new "collecting" phase
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "collecting",
        });
      },
    });
  }

  // **UPDATED**: only once in "collecting" do we allow Show Leaderboard

  if (quizStatus === "collecting" || quizStatus === "loading-leaderboard") {
    let label;
    if (quiz.parts?.length > 1 && currentPart < quiz.parts.length) {
      label = "Show Current Leaderboard";
    } else {
      label = "Show Final Leaderboard";
    }
    adminButtons.push({
      label,
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "leaderboard",
        });
      },
    });
  }

  if (quizStatus === "waiting") {
    adminButtons.push({
      label: currentPart === 1 ? "Start Quiz" : `Start Part ${currentPart}`,
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "countdown",
          currentPart: currentPart,
        });
      },
    });
  }

  if (quizStatus === "leaderboard" && currentPart < totalParts) {
    adminButtons.push({
      label: `Start Next Part (${currentPart + 1})`,
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "countdown",
          currentPart: currentPart + 1,
        });
      },
    });
  }

  if (quizStatus === "leaderboard" && currentPart === totalParts) {
    adminButtons.push({
      label: "End Quiz",
      disabled: false,
      visible: true,
      onClick: async () => {
        await updateDoc(doc(db, "liveQuizzes", quizId), {
          status: "finished",
        });
      },
    });
  }

  // --- UI ---
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-purple-800 mb-8 text-center">
        Quizmaster Dashboard
      </h1>
      <div className="flex gap-8">
        {/* LEFT: Pubs + Stats */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          <AdminPubList pubs={pubs} />
          <AdminStatsPanel
            quiz={quiz}
            currentPart={quiz.currentPart}
            currentPubId={""}
            quizStatus={quiz.status}
          />
        </div>
        {/* RIGHT: Controls */}
        <div className="w-full max-w-xs flex-shrink-0">
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <AdminQuizHeader
              quiz={quiz}
              currentPart={currentPart}
              totalParts={totalParts}
              quizStatus={quizStatus}
            />
            <AdminControls adminButtons={adminButtons} />
            {/* === OPTIONAL: Show collecting countdown for admin too === */}
            {quizStatus === "collecting" && collectCountdown !== null && (
              <div className="text-center text-purple-700 font-bold mb-4">
                Collecting marked sheets… closing in {collectCountdown}s
              </div>
            )}
            {/* Show "Close Quiz & Remove Data" ONLY if quiz is finished */}
            {quizStatus === "finished" && (
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow mt-4 w-full"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Are you sure? This will delete all live answers and marking tasks for this quiz. Scores on the leaderboard will remain."
                    )
                  ) {
                    await cleanupQuizData(quiz.id);
                    alert("Quiz data cleaned up!");
                  }
                }}
              >
                Close Quiz & Remove Data
              </button>
            )}
          </div>
          <AdminRoundsInfo parts={getPartsArray(quiz)} />
        </div>
      </div>
    </div>
  );
}
