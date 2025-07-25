
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin from client-side bundles
    if (!isServer) {
      config.externals.push('firebase-admin');
      
      // Provide fallbacks for node-specific modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
        zlib: require.resolve('browserify-zlib'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        asset: require.resolve('assert'),
      };
    }

    return config;
  },
};

export default nextConfig;
