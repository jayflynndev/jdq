"use client";

import Image from "next/image";

interface HeroProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  heightClass?: string;
  overlay?: boolean;
}

export default function HomeHero({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroImage,
  heightClass = "h-[500px]",
  overlay = false,
}: HeroProps) {
  return (
    <div
      className={`relative flex items-center justify-center text-center ${heightClass} px-4 py-10`}
    >
      {/* Background Image with blur */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <Image
          src={heroImage}
          alt="Hero Background"
          layout="fill"
          objectFit="cover"
          className="blur-sm opacity-30"
          priority
        />
      </div>

      {/* Optional overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-0" />
      )}

      {/* Foreground Content */}
      <div className="relative z-10 max-w-3xl text-white space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">
          {heroTitle}
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-purple-200">
          {heroSubtitle}
        </h2>
        <p className="text-md md:text-lg">{heroDescription}</p>
      </div>
    </div>
  );
}
