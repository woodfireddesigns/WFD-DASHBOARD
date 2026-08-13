import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, issueSession, passwordIsCorrect } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchanges the dashboard password for a session cookie.
 *
 * One shared password, one operator. There is no user table and no account to
 * enumerate, so a wrong password gets one flat answer with no hint as to which
 * part was wrong.
 */
export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a password." }, { status: 400 });
  }

  if (!process.env.SESSION_SECRET || !process.env.DASHBOARD_PASSWORD) {
    // Fail closed and say so in the log, not to the caller.
    console.error("Login attempted with SESSION_SECRET or DASHBOARD_PASSWORD unset.");
    return NextResponse.json(
      { error: "Sign-in is not configured on this deployment." },
      { status: 503 }
    );
  }

  if (!passwordIsCorrect(password)) {
    return NextResponse.json({ error: "That password is not right." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: issueSession(Math.floor(Date.now() / 1000)),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
