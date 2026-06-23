"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FaCompress,
  FaExpand,
  FaStepBackward,
  FaStepForward,
} from "react-icons/fa";
import { SlideCanvas } from "@/components/host-slides/SlideCanvas";
import type { HostDeck } from "@/src/host-slides/types";
import { buildHostSlideSequence } from "@/src/host-slides/slides";

export function Presenter({ deck }: { deck: HostDeck }) {
  const slides = buildHostSlideSequence(deck);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);

  const previous = useCallback(
    () => setIndex((current) => Math.max(0, current - 1)),
    [],
  );
  const next = useCallback(
    () => setIndex((current) => Math.min(slides.length - 1, current + 1)),
    [slides.length],
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

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#16082d] text-white">
      <SlideCanvas deck={deck} slide={slides[index]} mode="presenter" />

      {controlsVisible ? (
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
      ) : null}
    </main>
  );
}
