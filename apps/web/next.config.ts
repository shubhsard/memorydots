import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The engine is shared TypeScript source from the workspace, so Next must compile it.
  transpilePackages: ["@memorydots/engine"],
};

export default nextConfig;