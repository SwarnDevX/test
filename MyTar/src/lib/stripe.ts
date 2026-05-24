import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const PLANS = {
  FREE: { credits: 10, price: 0, name: 'Free' },
  PRO: { credits: 100, price: 19, name: 'Pro', priceId: process.env.STRIPE_PRO_PRICE_ID },
  BUSINESS: { credits: 500, price: 49, name: 'Business', priceId: process.env.STRIPE_BUSINESS_PRICE_ID },
} as const;

export const CREDIT_COSTS = {
  BACKGROUND: 3,
  COPY: 1,
  LAYOUT: 1,
  EXPORT: 1,
} as const;

