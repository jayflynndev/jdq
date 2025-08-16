"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { BrandButton } from "@/components/ui/BrandButton";

export default function ContactForm() {
  // Make loading explicit so the UI doesn’t flash the “not logged in” state
  const [userLoading, setUserLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
      setUserLoading(false);
    })();
  }, []);

  const email = profile?.email || user?.email || "";
  const username = profile?.username || user?.email?.split("@")[0] || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!message.trim()) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    const threadSubject = (subject || message.slice(0, 80)).trim();

    // 1) create thread
    const { data: thread, error: tErr } = await supabase
      .from("contact_threads")
      .insert({
        user_id: user.id,
        subject: threadSubject,
      })
      .select()
      .single();

    if (tErr || !thread) {
      setStatus("error");
      return;
    }

    // 2) first message
    const { error: mErr } = await supabase.from("contact_messages").insert({
      thread_id: thread.id,
      sender: "user",
      sender_id: user.id,
      message,
    });

    if (mErr) {
      setStatus("error");
      return;
    }

    setSubject("");
    setMessage("");
    setStatus("sent");
  }

  // ----- UI -----
  if (userLoading) {
    return (
      <div className="rounded-2xl border borderc bg-white/90 shadow-card p-6 text-center">
        <h2 className="text-xl font-semibold text-textc">Contact Us</h2>
        <p className="text-textc-muted mt-1">Checking login status…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border borderc bg-white shadow-card p-6">
        <h2 className="text-xl font-semibold text-textc mb-2">Contact Us</h2>
        <p className="text-textc-muted">
          You must be logged in to send a message.
        </p>
        <a
          href="/auth?tab=signin"
          className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 font-semibold text-white shadow-card hover:opacity-90"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border borderc bg-white shadow-card p-6">
      <h2 className="text-xl font-semibold text-textc mb-1">Contact Us</h2>
      <p className="text-sm text-textc-muted mb-4">
        We’ll reply in your profile inbox (Profile → Your Messages).
      </p>

      {/* success / error banners */}
      {status === "sent" && (
        <div className="mb-4 rounded-md border border-green-600/30 bg-green-50 px-3 py-2 text-green-800">
          Thanks! Your message was sent. Watch for a reply in “Your Messages”.
        </div>
      )}
      {status === "error" && (
        <div className="mb-4 rounded-md border border-red-600/30 bg-red-50 px-3 py-2 text-red-700">
          Please add a message (and try again).
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-textc mb-1">
              Username
            </label>
            <input
              value={username}
              disabled
              className="w-full rounded-lg border borderc bg-surface-subtle px-3 py-2 text-textc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textc mb-1">
              Email
            </label>
            <input
              value={email}
              disabled
              className="w-full rounded-lg border borderc bg-surface-subtle px-3 py-2 text-textc"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textc mb-1">
            Subject{" "}
            <span className="text-textc-muted font-normal">(optional)</span>
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Short summary"
            className="w-full rounded-lg border borderc bg-white px-3 py-2 text-textc focus:outline-none focus:ring-4 focus:ring-brand/20"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textc mb-1">
            Message
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Start with your name, then tell us what's up…"
            className="w-full rounded-lg border borderc bg-white px-3 py-2 text-textc focus:outline-none focus:ring-4 focus:ring-brand/20"
            required
          />
        </div>

        <BrandButton
          type="submit"
          loading={status === "sending"}
          className="w-full sm:w-auto"
          disabled={!message.trim()}
        >
          {status === "sending" ? "Sending…" : "Send Message"}
        </BrandButton>
      </form>
    </div>
  );
}
