"use client";

import { useEffect, useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/app/firebase/config";

export default function ResetPasswordPage() {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setOobCode(params.get("oobCode"));
    }
  }, []);

  const handleReset = async () => {
    if (!oobCode) {
      setError("Missing or invalid reset code.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Password reset failed. The link may be expired or invalid.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
      {success ? (
        <p className="text-green-600">
          ✅ Your password has been reset successfully.
        </p>
      ) : (
        <>
          <input
            type="password"
            className="border p-2 w-full mb-4"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Reset Password
          </button>
          {error && <p className="text-red-500 mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}
