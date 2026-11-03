import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  // Without this, Turbopack walks up looking for a lockfile and can land on one
  // outside the repo, which changes how it traces build output.
  turbopack: { root: import.meta.dirname },
  // Static case-study deck lives in public/; serve it at a clean path.
  async rewrites() {
    return [{ source: "/checkr", destination: "/checkr/index.html" }];
  },
};

export default nextConfig;
