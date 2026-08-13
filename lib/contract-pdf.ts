import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Renders an executed Scope of Work & Service Agreement to a PDF.
 *
 * Deliberately built on pdf-lib rather than a headless-browser print: this runs
 * inside a Vercel serverless function, where spawning Chromium is both slow and
 * over the bundle limit. The tradeoff is that layout is hand-computed here
 * rather than inherited from the contract page's CSS, so if the on-page terms
 * change, TERMS below has to change with them.
 */

const PAGE_W = 612; // US Letter, points
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.09, 0.08, 0.07);
const DIM = rgb(0.42, 0.4, 0.38);
const ACCENT = rgb(1, 0.3, 0);
const RULE = rgb(0.85, 0.83, 0.8);

export interface ContractLineItem {
  label: string;
  price: number;
  turnaround?: string;
  description?: string;
  deliverables?: string[];
}

export interface ContractPdfInput {
  proposalId: string;
  clientName: string;
  company: string | null;
  email: string;
  lineItems: ContractLineItem[];
  total: number;
  depositAmount: number;
  depositLabel: string;
  signedName: string;
  signedAt: string;
  createdAt: string;
}

export const TERMS: [string, string][] = [
  ["Payment", "Payment is collected per phase. Each phase is invoiced and funded before that phase begins; no phase starts until the prior one is approved. Work outside the agreed scope is billed at $75/hr."],
  ["Revisions", "Each deliverable includes two rounds of revisions. Additional revision rounds are billed at $75/hr. Revisions must be submitted as a single consolidated set per round."],
  ["Timeline", "Project timelines begin on the date the first phase payment is received and project materials (brand assets, copy, product info) are submitted by the client. Delays in client deliverables extend the timeline accordingly."],
  ["Intellectual Property", "All source files and final deliverables transfer to the client upon receipt of final payment for the relevant phase. Wood Fired Designs retains the right to display the work in its portfolio."],
  ["Regulatory Copy", "Nutrition, ingredient and allergen panels are typeset to copy supplied and approved by the client or its co-packer. Wood Fired Designs does not author, verify or legally clear regulatory content."],
  ["Cancellation", "If the client cancels after a phase has begun, that phase's payment is non-refundable. Unstarted phases are refunded in full. If Wood Fired Designs cancels, a full refund of unstarted work is issued within 5 business days."],
  ["Governing Law", "This agreement is governed by the laws of the state in which Undrafted Designs LLC is registered."],
];

function money(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Greedy wrap. pdf-lib has no text layout engine, so this is on us. */
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

export async function renderContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Service Agreement — ${input.company ?? input.clientName}`);
  doc.setAuthor("Wood Fired Designs · Undrafted Designs LLC");
  doc.setSubject(`Executed ${new Date(input.signedAt).toISOString()}`);
  doc.setProducer("Wood Fired Designs");

  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  /** Reserve vertical space, breaking to a new page when it runs out. */
  function need(h: number) {
    if (y - h < MARGIN + 28) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function text(
    s: string,
    opts: { size?: number; font?: PDFFont; color?: typeof INK; x?: number; gap?: number } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.font ?? body;
    for (const line of wrap(s, font, size, CONTENT_W - ((opts.x ?? MARGIN) - MARGIN))) {
      need(size + 4);
      page.drawText(line, { x: opts.x ?? MARGIN, y, size, font, color: opts.color ?? INK });
      y -= size + 4;
    }
    y -= opts.gap ?? 0;
  }

  function rule(gap = 12) {
    need(gap + 2);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: RULE,
    });
    y -= gap;
  }

  function rightText(s: string, font: PDFFont, size: number, atY: number, color = INK) {
    page.drawText(s, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(s, size),
      y: atY,
      size,
      font,
      color,
    });
  }

  // ── Masthead ──────────────────────────────────────────────────────────────
  page.drawText("WOOD FIRED DESIGNS", { x: MARGIN, y, size: 9, font: bold, color: ACCENT });
  y -= 22;
  page.drawText("Scope of Work & Service Agreement", { x: MARGIN, y, size: 20, font: bold, color: INK });
  y -= 16;
  text(
    `Agreement #${input.proposalId.slice(0, 8).toUpperCase()}  ·  Issued ${longDate(input.createdAt)}`,
    { size: 9, color: DIM, gap: 6 }
  );
  rule();

  // ── Parties ───────────────────────────────────────────────────────────────
  const partyTop = y;
  page.drawText("SERVICE PROVIDER", { x: MARGIN, y, size: 7.5, font: bold, color: DIM });
  page.drawText("CLIENT", { x: MARGIN + CONTENT_W / 2, y, size: 7.5, font: bold, color: DIM });
  y -= 14;
  page.drawText("Wood Fired Designs", { x: MARGIN, y, size: 11, font: bold, color: INK });
  page.drawText(input.company ?? input.clientName, {
    x: MARGIN + CONTENT_W / 2, y, size: 11, font: bold, color: INK,
  });
  y -= 13;
  page.drawText("Undrafted Designs LLC", { x: MARGIN, y, size: 9, font: body, color: DIM });
  page.drawText(input.clientName, { x: MARGIN + CONTENT_W / 2, y, size: 9, font: body, color: DIM });
  y -= 12;
  page.drawText("michael@woodfireddesigns.com", { x: MARGIN, y, size: 9, font: body, color: DIM });
  page.drawText(input.email, { x: MARGIN + CONTENT_W / 2, y, size: 9, font: body, color: DIM });
  y = partyTop - 62;
  rule();

  // ── Scope ─────────────────────────────────────────────────────────────────
  text("SCOPE OF WORK — DELIVERABLES", { size: 7.5, font: bold, color: DIM, gap: 8 });

  for (const item of input.lineItems) {
    need(40);
    const rowY = y;
    page.drawText(item.label, { x: MARGIN, y: rowY, size: 11.5, font: bold, color: INK });
    rightText(money(item.price), bold, 12, rowY, ACCENT);
    y -= 15;

    if (item.turnaround) {
      text(item.turnaround, { size: 8.5, color: ACCENT, gap: 1 });
    }
    if (item.description) {
      text(item.description, { size: 9.5, color: DIM, gap: 2 });
    }
    for (const d of item.deliverables ?? []) {
      text(`•  ${d}`, { size: 9, color: DIM, x: MARGIN + 10 });
    }
    y -= 10;
  }

  rule();

  // ── Totals ────────────────────────────────────────────────────────────────
  need(56);
  const totalY = y;
  page.drawText("Total Investment", { x: MARGIN, y: totalY, size: 11, font: bold, color: INK });
  rightText(money(input.total), bold, 20, totalY - 5, ACCENT);
  y -= 30;
  page.drawText(`Due at signing — ${input.depositLabel}`, { x: MARGIN, y, size: 9.5, font: body, color: DIM });
  rightText(money(input.depositAmount), bold, 11, y, INK);
  y -= 16;
  const remainder = input.total - input.depositAmount;
  if (remainder > 0) {
    page.drawText("Remaining, invoiced per phase as each one begins", {
      x: MARGIN, y, size: 9.5, font: body, color: DIM,
    });
    rightText(money(remainder), body, 10, y, DIM);
    y -= 16;
  }
  y -= 4;
  rule();

  // ── Terms ─────────────────────────────────────────────────────────────────
  text("TERMS & CONDITIONS", { size: 7.5, font: bold, color: DIM, gap: 8 });
  for (const [title, copy] of TERMS) {
    need(30);
    text(title, { size: 10, font: bold, gap: 1 });
    text(copy, { size: 9, color: DIM, gap: 8 });
  }

  rule();

  // ── Execution block ───────────────────────────────────────────────────────
  need(120);
  text("ELECTRONIC SIGNATURE", { size: 7.5, font: bold, color: DIM, gap: 8 });
  text(
    "The client named below agreed to the scope of work and terms in this document by typed electronic signature. Under the E-SIGN Act this constitutes a legally binding signature.",
    { size: 9, color: DIM, gap: 14 }
  );

  need(70);
  const sigY = y;
  page.drawText("Signed by", { x: MARGIN, y: sigY, size: 7.5, font: bold, color: DIM });
  page.drawText("Date executed", { x: MARGIN + CONTENT_W / 2, y: sigY, size: 7.5, font: bold, color: DIM });
  y -= 20;
  page.drawText(input.signedName, { x: MARGIN, y, size: 15, font: bold, color: INK });
  page.drawText(longDate(input.signedAt), { x: MARGIN + CONTENT_W / 2, y, size: 11, font: body, color: INK });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + CONTENT_W / 2 - 20, y },
    thickness: 0.75,
    color: RULE,
  });
  page.drawLine({
    start: { x: MARGIN + CONTENT_W / 2, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.75,
    color: RULE,
  });
  y -= 16;
  text(
    `Executed ${new Date(input.signedAt).toISOString()} · Agreement #${input.proposalId.slice(0, 8).toUpperCase()}`,
    { size: 8, color: DIM }
  );

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `Wood Fired Designs · Undrafted Designs LLC · woodfireddesigns.com          Page ${i + 1} of ${pages.length}`,
      { x: MARGIN, y: MARGIN - 22, size: 7.5, font: body, color: DIM }
    );
  });

  return doc.save();
}
