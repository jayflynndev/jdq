// app/lb-select/jvpqlb/page.tsx (or wherever your select page lives)
import Hero from "@/components/Hero";
import LBCard from "@/components/LBCard";

export default function LeaderboardSelectPage() {
  return (
    <div className="bg-gradient-to-t from-purple-800 to-purple-400">
      <Hero
        heroTitle="JDQ and JVPQ Leaderboards!"
        heroSubtitle="See your place against global players!"
        heroDescription=""
        heroImage="/public/images/HeroPH.jpg"
        heightClass="min-h-[300px] md:h-[600px]"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 px-4">
        <LBCard
          header="JDQ Leaderboard"
          subHeader="Jay's Daily Quiz"
          description="The Leader Board for the JDQ, add your scores each day to see how you have done against other players!"
          className="bg-gradient-to-r from-blue-500 to-blue-700"
          href="/lb-select/jdqlb"
        />
        <LBCard
          header="JVPQ Leaderboard"
          subHeader="Start Sharing Your Scores!"
          description="Thursday and Saturday official Leaderboards are here at last! Sign up above, and then you can share your scores for a Thursday or Saturday quiz, whether you watch live, pre-recorded, or on catchup!"
          className="bg-gradient-to-r from-emerald-500 to-emerald-700"
          href="/lb-select/jvpqlb"
        />
      </div>
    </div>
  );
}
