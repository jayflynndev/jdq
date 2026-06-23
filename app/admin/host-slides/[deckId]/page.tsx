import { DeckEditor } from "@/components/host-slides/editor/DeckEditor";

type PageProps = { params: Promise<{ deckId: string }> };

export default async function EditHostSlideDeckPage({ params }: PageProps) {
  const { deckId } = await params;

  return <DeckEditor deckId={deckId} />;
}
