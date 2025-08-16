// app/page.tsx
import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { PromoStrip } from "@/components/home/PromoStrip";
import { AdSlot } from "@/components/home/AdSlot";
import Script from "next/script";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jay’s Quiz Hub — Live Quizzes, Recaps & Leaderboards",
  description:
    "Play along with Jay’s live quizzes, add your scores, and climb JDQ & JVQ leaderboards. Catch quiz recaps and more.",
  openGraph: {
    title: "Jay’s Quiz Hub",
    description:
      "Live quizzes, recaps, and leaderboards — join in and climb the rankings.",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Website",
    name: "Jay’s Quiz Hub",
    url: "https://your-domain.example/",
    description: "Live quizzes, recaps, and leaderboards for JDQ & JVQ.",
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <Script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
        <Hero />

        {/* Top ad slot (leaderboard / responsive) */}
        <div className="mx-auto max-w-7xl px-4">
          <AdSlot
            id="home_top_responsive"
            sizes="responsive (728x90 / 320x100)"
            height={100}
          />
        </div>

        <FeatureGrid />

        {/* Mid-page ad slot */}
        <div className="mx-auto max-w-7xl px-4">
          <AdSlot
            id="home_mid_responsive"
            sizes="responsive (300x250 / 336x280)"
            height={280}
          />
        </div>

        <PromoStrip />

        {/* Bottom content block */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-lg bg-white/80 dark:bg-surface-inverted/50 backdrop-blur-md border border-purple-800 shadow-lg shadow-purple-50/20 p-6 transition-transform hover:scale-[1.01]">
            <h2 className="font-heading text-2xl">How it works</h2>
            <p className="text-textc-muted mt-2">
              Jay&#39;s Quiz Hub is your new home of all things quizzing. Lets
              Talk about how it works:
              <br />
              <br />
              <strong>JDQ:</strong>
              <br />
              Jay&#39;s Daily Quiz, affectionately known as JDQ, is a daily quiz
              that tests your knowledge on a variety of topics. 5 questions per
              week day all wrapped up in a neat and tidy short podcast!
              Available on all Podcast platforms, and a video version on
              Jay&#39;s YouTube Channel. Find out more{" "}
              <Link href="/jdq">here.</Link>
              <br />
              <strong>JVQ:</strong>
              <br />
              What is there to say that hasn&apos;t already been said about
              Jay&#39;s Virtual Quiz (JVQ)? The original virtual pub quiz that
              went viral in 2020 at the start of the pandemic and continues to
              entertain thousands of quizzers twice a week on YouTube. A simple
              50 question quiz split over five rounds, with the feel of a pub
              quiz right in your living room! Check out the latest quiz{" "}
              <Link href="/quiz-recap">here.</Link>
              <br />
              <strong>Leaderboards:</strong>
              <br />
              Alongside the both types of quizzes, there is now the option to
              add your scores not only to Global Leader Boards, but now the
              option to add fellow quizzers and create private leader boards,
              and see how you stack up against your friends and family. You can
              find the leaderboards <Link href="/leaderboards">here.</Link>
              <br />
              <strong>Coming Soon:</strong>
              <br />
              <strong>Quiz Hub Live:</strong> Will give you the chance to have
              that true pub quiz feel from the comfort of your own home. Stay
              tuned for more details!
              <br />
              <strong>Question Database:</strong> Jay will soon be uploading his
              entire database and make it available for free! You will be able
              to look through tens of thousands of questions written by Jay over
              his 20 years of pub quizzing and take the stress out of creating
              your own quizzes to use for yourself.
              <br />
              <strong>Pub Quiz Database:</strong> Jay is working hard on a
              database that will list pub quizzes across the world. Soon you
              will be able to find your nearest quiz, wherever you might find
              yourslef in the world!
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
