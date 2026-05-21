import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "michaeltdesh@gmail.com";
const FROM = "WFD Notifications <notifications@woodfireddesigns.com>";

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

  await resend.emails.send({
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
  await resend.emails.send({
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

export async function sendInvoicePaid(data: {
  name: string;
  business: string;
  email: string;
  amount: number;
  paymentType: string;
  portalToken: string;
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;
  await resend.emails.send({
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
