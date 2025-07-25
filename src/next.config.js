
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Resolve Node.js modules for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "process": require.resolve("process/browser"),
        "zlib": require.resolve("browserify-zlib"),
        "stream": require.resolve("stream-browserify"),
      };
    }
    config.plugins.push(
      new (require('webpack').ProvidePlugin)({
        process: "process/browser",
      })
    );
    return config;
  },
};

module.exports = nextConfig;
