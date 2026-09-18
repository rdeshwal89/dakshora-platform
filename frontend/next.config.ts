import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/portal/index.html",
      },
      {
        source: "/erp",
        destination: "/portal/index.html",
      },
      {
        source: "/portal",
        destination: "/portal/index.html",
      },
    ];
  },
};

export default nextConfig;