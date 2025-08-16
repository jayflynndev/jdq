"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";
import { BrandButton } from "@/components/ui/BrandButton";

type Availability = "idle" | "checking" | "available" | "taken" | "error";

export default function ProfileForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  // availability UI
  const [availability, setAvailability] = useState<Availability>("idle");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in.");
        return;
      }
      myIdRef.current = user.id;
      setEmail(user.email ?? "");
      setOriginalEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username ?? "");
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // debounced uniqueness check
  useEffect(() => {
    if (!username) {
      setAvailability("idle");
      return;
    }
    // if unchanged (same as current username), treat as available
    // (prevents flicker when user focuses and blurs without changes)
    const myId = myIdRef.current;

    if (checkTimer.current) clearTimeout(checkTimer.current);
    setAvailability("checking");

    checkTimer.current = setTimeout(async () => {
      try {
        // NOTE: allow spaces and symbols — no regex limiting
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          setAvailability("available");
        } else {
          const hit = data[0];
          if (hit.id === myId) setAvailability("available");
          else setAvailability("taken");
        }
      } catch {
        setAvailability("error");
      }
    }, 500); // debounce 500ms

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username]);

  const availabilityText = useMemo(() => {
    switch (availability) {
      case "idle":
        return "";
      case "checking":
        return "Checking username…";
      case "available":
        return "Username is available ✔";
      case "taken":
        return "Username is already taken";
      case "error":
        return "Could not check username right now";
      default:
        return "";
    }
  }, [availability]);

  const availabilityClass = useMemo(() => {
    switch (availability) {
      case "available":
        return "text-emerald-600";
      case "taken":
        return "text-red-600";
      case "checking":
        return "text-textc-muted";
      case "error":
        return "text-amber-600";
      default:
        return "text-textc-muted";
    }
  }, [availability]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // final server-side check too (defensive)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not logged in.");
      setLoading(false);
      return;
    }

    if (existing && existing.length && existing[0].id !== user.id) {
      toast.error("Username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    // update email (if changed)
    if (email && email !== originalEmail) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        toast.error("Failed to update email: " + emailErr.message);
        setLoading(false);
        return;
      } else {
        toast.success(
          "Email updated. You may need to verify your new address."
        );
        setOriginalEmail(email);
      }
    }

    // update password (optional)
    if (newPassword) {
      const { error: pwErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwErr) {
        toast.error("Failed to update password: " + pwErr.message);
        setLoading(false);
        return;
      } else {
        toast.success("Password updated!");
        setNewPassword("");
        setCurrentPassword("");
      }
    }

    // update username (allows spaces/symbols; no client regex restrictions)
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ username, email })
      .eq("id", user.id);

    if (profileErr) {
      toast.error("Failed to update profile: " + profileErr.message);
    } else {
      toast.success("Profile updated successfully!");
    }
    setLoading(false);
  };

  if (loading) return <div className="py-6 text-textc-muted">Loading...</div>;

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
          placeholder="Your display name (spaces & symbols allowed)"
          // no `required` change — keep as required
          required
        />
        {availabilityText && (
          <p className={`mt-1 text-sm ${availabilityClass}`}>
            {availabilityText}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
          required
        />
      </div>

      <div>
        <label
          className="block text-sm font-semibold mb-1"
          htmlFor="currentPassword"
        >
          Enter Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1" htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border borderc rounded bg-white dark:bg-surface-inverted"
        />
      </div>

      <BrandButton type="submit" className="w-full" loading={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </BrandButton>
    </form>
  );
}
