import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendUnsignedReminder, sendUnpaidReminder } from '@/lib/reminders'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PORTAL_BASE = 'https://wfd-dashboard.vercel.app'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { unsigned: 0, unpaid: 0, errors: 0 }

  // ── Scenario 1: submitted but contract not signed ─────────────────────────
  const { data: unsigned } = await supabase
    .from('intake_forms')
    .select('id, first_name, email, phone, package, package_price, portal_token, created_at, unsigned_reminders_sent')
    .eq('status', 'submitted')
    .lt('created_at', daysAgo(1))         // at least 1 day old
    .lt('unsigned_reminders_sent', 3)      // haven't sent all 3 yet
    .not('email', 'is', null)

  for (const intake of unsigned ?? []) {
    const age = daysSince(intake.created_at)
    const sent = intake.unsigned_reminders_sent as number
    const portalUrl = `${PORTAL_BASE}/portal/${intake.portal_token}`

    // Fire on day 1, 3, 7 — match the right reminder to the right window
    const shouldFire =
      (sent === 0 && age >= 1) ||
      (sent === 1 && age >= 3) ||
      (sent === 2 && age >= 7)

    if (!shouldFire) continue

    try {
      await sendUnsignedReminder({
        firstName: intake.first_name as string,
        email: intake.email as string,
        phone: intake.phone as string | null,
        pkg: intake.package as string,
        price: intake.package_price as number,
        portalUrl,
        reminderNumber: sent + 1,
        daysOld: age,
      })

      await supabase
        .from('intake_forms')
        .update({ unsigned_reminders_sent: sent + 1 })
        .eq('id', intake.id)

      results.unsigned++
    } catch (e) {
      console.error('Unsigned reminder failed:', e)
      results.errors++
    }
  }

  // ── Scenario 2: contract signed but deposit not paid ──────────────────────
  const { data: unpaid } = await supabase
    .from('intake_forms')
    .select('id, first_name, email, phone, package, package_price, portal_token, signed_at, unpaid_reminders_sent')
    .eq('status', 'signed')
    .eq('deposit_paid', false)
    .eq('full_paid', false)
    .lt('signed_at', daysAgo(1))
    .lt('unpaid_reminders_sent', 3)
    .not('email', 'is', null)
    .not('signed_at', 'is', null)

  for (const intake of unpaid ?? []) {
    const age = daysSince(intake.signed_at as string)
    const sent = intake.unpaid_reminders_sent as number
    const portalUrl = `${PORTAL_BASE}/portal/${intake.portal_token}`
    const payUrl = `${PORTAL_BASE}/portal/${intake.portal_token}/pay`

    const shouldFire =
      (sent === 0 && age >= 1) ||
      (sent === 1 && age >= 3) ||
      (sent === 2 && age >= 7)

    if (!shouldFire) continue

    try {
      await sendUnpaidReminder({
        firstName: intake.first_name as string,
        email: intake.email as string,
        phone: intake.phone as string | null,
        pkg: intake.package as string,
        price: intake.package_price as number,
        deposit: Math.round((intake.package_price as number) * 0.5),
        portalUrl,
        payUrl,
        reminderNumber: sent + 1,
        daysSinceSigned: age,
      })

      await supabase
        .from('intake_forms')
        .update({ unpaid_reminders_sent: sent + 1 })
        .eq('id', intake.id)

      results.unpaid++
    } catch (e) {
      console.error('Unpaid reminder failed:', e)
      results.errors++
    }
  }

  return NextResponse.json({ ...results, timestamp: new Date().toISOString() })
}
