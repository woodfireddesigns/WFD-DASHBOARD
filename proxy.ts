import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Closes the internal dashboard to the public.
 *
 * Until app.woodfireddesigns.com was attached, Vercel SSO was this app's only
 * door. Deployment protection is set to all_except_custom_domains, so the custom
 * domain -- which clients must reach -- removed that door for every route,
 * including /clients, /invoices and /pipeline.
 *
 * The session is a real Supabase session rather than a shared password, because
 * the dashboard also needs Postgres to know who is asking: RLS grants the
 * `authenticated` role access to the dashboard tables and grants `anon` nothing.
 * A password cookie would have gated the pages while leaving every query still
 * running as anon, which is the state that made adding a task silently do
 * nothing.
 */

/**
 * Reachable without a session.
 *
 * Prefix rules, so `/portal` covers `/portal/<token>/pay`. Note what is NOT
 * here: `/proposal` on its own is the internal proposal builder, while
 * `/proposal/<id>` is the client's contract. A prefix rule for `/proposal`
 * would publish the builder, so the contract page is matched by shape below.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  // Client-facing intake and quoting.
  // /start is the router that picks between the rest, so it has to be reachable
  // by anyone holding the link — it is the one address handed out publicly.
  "/start",
  "/onboard",
  "/quick",
  "/design",
  "/audit",
  "/retainer",
  // Sent to a client the day their contract comes back. They have no session
  // and never will; the link itself is the credential, same as /portal.
  "/kickoff",
  "/portal",
  "/for",
  // Called by the public contract and payment pages, which have no session.
  "/api/proposals/detail",
  "/api/proposals/sign",
  "/api/stripe/checkout",
  "/api/intake",
  "/api/direct-intake",
  "/api/il-questionnaire",
  "/api/deal-intake",
  "/api/kickoff",
  // Stripe holds no session and signs its own requests; the route verifies.
  // Exempting by path rather than by header means an unsigned request gets a
  // 400 explaining itself instead of a redirect Stripe reports as a failure.
  "/api/webhooks/stripe",
];

const CONTRACT_PAGE =
  /^\/proposal\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

export function isPublic(pathname: string): boolean {
  if (CONTRACT_PAGE.test(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next({ request });

  // A script or cron carries a shared secret instead of a session -- the
  // wfd-contract CLI on /api/proposals, the reminder cron on /api/reminders.
  // Presence of the header is not authorisation; it only buys the request the
  // right to reach the route, which checks the secret properly. Redirecting
  // these to /login is how a CLI gets an HTML login page instead of an error.
  if (request.headers.get("authorization") !== null) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser, not getSession: this revalidates the token with Supabase rather
  // than trusting a cookie the browser handed us.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user !== null) return response;

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
