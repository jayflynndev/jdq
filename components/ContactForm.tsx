"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

export default function ContactForm() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch profile for username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
    };
    getUser();
  }, []);

  // Show loading state while fetching user/profile
  if (user === undefined || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
        <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">
            Contact Us
          </h2>
          <p className="text-purple-800 mb-4">Checking login status…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
        <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">
            Contact Us
          </h2>
          <p className="text-purple-800 mb-4">
            You must be logged in to send a message.
          </p>
          <a href="/auth" className="text-purple-700 underline font-semibold">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const email = profile?.email || user.email || "";
  const username = profile?.username || user.email?.split("@")[0] || "";

  // Submit: Create thread and message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");

    // 1. Create thread
    const { data: thread, error: threadError } = await supabase
      .from("contact_threads")
      .insert({
        user_id: user.id,
        subject: message.slice(0, 50), // Or let user choose a subject
      })
      .select()
      .single();

    if (threadError || !thread) {
      setStatus("error");
      return;
    }

    // 2. Add message
    const { error: msgError } = await supabase.from("contact_messages").insert({
      thread_id: thread.id,
      sender: "user",
      sender_id: user.id,
      message,
    });

    if (msgError) {
      setStatus("error");
      // Optionally: delete the thread if first message failed
      return;
    }

    setMessage("");
    setStatus("sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
      <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-2 text-center">
          Contact Us
        </h1>
        <p className="text-center text-purple-800 mb-6">
          Found an issue? Have a suggestion? Need something correcting? Let us
          know! <br />
          (You must be logged in to send a message.)
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="username"
            type="text"
            value={username}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-purple-300 text-purple-900 rounded-lg"
          />
          <input
            name="email"
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-purple-300 text-purple-900 rounded-lg"
          />
          <textarea
            name="message"
            rows={4}
            placeholder="Start with your name, then type your message!"
            className="w-full px-4 py-3 bg-white border border-purple-300 text-purple-900 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-3 bg-purple-700 hover:bg-yellow-400 hover:text-purple-800 text-white font-bold rounded-lg shadow-md transition"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
        {status === "sent" && (
          <p className="mt-4 text-center text-green-600 font-semibold">
            Thank you! Your message has been sent. Look for replies in your
            profile!
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-center text-red-600 font-semibold">
            Please write a message before sending, or try again.
          </p>
        )}
      </div>
    </div>
  );
}
