/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin from client-side bundles
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

module.exports = nextConfig;
