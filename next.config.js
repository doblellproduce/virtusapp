/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Excluir 'firebase-admin' del paquete del cliente
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

export default nextConfig;
