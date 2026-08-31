import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Creative Retainer — Wood Fired Designs",
  description: "Social, ad creative and store management on a monthly retainer. Tell us what you need running and we'll scope it.",
};

export default function RetainerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
