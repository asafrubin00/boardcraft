import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import TouchGate from "@/components/TouchGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://boardcraft-eight.vercel.app";

export const metadata: Metadata = {
  title: "BoardCraft",
  description: "A corporate governance strategy game. Navigate board composition, proxy adviser dynamics, and AGM season.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "BoardCraft",
    description: "A corporate governance strategy game. Navigate board composition, proxy adviser dynamics, and AGM season.",
    url: BASE_URL,
    siteName: "BoardCraft",
    images: [
      {
        url: `${BASE_URL}/preview.png`,
        width: 1200,
        height: 627,
        alt: "BoardCraft — A corporate governance strategy game",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BoardCraft",
    description: "A corporate governance strategy game. Navigate board composition, proxy adviser dynamics, and AGM season.",
    images: [`${BASE_URL}/preview.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Source+Sans+3:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TouchGate>
          {children}
        </TouchGate>
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-foreground/25 text-xs whitespace-nowrap pointer-events-none z-10">
          <span>© 2025 Asaf Rubin. All rights reserved.</span>
          <span className="text-foreground/15">·</span>
          <Link href="/terms" className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2">
            Terms of Use
          </Link>
        </footer>
      </body>
    </html>
  );
}
