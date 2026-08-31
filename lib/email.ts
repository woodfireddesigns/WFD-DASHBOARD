import { Resend } from "resend";

const TO = "michael@woodfireddesigns.com";
const FROM = "WFD Notifications <notifications@woodfireddesigns.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

const fmt = (n: number) => "$" + n.toLocaleString();

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#9A9088;font-size:13px;width:140px">${label}</td><td style="padding:6px 0;color:#F2EDE8;font-size:13px">${value}</td></tr>`;
}

function card(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#1a1713;font-family:'DM Sans',Arial,sans-serif">
      <div style="max-width:560px;margin:40px auto;background:#201e1a;border:1px solid #333028;border-radius:10px;overflow:hidden">
        <div style="background:#FF4D00;padding:16px 28px">
          <p style="margin:0;color:#fff;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Wood Fired Designs</p>
        </div>
        <div style="padding:28px">${content}</div>
        <div style="padding:16px 28px;border-top:1px solid #333028">
          <p style="margin:0;color:#5A5248;font-size:11px">woodfireddesigns.com · michael@woodfireddesigns.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendQuestionnaireStarted(data: {
  name: string;
  business: string;
  email: string;
  phone: string;
  package: string;
  total: number;
  portalToken: string;
  answers: Record<string, unknown>;
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;

  const answerRows: Record<string, string> = {
    "Business Type":       data.answers.business_type as string,
    "Primary Goal":        data.answers.primary_goal as string,
    "Target Customer":     data.answers.target_customer as string,
    "Differentiator":      data.answers.differentiator as string,
    "Competitors / Refs":  data.answers.competitor_refs as string,
    "Pages":               ((data.answers.pages as string[]) ?? []).join(", "),
    "Has Copy":            data.answers.has_copy as string,
    "Has Logo":            data.answers.has_logo as string,
    "Has Photos":          data.answers.has_photos as string,
    "Brand Words":         data.answers.brand_words as string,
    "Color Preferences":   data.answers.color_prefs as string,
    "Brand Assets":        data.answers.brand_assets as string,
    "Style Direction":     ((data.answers.style_direction as string[]) ?? []).join(", "),
    "Domain":              data.answers.has_domain as string,
    "Hosting":             data.answers.has_hosting as string,
    "Integrations":        ((data.answers.integrations as string[]) ?? []).join(", "),
    "Platform":            data.answers.platform_pref as string,
    "Launch Timeline":     data.answers.launch_timeline as string,
    "Hard Deadline":       data.answers.hard_deadline as string,
    "Additional Notes":    data.answers.extra_notes as string,
    "Brand Starting Point": data.answers.brand_origin as string,
    "Brand Deliverables":  ((data.answers.brand_deliverables as string[]) ?? []).join(", "),
    "Referral Source":     data.answers.referral_source as string,
  };

  const answerSection = Object.entries(answerRows)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => row(k, v))
    .join("");

  await getResend().emails.send({
    from: FROM,
    to: TO,
    subject: `New Intake — ${data.business || data.name} (${data.package})`,
    html: card(`
      <h2 style="margin:0 0 6px;color:#F2EDE8;font-size:22px;font-weight:700">New questionnaire submitted</h2>
      <p style="margin:0 0 24px;color:#9A9088;font-size:13px">A potential client just completed the intake form.</p>

      <p style="margin:0 0 10px;color:#FF4D00;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Contact</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${row("Name", data.name)}
        ${row("Business", data.business || "—")}
        ${row("Email", data.email)}
        ${row("Phone", data.phone || "—")}
        ${row("Package", data.package)}
        ${row("Total", fmt(data.total))}
      </table>

      <p style="margin:0 0 10px;color:#FF4D00;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Full Questionnaire Answers</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${answerSection}
      </table>

      <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#FF4D00;color:#fff;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600">
        View Client Portal →
      </a>
    `),
  });
}

export async function sendContractSigned(data: {
  name: string;
  business: string;
  email: string;
  package: string;
  total: number;
  signedName: string;
  portalToken: string;
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;
  const deposit = Math.round(data.total * 0.5);
  await getResend().emails.send({
    from: FROM,
    to: TO,
    subject: `Contract Signed — ${data.business || data.name}`,
    html: card(`
      <h2 style="margin:0 0 6px;color:#4ADE80;font-size:22px;font-weight:700">✓ Contract signed</h2>
      <p style="margin:0 0 24px;color:#9A9088;font-size:13px">A client has reviewed and signed their contract.</p>
      <table style="width:100%;border-collapse:collapse">
        ${row("Signed by", data.signedName)}
        ${row("Business", data.business || "—")}
        ${row("Email", data.email)}
        ${row("Package", data.package)}
        ${row("Total", fmt(data.total))}
        ${row("Deposit due", fmt(deposit))}
      </table>
      <div style="margin-top:24px">
        <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#FF4D00;color:#fff;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600">
          View Client Portal →
        </a>
      </div>
    `),
  });
}

export async function sendPaymentConfirmationToClient(data: {
  firstName: string;
  email: string;
  pkg: string;
  amount: number;
  paymentType: string;
  portalToken: string;
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;
  const isDeposit = data.paymentType === "deposit";

  await getResend().emails.send({
    from: "Michael @ Wood Fired Designs <michael@woodfireddesigns.com>",
    to: data.email,
    subject: `You're in — payment confirmed, ${data.firstName}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1a1713;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#201e1a;border:1px solid #333028;border-radius:10px;overflow:hidden">
    <div style="background:#4ADE80;padding:16px 28px">
      <p style="margin:0;color:#111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Wood Fired Designs — Payment Confirmed</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">You're officially in, ${data.firstName}.</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 24px">
        ${isDeposit
          ? `Your ${fmt(data.amount)} deposit is in. I'll be in touch within 1 business day to kick things off. The remaining balance is invoiced at delivery.`
          : `Your full payment of ${fmt(data.amount)} is received. Work starts soon — I'll be in touch within 1 business day.`
        }
      </p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 28px">
        Your client portal is where you'll track project progress, review deliverables, and stay in the loop. Bookmark it — you'll need it.
      </p>
      <a href="${portalUrl}" style="display:block;padding:14px 28px;background:#4ADE80;color:#111;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;text-align:center">
        Go to My Portal →
      </a>
      <p style="margin:20px 0 0;color:#5A5248;font-size:12px;text-align:center">
        ${portalUrl}
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #333028">
      <p style="margin:0;color:#5A5248;font-size:11px">woodfireddesigns.com · michael@woodfireddesigns.com</p>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendInvoicePaid(data: {
  name: string;
  business: string;
  email: string;
  amount: number;
  paymentType: string;
  portalToken: string;
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;
  await getResend().emails.send({
    from: FROM,
    to: TO,
    subject: `Payment Received — ${fmt(data.amount)} from ${data.business || data.name}`,
    html: card(`
      <h2 style="margin:0 0 6px;color:#4ADE80;font-size:22px;font-weight:700">💰 Payment received</h2>
      <p style="margin:0 0 24px;color:#9A9088;font-size:13px">A client has completed payment via Stripe.</p>
      <table style="width:100%;border-collapse:collapse">
        ${row("Client", data.name)}
        ${row("Business", data.business || "—")}
        ${row("Email", data.email)}
        ${row("Amount", fmt(data.amount))}
        ${row("Type", data.paymentType === "deposit" ? "50% Deposit" : "Full Payment (5% discount)")}
      </table>
      <div style="margin-top:24px">
        <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#FF4D00;color:#fff;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600">
          View Client Portal →
        </a>
      </div>
    `),
  });
}

/**
 * A new deal from the audit or retainer form.
 *
 * Deliberately separate from sendQuestionnaireStarted: those are signed-scope
 * submissions with a price attached, these are the top of the funnel. Folding
 * them together would have made every audit request look like a sale.
 */
export async function sendDealCaptured(data: {
  name: string;
  business: string;
  email: string;
  phone: string;
  source: string;
  headline: string;
  detail: Record<string, string>;
}) {
  const rows = Object.entries(data.detail)
    .filter(([, v]) => v && v.trim() !== "")
    .map(([k, v]) => row(k, v))
    .join("");

  const html = card(`
    <p style="margin:0 0 4px;color:#FF4D00;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">${data.source}</p>
    <h1 style="margin:0 0 6px;color:#F2EDE8;font-size:22px;font-weight:600">${data.name || "New enquiry"}</h1>
    <p style="margin:0 0 20px;color:#9A9088;font-size:14px">${data.headline}</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("Business", data.business || "—")}
      ${row("Email", data.email || "—")}
      ${row("Phone", data.phone || "—")}
      ${rows}
    </table>
    <p style="margin:22px 0 0;color:#5A5248;font-size:12px">It is already a card on your Pipeline board.</p>
  `);

  return getResend().emails.send({
    from: FROM,
    to: TO,
    subject: `${data.source} — ${data.business || data.name || "new enquiry"}`,
    html,
  });
}

/** Kickoff details arriving after signature — what unblocks the build. */
export async function sendKickoffReceived(data: {
  name: string;
  business: string;
  email: string;
  project: string;
  detail: Record<string, string>;
}) {
  const rows = Object.entries(data.detail)
    .filter(([, v]) => v && v.trim() !== "")
    .map(([k, v]) => row(k, v))
    .join("");

  const html = card(`
    <p style="margin:0 0 4px;color:#FF4D00;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Kickoff pack</p>
    <h1 style="margin:0 0 6px;color:#F2EDE8;font-size:22px;font-weight:600">${data.business || data.name}</h1>
    <p style="margin:0 0 20px;color:#9A9088;font-size:14px">${data.project}</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("From", `${data.name} · ${data.email}`)}
      ${rows}
    </table>
  `);

  return getResend().emails.send({
    from: FROM,
    to: TO,
    subject: `Kickoff pack — ${data.business || data.name}`,
    html,
  });
}
