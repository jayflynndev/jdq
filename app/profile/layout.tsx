export const metadata = {
  title: "Profile",
  description: "Manage your scores, friends, leaderboards, and account.",
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
