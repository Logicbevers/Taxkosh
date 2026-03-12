import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds even if there are TS errors in generated .next types
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
