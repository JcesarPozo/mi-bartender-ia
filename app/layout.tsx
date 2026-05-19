import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";

const inter    = Inter({            subsets: ["latin"], variable: "--font-inter"    });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title:       "Mi Bartender IA — Borrach@s y más",
  description: "Tu mixólogo personal con inteligencia artificial. Crea cócteles únicos, guarda tus recetas favoritas y compártelas.",
  manifest:    "/manifest.json",

  // ── Open Graph (WhatsApp, Facebook, iMessage) ──────────────────────────────
  openGraph: {
    title:       "Mi Bartender IA — Crea tu cóctel perfecto",
    description: "Describe cómo te sientes, la IA inventa tu receta, genera la imagen y la guarda para siempre.",
    url:         "https://mi-bartender-ia.vercel.app",
    siteName:    "Mi Bartender IA",
    locale:      "es_ES",
    type:        "website",
    images: [{ url: "/logo-borrachos.jpg", width: 512, height: 512, alt: "Mi Bartender IA" }],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card:        "summary",
    title:       "Mi Bartender IA",
    description: "Tu mixólogo personal con inteligencia artificial.",
    images:      ["/logo-borrachos.jpg"],
  },

  // ── Íconos ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16",  type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32",  type: "image/png" },
      { url: "/icons/icon-192x192.png",  sizes: "192x192",type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png",         sizes: "180x180" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167x167.png", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120" },
    ],
  },

  // ── PWA / Apple Web App ────────────────────────────────────────────────────
  appleWebApp: {
    capable:         true,
    title:           "Bartender IA",
    statusBarStyle:  "black-translucent",
    startupImage:    "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor:     "#f5c842",
  width:          "device-width",
  initialScale:   1,
  maximumScale:   1,
  userScalable:   false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}>
      <head>
        {/* ── PWA básico ───────────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Apple iOS ────────────────────────────────────────── */}
        <meta name="apple-mobile-web-app-capable"             content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style"    content="black-translucent" />
        <meta name="apple-mobile-web-app-title"               content="Bartender IA" />
        <meta name="apple-touch-fullscreen"                   content="yes" />

        {/* ── Android / Chrome ─────────────────────────────────── */}
        <meta name="mobile-web-app-capable"                   content="yes" />
        <meta name="application-name"                         content="Bartender IA" />

        {/* ── Microsoft Tiles ──────────────────────────────────── */}
        <meta name="msapplication-TileColor"                  content="#000308" />
        <meta name="msapplication-TileImage"                  content="/icons/icon-144x144.png" />
        <meta name="msapplication-config"                     content="none" />

        {/* ── Color de fondo mientras carga ─────────────────────── */}
        <meta name="theme-color"                              content="#f5c842" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000308" />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <AppProvider>{children}</AppProvider>

        {/* ── Registro del Service Worker ──────────────────────── */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(function(reg) { console.log('[SW] ✅ Registrado:', reg.scope); })
                .catch(function(err) { console.warn('[SW] ⚠️', err); });
            });
          }
        `}} />
      </body>
    </html>
  );
}
