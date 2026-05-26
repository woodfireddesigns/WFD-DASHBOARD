"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare, Kanban, FolderOpen,
  Users, FileText, FileSignature, Zap, ClipboardList, Target, Radio,
} from "lucide-react";

const nav = [
  { label: "Home",      href: "/",           icon: Target },
  { label: "Tasks",     href: "/tasks",      icon: CheckSquare },
  { label: "Pipeline",  href: "/pipeline",   icon: Kanban },
  { label: "Leads",     href: "/leads",      icon: Radio },
  { label: "Projects",  href: "/projects",   icon: FolderOpen },
  { label: "Clients",   href: "/clients",    icon: Users },
  { label: "Invoices",  href: "/invoices",   icon: FileText },
  { label: "Onboarding",href: "/onboarding", icon: FileSignature },
  { label: "Proposals", href: "/proposal",   icon: Zap },
  { label: "UX Intake", href: "/onboard",    icon: ClipboardList },
  { label: "Design Intake", href: "/design", icon: ClipboardList },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{ backgroundColor: "#0A0907", width: 210, borderRight: "1px solid #1E1A16" }}
      className="flex flex-col h-screen shrink-0 select-none"
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.png" alt="Wood Fired Designs" style={{ width: 32, height: 32, objectFit: "contain", marginBottom: 8 }} />
        <p style={{ fontFamily: "Anton, sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "#FF6B2B", textTransform: "uppercase" }}>
          Wood Fired
        </p>
        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, letterSpacing: "0.14em", color: "#3D342C", textTransform: "uppercase" }}>
          Operations
        </p>
      </div>

      <div style={{ height: 1, backgroundColor: "#1E1A16", margin: "0 12px 8px" }} />

      {/* Nav */}
      <nav className="flex-1 flex flex-col px-2 overflow-y-auto" style={{ gap: 2 }}>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === "/"
            ? path === "/" || path === "/home"
            : path.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 7,
                fontSize: 12.5, fontWeight: active ? 600 : 400,
                color: active ? "#F2EDE8" : "#5A4E46",
                backgroundColor: active ? "#1E1A16" : "transparent",
                borderLeft: `2px solid ${active ? "#FF6B2B" : "transparent"}`,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#141110";
                  (e.currentTarget as HTMLElement).style.color = "#9A8E85";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#5A4E46";
                }
              }}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 1.75} color={active ? "#FF6B2B" : undefined} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1E1A16", padding: "12px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #FF6B2B, #E85A1A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            M
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: "#9A8E85", fontWeight: 500 }}>Michael D.</p>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#2A241E", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              wood fired designs
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
