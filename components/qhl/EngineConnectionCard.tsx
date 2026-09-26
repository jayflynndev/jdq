"use client";

import { useEffect, useState } from "react";
import { getQhlEngineSocket, measureServerOffset } from "@/src/qhl/engineSocket";

export function EngineConnectionCard() {
  const [status, setStatus] = useState("Connecting to the live engine…");
  const [offset, setOffset] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;
    void getQhlEngineSocket()
      .then((socket) => {
        const connected = async () => {
          try {
            const measured = await measureServerOffset(socket);
            if (active) {
              setOffset(measured);
              setStatus("Connected");
            }
          } catch (error) {
            if (active) setStatus(error instanceof Error ? error.message : "Time sync failed");
          }
        };
        const failed = (error: Error) => active && setStatus(error.message);
        socket.on("connect", connected);
        socket.on("connect_error", failed);
        cleanup = () => {
          socket.off("connect", connected);
          socket.off("connect_error", failed);
        };
        if (socket.connected) void connected();
      })
      .catch((error: unknown) => {
        if (active) setStatus(error instanceof Error ? error.message : "Engine connection failed");
      });
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <section className="qhl-card">
      <div className="qhl-kicker">Stage 1 connection</div>
      <h2 className="mt-2 text-xl font-bold text-white">{status}</h2>
      <p className="mt-2 text-sm text-violet-100/80">
        {offset === null
          ? "Waiting for the server-authoritative clock handshake."
          : `Measured server clock offset: ${Math.round(offset)} ms`}
      </p>
    </section>
  );
}
