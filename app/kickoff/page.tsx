"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IntakeForm, type Answers, type Question } from "@/components/intake/IntakeForm";

/**
 * The kickoff pack.
 *
 * This is the "onboard faster" form. Every question on it is something that has
 * actually held a build up: DNS access nobody could find, a logo that lived in
 * one person's downloads folder, three people sending contradictory feedback
 * with no one empowered to settle it. Asked once, on day one, in writing.
 *
 * Deliberately not a discovery form — by the time someone opens this, the scope
 * is signed. This is only ever about access and inputs.
 */
const QUESTIONS: Question[] = [
  {
    id: "contact",
    type: "text_fields",
    question: "Welcome aboard.",
    subtext: "Five minutes now saves both of us a fortnight of emails later. Everything here is something we need before the build can move.",
    required: true,
    fields: [
      { key: "first_name",    label: "First Name",    required: true },
      { key: "last_name",     label: "Last Name" },
      { key: "business_name", label: "Business Name", wide: true, required: true },
      { key: "email",         label: "Email Address", required: true, type: "email" },
      { key: "phone",         label: "Phone Number",  type: "tel" },
    ],
  },
  {
    id: "decision_maker",
    type: "textarea",
    question: "Who has the final word?",
    subtext: "Name and email. One person. Rounds get spent fast when three people send different notes and nobody can settle it.",
    required: true,
    placeholder: "Sam Okafor, sam@… — I'll gather everyone's notes and send one list.",
  },
  {
    id: "review_turnaround",
    type: "single_select",
    question: "How fast can you turn feedback around?",
    subtext: "The schedule is built on this number, so an honest one is worth more than a generous one.",
    required: true,
    options: [
      { value: "Same day",            label: "Same day" },
      { value: "1–2 business days",   label: "1–2 business days", badge: "Keeps the schedule" },
      { value: "About a week",        label: "About a week" },
      { value: "It varies — we're busy", label: "It varies — we're busy" },
    ],
  },
  {
    id: "hard_date",
    type: "textarea",
    question: "Is there a date this has to be live by?",
    subtext: "A trade show, a launch, a season. If there's a real one, say it now — it changes the build order.",
    placeholder: "PGA Show, January 20. Or: no hard date.",
  },
  {
    id: "brand_assets",
    type: "textarea",
    question: "Where do the brand files live?",
    subtext: "Logo files, fonts, guidelines, colour codes. A Drive or Dropbox link is perfect. If they don't exist, just say so — that's an answer.",
    required: true,
    placeholder: "https://drive.google.com/… — logo in AI and SVG, brand guide PDF. No font licences.",
  },
  {
    id: "photography",
    type: "single_select",
    question: "What photography do you have?",
    required: true,
    options: [
      { value: "Professional shots, ready to use",  label: "Professional shots, ready to use" },
      { value: "Some, but inconsistent",            label: "Some, but inconsistent" },
      { value: "Phone photos only",                 label: "Phone photos only" },
      { value: "None — we need images made",        label: "None — we need images made" },
    ],
  },
  {
    id: "copy_status",
    type: "single_select",
    question: "What about the words?",
    required: true,
    options: [
      { value: "Written and approved",        label: "Written and approved" },
      { value: "Drafted, needs a polish",     label: "Drafted, needs a polish" },
      { value: "We'll write it as we go",     label: "We'll write it as we go" },
      { value: "We'd like you to write it",   label: "We'd like you to write it", subtext: "Quoted separately if it isn't already in scope" },
    ],
  },
  {
    id: "domain_registrar",
    type: "textarea",
    question: "Who is the domain registered with?",
    subtext: "GoDaddy, Squarespace, Namecheap, Google. If you're not sure, say that — we can look it up.",
    required: true,
    placeholder: "Squarespace, renews in December. The card on file might be expired.",
  },
  {
    id: "domain_access",
    type: "single_select",
    question: "How do we get DNS access?",
    subtext: "This is the single most common thing that holds a launch up. Sorting it in week one costs nothing; sorting it in launch week costs days.",
    required: true,
    options: [
      { value: "We'll add you to the account",      label: "We'll add you to the account", badge: "Easiest" },
      { value: "We'll send you the login",          label: "We'll send you the login" },
      { value: "Send us the records and we'll paste them in", label: "Send us the records and we'll paste them in" },
      { value: "We don't know who controls it",     label: "We don't know who controls it", subtext: "Say so now — tracking it down takes time" },
    ],
  },
  {
    id: "platform_access",
    type: "multi_select",
    question: "Which accounts will we need to touch?",
    subtext: "Pick them all now so we can request access in one go rather than six.",
    options: [
      { value: "Shopify",           label: "Shopify" },
      { value: "Zoho Commerce",     label: "Zoho Commerce" },
      { value: "WordPress",         label: "WordPress" },
      { value: "Squarespace / Wix", label: "Squarespace / Wix" },
      { value: "Email platform",    label: "Email platform", subtext: "Klaviyo, Mailchimp, and the like" },
      { value: "Meta Business",     label: "Meta Business" },
      { value: "Google Business Profile", label: "Google Business Profile" },
      { value: "Nothing yet — all new", label: "Nothing yet — all new" },
    ],
  },
  {
    id: "existing_analytics",
    type: "single_select",
    question: "Is anything measuring traffic today?",
    subtext: "If there's history worth keeping, we'd rather not throw it away at cutover.",
    options: [
      { value: "Google Analytics",       label: "Google Analytics" },
      { value: "Platform analytics only",label: "Platform analytics only" },
      { value: "Nothing",                label: "Nothing" },
      { value: "Not sure",               label: "Not sure" },
    ],
  },
  {
    id: "must_haves",
    type: "textarea",
    question: "Anything that absolutely must not change?",
    subtext: "A tagline, a colour, a photo of the founder's dog. Better to know now than to find out in round two.",
    placeholder: "The green has to stay exactly as it is — it's on the trucks.",
  },
  {
    id: "extra_notes",
    type: "textarea",
    question: "Anything else we should know before we start?",
    placeholder: "Optional.",
  },
];

function KickoffInner() {
  const params = useSearchParams();
  const projectId = params.get("p") ?? "";

  async function submit(answers: Answers) {
    const res = await fetch("/api/kickoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, project_id: projectId }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error("Couldn't send that. Check your email address and try again.");
  }

  return (
    <IntakeForm
      storageKey="wfd_kickoff_progress"
      eyebrow="Project Kickoff"
      questions={QUESTIONS}
      onSubmit={submit}
      submitLabel="Send the pack"
      done={{
        title: "That's everything.",
        body: (
          <>
            <p style={{ marginBottom: 14 }}>
              This is now attached to your project. If anything you sent needs following up,
              Michael will come back on it — otherwise the next thing you hear will be work.
            </p>
            <p>Nothing else is needed from you right now.</p>
          </>
        ),
      }}
    />
  );
}

export default function KickoffPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#1a1713" }} />}>
      <KickoffInner />
    </Suspense>
  );
}
