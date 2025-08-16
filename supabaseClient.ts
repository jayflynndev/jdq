import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// reuse a single instance across HMR and tabs
const getBrowserClient = () => {
  const g = globalThis as any;
  if (!g.__supabase__) {
    g.__supabase__ = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true, // 🔑 keeps session alive
        detectSessionInUrl: true, // 🔑 handles email confirmation links
        storageKey: "quizhub-auth", // custom key for clarity
      },
    });
  }
  return g.__supabase__;
};

export const supabase = getBrowserClient();
