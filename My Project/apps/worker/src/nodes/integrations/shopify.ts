import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.shopify.getOrder",
  category: "INTEGRATION",
  label: "Shopify: Get Order",
  description: "Retrieve a Shopify order by ID",
  icon: "ShoppingCart",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "order", label: "Order", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Shopify credential", type: "string", default: "" },
    { name: "shopDomain", label: "Shop domain (e.g. mystore.myshopify.com)", type: "string", default: "" },
    { name: "orderId", label: "Order ID (expression)", type: "string", default: "{{input.orderId}}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.adminToken ?? cred.apiKey ?? "";
    const shopDomain = String(ctx.params.shopDomain ?? "");
    const orderId = ctx.resolveExpression(String(ctx.params.orderId ?? ""));

    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/orders/${orderId}.json`, {
      headers: { "X-Shopify-Access-Token": token },
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Shopify API ${res.status}: ${await res.text()}`);
    const json = await res.json() as { order: unknown };
    return { order: json.order };
  },
});

nodeRegistry.register({
  type: "integration.shopify.listProducts",
  category: "INTEGRATION",
  label: "Shopify: List Products",
  description: "List Shopify products",
  icon: "ShoppingCart",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "products", label: "Products", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Shopify credential", type: "string", default: "" },
    { name: "shopDomain", label: "Shop domain", type: "string", default: "" },
    { name: "limit", label: "Limit", type: "number", default: 50 },
    { name: "status", label: "Status", type: "select", options: ["active", "draft", "archived", "any"], default: "active" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.adminToken ?? cred.apiKey ?? "";
    const shopDomain = String(ctx.params.shopDomain ?? "");
    const limit = Number(ctx.params.limit ?? 50);
    const status = String(ctx.params.status ?? "active");

    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/products.json?limit=${limit}&status=${status}`, {
      headers: { "X-Shopify-Access-Token": token },
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Shopify API ${res.status}: ${await res.text()}`);
    const json = await res.json() as { products: unknown[] };
    return { products: json.products, count: json.products.length };
  },
});
