/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure SWC is used for production and development
  experimental: {
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig
