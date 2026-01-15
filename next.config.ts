import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@xenova/transformers", "onnxruntime-node"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        sharp: "commonjs sharp",
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
    }
    // Ignore .node binary files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });
    return config;
  },
};

export default nextConfig;
