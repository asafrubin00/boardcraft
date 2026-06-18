import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TabletRotateGate from "@/components/TabletRotateGate";
import { Analytics } from "@vercel/analytics/next";

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
        <TabletRotateGate>
          {children}
        </TabletRotateGate>
        <Analytics />
      </body>
    </html>
  );
}
