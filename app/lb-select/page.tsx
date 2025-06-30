import HomeHero from "@/components/Hero";
import LBCard from "@/components/LBCard";

export default function LeaderboardSelectPage() {
  return (
    <div className="bg-gradient-to-t from-purple-800 to-purple-400 z-50">
      <HomeHero
        heroTitle="JDQ and JVPQ Leaderboards!"
        heroSubtitle="See your place against global players!"
        heroDescription="The leader-boards for both Daily Quiz JDQ and bi-weekly quiz JVPQ. See how you stack up against players around the world! Pick the leader-board you want to checkout"
        heroImage="/images/HeroPH.jpg"
        heightClass="h-[600px] min-h-[300px]"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 px-4">
        <LBCard
          header="JDQ Leaderboard"
          subHeader="Daily Quiz"
          description="The Leader Board for the Daily Podcast Quiz!"
          className="bg-gradient-to-r from-blue-500 to-blue-700"
          href="/lb-select/jdqlb"
        />
        <LBCard
          header="*COMING SOON*"
          subHeader="JVPQ Leader Board"
          description="The Leader Board for the Bi-Weekly YouTube Quiz!"
          className="bg-gradient-to-r from-emerald-500 to-emerald-700"
          href="/lb-select/jvpqlb"
        />
      </div>
    </div>
  );
}
