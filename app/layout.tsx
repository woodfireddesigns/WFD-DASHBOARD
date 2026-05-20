import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WFD Dashboard",
  description: "Wood Fired Designs — Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
