import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Kickoff — Wood Fired Designs",
  description: "Everything needed to start building, collected once so nobody has to chase it.",
  robots: { index: false, follow: false },
};

export default function KickoffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
