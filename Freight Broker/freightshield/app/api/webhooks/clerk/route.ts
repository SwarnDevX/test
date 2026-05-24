import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db, brokerages, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

type OrgCreatedData = {
  id: string
  name: string
  created_at: number
}

type UserCreatedData = {
  id: string
  email_addresses: Array<{ email_address: string; id: string }>
  primary_email_address_id: string
  first_name: string | null
  last_name: string | null
  organization_memberships?: Array<{ organization: { id: string } }>
}

type WebhookPayload = { type: string; data: Record<string, unknown> }

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Raw body required for Svix signature verification — do NOT use req.json()
  const rawBody = await req.text()
  const headerPayload = await headers()

  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const wh = new Webhook(webhookSecret)
  let payload: WebhookPayload

  try {
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookPayload
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (payload.type === 'organization.created') {
    const data = payload.data as OrgCreatedData
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    await db
      .insert(brokerages)
      .values({
        clerkOrgId: data.id,
        name: data.name,
        plan: 'trial',
        trialEndsAt,
      })
      .onConflictDoNothing({ target: brokerages.clerkOrgId })
  }

  if (payload.type === 'user.created') {
    const data = payload.data as UserCreatedData

    const primaryEmail =
      data.email_addresses.find((e) => e.id === data.primary_email_address_id)
        ?.email_address ??
      data.email_addresses[0]?.email_address ??
      ''

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

    const orgId = data.organization_memberships?.[0]?.organization.id
    let brokerageId: string | undefined

    if (orgId) {
      const brokerage = await db
        .select({ id: brokerages.id })
        .from(brokerages)
        .where(eq(brokerages.clerkOrgId, orgId))
        .limit(1)

      brokerageId = brokerage[0]?.id
    }

    await db
      .insert(users)
      .values({
        clerkUserId: data.id,
        brokerageId: brokerageId ?? null,
        email: primaryEmail,
        fullName,
        role: 'owner',
      })
      .onConflictDoNothing({ target: users.clerkUserId })
  }

  return new Response('OK', { status: 200 })
}
