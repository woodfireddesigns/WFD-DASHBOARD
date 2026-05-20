"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-muted:#5A5248;
    --savings:#4ADE80;--font-d:'Anton',sans-serif;--font-b:'DM Sans',sans-serif;
  }
  body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);}
  .pay-btn{display:block;width:100%;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-family:var(--font-d);font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;text-align:center;transition:opacity 0.2s;}
  .pay-btn:hover{opacity:0.88;}
`;

const STATUS_STEPS = ["discovery", "design", "build", "review", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  discovery: "Discovery",
  design: "Design",
  build: "Development",
  review: "Review",
  delivered: "Delivered",
};
const PACKAGE_LABELS: Record<string, string> = {
  starter_site: "Starter Site",
  full_website: "Full Website",
  brand_and_site: "Brand + Site",
};

type IntakeRow = Record<string, unknown>;
type ProjectRow = Record<string, unknown>;

function PortalPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";
  const [intake, setIntake] = useState<IntakeRow | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!document.getElementById("portal-css")) {
      const s = document.createElement("style"); s.id = "portal-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase.from("intake_forms").select("*").eq("portal_token", id).single().then(async ({ data: intakeData }) => {
      setIntake(intakeData);
      if (intakeData?.project_id) {
        const { data: proj } = await supabase.from("projects").select("*").eq("id", intakeData.project_id).single();
        setProject(proj);
      }
      if (justPaid && intakeData?.id) {
        await supabase.from("intake_forms").update({ deposit_paid: true }).eq("id", intakeData.id);
        await supabase.from("projects").update({ status: "design" }).eq("id", intakeData.project_id);
      }
      setLoading(false);
    });
  }, [id, justPaid]);

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Loading your portal…</p>
    </div>
  );

  if (!intake) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}>
      <p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Portal not found.</p>
    </div>
  );

  const pkg = intake.package as string;
  const price = intake.package_price as number;
  const deposit = Math.round(price * 0.5);
  const clientName = `${intake.first_name} ${intake.last_name}`.trim();
  const projectStatus = (project?.status as string) ?? "discovery";
  const currentStep = STATUS_STEPS.indexOf(projectStatus);
  const depositPaid = intake.deposit_paid as boolean;
  const fullPaid = intake.full_paid as boolean;

  const deliverables = ((project?.deliverables as { text: string; done: boolean }[]) ?? []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 10 }}>Wood Fired Designs — Client Portal</p>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Hey, {(intake.first_name as string)}.
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            {intake.business_name as string || ""} · {PACKAGE_LABELS[pkg]} · ${price.toLocaleString()}
          </p>
        </div>

        {/* Payment success banner */}
        {justPaid && (
          <div style={{ background: "rgba(74,222,128,0.08)", border: "1.5px solid var(--savings)", borderRadius: 10, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <p style={{ fontSize: 13.5, color: "var(--savings)", fontWeight: 500 }}>Payment received. You&apos;re officially in the queue. Michael will be in touch within 1 business day.</p>
          </div>
        )}

        {/* Project status */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 18 }}>Project Status</p>
          <div style={{ display: "flex", gap: 0 }}>
            {STATUS_STEPS.map((s, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={s} style={{ flex: 1, position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isDone ? "var(--savings)" : isActive ? "var(--accent)" : "var(--bg-elevated)",
                      border: `2px solid ${isDone ? "var(--savings)" : isActive ? "var(--accent)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: isDone || isActive ? "#fff" : "var(--text-muted)",
                      zIndex: 1, position: "relative",
                    }}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <p style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--text-primary)" : isDone ? "var(--savings)" : "var(--text-muted)", marginTop: 6, textAlign: "center" }}>
                      {STATUS_LABELS[s]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ position: "absolute", top: 13, left: "50%", width: "100%", height: 2, background: isDone ? "var(--savings)" : "var(--border)", zIndex: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment */}
        {!depositPaid && (
          <div style={{ background: "var(--bg-surface)", border: "1.5px solid var(--accent)", borderRadius: 10, padding: "22px", marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 10 }}>Action Required — Deposit</p>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 18 }}>
              Your contract is signed. Pay your deposit to officially start the project.
            </p>
            <a href={`/portal/${id}/pay`} className="pay-btn">Pay Deposit & Start My Project →</a>
          </div>
        )}

        {depositPaid && !fullPaid && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--savings)", marginBottom: 3 }}>✓ Deposit paid — ${deposit.toLocaleString()}</p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Balance of ${deposit.toLocaleString()} due at delivery.</p>
              </div>
              <a href={`/portal/${id}/pay`} style={{ fontSize: 12.5, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Pay in full →</a>
            </div>
          </div>
        )}

        {fullPaid && (
          <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid var(--savings)", borderRadius: 10, padding: "16px 22px", marginBottom: 20 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--savings)" }}>✓ Paid in full — ${price.toLocaleString()}</p>
          </div>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>Your Deliverables</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: d.done ? "var(--savings)" : "var(--border)" }}>{d.done ? "✓" : "○"}</span>
                  <p style={{ fontSize: 13, color: d.done ? "var(--savings)" : "var(--text-secondary)", textDecoration: d.done ? "none" : "none" }}>{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File drop instructions */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px", marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Submit Your Assets</p>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>
            Send logos, brand files, photos, copy, and any reference links to:
          </p>
          <a href="mailto:michael@woodfireddesigns.com?subject=Project Assets" style={{ display: "inline-block", padding: "10px 20px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 13.5, fontWeight: 500, textDecoration: "none" }}>
            michael@woodfireddesigns.com
          </a>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
            Include your business name in the subject line. Google Drive and Dropbox links work great for large files.
          </p>
        </div>

        {/* Contact */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Questions?</p>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14 }}>
            Michael responds to all project questions within one business day. If something is urgent, call or text directly.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="mailto:michael@woodfireddesigns.com" style={{ padding: "9px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
              Email Michael
            </a>
            <a href="sms:+1YOURNUMBER" style={{ padding: "9px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
              Text Michael
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PortalPageWrapper() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1713" }}><p style={{ color: "#5A5248", fontFamily: "sans-serif", fontSize: 14 }}>Loading…</p></div>}>
      <PortalPage />
    </Suspense>
  );
}
