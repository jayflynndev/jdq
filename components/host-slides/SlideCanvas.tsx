import React from "react";
import Image from "next/image";
import type {
  HostBreakBlockConfig,
  HostDeck,
  HostPresenterSlide,
  HostQuestion,
  HostRound,
  HostShowScreenTextSettings,
  HostShowScreenType,
} from "@/src/host-slides/types";
import { createEmptyDingbatSet } from "@/src/host-slides/types";
import {
  getBreakAccessCode,
  resolveHostShowScreens,
} from "@/src/host-slides/showScreens";

type ShowScreenLayoutMode = "camera" | "break-countdown";

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

function getQuestionNumber(round: HostRound, question: HostQuestion): number {
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

  function showScreenSettings(
    screenType: HostShowScreenType,
  ): HostShowScreenTextSettings {
    const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
    switch (screenType) {
      case "blank":
        return showScreens.blank;
      case "pre_roll":
        return showScreens.preRoll;
      case "pre_quiz":
        return showScreens.preQuiz;
      case "pre_break":
        return showScreens.preBreak;
      case "break_countdown":
        return showScreens.breakCountdown;
      case "post_break":
        return showScreens.postBreak;
      case "mid_quiz_reset":
        return showScreens.midQuizReset;
      case "saturday_break_2":
        return showScreens.saturdayBreak2;
      case "quiz_end":
        return showScreens.quizEnd;
    }
  }

  function showScreenLabel(screenType: HostShowScreenType): string {
    switch (screenType) {
      case "blank":
        return "Blank";
      case "pre_roll":
        return "Pre-Roll";
      case "pre_quiz":
        return "Pre-Quiz";
      case "pre_break":
        return "Pre-Break";
      case "break_countdown":
        return "Break";
      case "post_break":
        return "Post-Break";
      case "mid_quiz_reset":
        return "Reset";
      case "saturday_break_2":
        return "Sat Break 2";
      case "quiz_end":
        return "Quiz End";
    }
  }

  function showScreenLayoutMode(
    screenType: HostShowScreenType,
  ): ShowScreenLayoutMode {
    return screenType === "break_countdown" ||
      screenType === "saturday_break_2"
      ? "break-countdown"
      : "camera";
  }

  function renderShowScreen({
    titleText,
    bodyText,
    tickerText,
    tickerLabel,
    asideTitle,
    accessCode,
    reserveCountdown,
    timerLabel,
    layoutMode,
  }: {
    titleText: string;
    bodyText: string;
    tickerText: string;
    tickerLabel: string;
    asideTitle: string;
    accessCode?: ReturnType<typeof getBreakAccessCode>;
    reserveCountdown: boolean;
    timerLabel: string;
    layoutMode: ShowScreenLayoutMode;
  }) {
    const visibleAccessCode = accessCode?.shouldShow ? accessCode : null;
    const isBreakCountdownMode = layoutMode === "break-countdown";

    return (
      <div className="relative flex h-full flex-col overflow-hidden p-[3%]">
        <div className="flex min-h-0 flex-1 gap-[3%] pb-[6%]">
          <div
            className="relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-black/70 p-[4%] shadow-2xl"
            data-show-screen-region="main"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,212,76,0.2),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(124,58,237,0.34),transparent_36%),linear-gradient(135deg,rgba(0,0,0,0.15),rgba(0,0,0,0.84))]" />
            <div className="relative h-full">
              {isBreakCountdownMode ? (
                <div className="flex h-full flex-col justify-center">
                  <p className="text-[clamp(1rem,1.5vw,1.7rem)] font-black uppercase tracking-[0.2em] text-yellow-300">
                    {titleText}
                  </p>
                  {bodyText.trim() ? (
                    <h2 className="mt-[4%] max-w-[1100px] whitespace-pre-line text-balance font-heading text-[clamp(2.6rem,5.8vw,7rem)] font-black leading-none text-white">
                      {bodyText}
                    </h2>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="absolute bottom-[6%] left-[6%] h-[18%] w-[24%] rounded-full border border-white/10 bg-white/5" />
                  <div className="absolute right-[7%] top-[7%] h-[28%] w-[18%] rounded-full border border-yellow-300/20 bg-yellow-300/10" />
                </>
              )}
            </div>
          </div>

          <aside
            className="flex w-[34%] min-w-0 flex-col rounded-[2rem] border border-white/10 bg-white/95 p-[2.5%] text-slate-950 shadow-2xl"
            data-show-screen-region="right-panel"
          >
            <p className="text-[clamp(0.8rem,1.05vw,1.15rem)] font-black uppercase tracking-[0.2em] text-violet-700">
              {deck.quizType}
            </p>
            <h3 className="mt-[2%] font-heading text-[clamp(1.5rem,2.5vw,3.2rem)] font-black leading-none text-slate-950">
              {isBreakCountdownMode
                ? visibleAccessCode
                  ? "quizhub.co.uk"
                  : asideTitle
                : titleText || asideTitle}
            </h3>
            {!isBreakCountdownMode ? (
              <>
                <p className="mt-[3%] text-[clamp(0.85rem,1.1vw,1.3rem)] font-bold text-violet-800">
                  {deck.title}
                </p>
                <p className="mt-[1.5%] text-[clamp(0.75rem,0.95vw,1.05rem)] font-semibold text-slate-500">
                  {new Date(`${deck.quizDate}T12:00:00`).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </p>
              </>
            ) : null}
            {!isBreakCountdownMode && bodyText.trim() ? (
              <p className="mt-[5%] whitespace-pre-line text-[clamp(1rem,1.55vw,1.75rem)] font-semibold leading-snug text-slate-800">
                {bodyText}
              </p>
            ) : null}
            {visibleAccessCode ? (
              <div className="mt-[6%] rounded-2xl border border-violet-200 bg-violet-50 p-[6%]">
                <p className="text-[clamp(0.75rem,0.95vw,1.05rem)] font-black uppercase tracking-[0.18em] text-violet-700">
                  quizhub.co.uk <br /> Access Code
                </p>
                <p className="mt-[2%] text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-slate-500">
                  {visibleAccessCode.part}
                </p>
                {visibleAccessCode.code ? (
                  <p className="mt-[3%] break-words font-heading text-[clamp(2.4rem,4.8vw,5.4rem)] font-black leading-none text-slate-950">
                    {visibleAccessCode.code}
                  </p>
                ) : (
                  <p
                    className={`mt-[3%] text-[clamp(1.1rem,1.6vw,1.8rem)] font-black leading-tight ${
                      isPresenter ? "text-slate-600" : "text-amber-700"
                    }`}
                  >
                    {isPresenter
                      ? "Access code coming soon"
                      : `${visibleAccessCode.part} access code missing`}
                  </p>
                )}
              </div>
            ) : null}
            {reserveCountdown ? (
              <div className="mt-auto" data-show-screen-region="timer">
                <p className="text-[clamp(0.8rem,1vw,1.1rem)] font-black uppercase tracking-[0.18em] text-slate-500">
                  {timerLabel}
                </p>
                <div className="mt-[3%] flex h-[18vh] items-center justify-center rounded-2xl border-4 border-dashed border-slate-300 bg-slate-950 text-center text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.16em] text-slate-500"></div>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-[10%] items-center overflow-hidden border-t border-yellow-300/40 bg-black/90 px-[3%]">
          <div className="mr-[2%] rounded bg-yellow-300 px-[1.2%] py-[0.45%] text-[clamp(0.8rem,1.05vw,1.15rem)] font-black uppercase tracking-[0.16em] text-black">
            {tickerLabel}
          </div>
          <p className="truncate text-[clamp(1rem,1.55vw,1.8rem)] font-bold uppercase tracking-[0.12em] text-white">
            {tickerText}
          </p>
        </div>
      </div>
    );
  }

  function renderConfiguredShowScreen(
    screenType: HostShowScreenType,
    accessCodePart?: "part1" | "part2",
    textSettings?: HostBreakBlockConfig["textSettings"],
    showTimerPlaceholder?: boolean,
  ) {
    const settings = {
      ...showScreenSettings(screenType),
      ...textSettings,
    };
    const defaultReserveCountdown =
      screenType === "pre_quiz" ||
      screenType === "break_countdown" ||
      screenType === "saturday_break_2";
    const reserveCountdown = showTimerPlaceholder ?? defaultReserveCountdown;
    return renderShowScreen({
      ...settings,
      tickerLabel: showScreenLabel(screenType),
      asideTitle:
        screenType === "quiz_end" ? "Quiz complete" : "Jay's Quiz",
      accessCode: accessCodePart
        ? getBreakAccessCode(deck, accessCodePart)
        : undefined,
      reserveCountdown,
      timerLabel: screenType === "pre_quiz" ? "Quiz Starts In:" : "Back in:",
      layoutMode: showScreenLayoutMode(screenType),
    });
  }

  function renderContent() {
    switch (slide.type) {
      case "show-screen":
        return renderConfiguredShowScreen(
          slide.screenType,
          slide.accessCodePart,
          slide.textSettings,
          slide.showTimerPlaceholder,
        );
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
      <div
        className={`relative z-10 h-full ${
          slide.type === "show-screen"
            ? ""
            : "p-[5%]"
        }`}
      >
        {renderContent()}
      </div>
      {isDingbatSlide ? (
        <div className="absolute inset-x-0 bottom-0 z-20 h-[9%] border-t border-white/10 bg-black/80" />
      ) : null}
    </div>
  );
}
