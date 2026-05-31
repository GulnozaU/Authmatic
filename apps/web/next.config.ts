import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@daytonaio/sdk"],
};

export default nextConfig;
