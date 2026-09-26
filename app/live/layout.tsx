import { AuthenticatedRouteGuard } from "@/components/auth/AuthenticatedRouteGuard";

export const metadata = { title: "Quiz Hub Live" };

export default function LiveLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthenticatedRouteGuard>{children}</AuthenticatedRouteGuard>;
}
