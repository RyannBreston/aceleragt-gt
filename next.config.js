/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment optimizations
  output: process.env.VERCEL ? 'standalone' : undefined,
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    // Optimize for serverless
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Performance optimizations for Vercel
  experimental: {
    // Optimize package imports for better bundling
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable serverComponentsExternalPackages for Prisma
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.logs in production for better performance
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  
  // API route configuration for serverless
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Webpack optimizations for Vercel
  webpack: (config, { isServer }) => {
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  
  // Environment variables validation
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;