import { PlayerRoomPage } from "@/components/qhl/player/PlayerRoomPage";

export default async function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <PlayerRoomPage quizId={quizId} />;
}
