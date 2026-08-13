// Session cookie for the internal dashboard.
//
// This app has no user accounts and needs none -- one operator, one password.
// What it does need is a cookie that cannot be forged, so the value carries its
// own expiry and an HMAC over that expiry.
//
// Deliberately not a JWT: there are no claims to carry, no third party to hand
// it to, and no algorithm negotiation worth the attack surface. It is a
// timestamp and a signature.
//
// Both the proxy and the login route import this. Proxy runs on the Node.js
// runtime in Next 16, so node:crypto is available in both.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "wfd_session";

/** Long enough not to be a nuisance, short enough that a stolen laptop ages out. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set, or is shorter than 16 characters. " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself leak timing.
  // A wrong length is simply wrong.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** `<expiry seconds>.<hmac>` */
export function issueSession(nowSeconds: number): string {
  const expiry = String(nowSeconds + SESSION_TTL_SECONDS);
  return `${expiry}.${sign(expiry)}`;
}

/**
 * Whether a cookie value is one we issued and has not expired.
 *
 * Returns false rather than throwing on anything malformed. A junk cookie is a
 * logged-out user, not a server error.
 */
export function sessionIsValid(value: string | undefined, nowSeconds: number): boolean {
  if (!value) return false;

  const separator = value.lastIndexOf(".");
  if (separator === -1) return false;

  const expiry = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt)) return false;

  // Expiry is checked before the HMAC so a flood of stale cookies costs a
  // comparison rather than a hash.
  if (nowSeconds >= expiresAt) return false;

  try {
    return constantTimeEquals(signature, sign(expiry));
  } catch {
    // SESSION_SECRET missing. Fail closed: no session is valid.
    return false;
  }
}

/**
 * Whether a submitted password matches, compared in constant time.
 *
 * With DASHBOARD_PASSWORD unset this returns false for every input, so a
 * misconfigured deploy locks the dashboard rather than opening it.
 */
export function passwordIsCorrect(submitted: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  return constantTimeEquals(submitted, expected);
}
