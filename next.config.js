
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   webpack: (config, { isServer }) => {
    if (!isServer) {
      // This is the correct and complete configuration to resolve the build error.
      config.resolve.fallback = {
        "process": require.resolve("process/browser"),
        "stream": require.resolve("stream-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "fs": false,
        "net": false,
        "tls": false,
        "path": false,
        "os": false,
        "crypto": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
    