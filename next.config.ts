import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output for the Docker image (ignored by Vercel).
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
