"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeckList } from "@/components/host-slides/DeckList";
import type { HostDeck, HostDeckStatus } from "@/src/host-slides/types";
import {
  deleteHostDeck,
  listHostDecks,
  updateHostDeckStatus,
} from "@/src/host-slides/supabaseDecks";

export function SavedDeckList() {
  const [decks, setDecks] = useState<HostDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusChangingDeckId, setStatusChangingDeckId] = useState<
    string | null
  >(null);

  const today = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const upcomingDecks = useMemo(
    () =>
      decks
        .filter((deck) => deck.quizDate >= today)
        .sort((left, right) => left.quizDate.localeCompare(right.quizDate)),
    [decks, today],
  );
  const archivedDecks = useMemo(
    () =>
      decks
        .filter((deck) => deck.quizDate < today)
        .sort((left, right) => right.quizDate.localeCompare(left.quizDate)),
    [decks, today],
  );

  const loadDecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDecks(await listHostDecks());
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load decks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  async function removeDeck(deck: HostDeck) {
    if (!window.confirm(`Delete “${deck.title}” and all of its questions?`)) {
      return;
    }

    setError(null);
    try {
      await deleteHostDeck(deck.id);
      setDecks((current) => current.filter((item) => item.id !== deck.id));
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete deck.",
      );
    }
  }

  async function changeStatus(deck: HostDeck, status: HostDeckStatus) {
    setStatusChangingDeckId(deck.id);
    setError(null);
    try {
      await updateHostDeckStatus(deck.id, status);
      setDecks((current) =>
        current.map((item) =>
          item.id === deck.id ? { ...item, status } : item,
        ),
      );
    } catch (statusError: unknown) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not update deck status.",
      );
    } finally {
      setStatusChangingDeckId(null);
    }
  }

  if (loading) {
    return <div className="qhl-card text-violet-100">Loading saved decks...</div>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-300/50 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {upcomingDecks.length > 0 ? (
        <DeckList
          decks={upcomingDecks}
          onDelete={(deck) => void removeDeck(deck)}
          onStatusChange={(deck, status) => void changeStatus(deck, status)}
          statusChangingDeckId={statusChangingDeckId}
          sectionId="prepared-decks"
          title="Upcoming Decks"
          description="Today’s quiz and future quiz nights, nearest first."
        />
      ) : (
        <section id="prepared-decks" className="space-y-4 scroll-mt-20">
          <h2 className="text-2xl font-bold text-white">Upcoming Decks</h2>
          <div className="qhl-card text-violet-100">
            No upcoming decks yet. Import a quiz to prepare the next quiz night.
          </div>
        </section>
      )}

      {archivedDecks.length > 0 ? (
        <DeckList
          decks={archivedDecks}
          onDelete={(deck) => void removeDeck(deck)}
          onStatusChange={(deck, status) => void changeStatus(deck, status)}
          statusChangingDeckId={statusChangingDeckId}
          sectionId="deck-archive"
          title="Archive"
          description="Past quiz nights, most recent first."
        />
      ) : (
        <section id="deck-archive" className="space-y-4 scroll-mt-20">
          <h2 className="text-2xl font-bold text-white">Archive</h2>
          <div className="qhl-card text-violet-100">
            No archived decks yet. Completed quiz nights will appear here.
          </div>
        </section>
      )}
    </div>
  );
}
