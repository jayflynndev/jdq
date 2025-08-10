"use client";

import { useState } from "react";
import { supabase } from "@/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Supabase handles the session from the reset link (if user arrived from the email)
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Your password has been reset. You can now log in with your new password."
      );
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Reset Password</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 bg-white rounded shadow-md"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            autoComplete="new-password"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="confirm"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="mt-4 text-gray-700 text-center">
          <Link href="/auth" className="text-blue-500 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
