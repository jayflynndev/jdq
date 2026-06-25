import Image from "next/image";
import type {
  HostDeck,
  HostPresenterSlide,
  HostQuestion,
  HostRound,
} from "@/src/host-slides/types";
import { createEmptyDingbatSet } from "@/src/host-slides/types";

type SlideCanvasProps = {
  deck: HostDeck;
  slide: HostPresenterSlide;
  mode?: "preview" | "presenter";
};

function findRound(deck: HostDeck, roundId: string): HostRound {
  const round = deck.rounds.find((candidate) => candidate.id === roundId);
  if (!round) throw new Error(`Round not found: ${roundId}`);
  return round;
}

function findQuestion(round: HostRound, questionId: string): HostQuestion {
  const question = round.questions.find(
    (candidate) => candidate.id === questionId,
  );
  if (!question) throw new Error(`Question not found: ${questionId}`);
  return question;
}

function getRoundLabel(deck: HostDeck, round: HostRound): string {
  const roundNumber =
    deck.rounds.findIndex((candidate) => candidate.id === round.id) + 1;
  return `Round ${roundNumber}`;
}

function getQuestionNumber(
  round: HostRound,
  question: HostQuestion,
): number {
  return (
    round.questions.findIndex((candidate) => candidate.id === question.id) + 1
  );
}

function getTiebreaker(deck: HostDeck): HostQuestion {
  if (!deck.tiebreaker) throw new Error("Tiebreaker question is missing");
  return deck.tiebreaker;
}

export function SlideCanvas({
  deck,
  slide,
  mode = "preview",
}: SlideCanvasProps) {
  const isPresenter = mode === "presenter";
  const frameClass = isPresenter
    ? "h-screen min-h-screen w-screen"
    : "aspect-video w-full rounded-xl border border-violet-300/30 shadow-2xl";
  const labelClass = isPresenter
    ? "text-[clamp(1.8rem,2.6vw,3.2rem)]"
    : "text-xs sm:text-sm lg:text-base";
  const titleClass = isPresenter
    ? "text-[clamp(2.5rem,6vw,7rem)]"
    : "text-2xl sm:text-3xl lg:text-4xl";
  const roundIntroNumberClass = isPresenter
    ? "text-[clamp(4rem,10vw,11rem)]"
    : "text-4xl sm:text-5xl lg:text-6xl";
  const roundIntroTitleClass = isPresenter
    ? "text-[clamp(3.25rem,7vw,8rem)]"
    : "text-3xl sm:text-4xl lg:text-5xl";
  const questionNumberClass = isPresenter
    ? "text-[clamp(1.9rem,3vw,3.6rem)]"
    : "text-base sm:text-lg lg:text-2xl";
  const isDingbatSlide =
    slide.type === "dingbat-question" || slide.type === "dingbat-answer";

  function questionTextClass(text: string): string {
    if (!isPresenter) {
      return text.length > 150
        ? "text-sm sm:text-base lg:text-lg"
        : "text-lg sm:text-xl lg:text-2xl";
    }
    if (text.length > 260) return "text-[clamp(1.35rem,2.1vw,2.6rem)]";
    if (text.length > 180) return "text-[clamp(1.55rem,2.6vw,3.25rem)]";
    if (text.length > 110) return "text-[clamp(1.75rem,3.2vw,4rem)]";
    return "text-[clamp(2rem,4.5vw,5.5rem)]";
  }

  function answerQuestionClass(text: string): string {
    if (!isPresenter) {
      return text.length > 150
        ? "text-xs sm:text-sm lg:text-base"
        : "text-base sm:text-lg lg:text-xl";
    }
    if (text.length > 180) return "text-[clamp(1.25rem,2vw,2.5rem)]";
    return "text-[clamp(1.5rem,2.8vw,3.4rem)]";
  }

  function answerTextClass(text: string): string {
    if (!isPresenter) return "text-2xl sm:text-3xl lg:text-4xl";
    if (text.length > 100) return "text-[clamp(1.75rem,3.5vw,4.25rem)]";
    return "text-[clamp(2.5rem,5.2vw,6.25rem)]";
  }

  const label = (text: string) => (
    <p
      className={`${labelClass} font-bold uppercase tracking-[0.2em] text-yellow-300`}
    >
      {text}
    </p>
  );

  const questionHeader = (roundHeading: string, questionHeading: string) => (
    <header className="shrink-0 border-b border-violet-200/15 pb-[2.5vh]">
      {label(roundHeading)}
      <p
        className={`mt-[1vh] font-heading font-extrabold text-violet-100 ${questionNumberClass}`}
      >
        {questionHeading}
      </p>
    </header>
  );

  const pictureArea = (question: HostQuestion) => (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-violet-200/30 bg-violet-950/45 shadow-2xl">
      {question.imageUrl ? (
        <Image
          src={question.imageUrl}
          alt={question.imagePlaceholder ?? question.prompt}
          fill
          sizes={isPresenter ? "55vw" : "45vw"}
          className="object-contain"
          unoptimized
        />
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center border-2 border-dashed border-violet-200/25 p-6 text-center text-violet-100/55">
          <span className="text-[clamp(1rem,1.8vw,2rem)] font-bold">
            Image placeholder
          </span>
          {question.imagePlaceholder ? (
            <span className="mt-2 text-[clamp(0.75rem,1.1vw,1.2rem)]">
              {question.imagePlaceholder}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );

  function renderQuestion(
    question: HostQuestion,
    roundHeading: string,
    questionHeading: string,
    isTiebreaker = false,
  ) {
    const isPictureQuestion = Boolean(
      question.imageUrl || question.imagePlaceholder,
    );

    return (
      <div className="flex h-full flex-col">
        {questionHeader(roundHeading, questionHeading)}
        {isPictureQuestion && !isTiebreaker ? (
          <div className="mt-[3%] flex min-h-0 flex-1 gap-[3%]">
            <div className="h-full w-[68%] shrink-0">
              {pictureArea(question)}
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <h2
                className={`font-heading font-extrabold leading-[1.1] text-white ${questionTextClass(
                  question.prompt,
                )}`}
              >
                {question.prompt}
              </h2>
            </div>
          </div>
        ) : (
          <div className="mt-[3%] flex min-h-0 flex-1 items-center overflow-hidden pb-[4%]">
            <h2
              className={`max-w-[1450px] text-balance font-heading font-extrabold leading-[1.12] text-white ${questionTextClass(
                question.prompt,
              )}`}
            >
              {question.prompt}
            </h2>
          </div>
        )}
      </div>
    );
  }

  function renderAnswer(
    question: HostQuestion,
    roundHeading: string,
    questionHeading: string,
  ) {
    const isPictureQuestion = Boolean(
      question.imageUrl || question.imagePlaceholder,
    );

    return (
      <div className="flex h-full flex-col">
        {questionHeader(roundHeading, questionHeading)}
        {isPictureQuestion ? (
          <div className="mt-[3%] flex min-h-0 flex-1 gap-[3%]">
            <div className="h-full w-[68%] shrink-0">
              {pictureArea(question)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="font-heading text-[clamp(0.9rem,1.6vw,1.8rem)] font-semibold leading-tight text-violet-100">
                {question.prompt}
              </p>
              <p className="mt-[3vh] text-[clamp(0.9rem,1.4vw,1.5rem)] font-bold uppercase tracking-[0.16em] text-violet-100">
                Answer:
              </p>
              <p className="mt-[1.5vh] font-heading text-[clamp(1.75rem,3.4vw,4rem)] font-extrabold leading-none text-yellow-300">
                {question.answer}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-[3%] flex min-h-0 flex-1 flex-col justify-center overflow-hidden pb-[4%]">
            <p
              className={`max-w-[1450px] text-balance font-heading font-semibold leading-tight text-violet-100 ${answerQuestionClass(
                question.prompt,
              )}`}
            >
              {question.prompt}
            </p>
            <div className="mt-[4vh] h-1 w-28 rounded-full bg-yellow-300" />
            <p className="mt-[2.5vh] text-[clamp(1rem,1.8vw,2rem)] font-bold uppercase tracking-[0.16em] text-violet-100">
              Answer:
            </p>
            <p
              className={`mt-[1.5vh] max-w-[1450px] font-heading font-extrabold leading-[1.05] text-yellow-300 ${answerTextClass(
                question.answer,
              )}`}
            >
              {question.answer}
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderDingbats(showAnswers: boolean) {
    const items =
      deck.quizType === "saturday"
        ? (deck.dingbats?.items ?? createEmptyDingbatSet().items)
        : createEmptyDingbatSet().items;

    return (
      <div className="flex h-full flex-col pb-[9%]">
        <div className="flex h-[16%] shrink-0 items-center justify-center">
          <h2 className="text-center font-heading text-[clamp(1.5rem,3.5vw,4rem)] font-extrabold uppercase tracking-[0.12em] text-yellow-300">
            Dingbats
          </h2>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-x-[1.5%] gap-y-[2%] py-[1%]">
          {items.map((item) => (
            <div
              key={item.position}
              className="relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white p-[1%] shadow-xl"
            >
              <span className="absolute left-[3%] top-[2%] z-10 text-[clamp(0.7rem,1vw,1.1rem)] font-bold text-slate-700">
                {item.position}
              </span>
              <div className="relative min-h-0 flex-1 overflow-hidden rounded bg-white">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={`Dingbat ${item.position}`}
                    fill
                    sizes={isPresenter ? "30vw" : "25vw"}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 text-[clamp(0.65rem,1vw,1rem)] font-semibold text-slate-400">
                    Image missing
                  </div>
                )}
              </div>
              {showAnswers ? (
                <p className="mt-[1%] min-h-[1.4em] text-center font-heading text-[clamp(0.7rem,1.25vw,1.35rem)] font-bold leading-tight text-slate-900">
                  {item.answer || "Answer missing"}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderContent() {
    switch (slide.type) {
      case "title":
        return (
          <div className="flex h-full flex-col justify-center">
            {label(deck.quizType)}
            <h2
              className={`mt-[3%] max-w-[1350px] font-heading font-extrabold leading-tight text-white ${titleClass}`}
            >
              {deck.title}
            </h2>
            <p className="mt-[4%] text-[clamp(1.25rem,2.4vw,2.75rem)] text-violet-100">
              {new Date(`${deck.quizDate}T12:00:00`).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "long", year: "numeric" },
              )}
            </p>
          </div>
        );
      case "round-intro": {
        const round = findRound(deck, slide.roundId);
        return (
          <div className="flex h-full flex-col justify-center text-center">
            <p
              className={`${roundIntroNumberClass} font-black uppercase leading-none tracking-[0.08em] text-yellow-300`}
            >
              {getRoundLabel(deck, round).toUpperCase()}
            </p>
            <h2
              className={`mx-auto mt-[4%] max-w-[1500px] font-heading font-extrabold leading-tight text-white ${roundIntroTitleClass}`}
            >
              {round.title}
            </h2>
          </div>
        );
      }
      case "connection-explanation":
        return (
          <div className="flex h-full flex-col justify-center">
            <p className="text-[clamp(1.6rem,2.4vw,3rem)] font-bold uppercase tracking-[0.2em] text-yellow-300">
              Connection Explained
            </p>
            <h2 className="mt-[4%] max-w-[1500px] text-balance font-heading text-[clamp(2.2rem,4.8vw,6rem)] font-extrabold leading-[1.12] text-white">
              {deck.connectionExplanation}
            </h2>
          </div>
        );
      case "question": {
        const round = findRound(deck, slide.roundId);
        const question = findQuestion(round, slide.questionId);
        const roundHeading = [getRoundLabel(deck, round), round.title].join(
          " • ",
        );
        return renderQuestion(
          question,
          roundHeading,
          `Question ${getQuestionNumber(round, question)}`,
        );
      }
      case "answer": {
        const round = findRound(deck, slide.roundId);
        const question = findQuestion(round, slide.questionId);
        const roundHeading = [getRoundLabel(deck, round), round.title].join(
          " • ",
        );
        return renderAnswer(
          question,
          roundHeading,
          `Question ${getQuestionNumber(round, question)}`,
        );
      }
      case "dingbat-question":
        return renderDingbats(false);
      case "dingbat-answer":
        return renderDingbats(true);
      case "tiebreaker-question":
        return renderQuestion(
          getTiebreaker(deck),
          "Tiebreaker",
          "Question",
          true,
        );
      case "tiebreaker-answer":
        return renderAnswer(getTiebreaker(deck), "Tiebreaker", "Question");
    }
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#16082d] text-left ${frameClass}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,212,76,0.22),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(124,58,237,0.4),transparent_35%)]" />
      <div className="relative z-10 h-full p-[5%]">
        {renderContent()}
      </div>
      {isDingbatSlide ? (
        <div className="absolute inset-x-0 bottom-0 z-20 h-[9%] border-t border-white/10 bg-black/80" />
      ) : null}
    </div>
  );
}
