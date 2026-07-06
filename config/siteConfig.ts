// config/siteConfig.ts
export const siteConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.jaysquizhub.com",
  adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
};
