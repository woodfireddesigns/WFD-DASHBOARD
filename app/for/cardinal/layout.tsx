import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Identity Proposal — Cardinal",
  description: "A personalized brand identity proposal from Wood Fired Designs for Ben Munoz at Cardinal. Spark Identity package — $1,200, 2-week delivery.",
  robots: { index: false, follow: false },
};

export default function CardinalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
