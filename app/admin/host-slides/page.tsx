import { FaFileWord, FaLayerGroup } from "react-icons/fa";
import { BrandButton } from "@/components/ui/BrandButton";
import { Card, CardContent } from "@/components/ui/Card";
import { SavedDeckList } from "@/components/host-slides/SavedDeckList";

export default function HostSlidesPage() {
  return (
    <main className="qhl-shell space-y-5">
      <section className="qhl-hero">
        <div className="qhl-kicker">Admin Tools</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Host Slides
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/85 md:text-base">
          Import quiz documents, prepare slides, and host live quiz nights.
        </p>
      </section>

      <Card hover={false}>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <BrandButton
              href="/admin/host-slides/import"
              leftIcon={<FaFileWord />}
            >
              Import Word Document
            </BrandButton>
            <BrandButton
              href="#prepared-decks"
              variant="outline"
              leftIcon={<FaLayerGroup />}
            >
              View Prepared Decks
            </BrandButton>
          </div>

          <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Quiz documents are pasted as text for now. Image uploads are not
            wired up yet.
          </p>
        </CardContent>
      </Card>

      <SavedDeckList />
    </main>
  );
}
