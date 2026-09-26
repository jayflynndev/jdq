import { EngineConnectionCard } from "@/components/qhl/EngineConnectionCard";

export default function LiveLobbyPage() {
  return (
    <main className="qhl-shell space-y-5">
      <header className="qhl-hero">
        <div className="qhl-kicker">Quiz Hub Live</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Live quiz lobby</h1>
        <p className="mt-2 text-violet-100/80">Night selection and team joining arrive in Stage 2.</p>
      </header>
      <EngineConnectionCard />
    </main>
  );
}
