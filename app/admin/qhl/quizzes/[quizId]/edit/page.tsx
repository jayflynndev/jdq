import { QuizEditForm } from "@/components/qhl/admin/QuizEditForm";

export default async function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <QuizEditForm quizId={quizId} />;
}
