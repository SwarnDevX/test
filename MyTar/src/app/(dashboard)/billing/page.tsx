'use client';

import { useSession } from 'next-auth/react';
import { Check, Zap } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    credits: 10,
    features: ['10 AI generations/month', 'All ad formats', 'PNG export', 'Basic editor', '1 brand kit'],
    planKey: 'FREE',
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    credits: 100,
    features: ['100 AI generations/month', 'All ad formats', 'PNG/JPG export', 'Full editor', '5 brand kits', 'Priority generation'],
    planKey: 'PRO',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: 'per month',
    credits: 500,
    features: ['500 AI generations/month', 'All ad formats', 'PNG/JPG export', 'Full editor', 'Unlimited brand kits', 'Priority support', 'API access'],
    planKey: 'BUSINESS',
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const currentPlan = (session?.user as any)?.plan ?? 'FREE';
  const credits = (session?.user as any)?.creditBalance ?? 0;

  async function subscribe(planKey: string) {
    if (planKey === 'FREE') return;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planKey }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your subscription and credits</p>
      </div>

      {/* Current usage */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Current Plan</div>
            <div className="text-xl font-bold flex items-center gap-2">
              {currentPlan}
              <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Credits Remaining</div>
            <div className="text-3xl font-bold text-blue-400">{credits}</div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold mb-4">Upgrade Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = plan.planKey === currentPlan;
          return (
            <div
              key={plan.planKey}
              className={`rounded-2xl p-6 border transition-colors ${
                plan.highlight
                  ? 'border-blue-500 bg-blue-600/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {plan.highlight && (
                <div className="flex items-center gap-1 text-xs text-blue-400 font-medium mb-3">
                  <Zap className="h-3 w-3" /> Most popular
                </div>
              )}
              <div className="text-lg font-bold">{plan.name}</div>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">/{plan.period}</span>
              </div>
              <div className="text-sm text-slate-400 mb-5">{plan.credits} credits/month</div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(plan.planKey)}
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-white/5 text-slate-400 cursor-default'
                    : plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border border-white/20 hover:bg-white/10 text-white'
                }`}
              >
                {isCurrent ? 'Current plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

