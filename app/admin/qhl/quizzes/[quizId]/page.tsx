import { AdminControlRoomPage } from "@/components/qhl/admin/AdminControlRoomPage";

export default async function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <AdminControlRoomPage quizId={quizId} />;
}
