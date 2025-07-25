/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Excluir firebase-admin del paquete del cliente,
    // ya que solo debe ejecutarse en el servidor.
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
};

module.exports = nextConfig;
