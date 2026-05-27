import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.mailchimp.addContact",
  category: "INTEGRATION",
  label: "Mailchimp: Add Contact",
  description: "Add or update a contact in a Mailchimp audience",
  icon: "Mail",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "contact", label: "Contact", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Mailchimp credential", type: "string", default: "" },
    { name: "audienceId", label: "Audience/List ID", type: "string", default: "" },
    { name: "email", label: "Email (expression)", type: "string", default: "{{input.email}}" },
    { name: "firstName", label: "First name", type: "string", default: "{{input.firstName}}" },
    { name: "lastName", label: "Last name", type: "string", default: "{{input.lastName}}" },
    { name: "status", label: "Status", type: "select", options: ["subscribed", "unsubscribed", "pending"], default: "subscribed" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.apiKey ?? "";
    const dataCenter = apiKey.split("-")[1] ?? "us1";
    const audienceId = String(ctx.params.audienceId ?? "");
    const email = String(ctx.resolveExpression(String(ctx.params.email ?? "")));

    const md5 = await crypto.subtle.digest("MD5", new TextEncoder().encode(email.toLowerCase()));
    const emailHash = Array.from(new Uint8Array(md5)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const body = {
      email_address: email,
      status_if_new: String(ctx.params.status ?? "subscribed"),
      status: String(ctx.params.status ?? "subscribed"),
      merge_fields: {
        FNAME: ctx.resolveExpression(String(ctx.params.firstName ?? "")),
        LNAME: ctx.resolveExpression(String(ctx.params.lastName ?? "")),
      },
    };

    const res = await fetch(
      `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: ctx.signal,
      },
    );

    if (!res.ok) throw new Error(`Mailchimp API ${res.status}: ${await res.text()}`);
    const contact = await res.json();
    return { contact, id: (contact as { id: string }).id };
  },
});
