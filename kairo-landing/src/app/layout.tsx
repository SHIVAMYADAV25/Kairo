import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = "https://www.kairoapp.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kairo — Native API Client for macOS, Windows & Linux",
    template: "%s · Kairo",
  },
  description:
    "Kairo is a blazing-fast native API client built with Rust. Scriptable requests, cloud sync, WebSocket/SSE/GraphQL/gRPC support, and built-in load testing — privacy-first and zero lock-in.",
  applicationName: "Kairo",
  keywords: [
    "Kairo",
    "API client",
    "Postman alternative",
    "Insomnia alternative",
    "REST client",
    "GraphQL client",
    "gRPC client",
    "WebSocket tester",
    "API testing tool",
    "native API client",
    "Rust API client",
    "Tauri app",
  ],
  authors: [{ name: "Kairo" }],
  creator: "Kairo",
  publisher: "Kairo",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Kairo",
    title: "Kairo — The API client that respects your time",
    description:
      "A blazing-fast native app built with Rust. HTTP, WebSocket, SSE, GraphQL, gRPC — with scriptable requests, cloud sync, and zero lock-in.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairo — The API client that respects your time",
    description:
      "A blazing-fast native app built with Rust. HTTP, WebSocket, SSE, GraphQL, gRPC — with scriptable requests, cloud sync, and zero lock-in.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-neutral-950 text-neutral-200`}>
        {children}
      </body>
    </html>
  );
}
