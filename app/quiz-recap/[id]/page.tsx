"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Image from "next/image";
import Section from "@/components/Section";

type QuizRound = {
  round: number;
  questions: string[];
};

type QuizImage = {
  label: string;
  url: string;
};

type QuizPart = {
  rounds: QuizRound[];
  images?: QuizImage[];
};

type Quiz = {
  id: string;
  quiz_day: string;
  quiz_date: string;
  youtube_url?: string;
  thumbnail_url?: string;
  access_codes?: {
    part1?: string;
    part2?: string;
  };
  parts?: {
    part1?: QuizPart;
    part2?: QuizPart;
  };
};

function VideoEmbed({ src, sticky }: { src: string; sticky: boolean }) {
  return (
    <div
      className={`
        ${
          sticky
            ? "fixed bottom-4 right-4 w-64 h-36 shadow-xl"
            : "relative w-full mb-6"
        }
        rounded-lg overflow-hidden transition-all duration-300
      `}
      style={!sticky ? { paddingBottom: "56.25%" } : {}}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={src}
        title="Quiz Video"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}

export default function QuizRecapDetailPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<null | "part1" | "part2">(
    null
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", String(id))
          .single();
        if (error) throw error;
        setQuiz(data as Quiz);
      } catch (err) {
        console.error("Failed to load quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();

    const handleScroll = () => {
      setIsSticky(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [id]);

  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const videoId = extractVideoId(quiz?.youtube_url || "");
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
    : null;

  const handleCodeSubmit = () => {
    if (!quiz?.access_codes || !selectedPart) return;
    const validCode = quiz.access_codes[selectedPart];
    if (codeInput.trim() === validCode) {
      setCodeValid(true);
    } else {
      alert("Incorrect code.");
    }
  };

  const resetView = () => {
    setSelectedPart(null);
    setCodeInput("");
    setCodeValid(false);
  };

  if (loading) return <div className="text-white p-8">Loading quiz...</div>;
  if (!quiz) return <div className="text-red-400 p-8">Quiz not found.</div>;

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Section
      container
      pyClass="py-8"
      bgClass="bg-gradient-to-t from-primary-200 to-primary-900"
    >
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        {quiz.quiz_day} – {formatDate(quiz.quiz_date)}
      </h1>

      {/* Video Embed */}
      {embedUrl && <VideoEmbed src={embedUrl} sticky={isSticky} />}

      {/* Part selection & logic */}
      {!selectedPart && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setSelectedPart("part1")}
            className="bg-purple-700 text-yellow-300 p-4 rounded-lg text-lg hover:bg-purple-600"
          >
            View Part One
          </button>
          <button
            onClick={() => setSelectedPart("part2")}
            className="bg-purple-700 text-yellow-300 p-4 rounded-lg text-lg hover:bg-purple-600"
          >
            View Part Two
          </button>
        </div>
      )}

      {/* Code entry */}
      {selectedPart && !codeValid && (
        <div className="mt-6 space-y-4">
          <p className="text-black text-lg">
            Enter access code for{" "}
            {selectedPart === "part1" ? "Part One" : "Part Two"}:
          </p>
          <input
            className="w-full p-2 rounded border border-gray-300"
            placeholder="Enter code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <button
              onClick={handleCodeSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
            >
              Submit Code
            </button>
            <button
              onClick={resetView}
              className="text-yellow-300 bg-primary-900 px-4 py-2 rounded font-bold"
            >
              Return to Part Menu
            </button>
          </div>
        </div>
      )}

      {/* Rounds & Images */}
      {selectedPart && codeValid && (
        <div className="mt-8 space-y-6">
          <button
            onClick={resetView}
            className="text-yellow-300 bg-primary-900 px-4 py-2 rounded font-bold"
          >
            Return to Part Menu
          </button>

          {/* Rounds */}
          <h2 className="text-2xl font-bold text-yellow-400">
            {selectedPart === "part1" ? "Rounds 1–3" : "Rounds 4–5"}
          </h2>
          {quiz.parts?.[selectedPart]?.rounds.map((round, idx) => (
            <div
              key={idx}
              className="bg-purple-700 p-4 rounded-lg text-white shadow-md"
            >
              <h3 className="text-xl font-bold mb-2">Round {round.round}</h3>
              <ul className="list-disc list-inside pl-2 space-y-1">
                {round.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
          <button
            onClick={resetView}
            className="text-yellow-300 bg-primary-900 px-4 py-2 rounded font-bold"
          >
            Return to Part Menu
          </button>
          {/* Images */}
          {(quiz.parts?.[selectedPart]?.images?.length ?? 0) > 0 && (
            <>
              <h3 className="text-xl font-semibold text-yellow-300">
                Related Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quiz.parts?.[selectedPart]?.images?.map((img, i) => (
                  <div
                    key={i}
                    className="bg-purple-800 rounded-lg p-3 text-white"
                  >
                    <p className="text-sm mb-2">{img.label}</p>
                    <Image
                      src={img.url}
                      alt={img.label}
                      width={600}
                      height={400}
                      className="rounded w-full h-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
