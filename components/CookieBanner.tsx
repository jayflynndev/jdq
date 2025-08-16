"use client";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("cookie-consent");
    if (!v) setOpen(true); // show only if not previously chosen
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl m-4 rounded-xl border border-purple-800 bg-white/95 p-4 shadow-lg">
        <p className="text-sm text-gray-800">
          We use cookies for analytics and ads personalisation. See our{" "}
          <a href="/privacy-policy" className="underline text-purple-700">
            Privacy Policy
          </a>
          .
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              localStorage.setItem("cookie-consent", "granted");
              setOpen(false);
            }}
            className="rounded-lg bg-purple-700 px-3 py-2 text-sm text-white hover:bg-purple-800"
          >
            Accept
          </button>
          <button
            onClick={() => {
              localStorage.setItem("cookie-consent", "denied");
              setOpen(false);
            }}
            className="rounded-lg border border-purple-700 px-3 py-2 text-sm hover:bg-purple-100"
          >
            Reject non-essential
          </button>
        </div>
      </div>
    </div>
  );
}
