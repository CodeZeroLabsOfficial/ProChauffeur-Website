import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },
  // Avoid auto-generating AGENTS.md / CLAUDE.md into the repo.
  agentRules: false,
  async redirects() {
    return [
      { source: "/book", destination: "/booking", permanent: true },
      { source: "/book/:path*", destination: "/booking/:path*", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
