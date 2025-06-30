interface HeroItemsProps {
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroImage?: string; // optional now
  heightClass?: string; // optional
}

export default function HomeHero({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroImage,
  heightClass,
}: HeroItemsProps) {
  const containerClasses = [
    "relative flex flex-col items-center justify-center",
    heightClass ?? "h-[calc(100vh-200px)] min-h-[400px]",
    heroImage ? "bg-cover bg-center bg-fixed md:bg-scroll" : "bg-transparent",
  ].join(" ");

  return (
    <div
      style={heroImage ? { backgroundImage: `url('${heroImage}')` } : {}}
      className={containerClasses}
    >
      <div className="bg-white/30 py-2 px-4 backdrop-blur-md rounded-md max-w-4xl text-center">
        <div className="text-black">
          <div className="text-4xl font-bold md:text-6xl">{heroTitle}</div>
          {heroSubtitle && (
            <div className="text-3xl font-bold md:text-5xl">{heroSubtitle}</div>
          )}
          {heroDescription && (
            <div className="text-2xl md:text-4xl">{heroDescription}</div>
          )}
        </div>
      </div>
    </div>
  );
}
