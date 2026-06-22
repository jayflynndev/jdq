import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";

export default function HostSlidesAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
