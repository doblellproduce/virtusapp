/** @type {import('next').NextConfig} */
const nextConfig = {
  // No se necesita configuración de webpack personalizada aquí.
  // El campo "browser" en package.json se encargará de excluir firebase-admin.
};

export default nextConfig;
