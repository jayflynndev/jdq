// config/siteConfig.ts
export const siteConfig = {
  adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
};
