/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 uses experimental.serverComponentsExternalPackages
  // (Next.js 15 renamed it to serverExternalPackages)
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
  },
};
module.exports = nextConfig;
