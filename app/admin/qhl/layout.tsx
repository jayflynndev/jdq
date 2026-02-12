import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
