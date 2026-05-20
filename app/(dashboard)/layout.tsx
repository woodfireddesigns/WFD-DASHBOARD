import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F0EBE1" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "32px 40px 48px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
