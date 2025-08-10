import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "rbwuzxdslxbafwxyauto.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
