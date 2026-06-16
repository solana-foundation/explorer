/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // Disable SWC minification
  experimental: {
    forceSwcTransforms: false, // Force Babel transforms
  },
};

module.exports = nextConfig;
