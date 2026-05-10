import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: ["publicity-angel-disclaimer-maui.trycloudflare.com"],
};

export default nextConfig;