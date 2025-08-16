// hooks/useLeaderboard.ts
"use client";
import { useEffect, useState } from "react";
import type { LBRow } from "@/utils/fetchLeaderboard";

type Loader = () => Promise<LBRow[]>;

export function useLeaderboard(loadFn: Loader, deps: any[]) {
  const [rows, setRows] = useState<LBRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFn().then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { rows, loading };
}
