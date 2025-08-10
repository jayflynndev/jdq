// app/page.tsx
import Section from "@/components/Section";
import HomeHero from "@/components/Hero";

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
          heroDescription="Quiz Hub is currently down for maintanance. Currently I am migrating all of the back end data across to a new database. Quiz Hub will be back up and running on Monday 11th August at 5AM. Usernames/emails and passwords will remain unchanged (You will not need to re-register or change anything). Thank you for your patience!"
          heroImage="/images/HeroPH.jpg"
          heightClass="min-h-[600px]"
          overlay
        />
      </Section>

      {/* Cards Section */}

      {/* Ad Banner Section TBC */}
    </>
  );
}
