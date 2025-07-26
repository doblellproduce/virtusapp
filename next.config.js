/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin from the client-side bundle
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  experimental: {
    // This option is now stable and should be at the root of the config
  },
  // This allows requests from the Firebase Studio development environment, resolving the CORS warning.
  allowedDevOrigins: ["https://*.cloudworkstations.dev"],
};

module.exports = nextConfig;
