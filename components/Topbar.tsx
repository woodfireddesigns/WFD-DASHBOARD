"use client";

import { usePathname } from "next/navigation";

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/":           { title: "The Forge",      sub: "Your daily command center" },
  "/tasks":      { title: "Tasks",          sub: "What gets done today" },
  "/pipeline":   { title: "Pipeline",       sub: "Leads in motion" },
  "/projects":   { title: "Projects",       sub: "Active work" },
  "/clients":    { title: "Clients",        sub: "Relationships" },
  "/invoices":   { title: "Invoices",       sub: "Money in motion" },
  "/onboarding": { title: "Onboarding",     sub: "Client sequences" },
  "/proposal":   { title: "Proposals",      sub: "Live proposal builder" },
  "/onboard":    { title: "UX Intake",      sub: "Web project questionnaire" },
  "/design":     { title: "Design Intake",  sub: "Brand & creative questionnaire" },
};

export default function Topbar() {
  const path = usePathname();
  const meta = PAGE_META[path] ?? { title: "Dashboard", sub: "" };
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 28px",
      borderBottom: "1px solid #1E1A16",
      backgroundColor: "#0A0907",
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{
          fontFamily: "Anton, sans-serif", fontSize: 18, fontWeight: 400,
          color: "#F2EDE8", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1,
        }}>
          {meta.title}
        </h1>
        {meta.sub && <p style={{ fontSize: 11.5, color: "#5A4E46", marginTop: 2 }}>{meta.sub}</p>}
      </div>
      <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#3D342C", letterSpacing: "0.06em" }}>
        {dateStr}
      </p>
    </header>
  );
}
