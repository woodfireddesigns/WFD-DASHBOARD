import { Resend } from 'resend'

const FROM = 'Michael @ Wood Fired Designs <michael@woodfireddesigns.com>'

const PACKAGE_LABELS: Record<string, string> = {
  pp_brand_foundation: 'Brand Foundation',
  pp_full_system:      'Full System',
  pp_pitch_deck:       'Pitch Deck',
  starter_site:        'Starter Site',
  full_website:        'Full Website',
  brand_and_site:      'Brand + Site',
}

function fmt(n: number) { return '$' + n.toLocaleString() }

function shell(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1a1713;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#201e1a;border:1px solid #333028;border-radius:10px;overflow:hidden">
    <div style="background:#FF4D00;padding:16px 28px">
      <p style="margin:0;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Wood Fired Designs</p>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="padding:16px 28px;border-top:1px solid #333028">
      <p style="margin:0;color:#5A5248;font-size:11px">woodfireddesigns.com · michael@woodfireddesigns.com</p>
    </div>
  </div>
</body></html>`
}

function btn(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;padding:13px 28px;background:#FF4D00;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-top:24px">${label} →</a>`
}

function notice() {
  return `<div style="margin-top:28px;padding:14px 18px;background:rgba(255,77,0,0.08);border:1px solid rgba(255,77,0,0.25);border-radius:8px">
    <p style="margin:0;color:#FF8555;font-size:12.5px;line-height:1.6"><strong>Work does not start</strong> until your contract is signed and your deposit is received. This protects your timeline and keeps your project slot reserved.</p>
  </div>`
}

// ── Scenario 1: unsigned contract ─────────────────────────────────────────

const UNSIGNED_COPY = [
  {
    subject: (name: string, pkg: string) => `Your ${pkg} contract is waiting, ${name}`,
    body: (name: string, pkg: string, price: number, url: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">Your <strong style="color:#F2EDE8">${pkg} — ${fmt(price)}</strong> contract is ready to review and sign. It takes about 2 minutes.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">Once it's signed we can lock in your start date and get things moving.</p>
      ${btn(url, 'Review & Sign Contract')}
      ${notice()}
    `,
    sms: (name: string, pkg: string, url: string) =>
      `Hey ${name}, your ${pkg} contract from Wood Fired Designs is ready to sign. Takes 2 min: ${url}`,
  },
  {
    subject: (name: string, pkg: string) => `Still holding your ${pkg} project slot`,
    body: (name: string, pkg: string, price: number, url: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">Just a follow-up — your <strong style="color:#F2EDE8">${pkg}</strong> contract still hasn't been signed.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">I'm holding your project slot, but I can only do that for so long. If you're ready, sign the contract below and we'll get started.</p>
      ${btn(url, 'Sign Your Contract')}
      ${notice()}
    `,
    sms: (name: string, pkg: string, url: string) =>
      `Hey ${name}, following up — your ${pkg} contract from WFD still needs a signature. Sign here: ${url}`,
  },
  {
    subject: (name: string, _pkg: string) => `Last reminder, ${name} — project slot expiring soon`,
    body: (name: string, pkg: string, price: number, url: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">This is my last reminder about your <strong style="color:#F2EDE8">${pkg} — ${fmt(price)}</strong> project.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">If I don't receive your signed contract in the next few days, I'll need to release your slot to someone else. If you're still interested, sign below now.</p>
      ${btn(url, 'Sign Before Your Slot Is Released')}
      ${notice()}
    `,
    sms: (name: string, pkg: string, url: string) =>
      `Hey ${name}, last reminder — your ${pkg} project slot at Wood Fired Designs is expiring. Sign your contract: ${url}`,
  },
]

// ── Scenario 2: signed but unpaid ─────────────────────────────────────────

const UNPAID_COPY = [
  {
    subject: (name: string) => `Your deposit locks in your start date, ${name}`,
    body: (name: string, pkg: string, deposit: number, payUrl: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">Your <strong style="color:#F2EDE8">${pkg}</strong> contract is signed — the only thing left is your deposit to officially lock in your start date.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">The deposit is <strong style="color:#F2EDE8">${fmt(deposit)}</strong> (50% of the total). The remaining balance is invoiced at delivery.</p>
      ${btn(payUrl, 'Pay Deposit & Lock In Your Start Date')}
      ${notice()}
    `,
    sms: (name: string, deposit: number, url: string) =>
      `Hey ${name}, your WFD contract is signed! Pay your ${fmt(deposit)} deposit to lock in your start date: ${url}`,
  },
  {
    subject: (name: string) => `Holding your spot — deposit still needed`,
    body: (name: string, pkg: string, deposit: number, payUrl: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">Your <strong style="color:#F2EDE8">${pkg}</strong> contract is signed but your deposit of <strong style="color:#F2EDE8">${fmt(deposit)}</strong> hasn't come in yet.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">I can't begin work until the deposit is received — this is what formally kicks the project off and reserves your spot in my schedule.</p>
      ${btn(payUrl, 'Pay Your Deposit Now')}
      ${notice()}
    `,
    sms: (name: string, deposit: number, url: string) =>
      `Hey ${name}, quick follow-up from WFD — your ${fmt(deposit)} deposit is still needed to start your project: ${url}`,
  },
  {
    subject: (name: string) => `Final notice — project slot being released, ${name}`,
    body: (name: string, pkg: string, deposit: number, payUrl: string) => `
      <h2 style="margin:0 0 8px;color:#F2EDE8;font-size:22px;font-weight:700">Hey ${name},</h2>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0 0 16px">This is my final notice regarding your <strong style="color:#F2EDE8">${pkg}</strong> project.</p>
      <p style="color:#9A9088;font-size:14px;line-height:1.7;margin:0">Your contract is signed but your <strong style="color:#F2EDE8">${fmt(deposit)} deposit</strong> hasn't arrived. If I don't receive it soon, I'll need to release your project slot. If you're ready to move forward, pay now.</p>
      ${btn(payUrl, 'Secure Your Project — Pay Deposit')}
      ${notice()}
    `,
    sms: (name: string, deposit: number, url: string) =>
      `Hey ${name}, last notice from WFD — your project slot is being released if deposit isn't received. Pay ${fmt(deposit)}: ${url}`,
  },
]

// ── SMS via Twilio (fires only if env vars are set) ───────────────────────

export async function sendSMS(to: string, body: string) {
  const sid  = process.env.TWILIO_ACCOUNT_SID
  const auth = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!sid || !auth || !from) return  // Twilio not configured — skip silently

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })
  if (!res.ok) console.error('Twilio SMS failed:', await res.text())
}

// ── Exported send functions ───────────────────────────────────────────────

export async function sendUnsignedReminder(data: {
  firstName: string
  email: string
  phone: string | null
  pkg: string
  price: number
  portalUrl: string
  reminderNumber: number
  daysOld: number
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const idx = Math.min(data.reminderNumber - 1, 2)
  const copy = UNSIGNED_COPY[idx]
  const label = PACKAGE_LABELS[data.pkg] ?? data.pkg

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: copy.subject(data.firstName, label),
    html: shell(copy.body(data.firstName, label, data.price, data.portalUrl)),
  })

  if (data.phone) {
    await sendSMS(data.phone, copy.sms(data.firstName, label, data.portalUrl))
  }
}

export async function sendUnpaidReminder(data: {
  firstName: string
  email: string
  phone: string | null
  pkg: string
  price: number
  deposit: number
  portalUrl: string
  payUrl: string
  reminderNumber: number
  daysSinceSigned: number
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const idx = Math.min(data.reminderNumber - 1, 2)
  const copy = UNPAID_COPY[idx]
  const label = PACKAGE_LABELS[data.pkg] ?? data.pkg

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: copy.subject(data.firstName),
    html: shell(copy.body(data.firstName, label, data.deposit, data.payUrl)),
  })

  if (data.phone) {
    await sendSMS(data.phone, copy.sms(data.firstName, data.deposit, data.payUrl))
  }
}
