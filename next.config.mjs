/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adicione esta secção 'env' para expor a versão do seu aplicativo
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  // ... outras configurações que você possa ter, como 'images', 'webpack', etc.
};

export default nextConfig;