/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'placeholder.com', 'via.placeholder.com', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: true,
  },
  // Add these optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}

export default nextConfig
