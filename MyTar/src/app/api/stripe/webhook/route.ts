import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata || {};

        if (userId && plan && plan in PLANS) {
          const planKey = plan as keyof typeof PLANS;
          const planConfig = PLANS[planKey];

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planKey,
              stripeSubscriptionId: session.subscription as string,
              creditBalance: { increment: planConfig.credits },
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription_details?.metadata?.userId) {
          // Monthly credit refresh
          const userId = invoice.subscription_details.metadata.userId;
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            const planConfig = PLANS[user.plan];
            await prisma.user.update({
              where: { id: userId },
              data: { creditBalance: planConfig.credits },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE', stripeSubscriptionId: null, creditBalance: 10 },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle plan changes
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
        if (user && subscription.status === 'active') {
          // Could update plan here based on price ID
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

