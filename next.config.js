/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'soldev-aa9ae.firebasestorage.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.iconfinder.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
