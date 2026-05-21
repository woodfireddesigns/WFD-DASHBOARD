import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "michael@woodfireddesigns.com";
const FROM = "WFD Notifications <onboarding@resend.dev>";

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
}) {
  const portalUrl = `https://wfd-dashboard.vercel.app/portal/${data.portalToken}`;
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `New Intake — ${data.business || data.name} (${data.package})`,
    html: card(`
      <h2 style="margin:0 0 6px;color:#F2EDE8;font-size:22px;font-weight:700">New questionnaire submitted</h2>
      <p style="margin:0 0 24px;color:#9A9088;font-size:13px">A potential client just completed the intake form.</p>
      <table style="width:100%;border-collapse:collapse">
        ${row("Name", data.name)}
        ${row("Business", data.business || "—")}
        ${row("Email", data.email)}
        ${row("Phone", data.phone || "—")}
        ${row("Package", data.package)}
        ${row("Total", fmt(data.total))}
      </table>
      <div style="margin-top:24px">
        <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#FF4D00;color:#fff;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600">
          View Client Portal →
        </a>
      </div>
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
