/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (
    config,
    { isServer, webpack } // webpack is provided as an argument here
  ) => {
    if (!isServer) {
      // Resolve Node.js modules for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        process: require.resolve('process/browser'),
        util: require.resolve('util/'),
        fs: false,
        net: false,
        tls: false,
      };
    }

    // This plugin makes the `process` variable available to modules
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );

    // Exclude firebase-admin from client-side bundles
    config.externals.push({
      'firebase-admin': 'commonjs firebase-admin',
    });


    return config;
  },
};

export default nextConfig;
