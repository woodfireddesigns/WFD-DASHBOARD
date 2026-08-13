import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Proposal",
  description: "Get a custom proposal from Wood Fired Designs in minutes. Select your services, see your deliverables, and lock in your scope — no back-and-forth required.",
};

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#1a1713" }}>
        {children}
      </body>
    </html>
  );
}
