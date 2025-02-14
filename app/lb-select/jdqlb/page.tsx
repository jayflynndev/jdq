import HomeHero from "@/components/Hero";
import Leaderboards from "@/components/Leaderboards";

export default function Leaderboard() {
  return (
    <>
      <HomeHero
        heroTitle="Leader Boards!"
        heroSubtitle="Find Your Place in the quizzing community"
        heroDescription="Where do you place, Daily, Weekly, Monthly or even all time? Check out the leaderbaords below to see how you are doing!"
        heroImage="/images/Podium.jpg"
      />
      <Leaderboards />
    </>
  );
}
