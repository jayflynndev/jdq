export const metadata = {
  title: "JVQ Admin",
  description: "Manage Jay's Virtual Quiz content.",
};

export default function JvqAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
