"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { fetchUsername } from "@/utils/fetchUsername";
import { fetchScores } from "@/utils/fetchScores";
import { fetchLeaderboardData } from "@/utils/fetchLeaderboardData";
import { calculateAverages } from "@/utils/calculateAverages";
import ProfileForm from "@/components/profileForm";

interface DataItem {
  username: string;
  // Add other properties of DataItem if needed
}

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

export default function Profile() {
  const [scores, setScores] = useState<Score[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [allTimeAverage, setAllTimeAverage] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [showAllScores, setShowAllScores] = useState(false);
  const [weeklyPosition, setWeeklyPosition] = useState<number | null>(null);
  const [monthlyPosition, setMonthlyPosition] = useState<number | null>(null);
  const [allTimePosition, setAllTimePosition] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email || "");
        try {
          const username = await fetchUsername(user.uid);
          setUsername(username);

          const scoresData = await fetchScores(user.uid);
          // Sort scores by date in descending order
          const sortedScores = scoresData.sort(
            (a, b) =>
              new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime()
          );
          setScores(sortedScores || []);
          const averages = calculateAverages(sortedScores || []);
          setWeeklyAverage(averages.weeklyAverage);
          setMonthlyAverage(averages.monthlyAverage);
          setAllTimeAverage(averages.allTimeAverage);

          const { weeklyData, monthlyData, allTimeData } =
            await fetchLeaderboardData(
              new Date().toISOString().split("T")[0],
              new Date(
                new Date().setDate(new Date().getDate() - new Date().getDay())
              ),
              new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
              new Date(0),
              new Date()
            );

          const findPosition = (data: DataItem[], username: string) => {
            return data.findIndex((user) => user.username === username) + 1;
          };

          setWeeklyPosition(findPosition(weeklyData, username));
          setMonthlyPosition(findPosition(monthlyData, username));
          setAllTimePosition(findPosition(allTimeData, username));
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError("An unknown error occurred");
          }
        }
      } else {
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const displayedScores = showAllScores ? scores : scores.slice(0, 5);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">
        {username}, welcome to your profile
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              {username}&apos;s Averages
            </h2>
            <table className="min-w-full bg-white border-collapse text-center">
              <thead>
                <tr>
                  <th className="py-2 border border-gray-300"></th>
                  <th className="py-2 border border-gray-300">Weekly</th>
                  <th className="py-2 border border-gray-300">Monthly</th>
                  <th className="py-2 border border-gray-300">All Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 border border-gray-300">Averages</td>
                  <td className="py-2 border border-gray-300">
                    {weeklyAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border border-gray-300">
                    {monthlyAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border border-gray-300">
                    {allTimeAverage.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 border border-gray-300">Position</td>
                  <td className="py-2 border border-gray-300">
                    {weeklyPosition !== null ? weeklyPosition : "Loading..."}
                  </td>
                  <td className="py-2 border border-gray-300">
                    {monthlyPosition !== null ? monthlyPosition : "Loading..."}
                  </td>
                  <td className="py-2 border border-gray-300">
                    {allTimePosition !== null ? allTimePosition : "Loading..."}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              {username}&apos;s Scores
            </h2>
            <table className="min-w-full bg-white border-collapse text-center">
              <thead>
                <tr>
                  <th className="py-2 border border-gray-300">Date</th>
                  <th className="py-2 border border-gray-300">Score</th>
                  <th className="py-2 border border-gray-300">Tiebreaker</th>
                </tr>
              </thead>
              <tbody>
                {displayedScores.map((score, index) => (
                  <tr key={index} className="text-center">
                    <td className="py-2 border border-gray-300">
                      {score.quizDate}
                    </td>
                    <td className="py-2 border border-gray-300">
                      {score.score.toFixed(2)}
                    </td>
                    <td className="py-2 border border-gray-300">
                      {score.tiebreaker.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scores.length > 5 && (
              <button
                onClick={() => setShowAllScores(!showAllScores)}
                className="mt-4 text-blue-500 hover:underline"
              >
                {showAllScores ? "Show Less" : "Show All"}
              </button>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
          <h3 className="text-lg font-semibold mb-4">
            Update details if required
          </h3>
          <ProfileForm
            email={email}
            username={username}
            currentPassword={currentPassword}
            setEmail={setEmail}
            setUsername={setUsername}
            setCurrentPassword={setCurrentPassword}
            setError={setError}
          />
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
