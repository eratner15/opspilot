import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Cloudflare Workers deployment
  experimental: {
    serverActions: {
      allowedOrigins: ["smb.cafecito-ai.com", "localhost:3000"],
    },
  },
};

export default nextConfig;
