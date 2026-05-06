import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa canvas (nativo de Node) — no bundlear, cargar en runtime
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'www.thecocktaildb.com' },
    ],
  },
  // Suprimir el DEP0169 warning de url.parse() que viene de @supabase/supabase-js
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { message: /DEP0169/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
