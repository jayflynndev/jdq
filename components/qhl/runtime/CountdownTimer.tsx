"use client";

import { useEffect, useRef, useState } from "react";

export function CountdownTimer({
  endsAt,
  onExpire,
}: {
  endsAt: string | null;
  onExpire?: () => void | Promise<void>;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const firedRef = useRef(false);
  const onExpireRef = useRef<typeof onExpire>(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    firedRef.current = false;

    if (!endsAt) {
      setSecondsLeft(null);
      return;
    }

    const endsAtIso: string = endsAt;

    function tick() {
      const ms = new Date(endsAtIso).getTime() - Date.now();
      const s = Math.ceil(ms / 1000);
      const clamped = s > 0 ? s : 0;
      setSecondsLeft(clamped);

      if (clamped === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    }

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (secondsLeft === null) return null;
  return (
    <div className="text-lg font-mono text-white">
      Countdown: {secondsLeft}s
    </div>
  );
}
