import { nodeRegistry } from "@flowforge/nodes-sdk";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeFetch(path: string, apiKey: string, method = "GET", data?: Record<string, string>, signal?: AbortSignal) {
  const url = `${STRIPE_API}${path}`;
  const body = data ? new URLSearchParams(data).toString() : undefined;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal,
  });

  const json = await res.json() as { error?: { message: string } };
  if (json.error) throw new Error(`Stripe error: ${json.error.message}`);
  return json;
}

nodeRegistry.register({
  type: "integration.stripe.getCustomer",
  category: "INTEGRATION",
  label: "Stripe: Get Customer",
  description: "Retrieve a Stripe customer by ID or email",
  icon: "CreditCard",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "customer", label: "Customer", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Stripe credential", type: "string", default: "" },
    { name: "customerId", label: "Customer ID (or expression)", type: "string", default: "{{input.customerId}}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.secretKey ?? cred.apiKey ?? "";
    const customerId = String(ctx.resolveExpression(String(ctx.params.customerId ?? "")));
    const customer = await stripeFetch(`/customers/${customerId}`, apiKey, "GET", undefined, ctx.signal);
    return { customer };
  },
});

nodeRegistry.register({
  type: "integration.stripe.createPaymentIntent",
  category: "INTEGRATION",
  label: "Stripe: Create Payment Intent",
  description: "Create a Stripe payment intent",
  icon: "CreditCard",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "paymentIntent", label: "Payment Intent", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Stripe credential", type: "string", default: "" },
    { name: "amount", label: "Amount (cents)", type: "number", default: 1000 },
    { name: "currency", label: "Currency", type: "string", default: "usd" },
    { name: "customerId", label: "Customer ID (optional)", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.secretKey ?? cred.apiKey ?? "";

    const data: Record<string, string> = {
      amount: String(Number(ctx.params.amount ?? 1000)),
      currency: String(ctx.params.currency ?? "usd"),
    };
    if (ctx.params.customerId) data.customer = String(ctx.resolveExpression(String(ctx.params.customerId)));

    const paymentIntent = await stripeFetch("/payment_intents", apiKey, "POST", data, ctx.signal);
    return { paymentIntent };
  },
});

nodeRegistry.register({
  type: "integration.stripe.listInvoices",
  category: "INTEGRATION",
  label: "Stripe: List Invoices",
  description: "List Stripe invoices for a customer",
  icon: "CreditCard",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "invoices", label: "Invoices", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Stripe credential", type: "string", default: "" },
    { name: "customerId", label: "Customer ID", type: "string", default: "{{input.customerId}}" },
    { name: "limit", label: "Limit", type: "number", default: 10 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.secretKey ?? cred.apiKey ?? "";
    const customerId = String(ctx.resolveExpression(String(ctx.params.customerId ?? "")));
    const limit = Number(ctx.params.limit ?? 10);

    const result = await stripeFetch(`/invoices?customer=${customerId}&limit=${limit}`, apiKey, "GET", undefined, ctx.signal);
    return { invoices: (result as { data: unknown[] }).data, count: (result as { data: unknown[] }).data.length };
  },
});
