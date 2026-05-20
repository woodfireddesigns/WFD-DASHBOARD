import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/start",
        destination: "/onboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
