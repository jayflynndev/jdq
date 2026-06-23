"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPresenter = /^\/host-slides\/[^/]+\/present\/?$/.test(pathname);

  if (isPresenter) return <>{children}</>;

  return (
    <>
      <NavBar />
      {children}
      <CookieBanner />
      <Footer />
    </>
  );
}
