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
    // This is the correct way to provide browser-compatible polyfills
    // for Node.js modules that are needed by some of the dependencies.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // The following fallbacks are needed for various Firebase and Google libraries.
        assert: require.resolve('assert/'),
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util/'),
      };

       config.plugins = config.plugins || [];
       config.plugins.push(
        new (require('webpack').ProvidePlugin)({
            process: 'process/browser',
        })
       )
    }

    // This is to prevent server-only packages from being bundled on the client.
    config.externals = [...config.externals, 'firebase-admin'];
    
    return config;
  },
  instrumentationHook: false,
};

module.exports = nextConfig;
