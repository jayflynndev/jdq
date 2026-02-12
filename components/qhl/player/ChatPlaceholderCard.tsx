"use client";

export function ChatPlaceholderCard() {
  return (
    <div className="qhl-card space-y-2">
      <div className="text-base font-semibold">Chat</div>
      <div className="text-sm text-violet-100/80">Coming soon.</div>
      <ul className="mt-2 list-disc pl-5 text-sm text-violet-100/80 space-y-1">
        <li>YouTube Live chat</li>
        <li>Venue chat</li>
        <li>Discord (Patreon channel)</li>
      </ul>
      <div className="text-xs text-violet-100/60">
        We’ll add this after the core quiz flow is fully locked down.
      </div>
    </div>
  );
}
