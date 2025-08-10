"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType, Score } from "@/utils/fetchScoresByType";

// Monday as start-of-week (adjust if you prefer Sunday)
function getWeekRange(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const toIso = (x: Date) => x.toISOString().slice(0, 10);
  return { from: toIso(start), to: toIso(end) };
}

type Row = {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
};

export default function WeeklyLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: string;
  searchedUsername?: string;
}) {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Row | null>(null);

  useEffect(() => {
    const run = async () => {
      const { from, to } = getWeekRange(selectedDate);
      const data = await fetchScoresByType(quizType, { from, to });

      // group by username
      const map = new Map<string, Score[]>();
      for (const s of data) {
        const key = s.username || "Unknown";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      }

      // averages (null-safe)
      const agg: Row[] = [];
      for (const [username, list] of map) {
        const scores = list.map((x) => x.score ?? 0);
        const tbs = list.map((x) => x.tiebreaker ?? Number.POSITIVE_INFINITY);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
        const avgTb =
          tbs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) /
            tbs.filter((x) => Number.isFinite(x)).length ||
          Number.POSITIVE_INFINITY;

        agg.push({
          username,
          averageScore: Math.round(avgScore * 100) / 100,
          averageTiebreaker: Number.isFinite(avgTb)
            ? Math.round(avgTb * 100) / 100
            : 999999,
        });
      }

      // sort: score desc, tb asc
      agg.sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker ||
          a.username.localeCompare(b.username)
      );

      setRows(agg);

      if (searchedUsername) {
        const idx = agg.findIndex(
          (u) => u.username.toLowerCase() === searchedUsername.toLowerCase()
        );
        setUserIndex(idx !== -1 ? idx : null);
        setUserScore(idx !== -1 ? agg[idx] : null);
      } else {
        setUserIndex(null);
        setUserScore(null);
      }
    };
    run();
  }, [quizType, selectedDate, searchedUsername]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap">
        <label className="text-white font-semibold">
          Select a date within the week:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="ml-2 px-2 py-1 rounded text-black"
          />
        </label>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowFull((p) => !p)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          {userIndex !== null && userIndex < 10 ? (
            <p className="font-bold mb-1">🎉 You’re in the top 10 this week:</p>
          ) : (
            <p className="font-bold mb-1">
              You’re not in the top 10, but here’s your weekly ranking:
            </p>
          )}
          <p>
            <strong>#{(userIndex ?? 0) + 1}</strong> – {userScore.username} –{" "}
            {userScore.averageScore} avg (Tiebreak avg:{" "}
            {userScore.averageTiebreaker})
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-black rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="py-2 px-4">Position</th>
              <th className="py-2 px-4">Username</th>
              <th className="py-2 px-4">Avg Score</th>
              <th className="py-2 px-4">Avg Tiebreak</th>
            </tr>
          </thead>
          <tbody>
            {(showFull ? rows : rows.slice(0, 10)).map((u, i) => (
              <tr
                key={u.username}
                className={`border-t border-gray-300 text-center ${
                  searchedUsername &&
                  u.username.toLowerCase() === searchedUsername.toLowerCase()
                    ? "bg-green-100 font-bold"
                    : ""
                }`}
              >
                <td className="py-2 px-4 font-bold">#{i + 1}</td>
                <td className="py-2 px-4">{u.username}</td>
                <td className="py-2 px-4">{u.averageScore}</td>
                <td className="py-2 px-4">{u.averageTiebreaker}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-white text-center mt-4">No scores this week.</p>
        )}
      </div>
    </div>
  );
}
