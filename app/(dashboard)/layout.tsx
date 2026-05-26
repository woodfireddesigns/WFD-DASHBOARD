import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Wood Fired Designs internal operations dashboard — projects, pipeline, clients, invoices, and onboarding.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0F0D0B" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "28px 32px 48px", backgroundColor: "#0F0D0B" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
