import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic server data (Appwrite) is read per request; cache components
  // would force explicit caching on every read, which we do not want for
  // admin views and live inquiry forms. Partial prefetching depends on cache
  // components, so it stays off with it.
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
