import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Content-hashed map geometry (scripts/build-geo.mts): safe to cache forever.
        source: "/geo/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
}

export default nextConfig
