import { EngineConnectionCard } from "@/components/qhl/EngineConnectionCard";

export default function QhlAdminPage() {
  return (
    <main className="qhl-shell space-y-5">
      <header className="qhl-hero">
        <div className="qhl-kicker">Quizmaster</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">QHL control room</h1>
        <p className="mt-2 text-violet-100/80">Night creation and live controls arrive in later checkpoints.</p>
      </header>
      <EngineConnectionCard />
    </main>
  );
}
