import type { NextConfig } from "next";

/** Server-side only: where the Express API lives. The browser always calls same-origin /api. */
const API_URL = process.env.API_URL?.replace(/\/$/, "") || "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@keystride/engine"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
