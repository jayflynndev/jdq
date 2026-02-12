"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      if (cancelled) return;
      if (authErr || !uid) {
        router.replace("/");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", uid)
        .maybeSingle();

      if (cancelled) return;
      if (profileErr || !profile?.is_admin) {
        router.replace("/");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !allowed) {
    return (
      <div className="qhl-shell">
        <div className="qhl-card">
          <div className="text-sm text-violet-100/80">Checking access...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
