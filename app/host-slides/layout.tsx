import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";

export default function HostSlidesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
