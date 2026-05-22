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
    subtext: "A strong, complete brand foundation. In your hands in 14 days.",
    turnaround: "14 days",
    price: 1200,
    category: "brand",
    includes: [
      "Logo suite (primary, secondary, submark)",
      "Color palette — 5 colors with usage rules",
      "Typography system — 2 fonts",
      "1-page brand guidelines PDF",
      "All file formats — PNG, SVG, PDF",
      "White, black, and full-color variants",
    ],
  },
  {
    value: "ignite_brand",
    label: "Ignite Brand System",
    subtext: "A complete system built to show up consistently everywhere.",
    turnaround: "21 days",
    price: 2800,
    badge: "Most Popular",
    category: "brand",
    includes: [
      "Everything in Spark",
      "Extended logo suite (horizontal, stacked, icon)",
      "Full brand guidelines — 10-page PDF",
      "Business card design (print-ready)",
      "6 social media post templates",
      "Brand pattern / texture asset",
      "Vehicle wrap & signage ready files",
      "Email signature design",
    ],
  },
  {
    value: "forge_identity",
    label: "Forge Complete Identity",
    subtext: "For brands making a serious move. Everything, done right.",
    turnaround: "28 days",
    price: 4800,
    badge: "Premium",
    category: "brand",
    includes: [
      "Everything in Ignite",
      "Full stationery suite (letterhead, envelope, folder)",
      "Packaging design — 1 product (print-ready)",
      "Brand photography direction guide",
      "12 social media templates",
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

type QType = "text_fields" | "textarea" | "single_select" | "multi_select" | "package_select" | "addon_select";

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
  {
    id: "contact",
    type: "text_fields",
    question: "Let's build your scope.",
    subtext: "Takes about 3 minutes. Your project brief builds live as you answer.",
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
    subtext: "Stack services together for a cohesive result — one project, one kick-off, one creative direction.",
    showIf: (a) => !!a.package,
  },
  // ── Brand questions ──
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
    id: "brand_industry",
    type: "single_select",
    question: "What industry are you in?",
    options: [
      { value: "Trades / contractor", label: "Trades / contractor" },
      { value: "Food & beverage / hospitality", label: "Food & beverage / hospitality" },
      { value: "Ecommerce / product brand", label: "Ecommerce / product brand" },
      { value: "Health, wellness & fitness", label: "Health, wellness & fitness" },
      { value: "Apparel & fashion", label: "Apparel & fashion" },
      { value: "Professional services", label: "Professional services" },
      { value: "Tech & software", label: "Tech & software" },
      { value: "Other", label: "Other" },
    ],
    showIf: isBrand,
  },
  {
    id: "brand_deliverables",
    type: "multi_select",
    question: "Which brand deliverables matter most to you?",
    subtext: "Helps us prioritize within your package.",
    items: BRAND_DELIVERABLE_OPTIONS,
    showIf: isBrand,
  },
  {
    id: "brand_competitors",
    type: "textarea",
    question: "List 2–3 brands or competitors you admire.",
    subtext: "Tell us what you like about them — the look, the feel, the vibe. URLs or names work.",
    showIf: isBrand,
  },
  // ── Packaging questions ──
  {
    id: "packaging_product_type",
    type: "single_select",
    question: "What type of product are we designing packaging for?",
    options: PRODUCT_TYPE_OPTIONS.map(v => ({ value: v, label: v })),
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
  // ── Photography questions ──
  {
    id: "photo_product_type",
    type: "single_select",
    question: "What are we shooting?",
    options: PRODUCT_TYPE_OPTIONS.map(v => ({ value: v, label: v })),
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
  {
    id: "photo_existing_brand",
    type: "single_select",
    question: "Do you have existing brand assets for us to match?",
    subtext: "Colors, fonts, logo — we'll style the photography to your brand.",
    options: [
      { value: "Yes — I'll send everything", label: "Yes — I'll send everything" },
      { value: "Partial — I have some assets", label: "Partial — I have some assets" },
      { value: "No — shoot as a standalone", label: "No — shoot as a standalone" },
    ],
    showIf: (a) => isPhoto(a) || ((a.addons as string[]) ?? []).some(x => x.startsWith("photo")),
  },
  // ── Merch questions ──
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
  // ── Universal ──
  {
    id: "style_direction",
    type: "multi_select",
    question: "What style direction feels right?",
    subtext: "Pick up to 3. This shapes the creative direction.",
    items: STYLE_OPTIONS,
  },
  {
    id: "brand_words",
    type: "textarea",
    question: "Describe your brand in 3–5 words.",
    subtext: "How do you want people to feel when they encounter your brand? Bold, trustworthy, warm, premium, rebellious — be specific.",
  },
  {
    id: "color_prefs",
    type: "textarea",
    question: "Any color preferences or existing brand colors?",
    subtext: "Hex codes, Pantones, or just describe the vibe — 'dark, moody navy' or 'bright citrus energy' both work.",
  },
  {
    id: "brand_assets",
    type: "textarea",
    question: "Do you have any existing assets to share?",
    subtext: "Logos, brand files, product photos, packaging samples. Drop a Google Drive / Dropbox link, or note what you have.",
  },
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
    id: "extra_notes",
    type: "textarea",
    question: "Anything else we should know?",
    subtext: "Hard deadlines, specific concerns, things you've loved or hated from past designers. The more detail, the better.",
  },
];

const STORAGE_KEY = "wfd_design_progress";

// ── Main ──────────────────────────────────────────────────────────────────────

function canAdvanceQ(q: Question, answers: Answers): boolean {
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
            {q.subtext && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 24 }}>{q.subtext}</p>}

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
              {stepIndex >= visibleQuestions.length - 1 ? "Review & Submit →" : "Next →"}
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
