"use client";
import { useState, useEffect } from "react";

interface DataItem {
  username: string;
  score: number;
  tiebreaker: number;
}

interface LeaderboardProps {
  title: string;
  data: DataItem[];
  period?: number;
  startDate?: Date;
  endDate?: Date;
  isMonthly?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ title, data }) => {
  const [sortedData, setSortedData] = useState<DataItem[]>([]);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (a.score === b.score) {
        return a.tiebreaker - b.tiebreaker;
      }
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Rank</th>
            <th className="py-2">Username</th>
            <th className="py-2">Score</th>
            <th className="py-2">Tiebreaker</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.slice(0, 3).map((item, index) => (
            <tr key={index} className="text-center">
              <td className="py-2">{index + 1}</td>
              <td className="py-2">{item.username}</td>
              <td className="py-2">{item.score.toFixed(2)}</td>
              <td className="py-2">{item.tiebreaker.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
