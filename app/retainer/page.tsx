"use client";

import { IntakeForm, type Answers, type Question } from "@/components/intake/IntakeForm";

/**
 * Monthly retainer enquiry.
 *
 * The existing forms all scope a project with an end date. Nothing captured the
 * thing that actually pays every month — the Niam arrangement was booked by hand
 * and lived only in the invoice history. The tiers here are the real ones being
 * billed today, so a lead can self-select into a number that exists.
 */
const QUESTIONS: Question[] = [
  {
    id: "contact",
    type: "text_fields",
    question: "Let's talk about what runs every month.",
    subtext: "Retainers are for the work that never really finishes — the feed, the ads, the store. Four minutes.",
    required: true,
    fields: [
      { key: "first_name",    label: "First Name",    required: true },
      { key: "last_name",     label: "Last Name" },
      { key: "business_name", label: "Business Name", wide: true, required: true },
      { key: "email",         label: "Email Address", required: true, type: "email" },
      { key: "phone",         label: "Phone Number",  type: "tel" },
      { key: "website_url",   label: "Website or store URL", wide: true, type: "url" },
    ],
  },
  {
    id: "services",
    type: "multi_select",
    question: "What needs running?",
    subtext: "Pick everything. We'll tell you what's worth bundling.",
    required: true,
    options: [
      { value: "Social media content",  label: "Social media content",  subtext: "A standing weekly cadence — video and stills, written, made and scheduled" },
      { value: "Ad creative",           label: "Ad creative",           subtext: "A monthly pack of paid creative, built to be tested" },
      { value: "Store management",      label: "Store management",      subtext: "Shopify or Zoho — product pages, merchandising, seasonal updates" },
      { value: "Email + lifecycle",     label: "Email + lifecycle",     subtext: "Campaigns and flows, on your brand" },
      { value: "Ongoing design support",label: "Ongoing design support",subtext: "The steady drip of one-off pieces a growing brand needs" },
    ],
  },
  {
    id: "volume",
    type: "single_select",
    question: "How much content, realistically, per week?",
    subtext: "Be honest about what you can feed and approve, not what sounds ambitious.",
    showIf: (a: Answers) => (a.services as string[] ?? []).includes("Social media content"),
    required: true,
    options: [
      { value: "2–3 posts a week",  label: "2–3 posts a week",  subtext: "Enough to look alive" },
      { value: "5 posts a week",    label: "5 posts a week",    subtext: "Two videos, three stills — the standard cadence", badge: "Most common" },
      { value: "Daily",             label: "Daily",             subtext: "Every weekday, plus stories" },
      { value: "Not sure yet",      label: "Not sure yet",      subtext: "We'll recommend one" },
    ],
  },
  {
    id: "platform",
    type: "multi_select",
    question: "Where does it need to go?",
    showIf: (a: Answers) => {
      const s = (a.services as string[]) ?? [];
      return s.includes("Social media content") || s.includes("Ad creative");
    },
    options: [
      { value: "Instagram", label: "Instagram" },
      { value: "TikTok",    label: "TikTok" },
      { value: "Facebook",  label: "Facebook" },
      { value: "Pinterest", label: "Pinterest" },
      { value: "LinkedIn",  label: "LinkedIn" },
      { value: "YouTube",   label: "YouTube" },
    ],
  },
  {
    id: "assets",
    type: "single_select",
    question: "What are we working from?",
    subtext: "This is the single biggest thing that decides what a month costs.",
    required: true,
    options: [
      { value: "Full brand kit + product photography", label: "Full brand kit and product photography", subtext: "Everything's ready. We just make and ship." },
      { value: "Brand exists, photography is thin",    label: "Brand exists, photography is thin",      subtext: "We generate or shoot what's missing" },
      { value: "Some assets, nothing systematic",      label: "Some assets, nothing systematic",        subtext: "We'd tidy the system first" },
      { value: "Starting close to scratch",            label: "Starting close to scratch",              subtext: "Brand work comes first, then the retainer" },
    ],
  },
  {
    id: "budget",
    type: "single_select",
    question: "What's the monthly budget?",
    subtext: "Creative only — this doesn't include what you spend on ads.",
    required: true,
    options: [
      { value: "Under $1,000",       label: "Under $1,000",       subtext: "A single lane, tightly scoped" },
      { value: "$1,000 – $2,000",    label: "$1,000 – $2,000",    subtext: "One full lane — social, or ad creative" },
      { value: "$2,000 – $3,500",    label: "$2,000 – $3,500",    subtext: "Two lanes running together", badge: "Most common" },
      { value: "$3,500+",            label: "$3,500+",            subtext: "Everything, plus shoots and campaign work" },
      { value: "Tell me what it costs", label: "Tell me what it costs", subtext: "We'll scope it and put a number on it" },
    ],
  },
  {
    id: "start",
    type: "single_select",
    question: "When would you want this starting?",
    required: true,
    options: [
      { value: "This month",     label: "This month" },
      { value: "Next month",     label: "Next month" },
      { value: "Within a quarter",label: "Within a quarter" },
      { value: "Still deciding", label: "Still deciding" },
    ],
  },
  {
    id: "extra_notes",
    type: "textarea",
    question: "What's the thing you'd most want fixed in the first month?",
    subtext: "Optional, but it's usually the most useful answer on the form.",
    placeholder: "The feed has been dead since March. The ads all look different. Nobody's touched the product pages in a year…",
  },
];

export default function RetainerPage() {
  async function submit(answers: Answers) {
    const res = await fetch("/api/deal-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, kind: "retainer" }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error("Couldn't send that. Check your email address and try again.");
  }

  return (
    <IntakeForm
      storageKey="wfd_retainer_progress"
      eyebrow="Monthly Retainer"
      questions={QUESTIONS}
      onSubmit={submit}
      submitLabel="Send it"
      done={{
        title: "Got it.",
        body: (
          <>
            <p style={{ marginBottom: 14 }}>
              You&apos;ll get a scoped monthly proposal back within{" "}
              <strong style={{ color: "var(--text-primary)" }}>two business days</strong> — what runs
              each month, what it costs, and what we&apos;d need from you to make it work.
            </p>
            <p>Month to month. No twelve-month lock-in.</p>
          </>
        ),
      }}
    />
  );
}
