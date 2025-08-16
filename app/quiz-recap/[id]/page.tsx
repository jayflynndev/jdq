// app/quiz-recap/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Image from "next/image";
import { BrandButton } from "@/components/ui/BrandButton";
import { Card, CardContent } from "@/components/ui/Card";

type QuizRound = { round: number; questions: string[] };
type QuizImage = { label: string; url: string };
type QuizPart = { rounds: QuizRound[]; images?: QuizImage[] };
type Quiz = {
  id: string;
  quiz_day: string;
  quiz_date: string;
  youtube_url?: string;
  thumbnail_url?: string;
  access_codes?: { part1?: string; part2?: string };
  parts?: { part1?: QuizPart; part2?: QuizPart };
};

function ShrinkingStickyVideo({ src }: { src: string }) {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const UP = 80; // unshrink when scrolled back above this
    const DOWN = 140; // shrink when scrolled past this
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (!shrink && y > DOWN) setShrink(true);
      else if (shrink && y < UP) setShrink(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [shrink]);

  return (
    <div
      className={[
        "sticky top-0 z-30 transition-all duration-250 ease-out bg-transparent",
        shrink ? "py-2" : "py-0",
        "pointer-events-none", // 🚀 block the wrapper itself
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto transition-transform duration-250 ease-out will-change-transform",
          shrink ? "max-w-3xl scale-[0.68]" : "max-w-none scale-100",
          "pointer-events-auto", // ✅ let children (iframe) be clickable again
        ].join(" ")}
        style={{ transformOrigin: "top center" }}
      >
        <div className="relative w-full overflow-hidden rounded-xl shadow-2xl">
          <div className="pt-[56.25%]" />
          <iframe
            className="absolute inset-0 h-full w-full"
            src={src}
            title="Quiz Video"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
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

  useEffect(() => {
    (async () => {
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
    })();
  }, [id]);

  const extractVideoId = (url: string) => {
    try {
      const u = new URL(url);
      return u.searchParams.get("v");
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
    const valid = quiz.access_codes[selectedPart];
    if (codeInput.trim() === valid) setCodeValid(true);
    else alert("Incorrect code.");
  };

  const resetView = () => {
    setSelectedPart(null);
    setCodeInput("");
    setCodeValid(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
        <div className="mx-auto max-w-7xl px-4 py-10 text-black">
          Loading quiz…
        </div>
      </main>
    );
  }
  if (!quiz) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
        <div className="mx-auto max-w-7xl px-4 py-10 text-red-200">
          Quiz not found.
        </div>
      </main>
    );
  }

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Top header */}
        <header className="mb-6">
          <h1 className="font-heading text-3xl text-black">
            {quiz.quiz_day} – {formatDate(quiz.quiz_date)}
          </h1>
          <p className="text-black/85">
            Enter the access code for the part you want to view. Images and
            rounds will appear once the correct code is entered.
          </p>
        </header>

        {/* Video (optional) */}
        {embedUrl && <ShrinkingStickyVideo src={embedUrl} />}

        {/* Part selector */}
        {!selectedPart && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="pop" hover>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-textc-muted">JVQ Recap</div>
                  <div className="font-semibold text-textc">View Part One</div>
                </div>
                <BrandButton onClick={() => setSelectedPart("part1")}>
                  Open
                </BrandButton>
              </CardContent>
            </Card>

            <Card variant="pop" hover>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-textc-muted">JVQ Recap</div>
                  <div className="font-semibold text-textc">View Part Two</div>
                </div>
                <BrandButton onClick={() => setSelectedPart("part2")}>
                  Open
                </BrandButton>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Code entry */}
        {selectedPart && !codeValid && (
          <Card className="mt-6">
            <CardContent className="space-y-4">
              <p className="text-textc">
                Enter access code for{" "}
                <strong>
                  {selectedPart === "part1" ? "Part One" : "Part Two"}
                </strong>
                :
              </p>
              <input
                className="w-full rounded-lg border borderc bg-white px-3 py-2 text-sm"
                placeholder="Enter code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <BrandButton onClick={handleCodeSubmit}>
                  Submit code
                </BrandButton>
                <BrandButton variant="outline" onClick={resetView}>
                  Return to part menu
                </BrandButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rounds & Images */}
        {selectedPart && codeValid && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-wrap gap-3">
              <BrandButton variant="outline" onClick={resetView}>
                ← Return to part menu
              </BrandButton>
            </div>

            <h2 className="text-2xl font-semibold text-black">
              {selectedPart === "part1" ? "Rounds 1–3" : "Rounds 4–5"}
            </h2>

            {/* Rounds */}
            {quiz.parts?.[selectedPart]?.rounds.map((round, idx) => (
              <Card key={idx} variant="pop">
                <CardContent>
                  <h3 className="mb-2 text-lg font-semibold text-textc">
                    Round {round.round}
                  </h3>
                  <ul className="list-disc pl-5 text-textc">
                    {round.questions.map((q, i) => (
                      <li key={i} className="py-0.5">
                        {q}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            {/* Images */}
            {(quiz.parts?.[selectedPart]?.images?.length ?? 0) > 0 && (
              <>
                <h3 className="text-xl font-semibold text-black">
                  Related Images
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {quiz.parts?.[selectedPart]?.images?.map((img, i) => (
                    <Card key={i}>
                      <CardContent>
                        <p className="mb-2 text-sm text-textc">{img.label}</p>
                        <div className="relative w-full overflow-hidden rounded-lg">
                          <Image
                            src={img.url}
                            alt={img.label}
                            width={1200}
                            height={800}
                            className="h-auto w-full rounded-lg object-contain"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="pt-2">
                  <BrandButton variant="outline" onClick={resetView}>
                    ← Return to part menu
                  </BrandButton>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
