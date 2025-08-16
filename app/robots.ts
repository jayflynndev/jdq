// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.example";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/", // allow all pages
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
