"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, { title: string; sub: string }> = {
  "/tasks":      { title: "Tasks",      sub: "Your day, structured." },
  "/pipeline":   { title: "Pipeline",   sub: "Leads & prospects." },
  "/projects":   { title: "Projects",   sub: "Active client work." },
  "/clients":    { title: "Clients",    sub: "Your roster." },
  "/invoices":   { title: "Invoices",   sub: "Money in and out." },
  "/onboarding": { title: "Onboarding", sub: "Client sequences." },
  "/settings":   { title: "Settings",   sub: "Preferences." },
};

export default function Topbar() {
  const path = usePathname();
  const base = "/" + path.split("/")[1];
  const meta = titles[base] ?? { title: "Dashboard", sub: "" };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <header
      className="flex items-center justify-between shrink-0"
      style={{
        padding: "18px 32px 16px",
        borderBottom: "1px solid #E8E2D8",
        backgroundColor: "#FDFAF6",
      }}
    >
      <div>
        <div className="flex items-baseline gap-3">
          <h1
            className="font-display"
            style={{ fontSize: 26, color: "#1E1C1A" }}
          >
            {meta.title}
          </h1>
          {meta.sub && (
            <span style={{ fontSize: 13, color: "#A09890", fontWeight: 400 }}>
              {meta.sub}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#A09890", marginTop: 1 }}>{today}</p>
      </div>
    </header>
  );
}
