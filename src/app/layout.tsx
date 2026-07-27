import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oulla Collection | Modern Modest Luxury",
  description: "L'héritage algérien rencontre le minimalisme éditorial contemporain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${bodoniModa.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#faf9f6] text-[#1a1c1a] font-sans">{children}</body>
    </html>
  );
}

