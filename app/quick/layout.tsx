import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get a Quote — Wood Fired Designs",
  description: "Tell us what you need and get a custom quote from Wood Fired Designs. Takes about 3 minutes.",
};

export default function QuickLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
