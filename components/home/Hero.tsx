// components/home/Hero.tsx
"use client";

import { BrandButton } from "@/components/ui/BrandButton";
import { JDQCard, JVQCard, FallbackCard } from "./HighlightCard";

export function Hero() {
  const today = new Date().getDay();
  const isJVQDay = today === 4 || today === 6; // Thu, Sat
  const isJDQDay = [1, 2, 3, 5].includes(today); // Mon, Tue, Wed, Fri

  return (
    <section className="relative overflow-hidden">
      {/* soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 relative">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left side */}
          <div>
            <h1 className="font-heading text-3xl sm:text-5xl text-textc">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-brand via-accent to-brand bg-clip-text text-transparent">
                Jay’s Quiz Hub
              </span>
            </h1>
            <p className="mt-3 text-textc-muted text-base sm:text-lg">
              The Home of Jay&apos;s Quiz Hub. 50 question quizzes twice a week
              LIVE on YouTube or Jay&apos;s daily quiz JDQ, available on all
              Podcast Platforms, Get started below!
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BrandButton href="/lb-select" className="cursor-pointer">
                View Leaderboards
              </BrandButton>
              <BrandButton
                href="/quiz-recap"
                variant="accent"
                className="cursor-pointer"
              >
                Quiz Recap
              </BrandButton>
            </div>
          </div>

          {/* Right side: dynamic card */}
          {isJVQDay ? <JVQCard /> : isJDQDay ? <JDQCard /> : <FallbackCard />}
        </div>
      </div>
    </section>
  );
}
