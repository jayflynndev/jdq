"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Ensure a profile row exists after sign in
  async function ensureProfile(userId: string, userEmail: string) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    if (!profileData) {
      await supabase
        .from("profiles")
        .insert([{ id: userId, email: userEmail, is_admin: false }]);
      // No need to capture profileError—let it fail silently if duplicate
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else if (data.user) {
        setSuccess("Signed in successfully!");
        await ensureProfile(data.user.id, data.user.email ?? email);
        // Give time for NavBar to update, then redirect
        setTimeout(() => {
          router.push("/");
        }, 200);
      }
    } else {
      if (password !== confirm) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(
          "Registration successful! Please check your email to verify your account, then log in."
        );
        // No profile insert here
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-center text-4xl font-bold mb-10">
        **If you are logging in for the first time since the 10th August, you
        will need to reset your password <br /> Please follow the forgotten
        password link below to reset it. Sorry for any inconvenience.**
      </h1>
      <h1 className="text-4xl font-bold mb-4">
        {mode === "signin" ? "Sign In" : "Register"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 bg-white rounded shadow-md"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

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
            autoComplete="email"
          />
        </div>

        <div className="mb-2">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </div>

        {mode === "signup" && (
          <div className="mb-2">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="confirm"
            >
              Confirm Password
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
        )}

        {mode === "signin" && (
          <div className="mb-4 text-right">
            <p className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        )}

        <button
          type="submit"
          className={`w-full ${
            mode === "signin" ? "bg-blue-500" : "bg-green-600"
          } text-white font-bold py-2 px-4 rounded hover:bg-blue-700`}
          disabled={loading}
        >
          {loading
            ? mode === "signin"
              ? "Signing In..."
              : "Registering..."
            : mode === "signin"
            ? "Sign In"
            : "Register"}
        </button>

        <p className="mt-4 text-gray-700">
          {mode === "signin" ? (
            <>
              Not registered?{" "}
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Click here
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
