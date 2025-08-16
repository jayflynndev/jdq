const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

type Props = {
  id: string;
  height: number;
  sizes?: string;
  className?: string;
};

export function AdSlot({ id, height, className }: Props) {
  if (!adsEnabled) {
    return null; // 👈 hide ad slots until AdSense is live
  }

  return (
    <div
      id={id}
      className={[
        "relative w-full overflow-hidden rounded-xl border border-purple-800 bg-white shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ minHeight: height }}
      aria-label="Advertisement"
      role="complementary"
    >
      {/* Skeleton to stop CLS while ad loads */}
      <div className="absolute inset-0 animate-pulse bg-purple-100/40" />
    </div>
  );
}
