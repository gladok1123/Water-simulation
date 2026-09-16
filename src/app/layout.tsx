import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
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
