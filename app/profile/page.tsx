export const dynamic = "force-dynamic"; // ⬅️ important

import { Suspense } from "react";
import ProfilePageInner from "@/components/profile/ProfilePageInner";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ProfilePageInner />
    </Suspense>
  );
}
