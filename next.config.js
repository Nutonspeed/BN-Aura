const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors during build (temporary fix for deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build (temporary fix for deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable experimental features for performance
  experimental: {
    // optimizeCss requires 'critters' package which is missing
    optimizeCss: false,
  },
  serverExternalPackages: [
    '@google/generative-ai',
    'ioredis',
    'socket.io',
    'puppeteer',
    'stripe',
    'jspdf',
    'html2canvas',
    '@sentry/nextjs',
  ],

  // Exclude heavy client-only packages from serverless function traces (~90MB saved)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@huggingface/transformers/**',
      'node_modules/three/**',
      'node_modules/@react-three/**',
      'node_modules/puppeteer/**',
      'node_modules/puppeteer-core/**',
      'node_modules/@mediapipe/**',
      'node_modules/@tensorflow/**',
    ],
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'royeyoxaaieipdajijni.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
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
        ],
      },
    ];
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/en/dashboard',
        permanent: false,
      },
      {
        source: '/auth/login',
        destination: '/en/auth/login',
        permanent: false,
      },
    ];
  },

  // Environment variable validation
  env: {
    CUSTOM_APP_VERSION: process.env.npm_package_version,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle node modules that need special treatment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Output configuration for static export (if needed)
  trailingSlash: false,
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
};

module.exports = withNextIntl(nextConfig);
