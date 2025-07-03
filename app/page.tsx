import AdBanner from "@/components/AdBanner";
import HomeHero from "@/components/Hero";
import HomeCard from "@/components/HomeCard";
import { FaClipboardList, FaTrophy } from "react-icons/fa";

export default function Home() {
  return (
    <div
      className="bg-gradient-to-t from-purple-900 to-purple-200
     text-white"
    >
      <HomeHero
        heroTitle="Welcome to Jay's Quiz Hub!"
        heroSubtitle="Quiz Recaps & JDQ Leaderboards"
        heroDescription="From quick dailies to the big screen experience—relive Thursday & Saturday’s epic quizzes, view your scores, and climb the leaderboard!"
        heroImage="/images/HeroPH.jpg"
        heightClass="min-h-[600px]"
        overlay={true}
      />

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <HomeCard
          title="Quiz Recap"
          description="Thursday and Saturday Recaps are available here! Use the code from the stream to access!"
          href="/quiz-recap"
          icon={<FaClipboardList />}
        />

        <HomeCard
          title="JDQ Leaderboards"
          description="Check daily, weekly, monthly, and all-time JDQ scores. Logged in? Add your own!"
          href="/lb-select/jdqlb"
          icon={<FaTrophy />}
        />
      </div>

      <AdBanner />
    </div>
  );
}
