import { ImportReview } from "@/components/host-slides/import/ImportReview";

export default function HostSlidesImportPage() {
  return (
    <main className="qhl-shell space-y-5">
      <section className="qhl-hero">
        <div className="qhl-kicker">Host Slides Import</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Import Review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/85 md:text-base">
          Upload a Word document or paste quiz content, then review every
          round, question, answer, and picture marker before creating a draft.
        </p>
      </section>

      <ImportReview />
    </main>
  );
}
