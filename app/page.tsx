import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { siteConfig } from "@/config/siteConfig";
import { AdSlot } from "@/components/home/AdSlot";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { PromoStrip } from "@/components/home/PromoStrip";

export const metadata: Metadata = {
  title: "Jay's Quiz Hub - Live Quizzes, Recaps & Leaderboards",
  description:
    "Play along with Jay's live quizzes, add your scores, and climb JDQ & JVQ leaderboards. Catch quiz recaps and more.",
  openGraph: {
    title: "Jay's Quiz Hub",
    description:
      "Live quizzes, recaps, and leaderboards - join in and climb the rankings.",
    type: "website",
  },
};

type HomePageProps = {
  searchParams?: Promise<{
    submitted?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const submitted = params?.submitted === "1";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Website",
    name: "Jay's Quiz Hub",
    url: siteConfig.siteUrl,
    description: "Live quizzes, recaps, and leaderboards for JDQ & JVQ.",
  };

  return (
    <>
      <Script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
        {submitted ? (
          <div className="mx-auto max-w-7xl px-4 pt-4">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm">
              Thanks - your question has been submitted for the anniversary
              quiz!
            </div>
          </div>
        ) : null}

        <Hero />

        <div className="mx-auto max-w-7xl px-4">
          <AdSlot
            id="home_top_responsive"
            sizes="responsive (728x90 / 320x100)"
            height={100}
          />
        </div>

        <FeatureGrid />

        <div className="mx-auto max-w-7xl px-4">
          <AdSlot
            id="home_mid_responsive"
            sizes="responsive (300x250 / 336x280)"
            height={280}
          />
        </div>

        <PromoStrip />

        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-lg border border-purple-800 bg-white/80 p-6 shadow-lg shadow-purple-50/20 backdrop-blur-md transition-transform hover:scale-[1.01] dark:bg-surface-inverted/50">
            <h2 className="font-heading text-2xl">How it works</h2>
            <div className="mt-2 space-y-4 text-textc-muted">
              <p>
                Jay&apos;s Quiz Hub is your home for daily quizzes, live quiz
                recaps, public leaderboards, and private leaderboards with
                friends and family.
              </p>

              <p>
                <strong>JDQ:</strong> Jay&apos;s Daily Quiz is a short weekday
                quiz with five questions across a variety of topics. Listen on
                your podcast platform of choice, watch the video version on
                YouTube, then add your score to the leaderboard. Find out more{" "}
                <Link href="/jdq">here</Link>.
              </p>

              <p>
                <strong>JVQ:</strong> Jay&apos;s Virtual Quiz is the original
                virtual pub quiz that went viral in 2020 and still brings
                quizzers together twice a week on YouTube. Catch the latest
                recap <Link href="/quiz-recap">here</Link>.
              </p>

              <p>
                <strong>Leaderboards:</strong> Add scores to the global boards,
                create private leaderboards, and see how you stack up against
                your friends and family. You can find the leaderboards{" "}
                <Link href="/lb-select">here</Link>.
              </p>

              <p>
                <strong>Coming soon:</strong> Quiz Hub Live, a question
                database, and a pub quiz database are all planned as the site
                grows.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
