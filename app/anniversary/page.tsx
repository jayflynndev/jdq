import AnniversarySubmitForm from "./AnniversarySubmitForm";

export const metadata = {
  title: "Submit a Question | QuizHub",
  description: "Send in your question for the anniversary quiz.",
};

export default function AnniversarySubmitPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
          Send in your quiz question
        </h1>
        <p className="mt-3 text-sm text-white dark:text-gray-300">
          Got a great question for the anniversary quiz? Send it in below and I
          might use it on the night. <br />
          Remember questions should be family friendly. Not all questions may be
          used.
        </p>
      </div>

      <AnniversarySubmitForm />
    </main>
  );
}
