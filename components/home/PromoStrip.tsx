// components/home/PromoStrip.tsx
import Link from "next/link";

export function PromoStrip() {
  return (
    <section className="bg-white dark:bg-surface-inverted/60 border-y borderc">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-textc-muted">
          Find more quizzes on our socials—new content every week.
        </p>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-full px-3 py-1 text-sm bg-brand/10 text-brand hover:bg-brand/15"
            href="https://www.youtube.com/"
            target="_blank"
          >
            YouTube
          </Link>
          <Link
            className="rounded-full px-3 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/15"
            href="https://www.instagram.com/"
            target="_blank"
          >
            Instagram
          </Link>
        </div>
      </div>
    </section>
  );
}
