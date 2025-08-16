// config/homeFeatures.ts
import { JVQ_GROUP, JDQ_GROUP } from "./menuConfig";

export type BadgeVariant = "brand" | "accent" | "gold" | "neutral";

export interface HomeFeature {
  id: string; // ✅ unique id
  icon: string;
  title: string;
  desc: string;
  href: string;
  badge?: { text: string; variant?: BadgeVariant };
  signedInOnly?: boolean;
  comingSoon?: boolean;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function mapGroupToFeatures(
  header: string,
  items: typeof JVQ_GROUP.items
): HomeFeature[] {
  return items.map((item) => {
    // Simple icon mapping
    let icon = "🏆";
    if (item.label.includes("Recap")) icon = "📋";
    if (item.label === "Listen") icon = "🎧";
    if (item.label === "Add Your Score") icon = "🎮";
    if (item.label.includes("Database")) icon = "📚";
    if (item.label.includes("Live")) icon = "⚡";

    return {
      id: `${slug(header)}:${slug(item.label)}`, // ✅ unique per group+label
      icon,
      title: item.label,
      desc:
        item.label === "Quiz Recap"
          ? "Thursday & Saturday recaps. Scan highlights and check answers after the stream."
          : item.label === "Listen"
          ? "Listen to the daily quiz podcast and log your score."
          : "View scores and climb the leaderboards.",
      href: item.href || "#",
      signedInOnly: item.label === "Add Your Score",
      comingSoon: !!item.disabled,
      badge: item.disabled
        ? { text: "Coming soon", variant: "neutral" }
        : item.label === "Add Your Score"
        ? { text: "Signed-in", variant: "brand" }
        : undefined,
    };
  });
}

export const homeFeatures: HomeFeature[] = [
  ...mapGroupToFeatures(JVQ_GROUP.header, JVQ_GROUP.items),
  ...mapGroupToFeatures(JDQ_GROUP.header, JDQ_GROUP.items),
].filter(
  (feature, index, self) =>
    index === self.findIndex((f) => f.title === feature.title)
);
