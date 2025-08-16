// components/home/FeatureCard.tsx
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge as UIBadge } from "@/components/ui/Badge";
import type { HomeFeature } from "@/config/homeFeatures";

export function FeatureCard({ icon, title, desc, href, badge }: HomeFeature) {
  return (
    <Link
      href={href}
      className="block focus:outline-none focus:ring-4 focus:ring-brand/20 rounded-lg"
    >
      {/* Make the card a positioning context */}
      <Card hover className="relative h-full">
        {/* Floating badge in the corner (if present) */}
        {badge && (
          <UIBadge
            variant={badge.variant ?? "neutral"}
            size="sm"
            className="
              absolute top-3 right-3
              px-3 py-1 text-xs font-medium tracking-wide
              bg-white/70 dark:bg-surface-inverted/60
              text-textc dark:text-white/80
              ring-1 ring-borderc/60 dark:ring-white/20
              rounded-full shadow-card backdrop-blur-[2px]
            "
          >
            {badge.text}
          </UIBadge>
        )}

        <CardHeader className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <CardTitle className="flex items-center gap-2">{title}</CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription>{desc}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
