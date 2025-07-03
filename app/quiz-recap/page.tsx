"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import HomeHero from "@/components/Hero";
import Section from "@/components/Section";
import Image from "next/image";

interface Quiz {
  id: string;
  quizDay: string;
  quizDate: string;
  thumbnailUrl?: string;
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
    <>
      <Section
        bgClass="relative bg-gradient-to-t from-primary-900 to-primary-200"
        pxClass="px-0"
        pyClass="py-0"
      >
        <HomeHero
          heroTitle="JVQ Recaps"
          heroSubtitle="Whether Thursday or Saturday, you can find those questions and Pictures here!"
          heroDescription="If playing live or premiere on the night in question, it will be the current quiz you need to select. If you are playing on catch-up, check the dates in the Previous Quizes"
          heroImage="/images/HeroPH.jpg"
          heightClass="min-h-[600px]"
          overlay={true}
        />
      </Section>

      <Section
        container
        bgClass="relative bg-gradient-to-t from-primary-200 to-primary-900"
      >
        {loading ? (
          <p className="text-primary-700">Loading quizzes…</p>
        ) : (
          <>
            {/* Current Quiz */}
            {currentQuiz && (
              <>
                <h1 className="text-h2 text-primary-200 text-xl font-bold mb-4">
                  Current Quiz 📌
                </h1>
                <Link
                  href={`/quiz-recap/${currentQuiz.id}`}
                  key={currentQuiz.id}
                  className="block"
                >
                  <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
                    {/* 16:9 container */}
                    <div className="aspect-w-16 aspect-h-9">
                      <Image
                        src={currentQuiz.thumbnailUrl!}
                        alt={`${currentQuiz.quizDay} thumbnail`}
                        fill
                        style={{ objectFit: "cover" }}
                        objectFit="cover"
                        className="brightness-75"
                        priority={false}
                      />
                    </div>
                    {/* overlay text */}
                  </div>
                </Link>
              </>
            )}

            {/* Previous Quizzes */}
            {previousQuizzes.length > 0 && (
              <>
                <h2 className="text-h2 text-primary-700 text-xl font-bold mt-4 mb-4">
                  Previous Quizzes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previousQuizzes.map((quiz) => (
                    <Link href={`/quiz-recap/${quiz.id}`} key={quiz.id}>
                      <div className="bg-primary-600 text-white p-4 rounded-lg shadow-md hover:bg-primary-500 transition">
                        {quiz.quizDay} – {formatDate(quiz.quizDate)}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Section>
    </>
  );
}
