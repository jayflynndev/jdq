"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // This parses the tokens from the URL fragment (#access_token=…)
        const { error } = await supabase.auth.getSession();
        if (error) throw error;

        // ✅ User is signed in now
        router.replace("/profile");
      } catch (e: any) {
        console.error("Auth callback error:", e);
        setError(e.message || "Could not complete sign-in.");
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur border border-white/40 shadow-2xl p-6 text-center">
        <h1 className="text-2xl font-bold text-purple-800">Signing you in…</h1>
        <p className="mt-2 text-purple-700">
          Just a moment while we complete your sign-in.
        </p>
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
      </div>
    </main>
  );
}
