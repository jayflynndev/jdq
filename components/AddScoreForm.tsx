"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";

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
  const [loading, setLoading] = useState(false);

  // Load user and username on mount
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

  // Main handler
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

    // Check if already submitted for this date/type
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

    // Weekday logic
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
    // Only allow after 8:30 PM on quiz day (JVQ)
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

    // Save to Supabase
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
      setScore("");
      setTiebreaker("");
      onScoreSubmitted();
    } catch (err: any) {
      toast.error("Failed to add score. " + (err?.message || ""));
      console.error(err);
    }
    setLoading(false);
  };

  const maxScore = quizType === "JDQ" ? 5 : 50;

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Your Score</h2>
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
            max={new Date().toISOString().split("T")[0]}
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
            Tiebreaker (difference between your answer and correct answer)
          </label>
          <input
            type="number"
            id="tiebreaker"
            value={tiebreaker}
            onChange={(e) => setTiebreaker(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            min="0"
            max="1000"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
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
