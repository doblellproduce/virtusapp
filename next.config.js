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
  // This allows requests from the Firebase Studio development environment, resolving the CORS warning.
  // This option is now stable and should be at the root of the config.
  experimental: {
    //
  },
  allowedDevOrigins: ["https://*.cloudworkstations.dev"],
};

module.exports = nextConfig;
