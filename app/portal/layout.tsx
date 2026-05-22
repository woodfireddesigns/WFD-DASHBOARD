import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Client Portal",
  description: "Track your Wood Fired Designs project — view your scope, deliverables, and make your payment securely.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
