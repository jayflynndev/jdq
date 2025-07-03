// components/Hero.tsx
"use client";

import React from "react";

interface HeroProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage?: string;
  heightClass?: string; // e.g. "h-[600px] min-h-[300px]"
}

export default function Hero({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroImage,
  heightClass = "",
}: HeroProps) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${heightClass}`}
    >
      {/* Text block with responsive padding + blur/bg */}
      <div
        className="
          relative z-10
          mx-auto max-w-3xl
          px-4 py-8
          sm:py-12 md:py-20
          text-center
          rounded-lg
          bg-purple-500 bg-opacity-20
          backdrop-blur-sm
          sm:bg-opacity-30
        "
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-2">
          {heroTitle}
        </h1>
        <h2 className="text-lg sm:text-xl md:text-2xl text-black mb-4">
          {heroSubtitle}
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-black leading-relaxed">
          {heroDescription}
        </p>
      </div>

      {/* Background image + overlay – only on md+ */}
      <div
        className="absolute inset-0 bg-cover bg-center hidden md:block"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-purple-500 opacity-100 hidden md:block" />
    </div>
  );
}
