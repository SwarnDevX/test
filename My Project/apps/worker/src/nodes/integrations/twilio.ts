import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.twilio.sendSms",
  category: "INTEGRATION",
  label: "Twilio: Send SMS",
  description: "Send an SMS message via Twilio",
  icon: "Phone",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "message", label: "Message", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Twilio credential", type: "string", default: "" },
    { name: "to", label: "To phone number", type: "string", default: "{{input.phone}}" },
    { name: "from", label: "From phone number (Twilio)", type: "string", default: "" },
    { name: "body", label: "Message body", type: "string", default: "{{input.message}}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const accountSid = cred.accountSid ?? "";
    const authToken = cred.authToken ?? cred.apiKey ?? "";
    if (!accountSid || !authToken) throw new Error("Twilio credentials require accountSid and authToken");

    const to = String(ctx.resolveExpression(String(ctx.params.to ?? "")));
    const from = String(ctx.params.from ?? "");
    const body = String(ctx.resolveExpression(String(ctx.params.body ?? "")));

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Twilio API ${res.status}: ${await res.text()}`);
    const message = await res.json();
    return { message, sid: (message as { sid: string }).sid };
  },
});
