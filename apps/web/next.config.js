/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Environment variables for Docker
  env: {
    RAG_API_URL: process.env.RAG_API_URL || 'http://localhost:8888',
  },
};

export default nextConfig;
