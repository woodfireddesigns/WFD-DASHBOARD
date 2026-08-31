import type { NextConfig } from "next";

// /start used to redirect straight to /onboard, from when the website intake was
// the only form worth pointing at. It is now the router that picks between all
// of them, so the redirect has to go — it would shadow the page entirely.
const nextConfig: NextConfig = {};

export default nextConfig;
