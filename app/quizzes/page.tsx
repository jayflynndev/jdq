"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/app/firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { QuizCard } from "@/components/liveQuiz/QuizCard";

import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";

// --- Types ---
type Pub = {
  pubId: string;
  name: string;
  members: string[];
  maxTeams?: number;
};
type LiveQuiz = {
  id: string;
  title: string;
  startTime: string;
  status: "live" | "upcoming" | "finished";
  locked: boolean;
  livestreamUrl: string;
  pubIds?: string[];
  pubs?: Pub[]; // We'll fill this in code below
};
type UserDoc = {
  uid: string;
  username: string;
  quizMembership: { [quizId: string]: string };
  isAdmin?: boolean;
};

export default function QuizListPage() {
  const [authUser, loadingAuthUser] = useAuthState(auth);
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userDocLoading, setUserDocLoading] = useState(true);
  const [userStats, setUserStats] = useState<{
    [quizId: string]: {
      score: number;
      pubPosition: number;
      globalPosition: number;
    };
  }>({});
  const [uidToUsername, setUidToUsername] = useState<{ [uid: string]: string }>(
    {}
  );

  const router = useRouter();
  // 1. Listen to quizzes, then fetch pub details for each
  useEffect(() => {
    setLoadingQuizzes(true);

    const unsubQuiz = onSnapshot(collection(db, "liveQuizzes"), (quizSnap) => {
      const quizArr = quizSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LiveQuiz[];

      const pubUnsubs: Unsubscribe[] = [];
      const quizMap: { [quizId: string]: LiveQuiz } = {};

      quizArr.forEach((quiz) => {
        quizMap[quiz.id] = { ...quiz, pubs: [] };

        const unsubPubs = onSnapshot(
          collection(db, "liveQuizzes", quiz.id, "pubs"),
          (pubsSnap) => {
            const pubs: Pub[] = pubsSnap.docs.map((doc) => {
              const data = doc.data();
              return {
                pubId: doc.id,
                name: data.name || "",
                members: Array.isArray(data.members) ? data.members : [],
                maxTeams: data.maxTeams || 10,
              };
            });
            quizMap[quiz.id].pubs = pubs;
            setQuizzes(Object.values(quizMap));
          }
        );
        pubUnsubs.push(unsubPubs);
      });

      setLoadingQuizzes(false);

      return () => {
        pubUnsubs.forEach((unsub) => unsub());
      };
    });

    return () => unsubQuiz();
  }, []);

  useEffect(() => {
    const allUids = Array.from(
      new Set(
        quizzes
          .flatMap((quiz) => quiz.pubs || [])
          .flatMap((pub) => pub.members || [])
      )
    );
    if (allUids.length === 0) return;
    const fetchUsernames = async () => {
      const uidMap: { [uid: string]: string } = {};
      await Promise.all(
        allUids.map(async (uid) => {
          if (uidToUsername[uid]) {
            uidMap[uid] = uidToUsername[uid];
            return;
          }
          const userSnap = await getDoc(doc(db, "users", uid));
          uidMap[uid] = userSnap.exists()
            ? userSnap.data().username || uid
            : uid;
        })
      );
      setUidToUsername((prev) => ({ ...prev, ...uidMap }));
    };
    fetchUsernames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes]);

  // User Firestore doc
  useEffect(() => {
    if (!authUser) {
      setUserDoc(null);
      setUserDocLoading(false);
      return;
    }
    setUserDocLoading(true);
    getDoc(doc(db, "users", authUser.uid))
      .then((snap) => {
        if (!snap.exists()) {
          setUserDoc(null);
        } else {
          const data = snap.data();
          setUserDoc({
            uid: authUser.uid,
            username: data.username || "",
            quizMembership: data.quizMembership || {},
            isAdmin: data.isAdmin || false,
          });
        }
        setUserDocLoading(false);
      })
      .catch(() => setUserDocLoading(false));
  }, [authUser]);

  useEffect(() => {
    async function fetchUserStats() {
      if (!authUser || !userDoc) return;
      const stats: {
        [quizId: string]: {
          score: number;
          pubPosition: number;
          globalPosition: number;
        };
      } = {};

      for (const quiz of quizzes) {
        if (quiz.status === "finished") {
          const currentPubId = userDoc.quizMembership?.[quiz.id];
          if (!currentPubId) continue;

          // Fetch all scores for this quiz and user (all parts!)
          const scoreSnap = await getDocs(collection(db, "liveScores"));

          // 1. Get all this user's scores for this quiz (all parts)
          let userTotalScore = 0;
          const userScoresForQuiz: any[] = [];
          const allScoresForQuiz: any[] = [];
          scoreSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.quizId === quiz.id) {
              allScoresForQuiz.push(data);
              if ((data.targetUid || data.userId) === authUser.uid) {
                userScoresForQuiz.push(data);
                userTotalScore += data.score ?? 0;
              }
            }
          });

          // 2. Combine scores per user for this quiz
          const userTotals: Record<
            string,
            {
              name: string;
              pubId: string;
              pubName?: string;
              totalScore: number;
            }
          > = {};
          allScoresForQuiz.forEach((data) => {
            const key = data.targetUid || data.userId;
            if (!userTotals[key]) {
              userTotals[key] = {
                name: data.targetUsername || key,
                pubId: data.pubId,
                pubName: data.pubName,
                totalScore: 0,
              };
            }
            userTotals[key].totalScore += data.score ?? 0;
          });

          // 3. Sorted lists for leaderboard
          const leaderboard = Object.values(userTotals).sort(
            (a, b) => b.totalScore - a.totalScore
          );

          // 4. Find this user's pub leaderboard
          const pubLeaderboard = Object.values(userTotals)
            .filter((u) => u.pubId === currentPubId)
            .sort((a, b) => b.totalScore - a.totalScore);

          // 5. Positions
          const username = userDoc.username || authUser.uid;
          // Try to find by username, then fallback to UID
          // Removed unused variable 'myEntry'
          const pubEntryIdx = pubLeaderboard.findIndex(
            (u) => u.name === username || u.name === authUser.uid
          );
          const globalEntryIdx = leaderboard.findIndex(
            (u) => u.name === username || u.name === authUser.uid
          );

          stats[quiz.id] = {
            score: userTotalScore,
            pubPosition: pubEntryIdx >= 0 ? pubEntryIdx + 1 : 0,
            globalPosition: globalEntryIdx >= 0 ? globalEntryIdx + 1 : 0,
          };
        }
      }
      setUserStats(stats);
    }
    fetchUserStats();
  }, [authUser, userDoc, quizzes]);

  // --- Handler stubs ---
  const handleRejoin = (quizId: string, pubId: string) => {
    router.push(`/quizzes/${quizId}/pubs/${pubId}`);
  };
  const handleLock = (quizId: string) => {
    alert(`Lock/Unlock quiz: ${quizId}`);
  };
  const handleJoinPub = async (quizId: string, pubId: string) => {
    if (!authUser) return;
    try {
      // 1. Add user to this quiz's pub
      const pubRef = doc(db, "liveQuizzes", quizId, "pubs", pubId);
      const pubSnap = await getDoc(pubRef);

      if (pubSnap.exists()) {
        await updateDoc(pubRef, {
          members: arrayUnion(authUser.uid),
        });
      } else {
        await setDoc(pubRef, {
          name: pubId, // or a user-friendly name if you want
          members: [authUser.uid],
          maxTeams: 10,
        });
      }

      // 2. Update user's quizMembership (still the same)
      const userRef = doc(db, "users", authUser.uid);
      await updateDoc(userRef, {
        [`quizMembership.${quizId}`]: pubId,
      });

      router.push(`/quizzes/${quizId}/pubs/${pubId}`);
    } catch (err) {
      alert("Failed to join pub: " + (err as Error).message);
    }
  };
  const handleJoinRandomPub = (quizId: string) => {
    // Find the quiz from state
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz || !quiz.pubs) return;
    // Filter available pubs
    const availablePubs = quiz.pubs.filter(
      (pub) => pub.members.length < (pub.maxTeams || 10)
    );
    if (availablePubs.length === 0) {
      alert("No available pubs!");
      return;
    }
    // Pick a random one
    const randomPub =
      availablePubs[Math.floor(Math.random() * availablePubs.length)];
    handleJoinPub(quizId, randomPub.pubId);
  };

  // --- Loading and no-user states ---
  if (loadingQuizzes || loadingAuthUser || userDocLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-100 to-white">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h1 className="font-extrabold text-3xl text-purple-800 mb-8 text-center">
            Live & Upcoming Quizzes
          </h1>
          <div className="text-center py-10 text-gray-500">
            Loading quizzes…
          </div>
        </div>
      </main>
    );
  }
  if (!authUser) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <div className="text-lg text-gray-600">
          Please sign in to join a quiz.
        </div>
      </main>
    );
  }
  if (!userDoc) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <div className="text-lg text-gray-600">
          User profile not found. Please contact support.
        </div>
      </main>
    );
  }

  // --- Main Render ---
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-white">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="font-extrabold text-3xl text-purple-800 mb-8 text-center">
          Live & Upcoming Quizzes
        </h1>
        {quizzes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No quizzes found.
          </div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              user={{
                uid: userDoc.uid,
                username: userDoc.username,
                isAdmin: !!userDoc.isAdmin,
                quizMembership: userDoc.quizMembership || {},
              }}
              onJoinPub={handleJoinPub}
              onJoinRandomPub={handleJoinRandomPub}
              onRejoin={handleRejoin}
              onLock={handleLock}
              stats={userStats[quiz.id]}
              uidToUsername={uidToUsername}
            />
          ))
        )}
      </div>
    </main>
  );
}
