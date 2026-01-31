import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notes App",
  description: "A Google Keep-like notes app with offline support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Notes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbbf24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
