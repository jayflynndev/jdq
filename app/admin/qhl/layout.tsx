import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";

export const metadata = { title: "QHL Admin" };

export default function QhlAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
