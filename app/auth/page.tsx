export const dynamic = "force-dynamic"; // ⬅️ important

import { Suspense } from "react";
import AuthPageInner from "@/components/auth/AuthPageInner";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <AuthPageInner />
    </Suspense>
  );
}
