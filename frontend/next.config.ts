import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const rawBackendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production" ? "https://dakshora-api.onrender.com" : "http://127.0.0.1:5000");
    const backendUrl =
      rawBackendUrl.includes("api.dakshora.in")
        ? "https://dakshora-api.onrender.com"
        : rawBackendUrl;
    return [
      // 1. Backend API reverse proxy routes
      {
        source: "/api/erp/:path*",
        destination: `${backendUrl}/api/erp/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: "/api/organizations/:path*",
        destination: `${backendUrl}/api/organizations/:path*`,
      },
      {
        source: "/api/supabase-test",
        destination: `${backendUrl}/api/supabase-test`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/health/ready",
        destination: `${backendUrl}/health/ready`,
      },
      {
        source: "/health/supabase",
        destination: `${backendUrl}/health/supabase`,
      },

      // 2. SPA Portal Entry & Sub-routes
      {
        source: "/",
        destination: "/portal/index.html",
      },
      {
        source: "/erp/:path*",
        destination: "/portal/index.html",
      },
      {
        source: "/erp",
        destination: "/portal/index.html",
      },
      {
        source: "/portal/:path*",
        destination: "/portal/index.html",
      },
      {
        source: "/portal",
        destination: "/portal/index.html",
      },
      {
        source: "/admin/:path*",
        destination: "/portal/index.html",
      },
      {
        source: "/admin",
        destination: "/portal/index.html",
      },
      {
        source: "/dashboard/:path*",
        destination: "/portal/index.html",
      },
      {
        source: "/dashboard",
        destination: "/portal/index.html",
      },
      {
        source: "/billing/:path*",
        destination: "/portal/index.html",
      },
      {
        source: "/billing",
        destination: "/portal/index.html",
      },
    ];
  },
};

export default nextConfig;