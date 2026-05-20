"use client";

import { useState, useEffect, useRef } from "react";

// ── CSS-in-JS global styles injected once ─────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  h1,h2,h3{text-transform:uppercase;letter-spacing:0.02em;}
  :root {
    --bg:             #1a1713;
    --bg-surface:     #201e1a;
    --bg-elevated:    #2a2723;
    --border:         #333028;
    --border-hover:   #FF4D00;
    --accent:         #FF4D00;
    --accent-dim:     rgba(255,77,0,0.10);
    --text-primary:   #F2EDE8;
    --text-secondary: #9A9088;
    --text-muted:     #5A5248;
    --savings:        #4ADE80;
    --font-d:         'Anton', sans-serif;
    --font-b:         'DM Sans', sans-serif;
    --ease:           cubic-bezier(0.16,1,0.3,1);
  }
  body { font-family: var(--font-b); background: var(--bg); color: var(--text-primary); overflow: hidden; }
  ::selection { background: var(--accent-dim); color: var(--text-primary); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .opt-card {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 13px 16px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--bg-surface);
    cursor: pointer; transition: border-color 0.18s, background 0.18s;
    user-select: none;
  }
  .opt-card:hover { border-color: var(--border-hover); background: var(--accent-dim); }
  .opt-card.selected { border-color: var(--accent); background: var(--accent-dim); }

  .opt-check {
    width: 18px; height: 18px; border-radius: 4px;
    border: 1.5px solid var(--border); flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
  }
  .opt-card.selected .opt-check { background: var(--accent); border-color: var(--accent); }

  .opt-radio {
    width: 18px; height: 18px; border-radius: 99px;
    border: 1.5px solid var(--border); flex-shrink: 0; margin-top: 2px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s;
  }
  .opt-card.selected .opt-radio { border-color: var(--accent); }
  .opt-card.selected .opt-radio::after {
    content: ''; width: 8px; height: 8px;
    border-radius: 99px; background: var(--accent);
  }

  .text-input {
    width: 100%; padding: 10px 14px;
    background: var(--bg-surface); border: 1.5px solid var(--border);
    border-radius: 8px; color: var(--text-primary);
    font-family: var(--font-b); font-size: 14px;
    outline: none; transition: border-color 0.18s;
  }
  .text-input:focus { border-color: var(--accent); }
  .text-input::placeholder { color: var(--text-muted); }

  .btn-primary {
    padding: 12px 24px; background: var(--accent); color: #fff;
    border: none; border-radius: 8px; font-family: var(--font-b);
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.35; cursor: default; transform: none; }

  .btn-ghost {
    padding: 10px 20px; background: transparent; color: var(--text-secondary);
    border: 1.5px solid var(--border); border-radius: 8px;
    font-family: var(--font-b); font-size: 14px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover { border-color: var(--text-secondary); color: var(--text-primary); }

  @keyframes slideInRight { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInLeft  { from { transform: translateX(-24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOutLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-24px); opacity: 0; } }
  @keyframes lineIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes bundleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,77,0,0); } 50% { box-shadow: 0 0 18px 4px rgba(255,77,0,0.22); } }

  .q-enter { animation: slideInRight 0.28s var(--ease) both; }
  .q-enter-back { animation: slideInLeft 0.28s var(--ease) both; }

  .line-item-row { animation: lineIn 0.22s var(--ease) both; }
  .bundle-enter { animation: bundleIn 0.3s var(--ease) both, glow 1.4s ease 0.3s; }

  @media (max-width: 767px) {
    body { overflow: auto; }
  }
`;

// ── Data ──────────────────────────────────────────────────────────────────────

const SERVICES: Record<string, { label: string; category: string; base: number; description: string; turnaround?: string; deliverables: string[] }> = {
  starter_site: {
    label: "Starter Website", category: "web", base: 1200, turnaround: "5 business days",
    description: "A sharp, fast single-page site built to make the right first impression and turn visitors into calls.",
    deliverables: [
      "Single-page custom website design + build",
      "Mobile-first responsive layout",
      "Contact form with email routing",
      "Click-to-call and click-to-email buttons",
      "Google Business Profile integration",
      "Basic on-page SEO (meta, titles, schema)",
      "Domain + hosting setup guidance",
      "You own everything — no lock-in",
    ],
  },
  full_website: {
    label: "Full Website", category: "web", base: 2400, turnaround: "7 business days",
    description: "A multi-page, conversion-focused website built to rank, convert, and represent your business at its best.",
    deliverables: [
      "Up to 5 custom-designed pages",
      "Mobile-first responsive design",
      "SEO foundation — meta, schema, sitemap, robots.txt",
      "Contact form + lead capture with email routing",
      "Services page + portfolio/gallery section",
      "Google Analytics 4 + Search Console setup",
      "Performance optimized — fast load, clean code",
      "You own the domain, hosting, and all files",
    ],
  },
  brand_and_site: {
    label: "Brand Identity + Full Website", category: "bundle", base: 4200, turnaround: "14 business days",
    description: "Your complete brand built from scratch — logo, identity system, and a full website that makes everything cohesive from day one.",
    deliverables: [
      "Primary logo + alternate lockups (stacked, horizontal, icon)",
      "Color system with hex, RGB, and CMYK values",
      "Typography stack — display + body font pairing",
      "Brand guidelines document (PDF + shareable)",
      "Vehicle wrap and signage-ready files",
      "Full website (up to 5 pages) — see Full Website deliverables",
      "All source files delivered (AI, EPS, PNG, SVG, PDF)",
      "You own everything outright",
    ],
  },
  brand_identity_only: {
    label: "Brand Identity System", category: "brand", base: 1800,
    description: "A complete visual identity built to last — not just a logo, but a full system your business can grow into.",
    deliverables: [
      "Primary logo + alternate lockups (stacked, horizontal, mark)",
      "Full color palette with usage rules",
      "Typography system — display and body fonts",
      "Brand guidelines document (PDF)",
      "Business card design (print-ready)",
      "Social profile assets (avatar, cover)",
      "All source files (AI, EPS, SVG, PNG, PDF)",
      "Vehicle wrap / signage ready files",
    ],
  },
  ecommerce_shopify: {
    label: "Shopify Ecommerce Store", category: "web", base: 3800, turnaround: "10 business days",
    description: "A custom Shopify build that looks nothing like a template — designed to convert browsers into buyers.",
    deliverables: [
      "Custom Shopify theme design and build",
      "Up to 3 product collection pages",
      "Product page template with conversion-focused layout",
      "Cart, checkout, and confirmation pages styled",
      "Mobile-first shopping experience",
      "Payment gateway setup and testing",
      "Basic email notification customization",
      "Analytics and tracking setup",
    ],
  },
  landing_page: {
    label: "Campaign Landing Page", category: "web", base: 1200, turnaround: "5 business days",
    description: "A single, focused page engineered to convert traffic into leads, bookings, or sales — no distractions.",
    deliverables: [
      "Single-page design and build",
      "Conversion-focused layout (hero, proof, CTA)",
      "Lead capture form with email routing",
      "Mobile-optimized",
      "Fast load — performance first",
      "Connected to your domain",
    ],
  },
  copywriting: {
    label: "Professional Copywriting", category: "addon", base: 600,
    description: "Every word on your site written to convert — clear, confident, and sounding like a business worth calling.",
    deliverables: [
      "Homepage headline, subhead, and body copy",
      "Services page copy for each offering",
      "About section — your story, without the fluff",
      "CTA copy throughout",
      "Meta descriptions for all pages",
      "Written in your voice — reviewed with you before use",
    ],
  },
  seo_local: {
    label: "Local SEO Setup", category: "addon", base: 400,
    description: "Get found by the people in your area who are actively searching for what you do.",
    deliverables: [
      "Google Business Profile optimization",
      "NAP consistency audit and fixes",
      "Local schema markup (business, services, reviews)",
      "Top 10 local citation submissions",
      "Keyword targeting for your city + service",
      "Baseline ranking report",
    ],
  },
  extra_pages: {
    label: "Additional Pages", category: "addon", base: 300,
    description: "Each additional page beyond the included package, designed and built to the same standard.",
    deliverables: [
      "Custom page design consistent with site system",
      "Mobile-optimized",
      "SEO meta and on-page optimization",
      "Integrated into site navigation",
    ],
  },
  packaging_single: {
    label: "Packaging Design — Single SKU", category: "packaging", base: 1200,
    description: "Label, box, or bag design for one product — print-ready files delivered, built to win the shelf and the scroll.",
    deliverables: [
      "Packaging concept and final design",
      "Dieline layout (supplied by your printer or sourced)",
      "Front, back, and side panel design",
      "Print-ready files (PDF, AI, packaged links)",
      "CMYK color-corrected for print",
      "Up to 2 revision rounds",
    ],
  },
  packaging_system: {
    label: "Packaging System — Multi SKU", category: "packaging", base: 2800,
    description: "A cohesive packaging system across 3+ SKUs — designed so every product looks like it belongs to the same brand.",
    deliverables: [
      "System design for 3+ SKUs",
      "Individual dieline layouts per SKU",
      "All panels designed — front, back, sides",
      "Cohesive visual language across products",
      "Print-ready files for all SKUs",
      "CMYK color-corrected",
      "Up to 3 revision rounds",
    ],
  },
  ai_photo_starter: {
    label: "AI Product Photography — Starter", category: "photo", base: 800,
    description: "10 final product images that look better than a $3k studio shoot — done without the logistics.",
    deliverables: [
      "10 final high-resolution images",
      "2 distinct scene styles (e.g. white BG + lifestyle)",
      "Web and social-ready exports",
      "JPEG + PNG formats",
      "Commercial usage rights — yours to use anywhere",
      "Delivered in 3 business days",
    ],
  },
  ai_photo_pro: {
    label: "AI Product Photography — Pro", category: "photo", base: 1500,
    description: "25 final images across 4 scene styles — enough to fill a product launch, a campaign, and a full social calendar.",
    deliverables: [
      "25 final high-resolution images",
      "4 distinct scene styles",
      "Ecommerce hero shots (white/neutral BG)",
      "Lifestyle and editorial scenes",
      "Social-format crops included",
      "JPEG + PNG formats, full resolution",
      "Commercial usage rights — yours outright",
      "Delivered in 5 business days",
    ],
  },
  merch_design: {
    label: "Merch & Apparel Design", category: "merch", base: 800,
    description: "Branded merch that people actually want to wear — designed for production, not just for show.",
    deliverables: [
      "Design for selected garments / accessories",
      "Placement mockups (front, back, sleeve as applicable)",
      "Print-ready files (screen print, DTG, or embroidery)",
      "Color separations if required",
      "Production spec sheet",
      "Printer-agnostic files — take them anywhere",
    ],
  },
};

const BUNDLES = [
  { id: "full_stack",    label: "Full Creative Stack",          requires: ["web","brand","photo"],      discount: 0.15, message: "Full creative stack — brand, website, and photography." },
  { id: "web_photo",     label: "Website + Photography Bundle", requires: ["web","photo"],              discount: 0.10, message: "Bundling your website with AI product photography." },
  { id: "web_packaging", label: "Website + Packaging Bundle",   requires: ["web","packaging"],          discount: 0.10, message: "Bundling your website with packaging design." },
  { id: "brand_pack",    label: "Brand + Packaging Bundle",     requires: ["brand","packaging"],        discount: 0.10, message: "Building your brand and packaging together." },
  { id: "web_merch",     label: "Website + Merch Bundle",       requires: ["web","merch"],              discount: 0.08, message: "Pairing your website with merch design." },
];

function getBestBundle(keys: string[]) {
  const cats = new Set(keys.flatMap((k) => {
    const cat = SERVICES[k]?.category;
    if (cat === "bundle") return ["web", "brand"];
    return cat ? [cat] : [];
  }));
  let best: typeof BUNDLES[0] | null = null;
  for (const b of BUNDLES) {
    if (b.requires.every((r) => cats.has(r))) {
      if (!best || b.discount > best.discount) best = b;
    }
  }
  return best;
}

const SECTION_MAP: Record<string, string[]> = {
  web:       ["q_web_scope", "q_web_addons", "q_web_timeline", "q_web_content"],
  ecom:      ["q_web_scope", "q_web_addons", "q_web_timeline", "q_web_content"],
  landing:   ["q_web_scope", "q_web_timeline", "q_web_content"],
  brand:     ["q_brand_scope", "q_brand_deliverables"],
  photo:     ["q_photo_scope", "q_photo_product"],
  packaging: ["q_packaging_scope"],
  merch:     ["q_merch_scope"],
};

function buildQueue(cats: string[]): string[] {
  const seen = new Set<string>();
  const q: string[] = [];
  for (const cat of cats) {
    for (const id of (SECTION_MAP[cat] ?? [])) {
      if (!seen.has(id)) { seen.add(id); q.push(id); }
    }
  }
  q.push("q_budget", "q_start_timeline");
  return q;
}

// ── Question definitions ──────────────────────────────────────────────────────

type QType = "text_fields" | "single_select" | "multi_select";
interface Option { value: string; label: string; subtext?: string; price_preview?: string; badge?: string; icon?: string; modifier?: number }
interface QDef { id: string; question: string; subtext?: string; type: QType; fields?: { key: string; label: string; required: boolean }[]; options?: Option[] }

const QUESTIONS: Record<string, QDef> = {
  q_contact: {
    id: "q_contact", type: "text_fields",
    question: "Let's build your proposal.",
    subtext: "Takes about 2 minutes. Your proposal builds live as you answer.",
    fields: [
      { key: "first_name", label: "First Name",   required: true },
      { key: "last_name",  label: "Last Name",    required: true },
      { key: "company",    label: "Business Name", required: false },
      { key: "email",      label: "Email Address", required: true },
      { key: "phone",      label: "Phone (optional)", required: false },
    ],
  },
  q_business_type: {
    id: "q_business_type", type: "single_select",
    question: "What kind of business are you running?",
    subtext: "Shapes how we scope and write your proposal.",
    options: [
      { value: "trades",      label: "Trades / Contractor",        subtext: "Roofing, HVAC, plumbing, electric, etc." },
      { value: "ecommerce",   label: "Ecommerce / Product Brand",  subtext: "Selling physical products online." },
      { value: "service",     label: "Service Business",           subtext: "Professional services, fitness, wellness." },
      { value: "hospitality", label: "Food, Bev & Hospitality",    subtext: "Restaurant, catering, CPG." },
      { value: "apparel",     label: "Apparel / Merch Brand",      subtext: "Clothing, hats, branded products." },
      { value: "other",       label: "Something else",             subtext: "" },
    ],
  },
  q_project_needs: {
    id: "q_project_needs", type: "multi_select",
    question: "What do you need built?",
    subtext: "Select everything on your list. We'll scope each one.",
    options: [
      { value: "web",       label: "Website",             icon: "🌐", subtext: "New build or redesign." },
      { value: "brand",     label: "Brand Identity",      icon: "🔥", subtext: "Logo, colors, full system." },
      { value: "ecom",      label: "Ecommerce / Shopify", icon: "🛒", subtext: "Online store." },
      { value: "landing",   label: "Landing Page",        icon: "⚡", subtext: "Campaign or lead gen." },
      { value: "photo",     label: "Product Photography", icon: "📸", subtext: "AI-enhanced product shots." },
      { value: "packaging", label: "Packaging Design",    icon: "📦", subtext: "Labels, boxes, bags." },
      { value: "merch",     label: "Merch / Apparel",     icon: "👕", subtext: "Tees, hats, branded drops." },
    ],
  },
  q_web_scope: {
    id: "q_web_scope", type: "single_select",
    question: "What kind of website do you need?",
    options: [
      { value: "starter_site",      label: "Single Page",                    subtext: "Strong, fast presence. Live in 5 days." },
      { value: "full_website",      label: "Multi-Page Site (up to 5 pages)", subtext: "Full presence, built to rank and convert. Live in 7 days." },
      { value: "brand_and_site",    label: "Brand Identity + Full Website",   subtext: "Logo, brand system, and website — done right the first time.", badge: "Best Value" },
      { value: "ecommerce_shopify", label: "Ecommerce / Shopify Store",        subtext: "Custom store build. Product catalog + checkout." },
    ],
  },
  q_web_addons: {
    id: "q_web_addons", type: "multi_select",
    question: "Any add-ons for your site?",
    subtext: "All optional. Add what you need.",
    options: [
      { value: "copywriting", label: "Copywriting",     subtext: "We write every word." },
      { value: "seo_local",   label: "Local SEO Setup", subtext: "GMB, citations, schema markup." },
      { value: "extra_pages", label: "Extra Pages",     subtext: "Beyond 5 pages, per page." },
    ],
  },
  q_web_timeline: {
    id: "q_web_timeline", type: "single_select",
    question: "How fast do you need to launch?",
    options: [
      { value: "standard", label: "Standard",          subtext: "Normal turnaround per package.",        modifier: 1.00 },
      { value: "rush",     label: "Rush it",           subtext: "~40% faster. 25% rush fee applied.",   modifier: 1.25 },
      { value: "flexible", label: "No hard deadline",  subtext: "We set a comfortable pace.",            modifier: 1.00 },
    ],
  },
  q_web_content: {
    id: "q_web_content", type: "single_select",
    question: "Do you have copy and images ready?",
    subtext: "Most clients don't — no problem. Just scoping.",
    options: [
      { value: "yes_both",   label: "Yes — copy and photos ready" },
      { value: "need_copy",  label: "Have photos, need copy help" },
      { value: "need_photo", label: "Have copy, need images" },
      { value: "need_both",  label: "Need both — let's figure it out" },
    ],
  },
  q_brand_scope: {
    id: "q_brand_scope", type: "single_select",
    question: "Where is your brand right now?",
    options: [
      { value: "zero",     label: "Starting from zero",            subtext: "No logo, nothing yet." },
      { value: "has_logo", label: "Have a logo, need the system",  subtext: "Colors, type, guidelines." },
      { value: "refresh",  label: "Need a refresh",                subtext: "Evolve what exists, not rebuild." },
    ],
  },
  q_brand_deliverables: {
    id: "q_brand_deliverables", type: "multi_select",
    question: "What brand deliverables matter most?",
    subtext: "Scope check — helps confirm the right package.",
    options: [
      { value: "logo",       label: "Logo Suite" },
      { value: "colors",     label: "Color System" },
      { value: "typography", label: "Typography Stack" },
      { value: "guidelines", label: "Brand Guidelines Doc" },
      { value: "signage",    label: "Vehicle Wrap / Signage Files" },
      { value: "social",     label: "Social Media Templates" },
      { value: "patterns",   label: "Pattern / Texture Library" },
    ],
  },
  q_photo_scope: {
    id: "q_photo_scope", type: "single_select",
    question: "How much product photography do you need?",
    options: [
      { value: "ai_photo_starter", label: "Starter — 10 images", subtext: "2 scene styles, white BG + lifestyle." },
      { value: "ai_photo_pro",     label: "Pro — 25 images",     subtext: "4 scene styles, social + ecommerce ready." },
    ],
  },
  q_photo_product: {
    id: "q_photo_product", type: "single_select",
    question: "What are we shooting?",
    options: [
      { value: "packaged",  label: "Packaged product" },
      { value: "apparel",   label: "Apparel / merch" },
      { value: "food_bev",  label: "Food & beverage" },
      { value: "equipment", label: "Equipment / gear" },
      { value: "other",     label: "Something else" },
    ],
  },
  q_packaging_scope: {
    id: "q_packaging_scope", type: "single_select",
    question: "How many products need packaging?",
    options: [
      { value: "packaging_single", label: "1 product",    subtext: "Single SKU, print-ready files." },
      { value: "packaging_system", label: "3 or more",    subtext: "Cohesive system across SKUs, print-ready." },
    ],
  },
  q_merch_scope: {
    id: "q_merch_scope", type: "multi_select",
    question: "What merch are you dropping?",
    options: [
      { value: "tees",    label: "T-Shirts" },
      { value: "hats",    label: "Hats / Caps" },
      { value: "hoodies", label: "Hoodies / Fleece" },
      { value: "branded", label: "Branded accessories" },
      { value: "full",    label: "Full merch line" },
    ],
  },
  q_budget: {
    id: "q_budget", type: "single_select",
    question: "What's your total investment range?",
    subtext: "Honest answer helps flag if scope needs adjusting. No judgment.",
    options: [
      { value: "under_1500", label: "Under $1,500" },
      { value: "1500_3000",  label: "$1,500 – $3,000" },
      { value: "3000_5000",  label: "$3,000 – $5,000" },
      { value: "5000_plus",  label: "$5,000+" },
      { value: "flexible",   label: "Flexible — show me what it takes" },
    ],
  },
  q_start_timeline: {
    id: "q_start_timeline", type: "single_select",
    question: "When do you want to kick things off?",
    options: [
      { value: "now",        label: "Ready to start now" },
      { value: "this_month", label: "This month" },
      { value: "next_month", label: "Next 30–60 days" },
      { value: "exploring",  label: "Still exploring — not ready yet" },
    ],
  },
};

const BUDGET_MAX: Record<string, number> = {
  under_1500: 1500, "1500_3000": 3000, "3000_5000": 5000, "5000_plus": Infinity, flexible: Infinity,
};

// ── State types ───────────────────────────────────────────────────────────────

interface LineItem { key: string; label: string; price: number; description: string; deliverables: string[]; turnaround?: string; note?: string }
interface ProposalState {
  clientName: string; company: string; email: string;
  lineItems: LineItem[];
  rushFee: number;
  scopeNotes: string[];
  subtotal: number;
  bundle: typeof BUNDLES[0] | null;
  savings: number;
  total: number;
  budgetRange: string;
  projectedStart: string;
}

// ── Counter animation hook ────────────────────────────────────────────────────

function useCounter(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    function step(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else prevRef.current = target;
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ── Proposal panel ────────────────────────────────────────────────────────────

function ProposalPanel({ state, done }: { state: ProposalState; done: boolean }) {
  const animTotal = useCounter(state.total);
  const budgetOver = state.budgetRange && state.budgetRange !== "flexible" && state.budgetRange !== "5000_plus"
    && state.total > (BUDGET_MAX[state.budgetRange] ?? Infinity);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "48px 36px", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 20 }}>
        Your Proposal
      </p>

      {/* Client header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-d)", fontSize: state.clientName ? 26 : 18, fontWeight: 700, color: state.clientName ? "var(--text-primary)" : "var(--text-muted)", lineHeight: 1.15, marginBottom: 3 }}>
          {state.clientName || "Your name goes here"}
        </h2>
        {state.company && <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{state.company}</p>}
        {done && state.projectedStart && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Projected Start: {state.projectedStart}</p>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

      {/* Empty state */}
      {state.lineItems.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.8 }}>
            Answer the questions on the left<br />and your scope builds here.
          </p>
        </div>
      )}

      {/* Deliverable cards — shown during questionnaire */}
      {!done && state.lineItems.length > 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {state.lineItems.map((item, i) => (
            <div
              key={item.key}
              className="line-item-row"
              style={{
                animationDelay: `${i * 70}ms`,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.25 }}>
                  {item.label}
                </p>
                {item.turnaround && (
                  <span style={{ fontSize: 10, fontWeight: 500, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {item.turnaround}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 12 }}>
                {item.description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {item.deliverables.map((d, di) => (
                  <div key={di} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0, fontSize: 11, marginTop: 1 }}>✦</span>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {state.rushFee > 0 && (
            <div className="line-item-row" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 18px" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>Rush Delivery</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>~40% faster turnaround, prioritised in queue.</p>
            </div>
          )}

          {/* Bundle teaser — no price */}
          {state.bundle && (
            <div className="bundle-enter" style={{ padding: "12px 16px", borderRadius: 8, border: "1.5px solid var(--accent)", background: "var(--accent-dim)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 4 }}>
                {state.bundle.label}
              </p>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {state.bundle.message} A bundle discount will be applied to your final total.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Final proposal — full rich view when done */}
      {done && state.lineItems.length > 0 && (
        <div style={{ flex: 1 }}>

          {/* Rich deliverable cards with price revealed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {state.lineItems.map((item, i) => (
              <div
                key={item.key}
                className="line-item-row"
                style={{
                  animationDelay: `${i * 70}ms`,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "18px 20px",
                }}
              >
                {/* Header row: label + price */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <p style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-d)", fontSize: 17, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                    ${item.price.toLocaleString()}
                  </p>
                </div>

                {/* Turnaround badge */}
                {item.turnaround && (
                  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 500, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 99, marginBottom: 10 }}>
                    {item.turnaround}
                  </span>
                )}

                {/* Description */}
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 12 }}>
                  {item.description}
                </p>

                {/* Deliverables checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.deliverables.map((d, di) => (
                    <div key={di} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0, fontSize: 10, marginTop: 2 }}>✦</span>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Rush fee card */}
            {state.rushFee > 0 && (
              <div className="line-item-row" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>Rush Delivery</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>~40% faster turnaround, prioritised in the queue.</p>
                </div>
                <p style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>
                  +${state.rushFee.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Bundle callout with revealed savings */}
          {state.bundle && state.savings > 0 && (
            <div className="bundle-enter" style={{ padding: "14px 18px", borderRadius: 8, border: "1.5px solid var(--accent)", background: "var(--accent-dim)", marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 5 }}>
                {state.bundle.label}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                {state.bundle.message}
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--savings)", marginTop: 6 }}>
                You're saving ${state.savings.toLocaleString()}
              </p>
            </div>
          )}

          {/* Totals block */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Subtotal</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>${(state.subtotal + state.rushFee).toLocaleString()}</p>
            </div>
            {state.savings > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "var(--savings)" }}>Bundle discount</p>
                <p style={{ fontSize: 13, color: "var(--savings)", fontFamily: "monospace" }}>−${state.savings.toLocaleString()}</p>
              </div>
            )}
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Total Investment</p>
              <p style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 700, color: "var(--accent)" }}>
                ${animTotal.toLocaleString()}
              </p>
            </div>
            {state.projectedStart && (
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>Projected Start: {state.projectedStart}</p>
            )}
          </div>

          {/* Budget mismatch */}
          {budgetOver && (
            <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #B86B10", background: "rgba(184,107,16,0.08)", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#E89840" }}>
                Your scope totals ${state.total.toLocaleString()}. We can trim this — let's talk.
              </p>
            </div>
          )}

          {/* Scope notes */}
          {state.scopeNotes.length > 0 && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Scope Notes</p>
              {state.scopeNotes.map((note, i) => (
                <p key={i} style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>· {note}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionRenderer({
  q, answers, onAnswer, onTextChange,
}: {
  q: QDef;
  answers: Record<string, string | string[]>;
  onAnswer: (qId: string, val: string | string[]) => void;
  onTextChange: (qId: string, key: string, val: string) => void;
}) {
  const current = answers[q.id];

  if (q.type === "text_fields") {
    const vals = (current as unknown as Record<string, string>) ?? {};
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {q.fields?.map((f) => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.04em" }}>
              {f.label}{f.required && <span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>}
            </label>
            <input
              className="text-input"
              value={vals[f.key] ?? ""}
              onChange={(e) => onTextChange(q.id, f.key, e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "single_select") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options?.map((opt) => {
          const sel = current === opt.value;
          return (
            <div key={opt.value} className={`opt-card${sel ? " selected" : ""}`} onClick={() => onAnswer(q.id, opt.value)}>
              <div className="opt-radio" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {opt.icon && <span>{opt.icon}</span>}
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</p>
                  {opt.badge && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "var(--accent)", color: "#fff", letterSpacing: "0.05em" }}>{opt.badge}</span>
                  )}
                </div>
                {opt.subtext && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{opt.subtext}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // multi_select
  const selected = (current as string[]) ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {q.options?.map((opt) => {
        const sel = selected.includes(opt.value);
        return (
          <div key={opt.value} className={`opt-card${sel ? " selected" : ""}`}
            onClick={() => {
              const next = sel ? selected.filter((v) => v !== opt.value) : [...selected, opt.value];
              onAnswer(q.id, next);
            }}>
            <div className="opt-check">
              {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {opt.icon && <span style={{ fontSize: 14 }}>{opt.icon}</span>}
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</p>
              </div>
              {opt.subtext && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{opt.subtext}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Compute proposal state from answers ───────────────────────────────────────

function computeProposal(answers: Record<string, unknown>): ProposalState {
  const contact = (answers["q_contact"] as Record<string, string>) ?? {};
  const clientName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");

  const lineItems: LineItem[] = [];
  const scopeNotes: string[] = [];
  let rushFee = 0;

  const mkItem = (key: string, note?: string): LineItem => {
    const s = SERVICES[key];
    return { key, label: s.label, price: s.base, description: s.description, deliverables: s.deliverables, turnaround: s.turnaround, note };
  };

  // Web scope
  const webScope = answers["q_web_scope"] as string;
  if (webScope && SERVICES[webScope]) lineItems.push(mkItem(webScope));

  // Web addons
  const addons = (answers["q_web_addons"] as string[]) ?? [];
  for (const a of addons) {
    if (SERVICES[a]) lineItems.push(mkItem(a));
  }

  // Rush fee
  if (answers["q_web_timeline"] === "rush") {
    const webSubtotal = lineItems.filter((i) => ["web","bundle","addon"].includes(SERVICES[i.key]?.category ?? "")).reduce((s, i) => s + i.price, 0);
    rushFee = Math.round(webSubtotal * 0.25);
  }

  // Content notes
  const content = answers["q_web_content"] as string;
  if (content === "need_copy") scopeNotes.push("Copywriting needed — add-on available");
  if (content === "need_photo") scopeNotes.push("Product images needed — AI photography available");
  if (content === "need_both") scopeNotes.push("Copy + images needed — can scope both");

  // Brand
  const brandScope = answers["q_brand_scope"] as string;
  if (brandScope && !webScope?.includes("brand_and_site")) {
    lineItems.push(mkItem("brand_identity_only"));
  }
  const brandDels = (answers["q_brand_deliverables"] as string[]) ?? [];
  if (brandDels.length >= 5) scopeNotes.push("Full brand system — comprehensive scope");
  if (brandDels.length) scopeNotes.push(`Brand deliverables: ${brandDels.join(", ")}`);

  // Photo
  const photoScope = answers["q_photo_scope"] as string;
  if (photoScope && SERVICES[photoScope]) lineItems.push(mkItem(photoScope));
  const photoProduct = answers["q_photo_product"] as string;
  if (photoProduct) scopeNotes.push(`Product type: ${photoProduct.replace("_", " ")}`);

  // Packaging
  const packScope = answers["q_packaging_scope"] as string;
  if (packScope && SERVICES[packScope]) lineItems.push(mkItem(packScope));

  // Merch
  const merchScope = answers["q_merch_scope"] as string[];
  if (merchScope?.length) {
    lineItems.push(mkItem("merch_design"));
    scopeNotes.push(`Merch: ${merchScope.join(", ")}`);
  }

  // Business type note
  const biz = answers["q_business_type"] as string;
  if (biz) scopeNotes.push(`Industry: ${biz}`);

  const subtotal = lineItems.reduce((s, i) => s + i.price, 0);
  const keys = lineItems.map((i) => i.key);
  const bundle = getBestBundle(keys);
  const savings = bundle ? Math.round((subtotal + rushFee) * bundle.discount) : 0;
  const total = subtotal + rushFee - savings;

  const startMap: Record<string, string> = {
    now: "Immediately", this_month: "This month", next_month: "Next 30–60 days", exploring: "TBD",
  };
  const projectedStart = startMap[answers["q_start_timeline"] as string] ?? "";

  return {
    clientName, company: contact.company ?? "", email: contact.email ?? "",
    lineItems, rushFee, scopeNotes,
    subtotal, bundle, savings, total,
    budgetRange: (answers["q_budget"] as string) ?? "",
    projectedStart,
  };
}

// ── Main app ──────────────────────────────────────────────────────────────────

const INITIAL_QUEUE = ["q_contact", "q_business_type", "q_project_needs"];

export default function ProposalPage() {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [queue, setQueue] = useState<string[]>(INITIAL_QUEUE);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [done, setDone] = useState(false);
  const [showMobileProposal, setShowMobileProposal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Inject global styles once
  useEffect(() => {
    if (document.getElementById("wfd-proposal-css")) return;
    const s = document.createElement("style");
    s.id = "wfd-proposal-css";
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
  }, []);

  const proposal = computeProposal(answers);
  const currentQId = queue[step];
  const q = QUESTIONS[currentQId];
  const progress = Math.round(((step) / Math.max(queue.length - 1, 1)) * 100);

  function canAdvance(): boolean {
    if (!q) return false;
    const a = answers[q.id];
    if (q.type === "text_fields") {
      const vals = (a as Record<string, string>) ?? {};
      return q.fields?.filter((f) => f.required).every((f) => vals[f.key]?.trim()) ?? false;
    }
    if (q.type === "single_select") return !!a;
    return true; // multi_select — can skip
  }

  function handleAnswer(qId: string, val: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }

  function handleTextChange(qId: string, key: string, val: string) {
    setAnswers((prev) => {
      const existing = (prev[qId] as Record<string, string>) ?? {};
      return { ...prev, [qId]: { ...existing, [key]: val } };
    });
  }

  function next() {
    if (!canAdvance()) return;

    // If Q3 (project needs), rebuild queue
    if (currentQId === "q_project_needs") {
      const cats = (answers["q_project_needs"] as string[]) ?? [];
      const newQueue = ["q_contact", "q_business_type", "q_project_needs", ...buildQueue(cats)];
      setQueue(newQueue);
      setDir("fwd");
      setStep(3);
      setAnimKey((k) => k + 1);
      return;
    }

    if (step >= queue.length - 1) {
      setDone(true);
      return;
    }
    setDir("fwd");
    setStep((s) => s + 1);
    setAnimKey((k) => k + 1);
  }

  function back() {
    if (step === 0) return;
    setDir("back");
    setStep((s) => s - 1);
    setAnimKey((k) => k + 1);
  }

  if (!q && !done) return null;

  const animClass = done ? "q-enter" : dir === "fwd" ? "q-enter" : "q-enter-back";

  // ── Done screen ──
  if (done) {
    return (
      <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-b)" }}>
        {/* Left — confirmation + CTAs */}
        <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 52px", background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}>
          <div className={animClass} style={{ maxWidth: 400, width: "100%" }}>
            <div style={{ fontSize: 44, marginBottom: 20 }}>🔥</div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
              Wood Fired Designs
            </p>
            <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 14 }}>
              Your Proposal<br />Is Ready.
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 36 }}>
              Everything is scoped on the right. Review it, then choose how you'd like to move forward — no pressure, no commitment yet.
            </p>

            {/* CTA 1 — primary */}
            <a
              href="https://calendly.com/woodfireddesigns/discovery"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", padding: "15px 24px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, textDecoration: "none", textAlign: "center", marginBottom: 10, letterSpacing: "0.02em" }}
            >
              Schedule a Call →
            </a>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", marginBottom: 20 }}>
              30 minutes. We'll walk through scope and answer every question.
            </p>

            {/* CTA 2 — secondary: saves proposal + opens contract */}
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const contact = (answers["q_contact"] as Record<string, string>) ?? {};
                  const res = await fetch("/api/proposals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientName: proposal.clientName,
                      company: proposal.company,
                      email: proposal.email,
                      phone: contact.phone ?? "",
                      businessType: answers["q_business_type"] ?? "",
                      lineItems: proposal.lineItems,
                      scopeNotes: proposal.scopeNotes,
                      rushFee: proposal.rushFee,
                      subtotal: proposal.subtotal,
                      savings: proposal.savings,
                      total: proposal.total,
                      bundleLabel: proposal.bundle?.label ?? null,
                      projectedStart: proposal.projectedStart,
                      budgetRange: proposal.budgetRange,
                    }),
                  });
                  const { proposalId } = await res.json();
                  window.location.href = `/proposal/${proposalId}`;
                } catch {
                  setSubmitting(false);
                }
              }}
              style={{ display: "block", width: "100%", padding: "14px 24px", background: "transparent", color: submitting ? "var(--text-muted)" : "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", textAlign: "center", marginBottom: 10 }}
            >
              {submitting ? "Preparing your contract…" : "I'm Ready — Review & Sign →"}
            </button>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center" }}>
              Saves your proposal · Opens the contract to sign
            </p>
          </div>
        </div>

        {/* Right — full rich proposal */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ProposalPanel state={proposal} done={true} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-b)", position: "relative" }}>
      {/* ── Left panel ── */}
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--bg-surface)", overflowY: "auto" }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--bg-elevated)", flexShrink: 0 }}>
          <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.35s var(--ease)" }} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 52px", maxWidth: 580 }}>
          {/* Step label */}
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 28 }}>
            Step {step + 1} of {queue.length}
          </p>

          {/* Question */}
          <div key={animKey} className={animClass} style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: q.subtext ? 8 : 24 }}>
              {q.question}
            </h2>
            {q.subtext && (
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>{q.subtext}</p>
            )}

            <QuestionRenderer
              q={q}
              answers={answers as Record<string, string | string[]>}
              onAnswer={handleAnswer}
              onTextChange={handleTextChange}
            />
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            {step > 0 && (
              <button className="btn-ghost" onClick={back}>← Back</button>
            )}
            <button
              className="btn-primary"
              onClick={next}
              disabled={!canAdvance()}
              style={{ marginLeft: step > 0 ? 0 : "auto" }}
            >
              {step >= queue.length - 1 ? "See My Proposal →" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <ProposalPanel state={proposal} done={false} />
      </div>

      {/* ── Mobile sticky bar ── */}
      {showMobileProposal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--bg)", overflowY: "auto", display: "none" }} className="mobile-overlay">
          <button onClick={() => setShowMobileProposal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20 }}>✕</button>
          <ProposalPanel state={proposal} done={false} />
        </div>
      )}
    </div>
  );
}
