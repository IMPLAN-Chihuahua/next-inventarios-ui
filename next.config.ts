import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://p9dccksl-8080.usw3.devtunnels.ms/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;