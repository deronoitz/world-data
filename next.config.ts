import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited dynamic pages (every page reads searchParams) in the client router
    // cache, so going back and forth between routes doesn't refetch and re-suspend.
    // Mutations that change server-rendered output call router.refresh(), which clears it.
    staleTimes: { dynamic: 300 },
  },
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
