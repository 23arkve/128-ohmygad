import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mctvkyblusfuxdjzhvzc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
