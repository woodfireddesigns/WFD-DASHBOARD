import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Identity Proposal — The Solo Club",
  description: "A personalized brand identity proposal from Wood Fired Designs for Kyle Richardson. Ignite Brand System — $3,500.",
  robots: { index: false, follow: false },
};

export default function SoloClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
