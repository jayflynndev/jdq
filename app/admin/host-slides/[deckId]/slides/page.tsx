import { LocalDeckPreview } from "@/components/host-slides/LocalDeckPreview";

type PageProps = { params: Promise<{ deckId: string }> };

export default async function HostSlidePreviewPage({ params }: PageProps) {
  const { deckId } = await params;

  return <LocalDeckPreview deckId={deckId} />;
}
