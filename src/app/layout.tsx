import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
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
  title: "Oulla Collection",
  description: "Modern modest luxury inspired by Algerian heritage.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Oulla Collection",
    description: "Modern modest luxury inspired by Algerian heritage.",
    url: "https://oullacollection.com", // replace with actual domain
    siteName: "Oulla Collection",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Oulla Collection",
      },
    ],
    locale: "fr_DZ",
    type: "website",
  },
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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#faf9f6] text-[#1a1c1a] font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

