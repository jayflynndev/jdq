"use client";

import { useEffect, useState } from "react";
import { Presenter } from "@/components/host-slides/Presenter";
import { loadHostDeck } from "@/src/host-slides/supabaseDecks";
import type { HostDeck } from "@/src/host-slides/types";

export function LocalDeckPresenter({ deckId }: { deckId: string }) {
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
      <main className="fixed inset-0 flex items-center justify-center bg-[#16082d] p-8 text-white">
        {error ?? "Loading presentation..."}
      </main>
    );
  }

  return <Presenter deck={deck} />;
}
