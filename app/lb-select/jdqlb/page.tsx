import JDQLeaderboardTabs from "@/components/JDQLeaderboardTabs";
import Section from "@/components/Section";

export default function JDQLeaderboardPage() {
  return (
    <Section
      bgClass="relative bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900"
      pyClass="py-10 sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 text-center text-black">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          JDQ Leaderboards
        </h1>

        <p className="mt-3 text-sm sm:text-base text-black/90">
          View placements for the Daily Quiz. New month boards appear once a
          user has <span className="font-semibold">5 scores</span> added.
        </p>

        <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-white/15 bg-white text-textc shadow-card">
          <JDQLeaderboardTabs quizType="JDQ" />
        </div>
      </div>
    </Section>
  );
}
