"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCompress,
  FaExpand,
  FaStepBackward,
  FaStepForward,
} from "react-icons/fa";
import { SlideCanvas } from "@/components/host-slides/SlideCanvas";
import type { HostDeck } from "@/src/host-slides/types";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import {
  getPresenterPreloadUrls,
  getPresenterSlideImageUrls,
} from "@/src/host-slides/presenterImagePreload";
import { supabase } from "@/supabaseClient";

type PresenterControlApiState = {
  deckId: string;
  currentIndex: number;
  maxIndex: number;
  commandCounter: number;
  updatedAt: string;
};

type PresenterControlApiResponse = {
  status: "ok" | "error" | "unauthorized";
  state?: PresenterControlApiState;
  tokenConfigured?: boolean;
  message?: string;
};

const streamDeckCommands = [
  { label: "Next", action: "next" },
  { label: "Previous", action: "previous" },
  { label: "First Break", action: "go_to_first_break" },
  { label: "Second Break", action: "go_to_second_break" },
  { label: "Dingbats", action: "go_to_dingbats" },
  { label: "Quiz End", action: "go_to_quiz_end" },
] as const;

export function Presenter({ deck }: { deck: HostDeck }) {
  const slides = useMemo(() => buildHostSlideSequence(deck), [deck]);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [origin, setOrigin] = useState("");
  const [controlState, setControlState] =
    useState<PresenterControlApiState | null>(null);
  const [controlTokenConfigured, setControlTokenConfigured] = useState(false);
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const [settledImageUrls, setSettledImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingImages = useRef(new Map<string, HTMLImageElement>());
  const indexRef = useRef(index);
  const commandCounterRef = useRef(0);
  const syncInFlightRef = useRef(false);
  const preloadUrls = useMemo(
    () => getPresenterPreloadUrls(deck, slides, index, 5),
    [deck, index, slides],
  );
  const currentImageUrls = useMemo(
    () => getPresenterSlideImageUrls(deck, slides[index]),
    [deck, index, slides],
  );
  const currentImagesReady = currentImageUrls.every((url) =>
    settledImageUrls.has(url),
  );
  const maxIndex = Math.max(0, slides.length - 1);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const syncPresenterControlState = useCallback(
    async (currentIndex: number) => {
      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;
      try {
        const headers = await authHeaders();
        const response = await fetch("/api/host-slides/presenter-control/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            deckId: deck.id,
            currentIndex,
            maxIndex,
          }),
        });
        const payload = (await response.json()) as PresenterControlApiResponse;
        if (payload.state) {
          setControlState(payload.state);
          commandCounterRef.current = Math.max(
            commandCounterRef.current,
            payload.state.commandCounter,
          );
        }
        if (typeof payload.tokenConfigured === "boolean") {
          setControlTokenConfigured(payload.tokenConfigured);
        }
        setControlMessage(
          response.ok ? null : payload.message ?? "Presenter control sync failed.",
        );
      } catch (error: unknown) {
        setControlMessage(
          error instanceof Error
            ? error.message
            : "Presenter control sync failed.",
        );
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [authHeaders, deck.id, maxIndex],
  );

  useEffect(() => {
    const desiredUrls = new Set(preloadUrls);
    for (const [url, image] of pendingImages.current) {
      if (desiredUrls.has(url)) continue;
      image.onload = null;
      image.onerror = null;
      pendingImages.current.delete(url);
    }

    preloadUrls.forEach((url) => {
      if (settledImageUrls.has(url) || pendingImages.current.has(url)) return;
      const image = new Image();
      const settle = () => {
        pendingImages.current.delete(url);
        setSettledImageUrls((current) => {
          if (current.has(url)) return current;
          const next = new Set(current);
          next.add(url);
          return next;
        });
      };
      const settleAfterDecode = () => {
        void image.decode().catch(() => undefined).finally(settle);
      };
      image.onload = settleAfterDecode;
      image.onerror = settle;
      pendingImages.current.set(url, image);
      image.src = url;
      if (image.complete) {
        if (image.naturalWidth > 0) settleAfterDecode();
        else settle();
      }
    });
  }, [preloadUrls, settledImageUrls]);

  useEffect(
    () => () => {
      pendingImages.current.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
      pendingImages.current.clear();
    },
    [],
  );

  useEffect(() => {
    void syncPresenterControlState(indexRef.current);
  }, [syncPresenterControlState]);

  useEffect(() => {
    let cancelled = false;

    async function pollPresenterControl() {
      try {
        const response = await fetch(
          `/api/host-slides/presenter-control/state?deckId=${encodeURIComponent(
            deck.id,
          )}`,
        );
        const payload = (await response.json()) as PresenterControlApiResponse;
        if (cancelled) return;
        if (payload.state) {
          setControlState(payload.state);
          if (
            payload.state.commandCounter > commandCounterRef.current &&
            payload.state.currentIndex !== indexRef.current
          ) {
            commandCounterRef.current = payload.state.commandCounter;
            setIndex(payload.state.currentIndex);
          } else {
            commandCounterRef.current = Math.max(
              commandCounterRef.current,
              payload.state.commandCounter,
            );
          }
        }
        if (typeof payload.tokenConfigured === "boolean") {
          setControlTokenConfigured(payload.tokenConfigured);
        }
        if (!response.ok) {
          setControlMessage(payload.message ?? "Presenter control polling failed.");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setControlMessage(
            error instanceof Error
              ? error.message
              : "Presenter control polling failed.",
          );
        }
      }
    }

    void pollPresenterControl();
    const interval = window.setInterval(() => void pollPresenterControl(), 400);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [deck.id]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(Math.max(0, nextIndex), maxIndex);
      setIndex(clamped);
      void syncPresenterControlState(clamped);
    },
    [maxIndex, syncPresenterControlState],
  );

  const previous = useCallback(
    () => goToIndex(indexRef.current - 1),
    [goToIndex],
  );
  const next = useCallback(
    () => goToIndex(indexRef.current + 1),
    [goToIndex],
  );
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === "ArrowLeft" || event.key === "Backspace") {
        event.preventDefault();
        previous();
      }
      if (event.key === "ArrowRight" || event.code === "Space") {
        event.preventDefault();
        next();
      }
      if (key === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
      if (key === "h") {
        event.preventDefault();
        setControlsVisible((visible) => !visible);
      }
    };
    const handleFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [next, previous, toggleFullscreen]);

  const controlBaseUrl = origin
    ? `${origin}/api/host-slides/presenter-control`
    : "/api/host-slides/presenter-control";

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#16082d] text-white">
      {currentImagesReady ? (
        <SlideCanvas deck={deck} slide={slides[index]} mode="presenter" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#16082d] text-sm font-semibold text-violet-100/60">
          Preparing slide image...
        </div>
      )}

      {controlsVisible ? (
        <>
          <section className="absolute right-4 top-4 z-30 max-w-xl rounded-xl border border-white/10 bg-black/70 p-4 text-xs text-violet-50 shadow-xl backdrop-blur">
            <div className="font-bold uppercase tracking-[0.16em] text-yellow-300">
              Stream Deck Control
            </div>
            <p className="mt-2 text-violet-100/80">
              Use a Multi Action: HTTP request to Host Slides, then Streamlabs
              hotkey.
            </p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="font-semibold text-violet-200">Action URL</dt>
                <dd className="break-all font-mono">
                  POST {controlBaseUrl}/action
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-violet-200">Deck ID</dt>
                <dd className="font-mono">{`{"deckId":"${deck.id}"}`}</dd>
              </div>
              <div>
                <dt className="font-semibold text-violet-200">Commands</dt>
                <dd className="mt-1 grid gap-1">
                  {streamDeckCommands.map((command) => (
                    <span
                      key={command.action}
                      className="rounded border border-white/10 bg-white/5 px-2 py-1"
                    >
                      <span className="font-semibold text-yellow-100">
                        {command.label}:{" "}
                      </span>
                      <span className="break-all font-mono">{`{"deckId":"${deck.id}","action":"${command.action}"}`}</span>
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-violet-200">Token</dt>
                <dd>
                  {controlTokenConfigured
                    ? "Configured. Send it as x-presenter-control-token or ?token=..."
                    : "Not configured."}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-violet-200">State</dt>
                <dd>
                  Slide {index + 1} / {slides.length}
                  {controlState
                    ? ` · command ${controlState.commandCounter}`
                    : ""}
                </dd>
              </div>
            </dl>
            {controlMessage ? (
              <p className="mt-3 rounded-lg border border-yellow-300/30 bg-yellow-950/40 p-2 font-semibold text-yellow-100">
                {controlMessage}
              </p>
            ) : null}
          </section>
          <nav className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-black/55 px-2 py-1.5 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={previous}
            disabled={index === 0}
            className="rounded-lg p-3 transition hover:bg-white/10 disabled:opacity-30"
            aria-label="Previous slide"
          >
            <FaStepBackward />
          </button>
          <span className="min-w-16 text-center text-sm font-semibold">
            {index + 1} / {slides.length}
          </span>
          <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg p-3 transition hover:bg-white/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index === slides.length - 1}
            className="rounded-lg p-3 transition hover:bg-white/10 disabled:opacity-30"
            aria-label="Next slide"
          >
            <FaStepForward />
          </button>
          </div>
          </nav>
        </>
      ) : null}
    </main>
  );
}
