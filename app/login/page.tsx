"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Sign-in for the internal dashboard.
 *
 * Signs in against Supabase rather than a shared password, because the session
 * is doing two jobs: it lets the proxy through, and it gives every dashboard
 * query the `authenticated` role that RLS actually grants access to.
 *
 * Styled inline with the forge palette, matching the other standalone pages in
 * this app, because this renders outside the dashboard shell.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // Supabase says "Invalid login credentials" for both a wrong password and
      // an unknown address, which is the right amount to say.
      setError(signInError.message);
      setPending(false);
      return;
    }

    // Replace, not push: the login page should not sit in the back stack.
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  const field: React.CSSProperties = {
    width: "100%",
    background: "#2a2723",
    border: "1px solid #333028",
    borderRadius: 6,
    color: "#F2EDE8",
    fontSize: 14,
    padding: "11px 14px",
    outline: "none",
    marginBottom: 12,
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "#5A5248",
    textTransform: "uppercase",
    marginBottom: 7,
  };

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
          fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
          fontSize: 28,
          fontWeight: 600,
          color: "#F2EDE8",
          textTransform: "uppercase",
          letterSpacing: "0.025em",
          margin: "0 0 6px",
        }}
      >
        Dashboard
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9088", margin: "0 0 24px", lineHeight: 1.6 }}>
        This part of the site is private. Client contract and payment links do not need this.
      </p>

      <label htmlFor="email" style={label}>
        Email
      </label>
      <input
        id="email"
        type="email"
        autoFocus
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={field}
      />

      <label htmlFor="password" style={label}>
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ ...field, marginBottom: 16 }}
      />

      <button
        type="submit"
        disabled={pending || email === "" || password === ""}
        style={{
          width: "100%",
          padding: 13,
          background: "#FF4D00",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14.5,
          fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending || email === "" || password === "" ? 0.4 : 1,
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
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* useSearchParams needs a Suspense boundary to prerender. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
