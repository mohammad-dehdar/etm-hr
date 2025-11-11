/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated/invalid experimental options for Next 14
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip ESLint and TS type-check during docker builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

module.exports = nextConfig;
