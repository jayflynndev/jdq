"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import Image from "next/image";

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
  quizDay: string;
  quizDate: string;
  youtubeUrl?: string;
  accessCodes?: {
    part1?: string;
    part2?: string;
  };
  parts?: {
    part1?: QuizPart;
    part2?: QuizPart;
  };
};

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
        const quizDoc = await getDoc(doc(db, "quizzes", String(id)));
        if (quizDoc.exists()) {
          setQuiz({ id: quizDoc.id, ...(quizDoc.data() as Omit<Quiz, "id">) });
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
      } finally {
        setLoading(false);
      }
      const handleScroll = () => {
        setIsSticky(window.scrollY > 300);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    };

    fetchQuiz();
  }, [id]);

  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const videoId = extractVideoId(quiz?.youtubeUrl || "");
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
    : null;

  const handleCodeSubmit = () => {
    if (!quiz?.accessCodes || !selectedPart) return;

    const validCode = quiz.accessCodes[selectedPart];
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
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        {quiz.quizDay} – {formatDate(quiz.quizDate)}
      </h1>

      {embedUrl && (
        <div
          className={`z-40 transition-all duration-300 ${
            isSticky
              ? "fixed bottom-4 right-4 w-64 h-36 shadow-xl"
              : "relative aspect-video w-full mb-6"
          } rounded-lg overflow-hidden`}
        >
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title="Quiz Video"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

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

      {selectedPart && !codeValid && (
        <div className="mt-6 space-y-4">
          <p className="text-white">
            Enter access code for{" "}
            {selectedPart === "part1" ? "Part One" : "Part Two"}:
          </p>
          <input
            className="w-full p-2 rounded border border-gray-300"
            placeholder="Enter code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <button
            onClick={handleCodeSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          >
            Submit Code
          </button>
          <button
            onClick={resetView}
            className="text-yellow-300 bg-purple-800 px-4 py-2 rounded font-bold ml-2  mt-2"
          >
            Return to Part Menu
          </button>
        </div>
      )}

      {selectedPart && codeValid && (
        <div className="mt-8 space-y-6">
          <button
            onClick={resetView}
            className="text-yellow-300 bg-purple-800 px-4 py-2 rounded font-bold ml-2  mt-2"
          >
            Return to Part Menu
          </button>

          {/* Rounds */}
          <h2 className="text-2xl font-bold text-yellow-400">
            {selectedPart === "part1" ? "Rounds 1–3" : "Rounds 4–5"}
          </h2>

          {quiz.parts?.[selectedPart]?.rounds.map(
            (round: { round: number; questions: string[] }, index: number) => (
              <div
                key={index}
                className="bg-purple-700 p-4 rounded-lg text-white shadow-md"
              >
                <h3 className="text-xl font-bold mb-2">Round {round.round}</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {round.questions.map((q: string, i: number) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )
          )}

          {/* Images */}
          {(quiz.parts?.[selectedPart]?.images?.length ?? 0) > 0 && (
            <>
              <button
                onClick={resetView}
                className="text-yellow-300 bg-purple-800 px-4 py-2 rounded font-bold ml-2  mt-2"
              >
                Return to Part Menu
              </button>
              <h3 className="text-xl font-semibold text-yellow-300 mt-6">
                Related Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quiz.parts?.[selectedPart]?.images?.map(
                  (img: { label: string; url: string }, i: number) => (
                    <div
                      key={i}
                      className="bg-purple-800 rounded-lg p-3 text-white"
                    >
                      <p className="text-sm mb-2">{img.label}</p>
                      <Image
                        src={img.url}
                        alt={img.label}
                        width={600} // or a safe default width
                        height={400} // or adjust as needed
                        className="rounded w-full h-auto object-contain"
                      />
                    </div>
                  )
                )}
              </div>
              <button
                onClick={resetView}
                className="text-yellow-300 bg-purple-800 px-4 py-2 rounded font-bold ml-2  mt-2"
              >
                Return to Part Menu
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
