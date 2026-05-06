import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Timeout extendido para rutas que llaman a Pollinations (puede tardar hasta 80s)
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'www.thecocktaildb.com' },
    ],
  },
};

export default nextConfig;
