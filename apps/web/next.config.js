/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Environment variables for Docker
  env: {
    RAG_API_URL: process.env.RAG_API_URL || 'http://localhost:8888',
  },
  // Ensure runtime environment variables are available
  serverRuntimeConfig: {
    RAG_API_URL: process.env.RAG_API_URL || 'http://localhost:8888',
  },
  // Make sure environment variables are available at build time and runtime
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
