import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.sendgrid.sendEmail",
  category: "INTEGRATION",
  label: "SendGrid: Send Email",
  description: "Send transactional email via SendGrid",
  icon: "Mail",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "SendGrid credential", type: "string", default: "" },
    { name: "to", label: "To (email or expression)", type: "string", default: "{{input.email}}" },
    { name: "from", label: "From email", type: "string", default: "noreply@example.com" },
    { name: "fromName", label: "From name", type: "string", default: "FlowForge" },
    { name: "subject", label: "Subject", type: "string", default: "{{input.subject}}" },
    { name: "htmlContent", label: "HTML Content", type: "string", default: "<p>{{input.body}}</p>" },
    { name: "textContent", label: "Plain text content", type: "string", default: "{{input.body}}" },
    { name: "templateId", label: "Template ID (optional)", type: "string", default: "" },
    { name: "dynamicTemplateData", label: "Template data (JSON)", type: "string", default: "{}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.apiKey ?? "";
    if (!apiKey) throw new Error("SendGrid API key is required");

    const to = String(ctx.resolveExpression(String(ctx.params.to ?? "")));
    const from = String(ctx.params.from ?? "noreply@example.com");
    const fromName = String(ctx.params.fromName ?? "FlowForge");
    const subject = String(ctx.resolveExpression(String(ctx.params.subject ?? "")));
    const htmlContent = String(ctx.resolveExpression(String(ctx.params.htmlContent ?? "")));
    const textContent = String(ctx.resolveExpression(String(ctx.params.textContent ?? "")));
    const templateId = String(ctx.params.templateId ?? "").trim();

    const body: Record<string, unknown> = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: fromName },
      subject,
    };

    if (templateId) {
      body.template_id = templateId;
      try {
        body.dynamic_template_data = JSON.parse(String(ctx.resolveExpression(String(ctx.params.dynamicTemplateData ?? "{}"))));
      } catch { /* empty */ }
    } else {
      body.content = [
        { type: "text/plain", value: textContent || "No text content" },
        { type: "text/html", value: htmlContent },
      ];
    }

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctx.signal,
    });

    if (!res.ok && res.status !== 202) {
      const err = await res.text();
      throw new Error(`SendGrid error ${res.status}: ${err}`);
    }

    return { result: { sent: true, to, subject, statusCode: res.status } };
  },
});
