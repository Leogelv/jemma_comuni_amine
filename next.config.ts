import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Для Telegram Mini App с API routes - деплоим на Vercel
  images: { unoptimized: true },
};

export default nextConfig;
