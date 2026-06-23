import { BrandButton } from "@/components/ui/BrandButton";

export function DeckActions({ deckId }: { deckId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <BrandButton href={`/admin/host-slides/${deckId}`} size="sm">
        Review/Edit
      </BrandButton>
      <BrandButton
        href={`/admin/host-slides/${deckId}/slides`}
        variant="outline"
        size="sm"
      >
        Preview Slides
      </BrandButton>
      <BrandButton
        href={`/host-slides/${deckId}/present`}
        variant="accent"
        size="sm"
      >
        Present
      </BrandButton>
    </div>
  );
}
