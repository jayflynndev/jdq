import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { siteConfig } from "@/config/siteConfig";
import Script from "next/script";
import clsx from "clsx";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Jay’s Quiz Hub — Live Quizzes, Recaps & Leaderboards",
    template: "%s | Jay’s Quiz Hub", // individual pages can override the %s
  },
  description:
    "Play along with Jay’s live quizzes, log your scores, and climb JDQ & JVQ leaderboards. Catch quiz recaps and explore thousands of questions.",
  openGraph: {
    title: "Jay’s Quiz Hub",
    description:
      "Live quizzes, recaps, and leaderboards — join in and climb the rankings.",
    url: "https://your-domain.example",
    siteName: "Jay’s Quiz Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jay’s Quiz Hub",
    description:
      "Play along with Jay’s live quizzes, daily challenges, and climb the leaderboards.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1521571031670829" />
      </head>
      <body
        className={clsx(
          inter.variable,
          poppins.variable,
          "min-h-screen bg-surface-subtle text-textc"
        )}
      >
        <Toaster position="top-center" />
        <NavBar />
        {siteConfig.adsEnabled && siteConfig.adsenseClient && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        {children}
        <CookieBanner />
        <Footer />
      </body>
    </html>
  );
}
