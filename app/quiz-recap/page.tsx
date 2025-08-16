// app/quiz-recap/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/supabaseClient";
import { Card, CardContent } from "@/components/ui/Card";

type Quiz = {
  id: string;
  quiz_day: string;
  quiz_date: string; // "YYYY-MM-DD"
  thumbnail_url?: string;
};

export default function QuizRecapPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .order("quiz_date", { ascending: false });
        if (error) throw error;
        setQuizzes(data || []);
      } catch (e) {
        console.error("Failed to fetch quizzes:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentQuiz = quizzes[0];
  const previousQuizzes = quizzes.slice(1, 7);

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Top section: text (left) + thumbnail (right) on desktop */}
        <section className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* Text block */}
          <div>
            <h1 className="font-heading text-3xl text-black font-bold">
              JVQ Recaps
            </h1>
            <p className="mt-2 max-w-prose text-black/85">
              Whether Thursday or Saturday, you can find those questions and
              pictures here. If you’re playing live or premiere on the night,
              open the current quiz. Catching up later? Pick from the previous
              quizzes below.
            </p>
          </div>

          {/* Current quiz thumbnail (no card/border) */}
          <div>
            {loading ? (
              <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-white/30" />
            ) : currentQuiz ? (
              <Link
                href={`/quiz-recap/${currentQuiz.id}`}
                aria-label={`Open ${currentQuiz.quiz_day} ${formatDate(
                  currentQuiz.quiz_date
                )} recap`}
                className="block"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl shadow-xl">
                  <Image
                    src={
                      currentQuiz.thumbnail_url || "/images/quiz-default.jpg"
                    }
                    alt={`${currentQuiz.quiz_day} ${formatDate(
                      currentQuiz.quiz_date
                    )} thumbnail`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </Link>
            ) : (
              <div className="text-white/80">No current quiz found.</div>
            )}
          </div>
        </section>

        {/* Previous quizzes */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-black">
            📚 Previous Quizzes
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-white/30"
                />
              ))}
            </div>
          ) : previousQuizzes.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {previousQuizzes.map((q) => (
                <Link key={q.id} href={`/quiz-recap/${q.id}`}>
                  <Card variant="pop" hover>
                    <CardContent>
                      <p className="font-medium text-textc">
                        {q.quiz_day} – {formatDate(q.quiz_date)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/80">No previous quizzes yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
