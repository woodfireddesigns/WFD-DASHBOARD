import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Project Intake",
  description: "Start your brand identity, packaging, photography, or merch project with Wood Fired Designs. Fill out the creative brief and we'll have everything we need to get started — no discovery call required.",
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
