
import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Agrega un polyfill para el módulo 'process' en el navegador
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
        zlib: require.resolve('browserify-zlib'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        assert: require.resolve('assert'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    
    // Excluir firebase-admin del paquete del cliente
    if (!isServer) {
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
      });
    }

    return config;
  },
};

export default nextConfig;
