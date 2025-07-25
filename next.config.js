/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Excluir firebase-admin del paquete del cliente
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

export default nextConfig;
