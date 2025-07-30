/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
      // Exclude Node.js built-ins from the client bundle
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
}

export default nextConfig
