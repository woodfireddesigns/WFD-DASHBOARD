/**
 * One stylesheet for every intake form.
 *
 * /onboard, /design and /quick each inlined their own near-identical copy of
 * this, which is how Spark Identity ended up priced at $1,200 on one form and
 * $1,800 on another. New forms share this instead.
 */
export const INTAKE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#1a1713;--bg-surface:#201e1a;--bg-elevated:#2a2723;
    --border:#333028;--accent:#FF4D00;--accent-dim:rgba(255,77,0,0.1);
    --text-primary:#F2EDE8;--text-secondary:#9A9088;--text-dim:#6B6259;
    --font-d:'Oswald',sans-serif;--font-b:'DM Sans',sans-serif;
    --ease:cubic-bezier(0.16,1,0.3,1);
  }
  html,body{background:var(--bg);color:var(--text-primary);font-family:var(--font-b);-webkit-font-smoothing:antialiased;}
  h1,h2,h3{font-family:var(--font-d);text-transform:uppercase;letter-spacing:0.02em;line-height:1.05;}
  .q-enter{animation:qIn 0.35s var(--ease) both;}
  .q-enter-back{animation:qInBack 0.35s var(--ease) both;}
  @keyframes qIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  @keyframes qInBack{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
  .opt-card{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:border-color 0.18s,background 0.18s;text-align:left;width:100%;background:transparent;color:inherit;font-family:inherit;}
  .opt-card:hover{border-color:var(--accent);background:var(--accent-dim);}
  .opt-card.sel{border-color:var(--accent);background:var(--accent-dim);}
  .opt-radio{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;transition:all 0.18s;}
  .opt-card.sel .opt-radio{border-color:var(--accent);background:var(--accent);}
  .opt-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all 0.18s;color:#fff;font-size:11px;line-height:1;}
  .opt-card.sel .opt-check{border-color:var(--accent);background:var(--accent);}
  .field{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:var(--font-b);font-size:14px;padding:11px 14px;outline:none;transition:border-color 0.2s;}
  .field::placeholder{color:var(--text-dim);}
  .field:focus{border-color:var(--accent);}
  textarea.field{resize:vertical;min-height:90px;line-height:1.6;}
  .btn{padding:13px 28px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-family:var(--font-b);font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;}
  .btn:disabled{opacity:0.35;cursor:not-allowed;}
  .btn-ghost{padding:12px 20px;background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:7px;font-family:var(--font-b);font-size:13.5px;cursor:pointer;}
  .q-title{font-family:var(--font-d);font-size:clamp(24px,4.5vw,34px);color:var(--text-primary);margin-bottom:8px;}
  .q-sub{font-size:14px;color:var(--text-secondary);line-height:1.7;margin-bottom:26px;}
  .q-eyebrow{font-size:10px;font-weight:600;letter-spacing:0.16em;color:var(--text-secondary);text-transform:uppercase;margin-bottom:14px;}
  .q-bar{height:2px;background:var(--border);border-radius:2px;overflow:hidden;}
  .q-bar-fill{height:100%;background:var(--accent);border-radius:2px;transition:width 0.35s var(--ease);}
  @media (max-width:640px){ .grid-2{grid-template-columns:1fr !important;} }
`;

/** Injects the sheet once per document, however many forms mount. */
export function useIntakeCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("wfd-intake-css")) return;
  const el = document.createElement("style");
  el.id = "wfd-intake-css";
  el.textContent = INTAKE_CSS;
  document.head.appendChild(el);
}
