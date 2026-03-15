/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['you360oficial.com.br/api'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'you360oficial.com.br/api',
        pathname: '/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig