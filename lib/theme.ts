/**
 * The dashboard's one palette.
 *
 * The shell has always been dark -- #0F0D0B canvas, near-black sidebar -- but
 * most pages were written against a light canvas and never moved. Tasks,
 * Pipeline, Projects, Clients and Invoices were painting #1E1C1A body text and
 * #C8C0B8 labels straight onto the dark page, which is the reason half the type
 * could not be read. Nothing was broken; the two halves of the app simply
 * disagreed about what colour the paper was.
 *
 * So the colours live here, once, and the pages import them. Every value below
 * is checked against `surface` -- the colour text actually sits on -- and none
 * of the text tokens fall under 4.5:1.
 *
 *   text      #F2EDE8  15.6:1
 *   text2     #C4B8AE   9.2:1
 *   muted     #8F827A   4.8:1   <- the dimmest colour any *word* may use
 *   faint     #6B5F57   2.9:1   <- rules, dividers, disabled glyphs. Not words.
 */

import type { CSSProperties } from "react";

export const T = {
  // Surfaces, lightest-on-top order.
  bg: "#0F0D0B",
  surface: "#161310",
  raised: "#1E1A16",
  sunken: "#12100D",
  input: "#1E1A16",

  // Lines.
  border: "#2A241E",
  borderHover: "#3A322A",

  // Type.
  text: "#F2EDE8",
  text2: "#C4B8AE",
  muted: "#8F827A",
  faint: "#6B5F57",

  // Brand.
  brand: "#FF6B2B",
  brandDim: "#E85A1A",
  brandWash: "rgba(255,107,43,0.10)",
  brandEdge: "rgba(255,107,43,0.30)",

  // Semantic. Each one lightened from the old light-canvas value so it still
  // reads at 4.5:1 or better on `surface`.
  success: "#3FB86B",
  warning: "#E8A33D",
  danger: "#E2564A",
  info: "#5B9BD5",
  violet: "#A78BFA",

  // Fonts, so pages stop hand-typing the stacks.
  display: "Oswald, 'Arial Narrow', sans-serif",
  body: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** A translucent wash of a semantic colour, for pills and hover states. */
export const wash = (hex: string, alpha = 0.14) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// ── Recurring shapes ─────────────────────────────────────────────────────────

export const card: CSSProperties = {
  backgroundColor: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "12px 14px",
};

export const input: CSSProperties = {
  width: "100%",
  fontSize: 13,
  color: T.text,
  backgroundColor: T.input,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: "8px 12px",
  outline: "none",
  fontFamily: T.body,
};

export const label: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: T.muted,
  marginBottom: 4,
};

export const primaryButton: CSSProperties = {
  backgroundColor: T.brand,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: T.body,
};

export const ghostButton: CSSProperties = {
  backgroundColor: "transparent",
  color: T.text2,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 12.5,
  cursor: "pointer",
  fontFamily: T.body,
};

export const pill = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 10.5,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 99,
  backgroundColor: wash(color),
  color,
});

export const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(6,5,4,0.72)",
  backdropFilter: "blur(4px)",
};

export const modalBox: CSSProperties = {
  backgroundColor: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
  width: "100%",
  maxWidth: 460,
  margin: "0 16px",
  padding: 24,
  maxHeight: "90vh",
  overflowY: "auto",
};
