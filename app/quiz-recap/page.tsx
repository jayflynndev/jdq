"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import HomeHero from "@/components/Hero";

interface Quiz {
  id: string;
  quizDay: string;
  quizDate: string;
}

export default function QuizRecapPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const q = query(
          collection(db, "quizzes"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Quiz[];
        setQuizzes(fetched);
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const currentQuiz = quizzes[0];
  const previousQuizzes = quizzes.slice(1, 7);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <main>
      <HomeHero
        heroTitle="Quiz Recap"
        heroSubtitle="Catch up on the action"
        heroDescription="Missed a quiz or want to relive it? Explore the latest recaps below."
        heightClass="h-[300px] min-h-[200px]"
      />

      <div className="px-4 py-6 max-w-5xl mx-auto">
        {loading ? (
          <p className="text-white">Loading quizzes...</p>
        ) : (
          <>
            {currentQuiz && (
              <>
                <h1 className="text-3xl font-bold text-yellow-400 mb-4">
                  Current Quiz 📌
                </h1>
                <Link href={`/quiz-recap/${currentQuiz.id}`}>
                  <div className="bg-purple-800 text-yellow-300 p-6 rounded-xl shadow-lg hover:bg-purple-700 cursor-pointer">
                    <div className="text-2xl font-extrabold tracking-wide uppercase">
                      {currentQuiz.quizDay} – {formatDate(currentQuiz.quizDate)}
                    </div>
                  </div>
                </Link>
              </>
            )}

            {previousQuizzes.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold text-yellow-400 mt-10 mb-4">
                  Previous Quizzes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousQuizzes.map((quiz) => (
                    <Link href={`/quiz-recap/${quiz.id}`} key={quiz.id}>
                      <div className="bg-purple-700 text-white p-4 rounded-lg shadow-md hover:bg-purple-600 transition cursor-pointer">
                        {quiz.quizDay} – {formatDate(quiz.quizDate)}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
