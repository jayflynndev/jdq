"use client";

import { useLayoutEffect, useRef } from "react";

/** Keep the existing typography at its authored size unless a break panel overflows. */
export function useBreakTextFit(enabled: boolean, contentKey: string) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = ref.current;
    if (!enabled || !frame) return;
    let disposed = false;
    const fittedTexts = new Set<HTMLElement>();
    const timerBoxes = new Set<HTMLElement>();
    const fit = () => {
      if (disposed) return;
      // The timer is supplied by OBS; only size its reserved space here.
      frame.querySelectorAll<HTMLElement>("[data-break-timer-box]").forEach((box) => {
        timerBoxes.add(box);
        box.style.height = `${frame.clientHeight * 0.18}px`;
      });
      frame.querySelectorAll<HTMLElement>("[data-break-fit]").forEach((panel) => {
        const texts = Array.from(panel.querySelectorAll<HTMLElement>("p, h2, h3, [data-break-ticker-label]"));
        const sizes = texts.map((text) => {
          fittedTexts.add(text);
          text.style.removeProperty("font-size");
          text.style.flexShrink = "0";
          text.style.overflowWrap = "anywhere";
          return parseFloat(getComputedStyle(text).fontSize);
        });
        const bounds = panel.getBoundingClientRect();
        const style = getComputedStyle(panel);
        const top = bounds.top + parseFloat(style.paddingTop) + panel.clientTop;
        const bottom = bounds.top + panel.clientTop + panel.clientHeight - parseFloat(style.paddingBottom);
        const measured = [...texts, ...panel.querySelectorAll<HTMLElement>("[data-break-timer-box]")];
        const fits = () => measured.every((text) => {
          const rect = text.getBoundingClientRect();
          return rect.top >= top - 0.5 && rect.bottom <= bottom + 0.5 &&
            text.scrollWidth <= text.clientWidth + 1;
        });
        const apply = (scale: number) => texts.forEach((text, index) => {
          text.style.fontSize = `${sizes[index] * scale}px`;
        });
        if (fits()) return;
        let low = 0;
        let high = 1;
        for (let step = 0; step < 14; step++) {
          const scale = (low + high) / 2;
          apply(scale);
          if (fits()) low = scale;
          else high = scale;
        }
        apply(low);
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    window.addEventListener("resize", fit);
    document.fonts.addEventListener("loadingdone", fit);
    void document.fonts.ready.then(fit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", fit);
      document.fonts.removeEventListener("loadingdone", fit);
      fittedTexts.forEach((text) => {
        text.style.removeProperty("font-size");
        text.style.removeProperty("flex-shrink");
        text.style.removeProperty("overflow-wrap");
      });
      timerBoxes.forEach((box) => box.style.removeProperty("height"));
    };
  }, [enabled, contentKey]);

  return ref;
}
