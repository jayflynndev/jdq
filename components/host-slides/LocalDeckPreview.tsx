"use client";

import { useEffect, useState } from "react";
import { DeckActions } from "@/components/host-slides/DeckActions";
import { SlideCanvas } from "@/components/host-slides/SlideCanvas";
import { loadHostDeck } from "@/src/host-slides/supabaseDecks";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import type { HostDeck } from "@/src/host-slides/types";

export function LocalDeckPreview({ deckId }: { deckId: string }) {
  const [deck, setDeck] = useState<HostDeck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHostDeck(deckId)
      .then((loadedDeck) => {
        if (!cancelled) setDeck(loadedDeck);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load deck.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  if (!deck) {
    return (
      <main className="qhl-shell">
        <div className="qhl-card text-white">
          {error ?? "Loading slide preview..."}
        </div>
      </main>
    );
  }

  const slides = buildHostSlideSequence(deck);

  return (
    <main className="qhl-shell space-y-5">
      <section className="qhl-hero">
        <div className="qhl-kicker">Slide Preview</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">{deck.title}</h1>
        <p className="mt-2 text-violet-100/80">
          {slides.length} generated slides
        </p>
        <div className="mt-5">
          <DeckActions deckId={deck.id} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {slides.map((slide, index) => (
          <article key={slide.id} className="space-y-2">
            <p className="text-sm font-semibold text-violet-100/75">
              Slide {index + 1}
            </p>
            <SlideCanvas deck={deck} slide={slide} />
          </article>
        ))}
      </div>
    </main>
  );
}
