"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/firebase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to send reset link. Please check the email address.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      {success ? (
        <p className="text-green-600">
          ✅ Reset email sent! Check your inbox for further instructions.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold text-gray-700">
            Enter your email address
          </label>
          <input
            type="email"
            className="border p-2 w-full mb-4"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Send Reset Link
          </button>
          {error && <p className="text-red-500 mt-3">{error}</p>}
        </form>
      )}
    </div>
  );
}
