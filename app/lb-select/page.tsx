// app/lb-select/jvpqlb/page.tsx (or wherever your select page lives)
import HomeHero from "@/components/Hero";
import LBCard from "@/components/LBCard";
import Section from "@/components/Section";

export default function LeaderboardSelectPage() {
  return (
    <Section
      bgClass="relative bg-gradient-to-t from-primary-200 to-primary-900"
      pxClass="px-0"
      pyClass="py-0"
    >
      <HomeHero
        heroTitle="JDQ and JVQ Leaderboards!"
        heroSubtitle="What is your position on the Leaderboard?"
        heroDescription="Now you can add your score to all the leader boards! Whether you play the JDQ, or the Thursday/Saturday quizzes, you can now share your scores with the world! (Remember, you need to create an account to be able to add your scores!"
        heroImage="/images/HeroPH.jpg"
        heightClass="min-h-[600px]"
        overlay={true}
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
    </Section>
  );
}
