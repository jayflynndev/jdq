import HomeHero from "@/components/Hero";
import HomeLeaderboards from "@/components/HomeLeaderboards";

export default function Home() {
  return (
    <div className="bg-gradient-to-t from-purple-800 to-purple-400 z-50">
      <HomeHero
        heroTitle="Home of Jay's Daily Quiz"
        heroSubtitle="Your Daily Quizzing Podcast!"
        heroDescription="Here you will find past episodes of JDQ,
            share your scores with other players around the world
            and also set up leader boards for friends and families!"
        heroImage="/images/HeroPH.jpg"
      />
      <HomeLeaderboards />
    </div>
  );
}
