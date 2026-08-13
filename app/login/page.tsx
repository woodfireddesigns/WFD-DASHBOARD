"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * The sign-in gate for the internal dashboard.
 *
 * Uses the forge palette inline, matching the other standalone pages in this
 * app (portal, proposal) rather than the dashboard shell, because this page
 * renders before a session exists and outside that shell.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        setPending(false);
        return;
      }

      // Replace, not push: the login page should not sit in the back stack.
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 340 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "#FF4D00",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Wood Fired Designs
      </p>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#F2EDE8",
          margin: "0 0 6px",
          letterSpacing: "-0.02em",
        }}
      >
        Dashboard
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9088", margin: "0 0 24px", lineHeight: 1.6 }}>
        This part of the site is private. Client contract and payment links do not need this.
      </p>

      <label
        htmlFor="password"
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#5A5248",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          background: "#2a2723",
          border: "1px solid #333028",
          borderRadius: 6,
          color: "#F2EDE8",
          fontSize: 14,
          padding: "11px 14px",
          outline: "none",
          marginBottom: 14,
        }}
      />

      <button
        type="submit"
        disabled={pending || password === ""}
        style={{
          width: "100%",
          padding: 13,
          background: "#FF4D00",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14.5,
          fontWeight: 600,
          cursor: pending || password === "" ? "not-allowed" : "pointer",
          opacity: pending || password === "" ? 0.4 : 1,
        }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {error !== null ? (
        <p
          role="alert"
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#E87070",
            background: "rgba(184,50,50,0.12)",
            border: "1px solid #B83232",
            borderRadius: 6,
            padding: "10px 14px",
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1713",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* useSearchParams needs a Suspense boundary to prerender. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
