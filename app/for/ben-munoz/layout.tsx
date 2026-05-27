import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Identity Proposal — Ben Munoz",
  description: "A personalized brand identity proposal from Wood Fired Designs for Ben Munoz. Spark Identity package — $1,200, 2-week delivery.",
  robots: { index: false, follow: false },
};

export default function BenMunozLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
