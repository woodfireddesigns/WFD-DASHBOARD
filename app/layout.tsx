import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wood Fired Designs — Client Dashboard",
    template: "%s | Wood Fired Designs",
  },
  description: "Wood Fired Designs is a one-person brand studio built for businesses that mean business. Logo design, brand identity, websites, and campaign creative — built from scratch, delivered fast, owned by you.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
    other: [{ rel: "icon", url: "/favicon.png" }],
  },
  openGraph: {
    siteName: "Wood Fired Designs",
    description: "A one-person brand studio built for businesses that mean business.",
    images: [{ url: "https://woodfireddesigns.com/assets/video/hero-poster.jpg", width: 1920, height: 1080 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
