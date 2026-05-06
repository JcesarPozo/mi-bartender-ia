import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa canvas (nativo de Node) — no bundlear, cargar en runtime
  serverExternalPackages: ["@react-pdf/renderer"],

  // Next.js 16 usa Turbopack por defecto — config vacía para confirmar que es intencional
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'www.thecocktaildb.com' },
    ],
  },
};

export default nextConfig;
