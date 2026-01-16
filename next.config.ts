import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "sharp",
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/compositor-win32-x64-msvc",
    "remotion",
    "esbuild",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "clsx/dist/clsx.m.js": path.resolve(__dirname, "node_modules/clsx/dist/clsx.mjs"),
    };
    return config;
  },
};

export default nextConfig;
