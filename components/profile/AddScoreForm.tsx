"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";

interface AddScoreFormProps {
  onScoreSubmitted: () => void;
}

const LS_KEY = "addScore.lastDate";

export default function AddScoreForm({ onScoreSubmitted }: AddScoreFormProps) {
  // Init from localStorage (fallback to today)
  const [quizDate, setQuizDate] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return saved;
    }
    return new Date().toISOString().split("T")[0];
  });

  const [score, setScore] = useState("");
  const [tiebreaker, setTiebreaker] = useState("");
  const [username, setUsername] = useState("");
  const [quizType, setQuizType] = useState<"JDQ" | "JVQ">("JDQ");
  const [loading, setLoading] = useState(false);

  // Persist date whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, quizDate);
    } catch {}
  }, [quizDate]);

  // Load user + username
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in.");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "");
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not authenticated.");
      setLoading(false);
      return;
    }

    // prevent duplicates by date/type
    const { data: existing, error: checkError } = await supabase
      .from("scores")
      .select("id")
      .eq("uid", user.id)
      .eq("quiz_date", quizDate)
      .eq("quiz_type", quizType)
      .maybeSingle();

    if (existing) {
      toast.error("You've already submitted a score for this date and quiz.");
      setLoading(false);
      return;
    }
    if (checkError && checkError.code !== "PGRST116") {
      toast.error("Could not check for duplicate: " + checkError.message);
      setLoading(false);
      return;
    }

    // JVQ day rules
    const dayOfWeek = new Date(quizDate).toLocaleDateString("en-GB", {
      weekday: "long",
    });
    const isJVQ = quizType === "JVQ";
    const dayType =
      isJVQ && (dayOfWeek === "Thursday" || dayOfWeek === "Saturday")
        ? dayOfWeek
        : null;

    if (isJVQ && !dayType) {
      toast.error("JVQ scores can only be submitted for Thursday or Saturday.");
      setLoading(false);
      return;
    }
    if (isJVQ && quizDate === new Date().toISOString().split("T")[0]) {
      const now = new Date();
      const currentTime = now.getHours() + now.getMinutes() / 60;
      if (currentTime < 20.5) {
        toast.error(
          "You can only submit JVQ scores after 8:30 PM on quiz day."
        );
        setLoading(false);
        return;
      }
    }

    // Save
    try {
      const { error } = await supabase.from("scores").insert([
        {
          uid: user.id,
          username,
          quiz_date: quizDate,
          score: parseInt(score),
          tiebreaker: parseInt(tiebreaker),
          quiz_type: quizType,
          ...(isJVQ ? { day_type: dayType } : {}),
        },
      ]);
      if (error) throw error;
      toast.success("Score successfully submitted!");

      // Clear only the inputs; keep the chosen date intact
      setScore("");
      setTiebreaker("");

      // You currently navigate to "Your Scores" after submit:
      onScoreSubmitted();
      // When the user returns to Add Score, the date will be restored from localStorage.
    } catch (err: any) {
      toast.error("Failed to add score. " + (err?.message || ""));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxScore = quizType === "JDQ" ? 5 : 50;

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-inverted/60 p-6 rounded-xl border borderc shadow-card">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Your Score</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="quizDate">
            Pick Quiz Date
          </label>
          <input
            type="date"
            id="quizDate"
            value={quizDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setQuizDate(e.target.value)}
            className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="quizType">
            Select Quiz Type
          </label>
          <select
            id="quizType"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value as "JDQ" | "JVQ")}
            className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
          >
            <option value="JDQ">JDQ (Daily Quiz)</option>
            <option value="JVQ">JVQ (Live YouTube Quiz)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1" htmlFor="score">
            Score (Max {maxScore})
          </label>
          <input
            type="number"
            id="score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
            min="0"
            max={maxScore}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-1" htmlFor="tiebreaker">
            Tiebreaker (difference between your answer and correct answer)
          </label>
          <input
            type="number"
            id="tiebreaker"
            value={tiebreaker}
            onChange={(e) => setTiebreaker(e.target.value)}
            className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
            min="0"
            max="1000"
            required
          />
        </div>

        <div className="flex justify-between gap-4">
          <button
            type="submit"
            className="flex-1 bg-brand text-white font-bold py-2 px-4 rounded hover:opacity-90 shadow-card"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onScoreSubmitted}
            className="flex-1 border borderc text-textc font-bold py-2 px-4 rounded hover:bg-brand/10"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
