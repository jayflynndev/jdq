"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/app/firebase/config";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!oobCode) return setError("Missing or invalid reset code.");

    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 3000);
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
          ✅ Your password has been reset successfully. Redirecting to
          sign-in...
        </p>
      ) : (
        <>
          <label className="block mb-2 font-semibold text-gray-700">
            New Password
          </label>
          <input
            type="password"
            className="border p-2 w-full mb-4"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleReset}
            disabled={!newPassword}
            className={`w-full text-white py-2 rounded ${
              newPassword
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Reset Password
          </button>
          {error && <p className="text-red-500 mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}
