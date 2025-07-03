import JVQLeaderboardTabs from "@/components/JVQLeaderboardTabs";

export default function JVQLeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-purple-800 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-2">JVQ Leaderboards</h1>
        <p className="text-lg text-blue-100 mb-6">
          View your placement in the Live Quiz rankings. <br />
          Separate leaderboards for Thursday, Saturday, and combined scores.
        </p>

        <JVQLeaderboardTabs />
      </div>
    </div>
  );
}
