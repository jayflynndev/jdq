"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  JVQ_GROUP as BASE_JVQ_GROUP,
  JDQ_GROUP as BASE_JDQ_GROUP,
  TOP_LEVEL_LOGGED_IN as BASE_TOP_IN,
  TOP_LEVEL_LOGGED_OUT as BASE_TOP_OUT,
  type MenuItem,
  type MenuGroup,
} from "@/config/menuConfig";

/** ------------ Notifications hook ------------ */
type NotifCounts = {
  friend_requests: number;
  leaderboard_invites: number;
  admin_messages: number;
  total: number;
};

function useNotifCounts(enabled: boolean) {
  const [counts, setCounts] = useState<NotifCounts>({
    friend_requests: 0,
    leaderboard_invites: 0,
    admin_messages: 0,
    total: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setCounts({
          friend_requests: 0,
          leaderboard_invites: 0,
          admin_messages: 0,
          total: 0,
        });
        return;
      }
      const { data, error } = await supabase.rpc("get_notification_counts", {
        p_user_id: uid,
      });
      if (error || !data) {
        setCounts({
          friend_requests: 0,
          leaderboard_invites: 0,
          admin_messages: 0,
          total: 0,
        });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const fr = row?.friend_requests ?? 0;
      const lb = row?.leaderboard_invites ?? 0;
      const am = row?.admin_messages ?? 0;
      setCounts({
        friend_requests: fr,
        leaderboard_invites: lb,
        admin_messages: am,
        total: fr + lb + am,
      });
    } catch {
      setCounts({
        friend_requests: 0,
        leaderboard_invites: 0,
        admin_messages: 0,
        total: 0,
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchCounts();

    const ch = supabase
      .channel("nav-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard_members" },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        fetchCounts
      )
      .subscribe();

    const handler = () => fetchCounts();
    window.addEventListener("notif-refresh", handler);

    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("notif-refresh", handler);
    };
  }, [enabled, fetchCounts]);

  return counts;
}

/** ------------ NavBar ------------ */
export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<null | { id: string }>(null);
  const [openDesktopPanel, setOpenDesktopPanel] = useState(false);
  const [openMobilePanel, setOpenMobilePanel] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  // Auth + live updates
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ? { id: data.user.id } : null);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ? { id: session.user.id } : null);
        setOpenDesktopPanel(false);
        setOpenMobilePanel(false);
        try {
          router.refresh();
        } catch {}
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  // Close menus on route change
  useEffect(() => {
    setOpenDesktopPanel(false);
    setOpenMobilePanel(false);
    setOpenMobileGroup(null);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      setOpenDesktopPanel(false);
      setOpenMobilePanel(false);
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch {
      window.location.assign("/");
    }
  };

  const handleSignIn = () => {
    setOpenDesktopPanel(false);
    setOpenMobilePanel(false);
    window.location.assign("/auth?redirect=/");
  };

  const isLoggedIn = !!user;
  const notifs = useNotifCounts(isLoggedIn);

  // Build menus from config
  const JVQ_GROUP: MenuGroup = {
    ...BASE_JVQ_GROUP,
    items: BASE_JVQ_GROUP.items.filter(
      (i) => isLoggedIn || i.label !== "Add Your Score"
    ),
  };
  const JDQ_GROUP: MenuGroup = {
    ...BASE_JDQ_GROUP,
    items: BASE_JDQ_GROUP.items.filter(
      (i) => isLoggedIn || i.label !== "Add Your Score"
    ),
  };
  const TOP_LEVEL_LOGGED_IN: MenuItem[] = BASE_TOP_IN.map((i) =>
    i.label === "Sign Out" ? { ...i, onClick: handleSignOut } : i
  );
  const TOP_LEVEL_LOGGED_OUT: MenuItem[] = BASE_TOP_OUT.map((i) =>
    i.label === "Sign In/Up!" ? { ...i, onClick: handleSignIn } : i
  );

  const GROUPS = isLoggedIn ? [JVQ_GROUP, JDQ_GROUP] : [JVQ_GROUP, JDQ_GROUP];
  const TOP = isLoggedIn ? TOP_LEVEL_LOGGED_IN : TOP_LEVEL_LOGGED_OUT;

  // Badge renderer
  const labelWithBadge = (label: string) => {
    let count = 0;
    if (label === "Your Leaderboards") count = notifs.leaderboard_invites;
    if (label === "Profile") count = notifs.friend_requests;
    if (label === "Message Us!") count = notifs.admin_messages;

    if (count <= 0) return <span>{label}</span>;
    return (
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        <span className="min-w-[18px] rounded-full bg-brand text-white px-1.5 py-[2px] text-[11px] leading-none text-center shadow-card">
          {count}
        </span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b borderc bg-surface-subtle/90 dark:bg-surface-inverted/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg sm:text-xl font-heading tracking-tight text-brand hover:opacity-90 transition-opacity"
        >
          Jay&apos;s Quiz Hub
        </Link>

        {/* Desktop menu */}
        <button
          aria-label="Open menu"
          className="relative hidden md:inline-flex btn rounded-lg h-10 px-3 text-sm bg-white dark:bg-surface-inverted border borderc text-textc hover:bg-brand/10 focus:ring-4 focus:ring-brand/20"
          onClick={() => setOpenDesktopPanel(true)}
        >
          ☰ Menu
          {notifs.total > 0 && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent ring-2 ring-white dark:ring-surface-inverted" />
          )}
        </button>

        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="relative md:hidden btn rounded-lg h-10 px-3 text-sm bg-white dark:bg-surface-inverted border borderc text-textc hover:bg-brand/10 focus:ring-4 focus:ring-brand/20"
          onClick={() => setOpenMobilePanel((v) => !v)}
          aria-expanded={openMobilePanel}
          aria-controls="mobile-menu"
        >
          ☰
          {notifs.total > 0 && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent ring-2 ring-white dark:ring-surface-inverted" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {openMobilePanel && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t borderc bg-gradient-to-b from-purple-900 via-purple-100 to-purple-50 text-black px-4 pb-4"
        >
          <ul className="py-2">
            {TOP.map((item) =>
              item.onClick ? (
                <li key={item.label}>
                  <button
                    onClick={item.onClick}
                    className="flex w-full px-3 py-2 rounded-md hover:bg-white/15"
                  >
                    {labelWithBadge(item.label)}
                  </button>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href || "#"}
                    className="block px-3 py-2 rounded-md hover:bg-white/15"
                  >
                    {labelWithBadge(item.label)}
                  </Link>
                </li>
              )
            )}
          </ul>
          <div className="divide-y divide-white/15">
            {GROUPS.map((g) => {
              const open = openMobileGroup === g.header;
              return (
                <div key={g.header}>
                  <button
                    className="flex w-full justify-between px-3 py-2 font-semibold"
                    onClick={() => setOpenMobileGroup(open ? null : g.header)}
                  >
                    {g.header}
                    <span className="opacity-80">{open ? "▲" : "▼"}</span>
                  </button>
                  {open && (
                    <ul>
                      {g.items.map((it) => (
                        <li key={`${g.header}-${it.label}`}>
                          {it.disabled ? (
                            <div className="px-5 py-2 text-white/50 cursor-not-allowed">
                              {it.label}
                            </div>
                          ) : it.onClick ? (
                            <button
                              onClick={it.onClick}
                              className="flex w-full px-5 py-2 hover:bg-white/15"
                            >
                              {it.label}
                            </button>
                          ) : (
                            <Link
                              href={it.href || "#"}
                              className="block px-5 py-2 hover:bg-white/15"
                            >
                              {it.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}

      {/* Desktop Slide Menu */}
      {openDesktopPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpenDesktopPanel(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Main Menu"
            className="fixed top-0 right-0 z-50 h-screen w-[400px] max-w-[92vw] rounded-l-xl shadow-2xl overflow-y-auto text-black"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
                <span className="text-base font-semibold">Menu</span>
                <button
                  onClick={() => setOpenDesktopPanel(false)}
                  className="rounded-md px-3 py-1.5 text-sm hover:bg-white/15"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-6">
                <ul className="space-y-1">
                  {TOP.map((item) =>
                    item.onClick ? (
                      <li key={item.label}>
                        <button
                          onClick={item.onClick}
                          className="w-full rounded-md px-3 py-2 text-left hover:bg-white/15"
                        >
                          {labelWithBadge(item.label)}
                        </button>
                      </li>
                    ) : (
                      <li key={item.label}>
                        <Link
                          href={item.href || "#"}
                          className="block rounded-md px-3 py-2 hover:bg-white/15"
                        >
                          {labelWithBadge(item.label)}
                        </Link>
                      </li>
                    )
                  )}
                </ul>

                <div className="space-y-6">
                  {GROUPS.map((g) => (
                    <section key={g.header}>
                      <h3 className="mb-2 font-semibold text-black/90">
                        {g.header}
                      </h3>
                      <ul className="space-y-1">
                        {g.items.map((it) => (
                          <li key={`${g.header}-${it.label}`}>
                            {it.disabled ? (
                              <div className="cursor-not-allowed rounded-md px-3 py-2 text-black/50">
                                {it.label}
                              </div>
                            ) : it.onClick ? (
                              <button className="w-full rounded-md px-3 py-2 text-left hover:bg-white/15">
                                {it.label}
                              </button>
                            ) : (
                              <Link
                                href={it.href || "#"}
                                className="block rounded-md px-3 py-2 hover:bg-white/15"
                              >
                                {it.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
