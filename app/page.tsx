import AdBanner from "@/components/AdBanner";
import HomeHero from "@/components/Hero";
import HomeCard from "@/components/HomeCard";

export default function Home() {
  return (
    <div className="bg-gradient-to-t from-purple-800 to-purple-400 z-50">
      <HomeHero
        heroTitle="Welcome to Jay's Quiz Hub!"
        heroSubtitle="Quiz Recap, or JDQ Leaderboards!"
        heroDescription="Previously the home of just JDQ the invasion of the long form has begun! Now you can find the recap for the Thursday and Saturdays quiz all here in one place! You do not need to register to view the recap or leaderboards, only if you want to add your JDQ scores."
        heroImage="public/images/HeroPH.jpg"
        heightClass="h-auto md:h-[600px]"
      />
      <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <HomeCard
          title="Quiz Recap"
          description="Thursday and Saturday Recaps are available here! Remember you can only access the parts with the code from the stream!"
          href="/quiz-recap"
        />
        <HomeCard
          title="JDQ Leaderboards"
          description="JDQ Leaderboards are here! Check the daily, weekly, monthly and all time scores! And if you are logged in add your own!"
          href="/lb-select/jdqlb"
        />
      </div>
      <AdBanner />
    </div>
  );
}
