import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
// import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jay's Quiz Hub",
  description: "JDQ and JVQ's New Home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={quicksand.className}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1521571031670829" />
      </head>
      <body>
        {/* <NavBar /> */}
        {children}
        <Footer />
      </body>
    </html>
  );
}
