import React from "react";

type DataItem = {
  username: string;
  score: number;
  tiebreaker: number;
  quizzesPlayed?: number;
};

interface LeaderboardProps {
  title: string;
  data: DataItem[];
  startDate: Date;
  endDate: Date;
  showQuizzesPlayed: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  title,
  data = [],

  showQuizzesPlayed,
}) => {
  const displayedData = data.slice(0, 10);
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <table className="min-w-full bg-white border-collapse text-center">
        <thead>
          <tr>
            <th className="py-2 border border-gray-300">Username</th>
            <th className="py-2 border border-gray-300">Score</th>
            <th className="py-2 border border-gray-300">Tiebreaker</th>
            {showQuizzesPlayed && (
              <th className="py-2 border border-gray-300">Quizzes Played</th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((item, index) => (
            <tr key={index}>
              <td className="py-2 border border-gray-300">{item.username}</td>
              <td className="py-2 border border-gray-300">
                {item.score.toFixed(2)}
              </td>
              <td className="py-2 border border-gray-300">
                {item.tiebreaker.toFixed(2)}
              </td>
              {showQuizzesPlayed && (
                <td className="py-2 border border-gray-300">
                  {item.quizzesPlayed}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
