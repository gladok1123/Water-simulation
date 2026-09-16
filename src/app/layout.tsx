import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted variable fonts (OpenType via next/font/local) so the build
// doesn't depend on Google Fonts being reachable.
const serif = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-wght-normal.woff2" },
    { path: "../fonts/cormorant-garamond-cyrillic-wght-normal.woff2" },
  ],
  variable: "--font-serif",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../fonts/manrope-latin-wght-normal.woff2" },
    { path: "../fonts/manrope-cyrillic-wght-normal.woff2" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Штиль — медитация на воде",
  description:
    "Расслабляющая симуляция воды бассейна: блики, каустика, дыхательные круги и звук волн.",
};

export const viewport: Viewport = {
  themeColor: "#0a3d63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`}>
      <body className="overflow-hidden bg-[#0a3d63] font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
