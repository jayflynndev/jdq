import JDQLeaderboardTabs from "@/components/JDQLeaderboardTabs";
import Section from "@/components/Section";

export default function JDQLeaderboardPage() {
  return (
    <Section
      bgClass="relative bg-gradient-to-t from-primary-200 to-primary-900"
      pyClass="py-8"
    >
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl text-yellow-500 font-bold mb-2">
          JDQ Leaderboards
        </h1>
        <p className="text-lg text-yellow-300 mb-6">
          View your placement in the Daily Quiz rankings. <br /> At the start of
          a new month, the leaderboard will begin once <br /> a minimum of 5
          scores from a user are added
        </p>

        <JDQLeaderboardTabs quizType="JDQ" />
      </div>
    </Section>
  );
}
