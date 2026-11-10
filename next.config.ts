import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },
  // Avoid auto-generating AGENTS.md / CLAUDE.md into the repo.
  agentRules: false
};

export default nextConfig;
