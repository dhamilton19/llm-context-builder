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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = "electron-renderer";
      config.externals = {
        ...config.externals,
        "fs": "require('fs')",
        "path": "require('path')",
      };
    }
    return config;
  },
}

export default nextConfig
