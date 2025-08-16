// components/home/HighlightCard.tsx
"use client";

import { BrandButton } from "@/components/ui/BrandButton";

export function JDQCard() {
  return (
    <div className="rounded-lg bg-white dark:bg-surface-inverted/60 shadow-card p-6">
      <h3 className="font-heading text-xl">JDQ Day!</h3>
      <p className="text-textc-muted mt-1">
        5 quickfire questions • New quiz each weekday
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>• Listen to the short daily podcast</li>
        <li>• Log your score to the JDQ leaderboard</li>
        <li>• Compete in daily, weekly & monthly rankings</li>
      </ul>
      <div className="mt-5 flex gap-3">
        <BrandButton href="/profile?tab=add-score" className="cursor-pointer">
          Add JDQ Score
        </BrandButton>
        <BrandButton href="/jdq" variant="ghost" className="cursor-pointer">
          Listen Now
        </BrandButton>
      </div>
    </div>
  );
}

export function JVQCard() {
  return (
    <div className="rounded-lg bg-white dark:bg-surface-inverted/60 shadow-card p-6">
      <h3 className="font-heading text-xl">Jay&apos;s Quiz Live!</h3>
      <p className="text-textc-muted mt-1">
        Live at 8pm • 50 questions • 2 parts
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>• Jay is live on YouTube tonight!</li>
        <li>• 50 questions, 5 rounds as always! </li>
        <li>• And at the end of the quiz add your score!</li>
      </ul>
      <div className="mt-5 flex gap-3">
        <BrandButton href="/quiz-recap" className="cursor-pointer">
          Watch Live!
        </BrandButton>
        <BrandButton
          href="/profile?tab=add-score"
          variant="ghost"
          className="cursor-pointer"
        >
          Add Your Score!
        </BrandButton>
      </div>
    </div>
  );
}

export function FallbackCard() {
  return (
    <div className="rounded-lg bg-white dark:bg-surface-inverted/60 shadow-card p-6">
      <h3 className="font-heading text-xl">No Quiz Tonight</h3>
      <p className="text-textc-muted mt-1">
        Why not catch up on past quizzes or climb the leaderboards?
      </p>
      <div className="mt-5 flex gap-3">
        <BrandButton href="/quiz-recap" className="cursor-pointer">
          View Recaps
        </BrandButton>
        <BrandButton
          href="/leaderboards"
          variant="ghost"
          className="cursor-pointer"
        >
          Leaderboards
        </BrandButton>
      </div>
    </div>
  );
}
