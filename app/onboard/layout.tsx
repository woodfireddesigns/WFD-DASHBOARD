import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Your Project",
  description: "Tell us about your website project in 5 minutes. Wood Fired Designs will scope your build, generate a contract, and get you in the queue — fast.",
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
