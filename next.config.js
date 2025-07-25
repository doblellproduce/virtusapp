
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
    // This webpack configuration is only applied to the client-side bundle.
    if (!isServer) {
      // Provide fallbacks for Node.js built-in modules that are used by some of the libraries.
      // This tells Webpack to use browser-compatible versions of these modules.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "process": require.resolve("process/browser"),
        "zlib": require.resolve("browserify-zlib"),
        "stream": require.resolve("stream-browserify"),
        "util": false,
        "assert": false,
      };
      
      // The ProvidePlugin makes a module available as a variable in every module.
      // We need to provide the 'process' module for some libraries to work correctly in the browser.
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        })
      );
    }
     
    // Exclude firebase-admin from client-side bundles.
    // This is crucial because firebase-admin is a server-only SDK.
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

module.exports = nextConfig;
