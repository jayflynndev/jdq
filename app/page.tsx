// app/page.tsx
import Section from "../components/Section";
import HomeHero from "../components/Hero";
import HomeCard from "../components/HomeCard";
import { FaClipboardList, FaTrophy } from "react-icons/fa";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Section
        bgClass="relative bg-gradient-to-t from-primary-900 to-primary-200"
        pyClass="py-0"
        pxClass="px-0"
      >
        <HomeHero
          heroTitle="Welcome to Jay’s Quiz Hub!"
          heroSubtitle="Quiz Recaps & JDQ Leaderboards"
          heroDescription="From quick dailies to the big screen experience—relive Thursday & Saturday’s epic quizzes, view your scores, and climb the leaderboard!"
          heroImage="/images/HeroPH.jpg"
          heightClass="min-h-[600px]"
          overlay
        />
      </Section>

      {/* Cards Section */}
      <Section
        container
        bgClass="bg-gradient-to-t from-primary-200 to-primary-900" // light neutral background
        pxClass="px-4"
        pyClass="py-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <HomeCard
            title="Quiz Recap"
            description="Thursday and Saturday Recaps are available here! Use the code from the stream to access!"
            href="/quiz-recap"
            icon={<FaClipboardList />}
          />
          <HomeCard
            title="Jay's Quiz Leaderboards"
            description="Find your place in the Worldwide leader boards of JDQ and NOW JVQ as well! Just remember to add your score you must be registered"
            href="/lb-select"
            icon={<FaTrophy />}
          />
        </div>
      </Section>

      {/* Ad Banner Section TBC */}
    </>
  );
}
