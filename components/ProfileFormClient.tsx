"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";

export default function ProfileForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  // Load current user's profile info
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in.");
        return;
      }
      setEmail(user.email ?? "");
      setOriginalEmail(user.email ?? "");
      // Fetch from "profiles" table
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

  // Check username uniqueness
  const isUsernameUnique = async (uname: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .limit(1);
    if (!data) return true;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Unique if the only hit is yourself or no hit at all
    return !data.length || data[0].id === user?.id;
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Username uniqueness check
    if (!(await isUsernameUnique(username))) {
      toast.error("Username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    // 2. Update "profiles" username/email
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not logged in.");
      setLoading(false);
      return;
    }

    // If email is changed, update email in Supabase Auth
    if (email && email !== originalEmail) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        toast.error("Failed to update email: " + emailErr.message);
        setLoading(false);
        return;
      } else {
        toast.success(
          "Email updated. You may need to verify your new email address."
        );
        setOriginalEmail(email);
      }
    }

    // If password is entered, update it
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
        setCurrentPassword(""); // Remove or uncomment if you add currentPassword state
      }
    }

    // Update username in "profiles" table
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

  if (loading) {
    return <div className="py-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleUpdateProfile}>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="username"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="email"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="currentPassword"
        >
          Enter Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="password"
        >
          New Password
        </label>
        <input
          type="password"
          id="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Updating..." : "Update Profile"}
      </button>
    </form>
  );
}
