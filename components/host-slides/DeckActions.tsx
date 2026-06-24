import { BrandButton } from "@/components/ui/BrandButton";
import { PresenterGateButton } from "@/components/host-slides/PresenterGateButton";
import type { HostDeck } from "@/src/host-slides/types";

export function DeckActions({ deck }: { deck: HostDeck }) {
  return (
    <div className="flex flex-wrap gap-2">
      <PresenterGateButton deck={deck} size="sm" />
      <BrandButton
        href={`/admin/host-slides/${deck.id}/slides`}
        variant="outline"
        size="sm"
      >
        Preview
      </BrandButton>
      <BrandButton href={`/admin/host-slides/${deck.id}`} size="sm">
        Edit
      </BrandButton>
    </div>
  );
}
