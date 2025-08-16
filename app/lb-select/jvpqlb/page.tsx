import JVQLeaderboardTabs from "@/components/JVQLeaderboardTabs";
import Section from "@/components/Section";

export default function JVQLeaderboardPage() {
  return (
    <Section
      bgClass="relative bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900"
      pyClass="py-10 sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 text-center text-white">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          JVQ Leaderboards
        </h1>
        <p className="mt-3 text-sm sm:text-base text-black/90">
          View your placement in the Live Quiz rankings. <br />
          Separate leaderboards for Thursday, Saturday, and combined scores.
          <br />
          Minimum 5 scores required for All-Time Leaderboards.
        </p>

        <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-white/15 bg-white text-textc shadow-card">
          <JVQLeaderboardTabs />
        </div>
      </div>
    </Section>
  );
}
