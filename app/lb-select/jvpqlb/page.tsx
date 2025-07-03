import JVQLeaderboardTabs from "@/components/JVQLeaderboardTabs";
import Section from "@/components/Section";

export default function JVQLeaderboardPage() {
  return (
    <Section
      bgClass="relative bg-gradient-to-t from-primary-200 to-primary-900"
      pyClass="py-12"
    >
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl text-yellow-500 font-bold mb-2">
          JVQ Leaderboards
        </h1>
        <p className="text-lg text-yellow-400 mb-6">
          View your placement in the Live Quiz rankings. <br />
          Separate leaderboards for Thursday, Saturday, and combined scores.
        </p>

        <JVQLeaderboardTabs />
      </div>
    </Section>
  );
}
