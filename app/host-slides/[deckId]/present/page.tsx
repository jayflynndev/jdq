import { LocalDeckPresenter } from "@/components/host-slides/LocalDeckPresenter";

type PageProps = { params: Promise<{ deckId: string }> };

export default async function PresentHostSlideDeckPage({ params }: PageProps) {
  const { deckId } = await params;

  return <LocalDeckPresenter deckId={deckId} />;
}
