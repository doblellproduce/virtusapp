/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isClient }) => {
    if (isClient) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
      };
    }
    return config;
  },
  // No se necesita configuración de webpack personalizada aquí.
  // El campo "browser" en package.json se encargará de excluir firebase-admin.
};

export default nextConfig;
