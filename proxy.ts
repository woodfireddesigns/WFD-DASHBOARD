import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionIsValid } from "@/lib/session";

/**
 * Closes the internal dashboard to the public.
 *
 * Until app.woodfireddesigns.com was attached, Vercel SSO was this app's only
 * door. Deployment protection is set to all_except_custom_domains, so the custom
 * domain -- which clients must reach -- removed that door for every route,
 * including /clients, /invoices and /leads.
 *
 * So the app needs its own gate. Client-facing routes stay open; everything
 * else requires the session cookie.
 *
 * This is the page-level gate only. It does not protect the tables from a
 * direct PostgREST call with the anon key, which ships in the public bundle --
 * `roofing_leads` is anon-readable and `projects` is anon-writable. Those
 * policies need tightening separately; this stops the dashboard being browsable
 * by anyone with the URL.
 */

/**
 * Reachable without a session.
 *
 * Prefix rules, so `/portal` covers `/portal/<token>/pay`. Note what is NOT
 * here: `/proposal` on its own is the internal proposal builder, while
 * `/proposal/<id>` is the client's contract. A prefix rule for `/proposal`
 * would publish the builder, so the contract page is matched by shape below
 * instead.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  // Client-facing intake and quoting.
  "/onboard",
  "/quick",
  "/design",
  "/portal",
  "/for",
  // Called by the public contract and payment pages, which have no session.
  "/api/proposals/detail",
  "/api/proposals/sign",
  "/api/stripe/checkout",
  "/api/intake",
  "/api/direct-intake",
  "/api/il-questionnaire",
  // Stripe holds no session and signs its own requests; the route verifies.
  // Exempting by path rather than by header means an unsigned request gets a
  // 400 explaining itself instead of a redirect Stripe reports as a failure.
  "/api/webhooks/stripe",
  // The open-tracking pixel in cold email. Gating it breaks every open stat and
  // shows recipients a redirect.
  "/api/leads/track",
];

const CONTRACT_PAGE =
  /^\/proposal\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

export function isPublic(pathname: string): boolean {
  if (CONTRACT_PAGE.test(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // A script or cron carries a shared secret instead of a cookie -- the
  // wfd-contract CLI on /api/proposals, the reminder cron on /api/reminders.
  // Presence of the header is not authorisation; it only buys the request the
  // right to reach the route, which checks the secret properly. Redirecting
  // these to /login is how a CLI gets an HTML login page instead of an error.
  if (request.headers.get("authorization") !== null) {
    return NextResponse.next();
  }

  if (sessionIsValid(request.cookies.get(SESSION_COOKIE)?.value, Math.floor(Date.now() / 1000))) {
    return NextResponse.next();
  }

  // An unauthenticated API call should get a 401 it can read, not a redirect to
  // a login page it cannot render.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

/**
 * Static assets are excluded so the gate never sits in front of an icon or a
 * font, which would redirect them to /login and break the page it is protecting.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|favicon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
