interface HeroItemsProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
}

export default function HomeHero({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroImage,
}: HeroItemsProps) {
  return (
    <div
      style={{ backgroundImage: `url('${heroImage}')` }}
      className="relative flex flex-col items-center justify-center h-[calc(100vh-200px)] min-h-[400px] bg-cover bg-center bg-fixed md:bg-scroll"
    >
      <div className="bg-white/30 py-2 px-4 backdrop-blur-md">
        <div className="relative flex flex-col items-center justify-center text-black text-center">
          <div className="text-4xl font-bold md:text-6xl">{heroTitle}</div>
          <div className="text-3xl font-bold md:text-5xl">{heroSubtitle}</div>
          <div className="text-2xl md:text-4xl">{heroDescription}</div>
        </div>
      </div>
    </div>
  );
}
