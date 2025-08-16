"use client";

import { useEffect, useState } from "react";
import { useNotifCounts } from "@/hooks/useNotifCounts";
import { useSearchParams } from "next/navigation";
import AddScoreForm from "@/components/profile/AddScoreForm";
import JdqScoreSummary from "@/components/profile/JdqScoreSummary";
import JvqScoreSummary from "@/components/profile/JvqScoreSummary";
import ProfileForm from "@/components/profile/ProfileFormClient";
import ContactThreads from "@/components/profile/ContactThreads";
import LeaderboardsWidget from "@/components/profile/LeaderboardsWidget";
import ManageQuizzers from "@/components/profile/ManageQuizzers";
import { supabase } from "@/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BrandButton } from "@/components/ui/BrandButton";
import clsx from "clsx";

type SectionKey =
  | "addScore"
  | "yourScores"
  | "yourLeaderboards"
  | "manageQuizzers"
  | "messages"
  | "updateProfile"
  | "dangerZone";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "addScore", label: "Add Your Score" },
  { key: "yourScores", label: "Your Scores" },
  { key: "yourLeaderboards", label: "Your Leaderboards" },
  { key: "manageQuizzers", label: "Manage Quizzers" },
  { key: "messages", label: "Your Messages" },
  { key: "updateProfile", label: "Update Profile" },
  { key: "dangerZone", label: "Danger Zone" },
];

function TabBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <Badge size="sm" className="ml-2">
      {n}
    </Badge>
  );
}

export default function ProfilePage() {
  const [active, setActive] = useState<SectionKey>("addScore");
  const [scoresView, setScoresView] = useState<"JDQ" | "JVQ">("JDQ");
  const [username, setUsername] = useState<string | null>(null);

  const counts = useNotifCounts(true);
  const params = useSearchParams();
  const tabParam = params.get("tab");

  useEffect(() => {
    const map: Record<string, SectionKey> = {
      "add-score": "addScore",
      "your-scores": "yourScores",
      "your-leaderboards": "yourLeaderboards",
      "manage-quizzers": "manageQuizzers",
      messages: "messages",
      "update-profile": "updateProfile",
      "danger-zone": "dangerZone",
    };
    if (tabParam && map[tabParam]) setActive(map[tabParam]);
  }, [tabParam]);

  // clear badges when a tab is viewed
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      if (active === "manageQuizzers") {
        await supabase.rpc("clear_notifications", {
          p_user_id: uid,
          p_scope: "friends",
        });
      } else if (active === "messages") {
        await supabase.rpc("clear_notifications", {
          p_user_id: uid,
          p_scope: "messages",
        });
      } else if (active === "yourLeaderboards") {
        await supabase.rpc("clear_notifications", {
          p_user_id: uid,
          p_scope: "leaderboards",
        });
      }
    })();
  }, [active]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();
      setUsername(profile?.username || null);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl text-textc">
            {username ? `Welcome, ${username}` : "Welcome to your profile"}
          </h1>
          <p className="text-textc-muted">
            Manage your scores, friends, and account.
          </p>
        </div>

        {/* Mobile: grid of buttons */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:hidden">
          {SECTIONS.map((s) => (
            <BrandButton
              key={s.key}
              variant={active === s.key ? "brand" : "outline"}
              className="w-full"
              onClick={() => setActive(s.key)}
            >
              {s.label}
              {s.key === "manageQuizzers" && (
                <TabBadge n={counts.friend_requests} />
              )}
              {s.key === "yourLeaderboards" && (
                <TabBadge n={counts.leaderboard_invites} />
              )}
              {s.key === "messages" && <TabBadge n={counts.admin_messages} />}
            </BrandButton>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Desktop sidebar */}
          <aside className="col-span-3 hidden sm:block">
            <Card hover={false}>
              <CardHeader>
                <CardTitle>Profile Menu</CardTitle>
                <CardDescription>Quick navigation</CardDescription>
              </CardHeader>
              <nav className="p-3 pt-0 space-y-1">
                {SECTIONS.map((s) => {
                  const isActive = active === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActive(s.key)}
                      className={clsx(
                        "w-full rounded-md px-3 py-2 text-left",
                        isActive ? "bg-brand text-white" : "hover:bg-brand/10"
                      )}
                    >
                      <span className="font-medium">{s.label}</span>
                      {s.key === "manageQuizzers" && (
                        <TabBadge n={counts.friend_requests} />
                      )}
                      {s.key === "yourLeaderboards" && (
                        <TabBadge n={counts.leaderboard_invites} />
                      )}
                      {s.key === "messages" && (
                        <TabBadge n={counts.admin_messages} />
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Content */}
          <section className="col-span-12 sm:col-span-9 space-y-6">
            {active === "addScore" && (
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Add your score</CardTitle>
                  <CardDescription>Log JDQ or JVQ results</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                  <AddScoreForm
                    onScoreSubmitted={() => setActive("yourScores")}
                  />
                </div>
              </Card>
            )}

            {active === "yourScores" && (
              <Card hover={false}>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your scores</CardTitle>
                    <CardDescription>
                      Switch between JDQ and JVQ
                    </CardDescription>
                  </div>
                  <div className="inline-flex rounded-lg border borderc overflow-hidden">
                    <button
                      onClick={() => setScoresView("JDQ")}
                      className={clsx(
                        "px-4 py-2 text-sm",
                        scoresView === "JDQ"
                          ? "bg-brand text-white"
                          : "hover:bg-brand/10"
                      )}
                    >
                      JDQ
                    </button>
                    <button
                      onClick={() => setScoresView("JVQ")}
                      className={clsx(
                        "px-4 py-2 text-sm",
                        scoresView === "JVQ"
                          ? "bg-brand text-white"
                          : "hover:bg-brand/10"
                      )}
                    >
                      JVQ
                    </button>
                  </div>
                </CardHeader>
                <div className="p-4 pt-0">
                  {scoresView === "JDQ" ? (
                    <JdqScoreSummary onBack={() => setActive("addScore")} />
                  ) : (
                    <JvqScoreSummary onBack={() => setActive("addScore")} />
                  )}
                </div>
              </Card>
            )}

            {active === "yourLeaderboards" && (
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Your leaderboards</CardTitle>
                  <CardDescription>Recent boards & snapshots</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                  <LeaderboardsWidget />
                </div>
              </Card>
            )}

            {active === "manageQuizzers" && (
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Manage quizzers</CardTitle>
                  <CardDescription>Requests, friends, and more</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                  <ManageQuizzers />
                </div>
              </Card>
            )}

            {active === "messages" && (
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Your messages</CardTitle>
                  <CardDescription>Replies from Jay’s Quiz Hub</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                  <ContactThreads />
                </div>
              </Card>
            )}

            {active === "updateProfile" && (
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Update profile</CardTitle>
                  <CardDescription>Username, email, password</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                  <div className="mx-auto max-w-md">
                    <ProfileForm />
                  </div>
                </div>
              </Card>
            )}

            {active === "dangerZone" && <DangerZoneCard />}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- Danger Zone (client calls Edge Function) ---------- */
function DangerZoneCard() {
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    if (
      !confirm("This will permanently delete your account and data. Continue?")
    ) {
      return;
    }

    setBusy(true);
    try {
      // get the current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not logged in");

      // send token to API route
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete account");
      }

      // ✅ sign the user out to clear session tokens (prevents 403 spam)
      await supabase.auth.signOut();

      // After deletion + signout, send them home
      window.location.href = "/";
    } catch (e: any) {
      alert(e?.message || "Could not delete account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card hover={false}>
      <CardHeader>
        <CardTitle className="text-red-600">Danger zone</CardTitle>
        <CardDescription>
          Delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <div className="p-4 pt-0 space-y-3">
        <p className="text-sm text-textc-muted">
          This action is irreversible and will remove your scores, friendships,
          messages, and profile.
        </p>
        <BrandButton
          variant="outline"
          onClick={deleteAccount}
          className="border-red-600 text-red-600 hover:bg-red-600/10"
          loading={busy}
        >
          Delete my account
        </BrandButton>
      </div>
    </Card>
  );
}
