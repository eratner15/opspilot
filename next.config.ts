import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for Cloudflare Workers deployment
  // outputFileTracingRoot prevents monorepo detection from nesting standalone output
  outputFileTracingRoot: path.resolve("."),
  experimental: {
    serverActions: {
      allowedOrigins: ["smb.cafecito-ai.com", "localhost:3000"],
    },
  },
};

export default nextConfig;
