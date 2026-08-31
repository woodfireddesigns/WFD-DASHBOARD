import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Brand & Site Audit — Wood Fired Designs",
  description: "A straight read on what your brand and website are costing you. Ninety seconds to ask, no pitch attached.",
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
