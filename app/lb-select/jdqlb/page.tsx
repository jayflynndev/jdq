import LeaderboardTabs from "@/components/LeaderboardTabs";

export default function JDQLeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-purple-800 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-2">JDQ Leaderboards</h1>
        <p className="text-lg text-blue-100 mb-6">
          View your placement in the Daily Quiz rankings. <br /> At the start of
          a new month, the leaderboard will begin once <br /> a minimum of 5
          scores from a user are added
        </p>

        <LeaderboardTabs quizType="JDQ" />
      </div>
    </div>
  );
}
