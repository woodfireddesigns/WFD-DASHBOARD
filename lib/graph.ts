/**
 * Microsoft Graph API client for sending email from michael@woodfireddesigns.com.
 *
 * Uses the Client Credentials flow (app-only auth) with a registered Azure AD app.
 * This means no user login required — the app sends on behalf of the mailbox.
 *
 * Required env vars:
 *   MS_TENANT_ID      — Azure AD tenant ID (Directory ID)
 *   MS_CLIENT_ID      — App registration client ID
 *   MS_CLIENT_SECRET  — App registration client secret
 *   MS_SENDER_EMAIL   — The mailbox to send from (michael@woodfireddesigns.com)
 */

const TOKEN_URL = () =>
  `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`;

const GRAPH_SEND_URL = () =>
  `https://graph.microsoft.com/v1.0/users/${process.env.MS_SENDER_EMAIL}/sendMail`;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(TOKEN_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph token error: ${err}`);
  }

  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  body: string;
  trackingPixelUrl?: string;
}

export async function sendMail({ to, subject, body, trackingPixelUrl }: SendMailOptions) {
  const token = await getAccessToken();

  const pixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : "";

  // Convert plain-text URLs to clickable links before rendering
  const linkedBody = body
    .replace(/\n/g, "<br>")
    .replace(
      /(https?:\/\/[^\s<"]+)/g,
      '<a href="$1" style="color:#FF6B2B;text-decoration:none;font-weight:600">$1</a>'
    );
  const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">${linkedBody}${pixel}</div>`;

  const message = {
    message: {
      subject,
      body: { contentType: "HTML", content: htmlBody },
      toRecipients: [{ emailAddress: { address: to } }],
      from: {
        emailAddress: {
          name: "Michael Deschenes",
          address: process.env.MS_SENDER_EMAIL!,
        },
      },
    },
    saveToSentItems: true,
  };

  const res = await fetch(GRAPH_SEND_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph sendMail error ${res.status}: ${err}`);
  }
}
