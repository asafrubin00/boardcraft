import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://boardcraft-eight.vercel.app";

// Blend the browser chrome into the app's navy and extend rendering into the
// safe areas on notched iPhones (bottom-fixed elements pad with env() insets).
export const viewport: Viewport = {
  themeColor: "#112840",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "BoardCraft",
  description: "A corporate governance strategy game. Navigate board composition, proxy adviser dynamics, and AGM season.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
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
        {children}
      </body>
    </html>
  );
}
