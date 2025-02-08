"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";

export default function AddScore() {
  const [quizDate, setQuizDate] = useState("");
  const [score, setScore] = useState("");
  const [tiebreaker, setTiebreaker] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch the user's username from Firestore
        const fetchUsername = async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              setUsername(userDoc.data().username);
            }
          } catch (error) {
            console.error("Error fetching username:", error);
            setError("Failed to fetch username. Please try again.");
          }
        };
        fetchUsername();
      } else {
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated");
        return;
      }

      await setDoc(doc(db, "scores", `${user.uid}_${quizDate}`), {
        uid: user.uid,
        username: username,
        quizDate: quizDate,
        score: parseInt(score),
        tiebreaker: parseInt(tiebreaker),
      });

      router.push("/leaderboard");
    } catch (error) {
      console.error("Error adding score:", error);
      setError("Failed to add score. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Add Score</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 bg-white rounded shadow-md"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="quizDate"
          >
            Pick Quiz Date
          </label>
          <input
            type="date"
            id="quizDate"
            value={quizDate}
            onChange={(e) => setQuizDate(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="score"
          >
            Enter Your Score (Out of 5)
          </label>
          <input
            type="number"
            id="score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            min="0"
            max="5"
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="tiebreaker"
          >
            Enter Your Tiebreaker Score (this is the amount you were away from
            it)
          </label>
          <input
            type="number"
            id="tiebreaker"
            value={tiebreaker}
            onChange={(e) => setTiebreaker(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            min="0"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
        >
          Submit Score
        </button>
      </form>
    </div>
  );
}
