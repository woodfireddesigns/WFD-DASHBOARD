"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare, Kanban, FolderOpen,
  Users, FileText, FileSignature, Zap, ClipboardList, Settings,
} from "lucide-react";

const nav = [
  { label: "Tasks",      href: "/tasks",      icon: CheckSquare },
  { label: "Pipeline",   href: "/pipeline",   icon: Kanban },
  { label: "Projects",   href: "/projects",   icon: FolderOpen },
  { label: "Clients",    href: "/clients",    icon: Users },
  { label: "Invoices",   href: "/invoices",   icon: FileText },
  { label: "Onboarding", href: "/onboarding", icon: FileSignature },
  { label: "Proposals",  href: "/proposal",   icon: Zap },
  { label: "Intake Form", href: "/onboard",   icon: ClipboardList },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{ backgroundColor: "#1E1C1A", width: 220 }}
      className="flex flex-col h-screen shrink-0 select-none"
    >
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <span
          className="font-display text-[#FF6B2B]"
          style={{ fontSize: 20 }}
        >
          WFD
        </span>
        <p
          className="font-mono uppercase mt-0.5"
          style={{ fontSize: 9, letterSpacing: "0.14em", color: "#4A4642" }}
        >
          Operations
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "#2C2A28", margin: "0 16px 12px" }} />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === "/tasks"
            ? path === "/tasks" || path === "/"
            : path.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg transition-all"
              style={{
                padding: "9px 12px",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#FFFFFF" : "#7A726A",
                backgroundColor: active ? "#2C2A28" : "transparent",
                borderLeft: active ? "2px solid #FF6B2B" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#252320";
                  (e.currentTarget as HTMLElement).style.color = "#C8C0B8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#7A726A";
                }
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #2C2A28", padding: "12px 8px 16px" }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg transition-all"
          style={{ padding: "9px 12px", fontSize: 13, color: "#4A4642" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#252320";
            (e.currentTarget as HTMLElement).style.color = "#7A726A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#4A4642";
          }}
        >
          <Settings size={15} strokeWidth={1.75} />
          Settings
        </Link>

        <div style={{ padding: "10px 12px 0" }}>
          <div
            className="flex items-center gap-2.5"
          >
            <div
              className="flex items-center justify-center rounded-full text-white font-semibold shrink-0"
              style={{ width: 26, height: 26, backgroundColor: "#FF6B2B", fontSize: 11 }}
            >
              M
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 12, color: "#7A726A", fontWeight: 500 }}>Michael D.</p>
              <p className="font-mono truncate" style={{ fontSize: 9, color: "#3D342A", letterSpacing: "0.02em" }}>
                wood fired designs
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
