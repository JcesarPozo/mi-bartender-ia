import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";

const inter     = Inter({           subsets: ["latin"], variable: "--font-inter"     });
const playfair  = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Mi Bartender IA",
  description: "Tu mixólogo personal con inteligencia artificial — Borrach@s y más",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bartender IA",
  },
  icons: {
    icon: "/logo-borrachos.jpg",
    apple: "/logo-borrachos.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5c842",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bartender IA" />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <AppProvider>
          {children}
        </AppProvider>
        {/* Registro del Service Worker */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) { console.log('[SW] Registrado:', reg.scope); },
                  function(err) { console.warn('[SW] Error:', err); }
                );
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
