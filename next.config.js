/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This disables all ESLint checks during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
