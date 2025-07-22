/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin from client-side bundles
    if (!isServer) {
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

module.exports = nextConfig;