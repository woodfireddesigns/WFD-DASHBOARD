"use client";

import { IntakeForm, type Answers, type Question } from "@/components/intake/IntakeForm";

/**
 * The free audit.
 *
 * The shortest possible ask, because this is the top of the funnel and its only
 * job is to start a conversation with someone who has not decided to buy
 * anything. Five steps, one required field beyond contact. Everything specific
 * enough to price gets asked later, on /design or /onboard.
 */
const QUESTIONS: Question[] = [
  {
    id: "contact",
    type: "text_fields",
    question: "Let's take a look.",
    subtext: "A real audit, written by hand, back inside two business days. No pitch deck, no call required.",
    required: true,
    fields: [
      { key: "first_name",    label: "First Name",    required: true },
      { key: "last_name",     label: "Last Name" },
      { key: "business_name", label: "Business Name", wide: true },
      { key: "email",         label: "Email Address", required: true, type: "email" },
      { key: "phone",         label: "Phone Number",  type: "tel" },
      { key: "website_url",   label: "Website",       wide: true, placeholder: "yourbusiness.com — or tell us you don't have one yet", type: "url" },
    ],
  },
  {
    id: "focus",
    type: "multi_select",
    question: "What should we look hardest at?",
    subtext: "Pick everything that applies.",
    required: true,
    options: [
      { value: "The website",        label: "The website",        subtext: "Design, speed, structure, whether it converts" },
      { value: "The brand",          label: "The brand",          subtext: "Logo, colours, type, whether it holds together" },
      { value: "Packaging",          label: "Packaging",          subtext: "How the product reads on a shelf" },
      { value: "Product photography",label: "Product photography",subtext: "Whether the images sell the thing" },
      { value: "Social presence",    label: "Social presence",    subtext: "Whether the feed looks like a real company" },
    ],
  },
  {
    id: "biggest_problem",
    type: "single_select",
    question: "What's actually going wrong?",
    subtext: "The honest answer is more useful than the polite one.",
    required: true,
    options: [
      { value: "Not enough people find us",            label: "Not enough people find us" },
      { value: "People find us but don't buy",          label: "People find us but don't buy" },
      { value: "We look smaller than we are",           label: "We look smaller than we are" },
      { value: "It's inconsistent — nothing matches",   label: "It's inconsistent — nothing matches" },
      { value: "We're launching and starting from zero",label: "We're launching and starting from zero" },
      { value: "Honestly not sure — that's why I'm here", label: "Honestly not sure — that's why I'm here" },
    ],
  },
  {
    id: "timeline",
    type: "single_select",
    question: "If we found something worth fixing, when would you want it fixed?",
    subtext: "No wrong answer. It just tells us how to write this.",
    options: [
      { value: "Immediately — it's costing us now", label: "Immediately — it's costing us now" },
      { value: "Next month or two",                  label: "Next month or two" },
      { value: "Sometime this year",                 label: "Sometime this year" },
      { value: "Just gathering information",         label: "Just gathering information" },
    ],
  },
  {
    id: "extra_notes",
    type: "textarea",
    question: "Anything you already know is broken?",
    subtext: "Optional. Saves us finding what you could have just told us.",
    placeholder: "The mobile menu is a mess, the logo was made in Canva in 2019, nobody can find the contact page…",
  },
];

export default function AuditPage() {
  async function submit(answers: Answers) {
    const res = await fetch("/api/deal-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, kind: "audit", services: answers.focus }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error("Couldn't send that. Check your email address and try again.");
  }

  return (
    <IntakeForm
      storageKey="wfd_audit_progress"
      eyebrow="Free Audit"
      questions={QUESTIONS}
      onSubmit={submit}
      submitLabel="Send it"
      done={{
        title: "We're on it.",
        body: (
          <>
            <p style={{ marginBottom: 14 }}>
              Michael reads every one of these himself. You&apos;ll get a written audit back within{" "}
              <strong style={{ color: "var(--text-primary)" }}>two business days</strong> — specific
              things, in priority order, with what each one is worth fixing.
            </p>
            <p>No obligation attached to it. If it&apos;s useful, we can talk.</p>
          </>
        ),
      }}
    />
  );
}
