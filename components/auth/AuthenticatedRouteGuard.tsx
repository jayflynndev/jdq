"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export function AuthenticatedRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then((result: {
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }) => {
      if (!active) return;
      if (result.error || !result.data.user) {
        router.replace("/auth?tab=signin");
        return;
      }
      setAllowed(true);
    });
    return () => { active = false; };
  }, [router]);

  if (!allowed) {
    return <main className="min-h-[60vh] grid place-items-center text-textc-muted">Checking access…</main>;
  }
  return <>{children}</>;
}
