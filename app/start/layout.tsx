import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start a Project — Wood Fired Designs",
  description: "Tell us what you need and we'll point you at the right questions. Branding, websites, packaging, photography, merch and monthly retainers.",
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
