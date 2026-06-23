export type QuizRecapListItem = {
  id: string;
  quiz_day: string;
  quiz_date: string;
};

export type QuizRecapListing<T extends QuizRecapListItem> = {
  currentQuiz: T | undefined;
  previousQuizzes: T[];
};

type FeaturedRecapWindow = {
  quizDay: "thursday" | "saturday";
  quizDate: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(isoDate: string): Date {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${isoDate}`);
  }
  return date;
}

function formatIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getDateInTimeZone(
  date: Date,
  timeZone = "Europe/London",
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!year || !month || !day) {
    throw new Error(`Could not determine the date in ${timeZone}.`);
  }
  return `${year}-${month}-${day}`;
}

export function getFeaturedRecapWindow(
  todayIso: string,
): FeaturedRecapWindow {
  const today = parseIsoDate(todayIso);
  const weekday = today.getUTCDay();
  const usesThursday = weekday === 4 || weekday === 5;
  const targetWeekday = usesThursday ? 4 : 6;
  const daysSinceTarget = (weekday - targetWeekday + 7) % 7;
  const quizDate = new Date(today);
  quizDate.setUTCDate(today.getUTCDate() - daysSinceTarget);

  return {
    quizDay: usesThursday ? "thursday" : "saturday",
    quizDate: formatIsoDate(quizDate),
  };
}

function normalizedQuizDay(quizDay: string): string {
  return quizDay.trim().toLowerCase();
}

function isEligibleQuizDay(quizDay: string): boolean {
  const normalized = normalizedQuizDay(quizDay);
  return normalized === "thursday" || normalized === "saturday";
}

export function selectQuizRecapListing<T extends QuizRecapListItem>(
  quizzes: readonly T[],
  todayIso: string,
): QuizRecapListing<T> {
  parseIsoDate(todayIso);
  const featuredWindow = getFeaturedRecapWindow(todayIso);
  const eligibleQuizzes = quizzes
    .filter(
      (quiz) =>
        ISO_DATE_PATTERN.test(quiz.quiz_date) &&
        quiz.quiz_date <= todayIso &&
        isEligibleQuizDay(quiz.quiz_day),
    )
    .sort((left, right) => right.quiz_date.localeCompare(left.quiz_date));

  const currentQuiz = eligibleQuizzes.find(
    (quiz) =>
      quiz.quiz_date === featuredWindow.quizDate &&
      normalizedQuizDay(quiz.quiz_day) === featuredWindow.quizDay,
  );
  const previousQuizzes = eligibleQuizzes
    .filter((quiz) => quiz.id !== currentQuiz?.id)
    .slice(0, 6);

  return { currentQuiz, previousQuizzes };
}
