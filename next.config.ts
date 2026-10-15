import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "oct-outline-ethics-thu.trycloudflare.com",
  ],
};

export default nextConfig;