/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This disables all ESLint checks during builds
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
