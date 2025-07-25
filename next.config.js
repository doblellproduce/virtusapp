
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
        "util": require.resolve("util/"),
        "assert": require.resolve("assert/"),
      };
      
      // Provide 'process' to the browser environment
      config.plugins.push(
        new (require('webpack').ProvidePlugin)({
          process: "process/browser",
        })
      );
    }
     
    // Ignore firebase-admin in client-side bundles
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

module.exports = nextConfig;
