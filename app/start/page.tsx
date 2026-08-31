"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTAKE_CSS } from "@/components/intake/theme";

/**
 * The one link.
 *
 * There were four public intake URLs and no way to know which one to send
 * without knowing the answer to the first question on it. This asks that
 * question once and routes accordingly, so there is a single address to put on
 * a business card, in a DM, or at the end of a proposal.
 *
 * A router, not a wrapper: it hands off rather than embedding, so each form
 * keeps its own resume state and can be linked directly when you already know
 * where someone belongs.
 */
type Path = {
  href: string;
  label: string;
  blurb: string;
  time: string;
  accent: string;
};

const PATHS: Path[] = [
  {
    href: "/audit",
    label: "Just show me what's wrong",
    blurb: "A free written audit of your brand or site. Specific problems, in priority order, back within two business days. Nothing to buy.",
    time: "90 seconds",
    accent: "#4FFFB0",
  },
  {
    href: "/quick",
    label: "I know roughly what I want — quote me",
    blurb: "Pick a service, a style and a timeline. Enough for a real number without sitting through discovery.",
    time: "3 minutes",
    accent: "#FF4D00",
  },
  {
    href: "/onboard",
    label: "I need a website",
    blurb: "Full project discovery for a site build — goals, pages, audience, brand, domain and hosting.",
    time: "5 minutes",
    accent: "#47C8FF",
  },
  {
    href: "/design",
    label: "I need brand, packaging, photography or merch",
    blurb: "Deep creative discovery. Your scope and price build live as you answer.",
    time: "8 minutes",
    accent: "#C084FC",
  },
  {
    href: "/retainer",
    label: "I need someone running this every month",
    blurb: "Social content, ad creative, store management. Ongoing work on a monthly retainer.",
    time: "4 minutes",
    accent: "#E8FF47",
  },
];

export default function StartPage() {
  const router = useRouter();
  const [going, setGoing] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById("wfd-intake-css")) return;
    const el = document.createElement("style");
    el.id = "wfd-intake-css";
    el.textContent = INTAKE_CSS;
    document.head.appendChild(el);
  }, []);

  // Prefetch on hover: by the time the click lands the next form is warm, so
  // the handoff reads as one form rather than two.
  function go(href: string) {
    setGoing(href);
    router.push(href);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div className="q-enter" style={{ width: "100%", maxWidth: 660 }}>
        <p className="q-eyebrow">Wood Fired Designs</p>
        <h1 className="q-title" style={{ fontSize: "clamp(30px,6vw,46px)" }}>What brings you here?</h1>
        <p className="q-sub" style={{ marginBottom: 30 }}>
          Pick the closest one. Every path lands in the same place — this just decides
          which questions are worth your time.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PATHS.map((p) => (
            <button
              key={p.href}
              type="button"
              className="opt-card"
              onClick={() => go(p.href)}
              onMouseEnter={() => router.prefetch(p.href)}
              onFocus={() => router.prefetch(p.href)}
              disabled={going !== null}
              style={{ opacity: going !== null && going !== p.href ? 0.4 : 1, alignItems: "center", gap: 14, padding: "16px 18px" }}
            >
              <span aria-hidden="true" style={{ width: 3, alignSelf: "stretch", background: p.accent, borderRadius: 3, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: p.accent, border: `1px solid ${p.accent}33`, padding: "2px 8px", borderRadius: 99 }}>
                    {p.time}
                  </span>
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
                  {p.blurb}
                </span>
              </span>
              <span aria-hidden="true" style={{ color: "var(--text-dim)", fontSize: 18, flexShrink: 0 }}>
                {going === p.href ? "···" : "→"}
              </span>
            </button>
          ))}
        </div>

        <p style={{ marginTop: 26, fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7 }}>
          Every form saves as you go, so you can close the tab and come back.
          Prefer to just talk?{" "}
          <a href="mailto:michael@woodfireddesigns.com" style={{ color: "var(--accent)", textDecoration: "none" }}>
            michael@woodfireddesigns.com
          </a>
        </p>
      </div>
    </div>
  );
}
