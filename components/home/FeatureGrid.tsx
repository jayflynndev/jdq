// components/home/FeatureGrid.tsx
"use client";

import React from "react";
import { supabase } from "@/supabaseClient";
import { FeatureCard } from "./FeatureCard";
import { homeFeatures } from "@/config/homeFeatures";

export function FeatureGrid() {
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then((response: { data: { user?: { id?: string } } }) => {
        if (!mounted) return;
        setUserId(response.data.user?.id ?? null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const items = homeFeatures.filter((f) => !f.signedInOnly || !!userId);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((feature) => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </section>
  );
}
