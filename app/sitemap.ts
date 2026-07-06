import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/siteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/jdq",
    "/lb-select",
    "/leaderboards/mine",
    "/quiz-recap",
    "/profile",
  ];

  return staticRoutes.map((path) => ({
    url: `${siteConfig.siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
