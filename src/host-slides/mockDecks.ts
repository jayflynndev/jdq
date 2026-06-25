import type { HostDeck } from "@/src/host-slides/types";

export const mockHostSlideDecks: readonly HostDeck[] = [
  {
    id: "thursday-quiz-26-june",
    title: "Thursday Night Quiz",
    quizType: "thursday",
    quizDate: "2026-06-26",
    status: "ready",
    connectionExplanation:
      "The answers were all things you would find in an IKEA catalogue.",
    rounds: [
      {
        id: "thursday-round-1",
        title: "General Knowledge",
        questions: [
          { id: "t-r1-q1", prompt: "Which element has the chemical symbol Fe?", answer: "Iron" },
          { id: "t-r1-q2", prompt: "What is the capital city of Portugal?", answer: "Lisbon" },
        ],
      },
      {
        id: "thursday-round-2",
        title: "Picture Round: Famous Faces",
        questions: [
          { id: "t-r2-q1", prompt: "Name the actor shown in picture one.", answer: "Olivia Colman", imagePlaceholder: "Portrait image 1" },
          { id: "t-r2-q2", prompt: "Name the musician shown in picture two.", answer: "Stormzy", imagePlaceholder: "Portrait image 2" },
        ],
      },
      {
        id: "thursday-round-3",
        title: "Film & Television",
        questions: [
          { id: "t-r3-q1", prompt: "Who directed Jaws?", answer: "Steven Spielberg" },
          { id: "t-r3-q2", prompt: "What is the coffee shop in Friends called?", answer: "Central Perk" },
        ],
      },
      {
        id: "thursday-round-4",
        title: "Music",
        questions: [
          { id: "t-r4-q1", prompt: "Which band released the album Rumours?", answer: "Fleetwood Mac" },
          {
            id: "t-r4-q2",
            prompt: "Name the singer shown in this picture.",
            answer: "Madonna",
            imagePlaceholder: "Music artist image",
          },
        ],
      },
      {
        id: "thursday-round-5",
        title: "Connections",
        questions: [
          { id: "t-r5-q1", prompt: "What connects Mercury, Venus, Earth and Mars?", answer: "They are the four inner planets" },
          { id: "t-r5-q2", prompt: "What connects ruby, scarlet and crimson?", answer: "They are shades of red" },
        ],
      },
    ],
    tiebreaker: {
      id: "thursday-tiebreaker",
      prompt: "To the nearest mile, how long is the River Thames?",
      answer: "215 miles",
    },
  },
  {
    id: "saturday-quiz-28-june",
    title: "Saturday Night Quiz",
    quizType: "saturday",
    quizDate: "2026-06-28",
    status: "draft",
    rounds: [
      {
        id: "saturday-round-1",
        title: "General Knowledge",
        questions: [
          { id: "s-r1-q1", prompt: "Which ocean is the largest?", answer: "The Pacific Ocean" },
          { id: "s-r1-q2", prompt: "How many sides does a dodecagon have?", answer: "12" },
        ],
      },
      {
        id: "saturday-round-2",
        title: "Picture Round",
        questions: [
          { id: "s-r2-q1", prompt: "Identify the landmark in picture one.", answer: "The Eiffel Tower", imagePlaceholder: "Landmark image 1" },
          { id: "s-r2-q2", prompt: "Identify the landmark in picture two.", answer: "Sydney Opera House", imagePlaceholder: "Landmark image 2" },
        ],
      },
      {
        id: "saturday-round-3",
        title: "Sport",
        questions: [
          { id: "s-r3-q1", prompt: "Wimbledon is played on which surface?", answer: "Grass" },
          { id: "s-r3-q2", prompt: "How many players start in a rugby union team?", answer: "15" },
        ],
      },
      {
        id: "saturday-round-4",
        title: "Music",
        questions: [
          { id: "s-r4-q1", prompt: "Who represented the UK at Eurovision in 2022?", answer: "Sam Ryder" },
          { id: "s-r4-q2", prompt: "Which artist released Purple Rain?", answer: "Prince" },
        ],
      },
      {
        id: "saturday-round-5",
        title: "Final Connections",
        questions: [
          { id: "s-r5-q1", prompt: "What connects Cairo, Nairobi and Accra?", answer: "They are African capital cities" },
          { id: "s-r5-q2", prompt: "What connects oak, ash and elm?", answer: "They are trees" },
        ],
      },
    ],
    tiebreaker: {
      id: "saturday-tiebreaker",
      prompt: "How many minutes long is the film Titanic?",
      answer: "194 minutes",
    },
  },
  {
    id: "patreon-summer-special",
    title: "Patreon Summer Special",
    quizType: "patreon",
    quizDate: "2026-07-03",
    status: "ready",
    rounds: [
      {
        id: "patreon-round-1",
        title: "Summer Around the World",
        questions: [
          { id: "p-r1-q1", prompt: "Santorini belongs to which country?", answer: "Greece" },
          { id: "p-r1-q2", prompt: "Which fruit is used in a Bellini?", answer: "Peach" },
        ],
      },
      {
        id: "patreon-round-2",
        title: "Connections",
        questions: [
          { id: "p-r2-q1", prompt: "What connects ruby, scarlet and crimson?", answer: "They are shades of red" },
          { id: "p-r2-q2", prompt: "What connects Mercury, Gemini and Apollo?", answer: "NASA space programmes" },
        ],
      },
    ],
  },
];

export function getMockHostSlideDeck(deckId: string): HostDeck | undefined {
  return mockHostSlideDecks.find((deck) => deck.id === deckId);
}
