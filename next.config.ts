import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Avatars Google (Google OAuth)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        // Avatars GitHub (si utilisé plus tard)
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
