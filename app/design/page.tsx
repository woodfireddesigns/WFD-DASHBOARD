"use client";
import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-muted:#5A5248;
    --font-d:'Anton',sans-serif;--font-b:'DM Sans',sans-serif;
    --ease:cubic-bezier(0.16,1,0.3,1);
  }
  body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);}
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  .q-enter{animation:qIn 0.35s var(--ease) both;}
  .q-enter-back{animation:qInBack 0.35s var(--ease) both;}
  @keyframes qIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
  @keyframes qInBack{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
  .opt-card{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:border-color 0.18s,background 0.18s;}
  .opt-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .opt-card.selected{border-color:var(--accent);background:var(--accent-dim);}
  .opt-radio{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;transition:border-color 0.18s,background 0.18s;}
  .opt-card.selected .opt-radio{border-color:var(--accent);background:var(--accent);}
  .opt-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:border-color 0.18s,background 0.18s;}
  .opt-card.selected .opt-check{border-color:var(--accent);background:var(--accent);}
  .field-input{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:var(--font-b);font-size:14px;padding:11px 14px;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:var(--accent);}
  textarea.field-input{resize:vertical;min-height:90px;line-height:1.6;}
  .btn-primary{padding:12px 28px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-family:var(--font-b);font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s;}
  .btn-primary:disabled{opacity:0.35;cursor:not-allowed;}
  .btn-ghost{padding:12px 20px;background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:7px;font-family:var(--font-b);font-size:13.5px;cursor:pointer;transition:color 0.18s,border-color 0.18s;}
  .btn-ghost:hover{color:var(--text-primary);border-color:var(--text-secondary);}
  .scope-item{animation:scopeIn 0.3s var(--ease) both;}
  @keyframes scopeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .pkg-card{border:1px solid var(--border);border-radius:10px;padding:18px 20px;cursor:pointer;transition:border-color 0.2s,background 0.2s;}
  .pkg-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .pkg-card.selected{border-color:var(--accent);background:var(--accent-dim);}
  .layout-wrap{display:flex;height:100vh;}
  .q-panel{flex:0 0 58%;display:flex;flex-direction:column;border-right:1px solid var(--border);background:var(--bg-surface);overflow-y:auto;}
  .scope-panel{flex:1;overflow-y:auto;}
  .scope-inner{max-width:560px;margin:0 auto;padding:48px 36px;display:flex;flex-direction:column;}
  @media(max-width:768px){
    .layout-wrap{flex-direction:column;height:auto;min-height:100vh;}
    .q-panel{flex:none;width:100%;border-right:none;border-bottom:1px solid var(--border);}
    .scope-panel{display:none;}
    .q-inner{padding:32px 20px!important;max-width:100%!important;}
    .q-headline{font-size:22px!important;}
    .controls-bar{padding-top:20px!important;margin-top:24px!important;}
  }
`;

// ── Packages ──────────────────────────────────────────────────────────────────

const PACKAGES = [
  {
    value: "spark_identity",
    label: "Spark Identity",
    subtext: "A real brand, not just a logo. Fast, contained, and built to last.",
    turnaround: "2 weeks",
    price: 1800,
    category: "brand",
    includes: [
      "Logo system (primary, secondary, submark)",
      "Color palette with usage rules",
      "Typography system — 2 fonts",
      "Basic brand usage guide",
      "3 social media profile assets",
      "3 launch graphics",
      "All file formats — PNG, SVG, PDF",
    ],
  },
  {
    value: "ignite_brand",
    label: "Ignite Brand System",
    subtext: "A complete system built to show up consistently everywhere.",
    turnaround: "4–6 weeks",
    price: 3500,
    badge: "Most Popular",
    category: "brand",
    includes: [
      "Full logo suite (primary, secondary, submark, icon)",
      "Expanded color system",
      "Primary and secondary typography",
      "Comprehensive brand guidelines — 20–30 pages",
      "Social media starter kit",
      "Business card design",
      "One core marketing asset (flyer, label, ad, or pitch deck cover)",
      "Vehicle wrap & signage ready files",
    ],
  },
  {
    value: "forge_identity",
    label: "Forge Complete Identity",
    subtext: "Your brand plus the creative firepower to market it.",
    turnaround: "6–8 weeks",
    price: 6500,
    badge: "Premium",
    category: "brand",
    includes: [
      "Full brand identity system",
      "Expanded brand guidelines — 40+ pages",
      "Social ad kit — 10 static ads + 2 video concepts",
      "Email header templates",
      "Landing page copy + wireframe",
      "Full stationery suite",
      "Canva Brand Kit setup",
      "Brand launch strategy document",
    ],
  },
];

const STANDALONE = [
  {
    value: "packaging_single",
    label: "Packaging — Single SKU",
    subtext: "One product, print-ready files, dieline supplied by printer.",
    turnaround: "10 days",
    price: 1200,
    category: "packaging",
    includes: [
      "1 product packaging design",
      "Print-ready files (PDF, AI)",
      "Dieline supplied by your printer",
      "2 rounds of revisions",
    ],
  },
  {
    value: "packaging_system",
    label: "Packaging — Multi-SKU System",
    subtext: "3+ products with a cohesive visual system across every SKU.",
    turnaround: "21 days",
    price: 2800,
    badge: "Best Value",
    category: "packaging",
    includes: [
      "3+ product packaging designs",
      "Cohesive visual system across all SKUs",
      "Print-ready files for each",
      "3 rounds of revisions",
    ],
  },
  {
    value: "photo_starter",
    label: "AI Photography — Starter",
    subtext: "10 final images. 2 scene styles. White background + lifestyle.",
    turnaround: "5 days",
    price: 800,
    category: "photo",
    includes: [
      "10 final high-resolution images",
      "2 scene style directions",
      "Clean white background set",
      "Lifestyle / in-context set",
      "Social & web optimized",
    ],
  },
  {
    value: "photo_pro",
    label: "AI Photography — Pro",
    subtext: "25 final images. 4 scene styles. Social + ecommerce ready.",
    turnaround: "7 days",
    price: 1500,
    badge: "Most Popular",
    category: "photo",
    includes: [
      "25 final high-resolution images",
      "4 scene style directions",
      "White background + 3 lifestyle sets",
      "Ecommerce & social media optimized",
      "Usage rights included",
    ],
  },
  {
    value: "photo_campaign",
    label: "AI Photography — Campaign",
    subtext: "50 images. Custom art direction. Built for a launch or campaign.",
    turnaround: "10 days",
    price: 2800,
    badge: "Premium",
    category: "photo",
    includes: [
      "50 final high-resolution images",
      "Custom art direction session",
      "6+ scene style directions",
      "Campaign-ready compositions",
      "Full usage rights",
      "Seasonal / themed options",
    ],
  },
  {
    value: "merch_single",
    label: "Merch Design — Single Item",
    subtext: "One item, print-ready. Tee, hat, hoodie, or branded accessory.",
    turnaround: "7 days",
    price: 800,
    category: "merch",
    includes: [
      "1 apparel or product design",
      "Print-ready files",
      "Front + back if applicable",
      "2 rounds of revisions",
      "Supplier-ready format",
    ],
  },
  {
    value: "merch_line",
    label: "Merch Design — Full Line",
    subtext: "4+ items with a cohesive drop. Built to sell together.",
    turnaround: "14 days",
    price: 1800,
    category: "merch",
    includes: [
      "4+ apparel / product designs",
      "Cohesive collection system",
      "Print-ready files for all items",
      "3 rounds of revisions",
      "Supplier-ready format",
      "Mockup presentation",
    ],
  },
];

const ALL_PKGS = [...PACKAGES, ...STANDALONE];

const STYLE_OPTIONS = ["Clean & minimal", "Bold & edgy", "Warm & approachable", "Dark & premium", "Bright & energetic", "Classic & professional", "Luxury & refined", "Rustic & handcrafted", "Playful & fun", "Modern & geometric"];
const BRAND_DELIVERABLE_OPTIONS = ["Logo suite", "Color system", "Typography stack", "Brand guidelines PDF", "Business card", "Social media templates", "Vehicle wrap / signage files", "Stationery suite", "Pattern / texture library"];
const PRODUCT_TYPE_OPTIONS = ["Food & beverage", "Skincare / beauty", "Supplements / health", "Apparel / soft goods", "Electronics / tech", "Home goods", "Spirits / wine / beer", "Pet products", "Other"];
const SHOOT_STYLE_OPTIONS = ["White background / studio", "Lifestyle / in-context", "Flat lay", "Dark & moody", "Bright & airy", "Textured surfaces", "Outdoor / nature", "Urban / industrial"];
const MERCH_ITEMS = ["T-shirts", "Hoodies / fleece", "Hats / caps", "Tote bags", "Branded accessories", "Stickers / patches", "Full drop (everything)"];

const BASE_PRICES: Record<string, number> = Object.fromEntries(ALL_PKGS.map(p => [p.value, p.price]));

interface Answers { [key: string]: string | string[] | boolean }

function calcTotal(answers: Answers) {
  const pkg = answers.package as string;
  const base = BASE_PRICES[pkg] ?? 0;
  const addons = (answers.addons as string[]) ?? [];
  const addonTotal = addons.reduce((s, a) => s + (BASE_PRICES[a] ?? 0), 0);
  return base + addonTotal;
}

// ── Scope Panel ───────────────────────────────────────────────────────────────

function ScopePanel({ answers }: { answers: Answers }) {
  const pkg = ALL_PKGS.find(p => p.value === answers.package);
  const addons = ((answers.addons as string[]) ?? []).map(a => ALL_PKGS.find(p => p.value === a)).filter(Boolean);
  const total = calcTotal(answers);
  const fmt = (n: number) => "$" + n.toLocaleString();

  return (
    <div className="scope-inner">
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 20 }}>
        Your Design Scope
      </p>

      {answers.first_name ? (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 22, color: "var(--text-primary)", marginBottom: 3 }}>
            {answers.first_name as string}{answers.last_name ? ` ${answers.last_name as string}` : ""}
          </h2>
          {answers.business_name && <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{answers.business_name as string}</p>}
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 18, color: "var(--text-secondary)" }}>Your scope builds here</h2>
        </div>
      )}

      <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />

      {!pkg && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>Select a package or service and your scope will populate here.</p>}

      {pkg && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 14, color: "var(--text-primary)" }}>{pkg.label}</p>
              <span style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99 }}>{pkg.turnaround}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pkg.includes.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 7 }}>
                  <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {addons.map((a, i) => a && (
            <div key={i} className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 13, color: "var(--text-primary)" }}>{a.label}</p>
                <span style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99 }}>Add-on</span>
              </div>
              {a.includes.slice(0, 3).map((d, di) => (
                <div key={di} style={{ display: "flex", gap: 7 }}>
                  <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d}</p>
                </div>
              ))}
            </div>
          ))}

          {answers.style_direction && ((answers.style_direction as string[]).length > 0) && (
            <div className="scope-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Style Direction</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(answers.style_direction as string[]).map(s => (
                  <span key={s} style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-dim)", padding: "3px 10px", borderRadius: 99 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {total > 0 && (
            <div className="scope-item" style={{ background: "var(--bg)", border: "1.5px solid var(--accent)", borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Investment</p>
              {BASE_PRICES[pkg.value] > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{pkg.label}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{fmt(pkg.price)}</p>
                </div>
              )}
              {addons.map(a => a && (
                <div key={a.value} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{a.label}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{fmt(a.price)}</p>
                </div>
              ))}
              <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Total</p>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 22, color: "var(--accent)" }}>{fmt(total)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Questions ─────────────────────────────────────────────────────────────────

type QType = "text_fields" | "textarea" | "single_select" | "multi_select" | "package_select" | "addon_select" | "divider";

interface Field { key: string; label: string; required?: boolean; placeholder?: string }
interface Option { value: string; label: string; subtext?: string; badge?: string }
interface Question {
  id: string; type: QType; question: string; subtext?: string;
  fields?: Field[]; options?: Option[]; items?: string[];
  required?: boolean; showIf?: (a: Answers) => boolean;
}

const isBrand = (a: Answers) => ["spark_identity","ignite_brand","forge_identity"].includes(a.package as string);
const isPackaging = (a: Answers) => ["packaging_single","packaging_system"].includes(a.package as string);
const isPhoto = (a: Answers) => ["photo_starter","photo_pro","photo_campaign"].includes(a.package as string);
const isMerch = (a: Answers) => ["merch_single","merch_line"].includes(a.package as string);

const QUESTIONS: Question[] = [

  // ── PART 1: SCOPE ────────────────────────────────────────────────────────────
  {
    id: "contact",
    type: "text_fields",
    question: "Let's build your scope.",
    subtext: "This takes about 8 minutes total. Your project brief builds live on the right as you answer.",
    fields: [
      { key: "first_name", label: "First Name", required: true },
      { key: "last_name", label: "Last Name", required: true },
      { key: "business_name", label: "Business Name", placeholder: "If applicable" },
      { key: "email", label: "Email Address", required: true },
      { key: "phone", label: "Phone Number" },
    ],
  },
  {
    id: "referral_source",
    type: "single_select",
    question: "How did you hear about us?",
    options: [
      { value: "Google search", label: "Google search" },
      { value: "Instagram", label: "Instagram" },
      { value: "Referral from a friend", label: "Referral from a friend" },
      { value: "Existing client", label: "Existing client" },
      { value: "LinkedIn", label: "LinkedIn" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    id: "package",
    type: "package_select",
    question: "What do you need built?",
    subtext: "Pick your primary service. You can add on more on the next screen.",
  },
  {
    id: "addons",
    type: "addon_select",
    question: "Anything you'd like to add on?",
    subtext: "Stack services for a cohesive result — one project, one kick-off, one creative direction.",
    showIf: (a) => !!a.package,
  },
  // ── Brand scope ──
  {
    id: "brand_origin",
    type: "single_select",
    question: "Where is your brand right now?",
    options: [
      { value: "Starting from zero — no logo, nothing yet", label: "Starting from zero — no logo, nothing yet" },
      { value: "Have a logo, need the full system", label: "Have a logo, need the full system" },
      { value: "Need a refresh — evolve what exists", label: "Need a refresh — evolve what exists" },
    ],
    showIf: isBrand,
  },
  {
    id: "brand_deliverables",
    type: "multi_select",
    question: "Which deliverables matter most to you?",
    subtext: "Helps us prioritize within your package.",
    items: BRAND_DELIVERABLE_OPTIONS,
    showIf: isBrand,
  },
  // ── Packaging scope ──
  {
    id: "packaging_product_type",
    type: "single_select",
    question: "What type of product are we designing packaging for?",
    options: PRODUCT_TYPE_OPTIONS.map(v => ({ value: v, label: v })),
    showIf: (a) => isPackaging(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("packaging")),
  },
  {
    id: "packaging_retail_context",
    type: "single_select",
    question: "Where will this product be sold?",
    options: [
      { value: "Retail shelf (grocery, specialty, etc.)", label: "Retail shelf (grocery, specialty, etc.)" },
      { value: "Online only (ecommerce, DTC)", label: "Online only (ecommerce, DTC)" },
      { value: "Amazon", label: "Amazon" },
      { value: "Both retail and online", label: "Both retail and online" },
    ],
    showIf: (a) => isPackaging(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("packaging")),
  },
  {
    id: "packaging_price_point",
    type: "single_select",
    question: "What's the price point of your product?",
    subtext: "Shapes the design positioning — budget, mid, or premium.",
    options: [
      { value: "Budget — competing on price", label: "Budget — competing on price" },
      { value: "Mid-market — quality at fair price", label: "Mid-market — quality at fair price" },
      { value: "Premium — higher price, higher perceived value", label: "Premium — higher price, higher perceived value" },
      { value: "Luxury — price is a feature", label: "Luxury — price is a feature" },
    ],
    showIf: (a) => isPackaging(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("packaging")),
  },
  {
    id: "packaging_printer",
    type: "single_select",
    question: "Do you have a printer / manufacturer lined up?",
    subtext: "We need their dieline spec to design to the right dimensions.",
    options: [
      { value: "Yes — I'll send the dieline", label: "Yes — I'll send the dieline" },
      { value: "No — help me find one", label: "No — help me find one" },
      { value: "Not sure yet", label: "Not sure yet" },
    ],
    showIf: (a) => isPackaging(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("packaging")),
  },
  // ── Photography scope ──
  {
    id: "photo_product_type",
    type: "single_select",
    question: "What are we shooting?",
    options: PRODUCT_TYPE_OPTIONS.map(v => ({ value: v, label: v })),
    showIf: (a) => isPhoto(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("photo")),
  },
  {
    id: "photo_primary_platform",
    type: "single_select",
    question: "Where will these images be used most?",
    options: [
      { value: "Instagram / social media", label: "Instagram / social media" },
      { value: "Amazon / ecommerce listings", label: "Amazon / ecommerce listings" },
      { value: "Website hero and product pages", label: "Website hero and product pages" },
      { value: "Paid ads (Meta, Google)", label: "Paid ads (Meta, Google)" },
      { value: "All of the above", label: "All of the above" },
    ],
    showIf: (a) => isPhoto(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("photo")),
  },
  {
    id: "photo_styles",
    type: "multi_select",
    question: "What shoot styles are you drawn to?",
    subtext: "Pick everything that resonates.",
    items: SHOOT_STYLE_OPTIONS,
    showIf: (a) => isPhoto(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("photo")),
  },
  // ── Merch scope ──
  {
    id: "merch_items",
    type: "multi_select",
    question: "What items are you dropping?",
    items: MERCH_ITEMS,
    showIf: (a) => isMerch(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("merch")),
  },
  {
    id: "merch_use",
    type: "single_select",
    question: "What's this merch for?",
    options: [
      { value: "Selling to customers (merch store)", label: "Selling to customers (merch store)" },
      { value: "Team / staff uniforms", label: "Team / staff uniforms" },
      { value: "Brand promotional items", label: "Brand promotional items" },
      { value: "Event or launch drop", label: "Event or launch drop" },
    ],
    showIf: (a) => isMerch(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("merch")),
  },

  // ── DIVIDER: CREATIVE BRIEF ──────────────────────────────────────────────────
  {
    id: "divider_brief",
    type: "divider",
    question: "Now let's build your creative brief.",
    subtext: "Your scope is locked in. The next section is where we go deep — business context, audience, competitive landscape, and creative direction. This is what separates a great project from an average one.",
  },

  // ── Business context ──
  {
    id: "elevator_pitch",
    type: "textarea",
    question: "Describe your business in 2–3 sentences.",
    subtext: "What you do, who you serve, and why it matters. Your elevator pitch. Be direct.",
  },
  {
    id: "business_stage",
    type: "single_select",
    question: "Where are you in the business journey?",
    options: [
      { value: "Pre-launch — building before we go live", label: "Pre-launch — building before we go live" },
      { value: "Early stage — under 1 year, finding our footing", label: "Early stage — under 1 year, finding our footing" },
      { value: "Growing — 1–3 years, gaining momentum", label: "Growing — 1–3 years, gaining momentum" },
      { value: "Established — 3+ years, leveling up the brand", label: "Established — 3+ years, leveling up the brand" },
    ],
  },
  {
    id: "business_goal",
    type: "single_select",
    question: "What's your biggest goal right now?",
    subtext: "The one thing that would move the needle most.",
    options: [
      { value: "Build brand awareness and recognition", label: "Build brand awareness and recognition" },
      { value: "Drive more direct sales or leads", label: "Drive more direct sales or leads" },
      { value: "Launch a new product or product line", label: "Launch a new product or product line" },
      { value: "Enter a new market or distribution channel", label: "Enter a new market or distribution channel" },
      { value: "Rebrand to better reflect where we are now", label: "Rebrand to better reflect where we are now" },
      { value: "Attract investors or retail buyers", label: "Attract investors or retail buyers" },
    ],
  },
  {
    id: "unfair_advantage",
    type: "textarea",
    question: "What do you do better than anyone else?",
    subtext: "Your unfair advantage. The thing that makes a customer choose you over every other option. Be honest and specific — this becomes the backbone of the creative.",
  },

  // ── Audience ──
  {
    id: "ideal_customer",
    type: "textarea",
    question: "Describe your ideal customer in detail.",
    subtext: "Age, lifestyle, values, where they live, what they care about, what problems they have. The more specific, the better the creative brief.",
  },
  {
    id: "customer_values",
    type: "multi_select",
    question: "What does your customer value most when buying?",
    subtext: "Pick the top 3.",
    items: ["Price / value", "Quality & craftsmanship", "Brand story & authenticity", "Sustainability & ethics", "Status & prestige", "Community & belonging", "Innovation & novelty", "Convenience & speed"],
  },
  {
    id: "customer_online",
    type: "multi_select",
    question: "Where does your customer spend time online?",
    items: ["Instagram", "TikTok", "YouTube", "Pinterest", "Facebook", "LinkedIn", "Amazon", "Podcasts", "Email newsletters"],
  },

  // ── Competitive landscape ──
  {
    id: "top_competitors",
    type: "textarea",
    question: "Who are your top 3 competitors?",
    subtext: "Name them, link them, describe them. We'll research them — but knowing who you're up against directly shapes how we position you.",
  },
  {
    id: "competitor_differentiation",
    type: "textarea",
    question: "How does your brand stand out from those competitors?",
    subtext: "Don't just say 'better quality' — dig in. What specifically makes your product, service, or experience different or superior?",
  },
  {
    id: "admired_brands",
    type: "textarea",
    question: "Are there brands you admire outside your industry?",
    subtext: "Brands whose look, feel, or positioning you want to draw from — even if they're completely different from your category. Tell us what resonates and why.",
  },

  // ── Brand personality ──
  {
    id: "brand_person",
    type: "textarea",
    question: "If your brand were a person, describe them.",
    subtext: "How old are they? How do they dress? How do they talk — formal or casual, loud or quiet, witty or serious? What do they care about? What would they never say?",
  },
  {
    id: "brand_not",
    type: "textarea",
    question: "What brands do you definitely NOT want to look like?",
    subtext: "Just as important as what you like. Competitors, adjacent brands, anything that feels wrong. Tell us what to avoid and why.",
  },
  {
    id: "brand_industry",
    type: "single_select",
    question: "What industry are you in?",
    options: [
      { value: "Food & beverage / CPG", label: "Food & beverage / CPG" },
      { value: "Health, wellness & supplements", label: "Health, wellness & supplements" },
      { value: "Apparel & fashion", label: "Apparel & fashion" },
      { value: "Cannabis / hemp", label: "Cannabis / hemp" },
      { value: "Beauty & personal care", label: "Beauty & personal care" },
      { value: "Sports & outdoor", label: "Sports & outdoor" },
      { value: "Trades / contractor", label: "Trades / contractor" },
      { value: "Professional services", label: "Professional services" },
      { value: "Tech & software", label: "Tech & software" },
      { value: "Ecommerce / DTC brand", label: "Ecommerce / DTC brand" },
      { value: "Other", label: "Other" },
    ],
  },

  // ── Creative direction ──
  {
    id: "style_direction",
    type: "multi_select",
    question: "What style direction feels right?",
    subtext: "Pick up to 3.",
    items: STYLE_OPTIONS,
  },
  {
    id: "brand_words",
    type: "textarea",
    question: "Give us 5 words that must be true about the creative.",
    subtext: "Not aspirational — true. If someone looked at the finished work, these are the 5 words they'd use to describe it. Bold. Warm. Premium. Human. Unexpected. Whatever fits.",
  },
  {
    id: "color_prefs",
    type: "textarea",
    question: "Colors you love — and colors to avoid.",
    subtext: "Both matter equally. Hex codes, Pantones, or descriptions all work. 'Nothing corporate blue' is a perfectly valid answer.",
  },
  {
    id: "visual_references",
    type: "textarea",
    question: "Drop any visual references or inspiration.",
    subtext: "Pinterest boards, Instagram accounts, specific brands, products you've seen on a shelf — anything that's triggered a 'yes, that' reaction. Links or descriptions both work.",
  },
  {
    id: "off_brand",
    type: "textarea",
    question: "What's definitively off-brand or off-limits?",
    subtext: "Styles, colors, treatments, tones, or vibes that are a hard no. The more specific, the better — 'no gradients' or 'nothing looks like a MLM brand' gives us real guardrails.",
  },

  // ── Assets ──
  {
    id: "brand_assets",
    type: "textarea",
    question: "What existing assets can you share?",
    subtext: "Logos, brand guidelines, product photos, packaging, past design files. Drop a Google Drive / Dropbox link, or note what you have. You can also send after submitting.",
  },

  // ── Success criteria ──
  {
    id: "success_definition",
    type: "textarea",
    question: "What does a home run look like to you?",
    subtext: "When you see the final work and say 'this is exactly right' — what does that mean? What specific feeling, reaction, or outcome tells you we nailed it?",
  },
  {
    id: "hard_requirements",
    type: "textarea",
    question: "Any hard requirements or must-avoids?",
    subtext: "Things that aren't optional — legal, brand, or business constraints. Specific colors that must be used, words that can't appear, formats that are mandatory, etc.",
  },

  // ── Timeline ──
  {
    id: "launch_timeline",
    type: "single_select",
    question: "When do you need this done?",
    options: [
      { value: "ASAP — as fast as possible", label: "ASAP — as fast as possible" },
      { value: "Within 2–4 weeks", label: "Within 2–4 weeks" },
      { value: "Within 1–2 months", label: "Within 1–2 months" },
      { value: "Flexible — no hard deadline", label: "Flexible — no hard deadline" },
    ],
  },
  {
    id: "hard_deadline",
    type: "single_select",
    question: "Is there a hard external deadline?",
    subtext: "A launch event, trade show, product drop, or investor meeting that can't move.",
    options: [
      { value: "No hard deadline — just sooner is better", label: "No hard deadline — just sooner is better" },
      { value: "Yes — I'll share the date in notes below", label: "Yes — I'll share the date in notes below" },
    ],
  },
  {
    id: "extra_notes",
    type: "textarea",
    question: "Anything else we should know before we start?",
    subtext: "Past experiences with designers (good or bad), budget context, internal stakeholders who'll review, anything that shapes how this project will run.",
  },
];

const STORAGE_KEY = "wfd_design_progress";

// ── Main ──────────────────────────────────────────────────────────────────────

function canAdvanceQ(q: Question, answers: Answers): boolean {
  if (q.type === "divider") return true;
  if (q.type === "addon_select") return true;
  if (q.type === "text_fields") {
    const vals = (answers[q.id] as unknown as Record<string, string>) ?? {};
    return (q.fields ?? []).filter(f => f.required).every(f => vals[f.key]?.trim());
  }
  if (q.type === "package_select") return !!answers.package;
  if (q.type === "textarea") return true;
  if (q.type === "single_select") return !!answers[q.id];
  return true;
}

export default function DesignIntakePage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [savedData, setSavedData] = useState<{ answers: Answers; step: number } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (document.getElementById("design-css")) return;
    const s = document.createElement("style"); s.id = "design-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { answers: Answers; step: number };
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        setSavedData(parsed); setResumePrompt(true);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step: stepIndex }));
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1800);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [answers, stepIndex]);

  function clearSaved() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }

  const visibleQuestions = QUESTIONS.filter(q => !q.showIf || q.showIf(answers));
  const q = visibleQuestions[stepIndex];
  const progress = Math.round((stepIndex / Math.max(visibleQuestions.length - 1, 1)) * 100);

  function setField(qId: string, key: string, val: string) {
    setAnswers(prev => {
      const existing = (prev[qId] as unknown as Record<string, string>) ?? {};
      return { ...prev, [qId]: { ...existing, [key]: val } } as Answers;
    });
  }
  function setAnswer(key: string, val: string | string[] | boolean) {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }
  function toggleMulti(key: string, val: string) {
    const cur = (answers[key] as string[]) ?? [];
    setAnswer(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]);
  }

  function next() {
    if (!canAdvanceQ(q, answers)) return;
    if (stepIndex >= visibleQuestions.length - 1) { setDone(true); return; }
    setDir("fwd"); setStepIndex(i => i + 1); setAnimKey(k => k + 1);
  }
  function back() {
    if (stepIndex === 0) return;
    setDir("back"); setStepIndex(i => i - 1); setAnimKey(k => k + 1);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (done || resumePrompt) return;
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (!canAdvanceQ(q, answers)) return;
      e.preventDefault();
      next();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  async function submit() {
    setSubmitting(true);
    const contact = (answers.contact as unknown as Record<string, string>) ?? {};
    const pkg = answers.package as string;
    const addons = (answers.addons as string[]) ?? [];
    const total = calcTotal(answers);

    const payload = {
      form_type: "design",
      first_name: contact.first_name ?? "",
      last_name: contact.last_name ?? "",
      business_name: contact.business_name ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      referral_source: answers.referral_source ?? "",
      package: pkg,
      package_price: total,
      integrations: addons,
      style_direction: answers.style_direction ?? [],
      brand_words: answers.brand_words ?? "",
      color_prefs: answers.color_prefs ?? "",
      brand_assets: answers.brand_assets ?? "",
      launch_timeline: answers.launch_timeline ?? "",
      extra_notes: answers.extra_notes ?? "",
      primary_goal: answers.brand_industry ?? "",
      target_customer: answers.brand_origin ?? "",
      differentiator: answers.brand_competitors ?? "",
      competitor_refs: answers.packaging_product_type ?? answers.photo_product_type ?? "",
      has_copy: answers.packaging_printer as string ?? "",
      has_logo: answers.photo_existing_brand as string ?? "",
      has_photos: ((answers.photo_styles as string[]) ?? []).join(", "),
      pages: answers.merch_items as string[] ?? [],
      has_hosting: answers.merch_use as string ?? "",
    };

    try {
      const res = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Submission failed");
      if (!data.portalToken) throw new Error("No portal token returned");
      clearSaved();
      window.location.href = `/onboard/${data.portalToken}`;
    } catch (err) {
      alert("Submission error: " + (err instanceof Error ? err.message : String(err)));
      setSubmitting(false);
    }
  }

  const animClass = dir === "fwd" ? "q-enter" : "q-enter-back";

  // Resume prompt
  if (resumePrompt && savedData) {
    const savedContact = (savedData.answers.contact as unknown as Record<string, string>) ?? {};
    const savedPkg = ALL_PKGS.find(p => p.value === savedData.answers.package);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>👋</div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 12 }}>Welcome Back</p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 26, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 14 }}>
            {savedContact.first_name ? `Hey ${savedContact.first_name} —` : "You left off mid-way."}
          </h2>
          {savedPkg && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 28 }}>You had selected <strong style={{ color: "var(--text-primary)" }}>{savedPkg.label}</strong>.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setAnswers(savedData.answers); setStepIndex(savedData.step); setResumePrompt(false); }} style={{ padding: "14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Resume Where I Left Off →
            </button>
            <button onClick={() => { clearSaved(); setResumePrompt(false); setSavedData(null); }} style={{ padding: "13px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 13.5, cursor: "pointer" }}>
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    const contact = (answers.contact as unknown as Record<string, string>) ?? {};
    const pkg = ALL_PKGS.find(p => p.value === answers.package);
    const total = calcTotal(answers);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔥</div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 12 }}>Wood Fired Designs</p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 14 }}>
            You&apos;re all set,<br />{contact.first_name || "friend"}.
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 12 }}>
            You selected <strong style={{ color: "var(--text-primary)" }}>{pkg?.label}</strong> — ${total.toLocaleString()} total. Confirm below and your contract will be ready to sign.
          </p>
          <button onClick={submit} disabled={submitting} style={{ display: "block", width: "100%", padding: "15px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1, marginBottom: 10 }}>
            {submitting ? "Saving your project…" : "Generate My Contract →"}
          </button>
          <button onClick={() => { setDone(false); setDir("back"); setStepIndex(visibleQuestions.length - 1); setAnimKey(k => k + 1); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 12.5, cursor: "pointer" }}>
            ← Go back and edit
          </button>
        </div>
      </div>
    );
  }

  // Addon options — exclude current package and same-category items
  const currentPkg = ALL_PKGS.find(p => p.value === answers.package);
  const addonOptions = STANDALONE.filter(p => {
    if (p.value === answers.package) return false;
    if (currentPkg && p.category === currentPkg.category) return false;
    return true;
  });

  return (
    <div className="layout-wrap" style={{ fontFamily: "var(--font-b)" }}>
      {/* Left panel */}
      <div className="q-panel">
        <div style={{ height: 3, background: "var(--bg-elevated)", flexShrink: 0 }}>
          <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.35s var(--ease)" }} />
        </div>
        <div className="q-inner" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 52px", maxWidth: 600 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Step {stepIndex + 1} of {visibleQuestions.length}
            </p>
            <p style={{ fontSize: 11, color: justSaved ? "var(--accent)" : "transparent", transition: "color 0.4s", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✓ Progress saved
            </p>
          </div>

          <div key={animKey} className={animClass} style={{ flex: 1 }}>
            <h2 className="q-headline" style={{ fontFamily: "var(--font-d)", fontSize: 28, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: q.subtext ? 10 : 28 }}>
              {q.question}
            </h2>
            {q.type !== "divider" && q.subtext && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 24 }}>{q.subtext}</p>}

            {/* Divider */}
            {q.type === "divider" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--accent)" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Part 2 of 2</span>
                  <div style={{ flex: 1, height: 1, background: "var(--accent)" }} />
                </div>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75 }}>{q.subtext}</p>
              </div>
            )}

            {/* Text fields */}
            {q.type === "text_fields" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {q.fields?.map(f => (
                  <div key={f.key}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 7 }}>{f.label}{f.required ? " *" : ""}</p>
                    <input className="field-input" type={f.key === "email" ? "email" : "text"} placeholder={f.placeholder ?? ""}
                      value={((answers[q.id] as unknown as Record<string, string>) ?? {})[f.key] ?? ""}
                      onChange={e => setField(q.id, f.key, e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            {q.type === "textarea" && (
              <textarea className="field-input" placeholder="Type your answer here…"
                value={(answers[q.id] as string) ?? ""}
                onChange={e => setAnswer(q.id, e.target.value)} />
            )}

            {/* Package select */}
            {q.type === "package_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["brand", "packaging", "photo", "merch"].map(cat => {
                  const catPkgs = ALL_PKGS.filter(p => p.category === cat);
                  const catLabels: Record<string, string> = { brand: "Brand Identity", packaging: "Packaging Design", photo: "AI Product Photography", merch: "Merch & Apparel" };
                  return (
                    <div key={cat}>
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>{catLabels[cat]}</p>
                      {catPkgs.map(pkg => (
                        <div key={pkg.value} className={`pkg-card${answers.package === pkg.value ? " selected" : ""}`}
                          onClick={() => setAnswer("package", pkg.value)} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                            <p style={{ fontFamily: "var(--font-d)", fontSize: 15, color: "var(--text-primary)" }}>{pkg.label}</p>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              {pkg.badge && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99 }}>{pkg.badge}</span>}
                              <span style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99 }}>{pkg.turnaround}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>{pkg.subtext}</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {pkg.includes.slice(0, 4).map(d => (
                              <span key={d} style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 9px", borderRadius: 99 }}>{d}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Addon select */}
            {q.type === "addon_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={`opt-card${((answers.addons as string[]) ?? []).length === 0 ? " selected" : ""}`}
                  onClick={() => setAnswer("addons", [])}>
                  <div className="opt-radio" />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>No add-ons — just the primary package</p>
                </div>
                {addonOptions.map(opt => {
                  const sel = ((answers.addons as string[]) ?? []).includes(opt.value);
                  return (
                    <div key={opt.value} className={`opt-card${sel ? " selected" : ""}`}
                      onClick={() => toggleMulti("addons", opt.value)}>
                      <div className="opt-check">
                        {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</p>
                          {opt.badge && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", padding: "1px 7px", borderRadius: 99 }}>{opt.badge}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{opt.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Single select */}
            {q.type === "single_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options?.map(opt => (
                  <div key={opt.value} className={`opt-card${answers[q.id] === opt.value ? " selected" : ""}`}
                    onClick={() => setAnswer(q.id, opt.value)}>
                    <div className="opt-radio" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</p>
                      {opt.subtext && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{opt.subtext}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Multi select */}
            {q.type === "multi_select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(q.items ?? []).map(item => {
                  const sel = ((answers[q.id] as string[]) ?? []).includes(item);
                  return (
                    <div key={item} className={`opt-card${sel ? " selected" : ""}`} onClick={() => toggleMulti(q.id, item)}>
                      <div className="opt-check">
                        {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{item}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="controls-bar" style={{ display: "flex", gap: 10, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            {stepIndex > 0 && <button className="btn-ghost" onClick={back}>← Back</button>}
            <button className="btn-primary" onClick={next} disabled={!canAdvanceQ(q, answers)} style={{ marginLeft: stepIndex > 0 ? 0 : "auto" }}>
              {stepIndex >= visibleQuestions.length - 1 ? "Review & Submit →" : q.type === "divider" ? "Start the Creative Brief →" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="scope-panel">
        <ScopePanel answers={answers} />
      </div>
    </div>
  );
}
