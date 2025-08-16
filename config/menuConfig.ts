// config/menuConfig.ts
export type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};
export type MenuGroup = { header: string; items: MenuItem[] };

// These have no onClick — NavBar will attach those at runtime
export const JVQ_GROUP: MenuGroup = {
  header: "JVQ",
  items: [
    { label: "Quiz Recap", href: "/quiz-recap" },
    { label: "JVQ Leaderboards", href: "/lb-select/jvpqlb" },
    { label: "Add Your Score", href: "/profile?tab=add-score" },
    { label: "QuizHub Live (Coming Soon)", disabled: true },
  ],
};

export const JDQ_GROUP: MenuGroup = {
  header: "JDQ",
  items: [
    { label: "Listen", href: "/jdq" },
    { label: "JDQ Leaderboards", href: "/lb-select/jdqlb" },
    { label: "Add Your Score", href: "/profile?tab=add-score" },
  ],
};

export const TOP_LEVEL_LOGGED_IN: MenuItem[] = [
  { label: "Home", href: "/" },
  { label: "Global Leaderboards", href: "/lb-select" },
  { label: "Your Leaderboards", href: "/leaderboards/mine" },
  { label: "Profile", href: "/profile" },
  { label: "Message Us!", href: "/contact" },
  { label: "Question Database (Coming Soon)", disabled: true },
  { label: "About Jay ", href: "/about" },
  { label: "Sign Out" }, // onClick added later
];

export const TOP_LEVEL_LOGGED_OUT: MenuItem[] = [
  { label: "Home", href: "/" },
  { label: "Leaderboards", href: "/lb-select" },
  { label: "Question Database (Coming Soon)", disabled: true },
  { label: "About Jay ", href: "/about" },
  { label: "Sign In/Up!" }, // onClick added later
];
