"use client";

import { BrandButton } from "@/components/ui/BrandButton";
import { FallbackCard, JDQCard, JVQCard } from "./HighlightCard";

export function Hero() {
  const today = new Date().getDay();
  const isJVQDay = today === 4 || today === 6;
  const isJDQDay = [1, 2, 3, 5].includes(today);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="font-heading text-3xl text-textc sm:text-5xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-brand via-accent to-brand bg-clip-text text-transparent">
                Jay&apos;s Quiz Hub
              </span>
            </h1>
            <p className="mt-3 text-base text-textc-muted sm:text-lg">
              The home of Jay&apos;s Quiz Hub. Play 50-question quizzes twice a
              week live on YouTube, or catch Jay&apos;s Daily Quiz on your
              favourite podcast platform.
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

          {isJVQDay ? <JVQCard /> : isJDQDay ? <JDQCard /> : <FallbackCard />}
        </div>
      </div>
    </section>
  );
}
