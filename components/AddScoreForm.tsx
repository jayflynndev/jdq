"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";

interface AddScoreFormProps {
  onScoreSubmitted: () => void;
}

export default function AddScoreForm({ onScoreSubmitted }: AddScoreFormProps) {
  const [quizDate, setQuizDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [score, setScore] = useState("");
  const [tiebreaker, setTiebreaker] = useState("");
  const [username, setUsername] = useState("");
  const [quizType, setQuizType] = useState("JDQ");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
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
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated");
      return;
    }

    const docRef = doc(db, "scores", `${user.uid}_${quizDate}_${quizType}`);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      setError("You've already submitted a score for this date and quiz.");
      return;
    }

    try {
      await setDoc(docRef, {
        uid: user.uid,
        username,
        quizDate,
        score: parseInt(score),
        tiebreaker: parseInt(tiebreaker),
        quizType,
      });

      setSuccess("Score successfully submitted!");
      setScore("");
      setTiebreaker("");
    } catch (err) {
      console.error("Error adding score:", err);
      setError("Failed to add score. Please try again.");
    }
  };

  const maxScore = quizType === "JDQ" ? 5 : 50;

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Your Score</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="text-green-600 font-semibold mb-4">{success}</p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Quiz Date */}
        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="quizDate">
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

        {/* Quiz Type */}
        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="quizType">
            Select Quiz Type
          </label>
          <select
            id="quizType"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="JDQ">JDQ (Daily Quiz)</option>
            <option value="JVQ">JVQ (Live YouTube Quiz)</option>
          </select>
        </div>

        {/* Score */}
        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="score">
            Score (Max {maxScore})
          </label>
          <input
            type="number"
            id="score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            min="0"
            max={maxScore}
            required
          />
        </div>

        {/* Tiebreaker */}
        <div className="mb-6">
          <label className="block font-semibold mb-1" htmlFor="tiebreaker">
            Tiebreaker (points you were away)
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

        {/* Buttons */}
        <div className="flex justify-between gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onScoreSubmitted}
            className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
