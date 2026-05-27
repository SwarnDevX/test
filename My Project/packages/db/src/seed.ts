import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_WORKFLOWS = [
  {
    name: "Lead-Gen Chatbot",
    description: "Conversational lead capture with AI qualification and CRM sync",
    category: "Sales",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.chatMessage", position: { x: 100, y: 200 }, data: { label: "Chat Trigger", config: {} } },
        { id: "ai-1", type: "ai.chatCompletion", position: { x: 350, y: 200 }, data: { label: "Qualify Lead", config: { model: "gpt-4o", systemPrompt: "You are a friendly sales assistant. Qualify leads by asking for their name, company, budget, and timeline. Extract structured data." } } },
        { id: "logic-1", type: "logic.ifElse", position: { x: 600, y: 200 }, data: { label: "Qualified?", config: { condition: "{{ai-1.qualified}} === true" } } },
        { id: "integration-1", type: "integration.hubspot.createContact", position: { x: 850, y: 150 }, data: { label: "Add to HubSpot", config: {} } },
        { id: "integration-2", type: "integration.slack.sendMessage", position: { x: 850, y: 300 }, data: { label: "Notify Sales", config: { channel: "#leads" } } },
        { id: "output-1", type: "output.chatbotDeploy", position: { x: 1100, y: 200 }, data: { label: "Deploy Widget", config: {} } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "ai-1", type: "smoothstep" },
        { id: "e2", source: "ai-1", target: "logic-1", type: "smoothstep" },
        { id: "e3", source: "logic-1", target: "integration-1", sourceHandle: "true", type: "smoothstep" },
        { id: "e4", source: "logic-1", target: "integration-2", sourceHandle: "true", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "RAG over PDFs",
    description: "Upload PDFs to knowledge base and answer questions with cited sources",
    category: "AI",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.chatMessage", position: { x: 100, y: 200 }, data: { label: "User Question", config: {} } },
        { id: "ai-1", type: "ai.vectorSearch", position: { x: 350, y: 200 }, data: { label: "Search KB", config: { topK: 5 } } },
        { id: "ai-2", type: "ai.reranker", position: { x: 600, y: 200 }, data: { label: "Rerank Results", config: {} } },
        { id: "ai-3", type: "ai.chatCompletion", position: { x: 850, y: 200 }, data: { label: "Generate Answer", config: { model: "claude-3-5-sonnet-20241022", systemPrompt: "Answer based on context. Cite sources." } } },
        { id: "output-1", type: "output.chatbotDeploy", position: { x: 1100, y: 200 }, data: { label: "Chat Widget", config: {} } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "ai-1", type: "smoothstep" },
        { id: "e2", source: "ai-1", target: "ai-2", type: "smoothstep" },
        { id: "e3", source: "ai-2", target: "ai-3", type: "smoothstep" },
        { id: "e4", source: "ai-3", target: "output-1", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Daily News Digest to Slack",
    description: "Fetch top news, summarize with AI, send to Slack every morning",
    category: "Automation",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.schedule", position: { x: 100, y: 200 }, data: { label: "Daily 8am", config: { cron: "0 8 * * *" } } },
        { id: "data-1", type: "data.httpRequest", position: { x: 350, y: 200 }, data: { label: "Fetch News", config: { url: "https://newsapi.org/v2/top-headlines", method: "GET" } } },
        { id: "ai-1", type: "ai.chatCompletion", position: { x: 600, y: 200 }, data: { label: "Summarize", config: { model: "gpt-4o-mini", systemPrompt: "Summarize these news articles into 5 bullet points with emoji." } } },
        { id: "integration-1", type: "integration.slack.sendMessage", position: { x: 850, y: 200 }, data: { label: "Send to Slack", config: { channel: "#news-digest" } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "data-1", type: "smoothstep" },
        { id: "e2", source: "data-1", target: "ai-1", type: "smoothstep" },
        { id: "e3", source: "ai-1", target: "integration-1", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "GitHub Issue Triager",
    description: "Auto-label, assign priority, and notify team when issues are opened",
    category: "DevOps",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.webhook", position: { x: 100, y: 200 }, data: { label: "GitHub Webhook", config: { events: ["issues"] } } },
        { id: "ai-1", type: "ai.structuredOutput", position: { x: 350, y: 200 }, data: { label: "Classify Issue", config: { model: "gpt-4o", schema: { priority: "low|medium|high|critical", labels: ["bug", "feature", "docs", "question"], assignee: "string" } } } },
        { id: "integration-1", type: "integration.github.addLabels", position: { x: 600, y: 150 }, data: { label: "Add Labels", config: {} } },
        { id: "integration-2", type: "integration.github.assignIssue", position: { x: 600, y: 300 }, data: { label: "Assign Issue", config: {} } },
        { id: "integration-3", type: "integration.slack.sendMessage", position: { x: 850, y: 200 }, data: { label: "Notify Team", config: { channel: "#engineering" } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "ai-1", type: "smoothstep" },
        { id: "e2", source: "ai-1", target: "integration-1", type: "smoothstep" },
        { id: "e3", source: "ai-1", target: "integration-2", type: "smoothstep" },
        { id: "e4", source: "integration-1", target: "integration-3", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Shopify Order → CRM",
    description: "Sync new Shopify orders to HubSpot CRM and update customer profile",
    category: "E-commerce",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.webhook", position: { x: 100, y: 200 }, data: { label: "Order Created", config: { source: "shopify", events: ["orders/create"] } } },
        { id: "data-1", type: "data.httpRequest", position: { x: 350, y: 100 }, data: { label: "Get Customer", config: { url: "https://{{shop}}.myshopify.com/admin/api/2024-01/customers/{{customerId}}.json" } } },
        { id: "integration-1", type: "integration.hubspot.upsertContact", position: { x: 600, y: 100 }, data: { label: "Upsert Contact", config: {} } },
        { id: "integration-2", type: "integration.hubspot.createDeal", position: { x: 600, y: 250 }, data: { label: "Create Deal", config: {} } },
        { id: "integration-3", type: "integration.sendgrid.sendEmail", position: { x: 850, y: 200 }, data: { label: "Order Confirm", config: { templateId: "d-order-confirm" } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "data-1", type: "smoothstep" },
        { id: "e2", source: "trigger-1", target: "integration-2", type: "smoothstep" },
        { id: "e3", source: "data-1", target: "integration-1", type: "smoothstep" },
        { id: "e4", source: "integration-1", target: "integration-3", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Email Classifier & Router",
    description: "Read incoming emails, classify with AI, route to correct department",
    category: "Productivity",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.email", position: { x: 100, y: 200 }, data: { label: "New Email", config: {} } },
        { id: "ai-1", type: "ai.structuredOutput", position: { x: 350, y: 200 }, data: { label: "Classify Email", config: { model: "gpt-4o-mini", schema: { category: "billing|support|sales|other", urgency: "low|medium|high", summary: "string" } } } },
        { id: "logic-1", type: "logic.switch", position: { x: 600, y: 200 }, data: { label: "Route", config: { field: "{{ai-1.category}}" } } },
        { id: "integration-1", type: "integration.zendesk.createTicket", position: { x: 850, y: 100 }, data: { label: "Support Ticket", config: { department: "support" } } },
        { id: "integration-2", type: "integration.hubspot.createContact", position: { x: 850, y: 250 }, data: { label: "Sales Lead", config: {} } },
        { id: "integration-3", type: "integration.slack.sendMessage", position: { x: 850, y: 400 }, data: { label: "Billing Alert", config: { channel: "#billing" } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "ai-1", type: "smoothstep" },
        { id: "e2", source: "ai-1", target: "logic-1", type: "smoothstep" },
        { id: "e3", source: "logic-1", target: "integration-1", sourceHandle: "support", type: "smoothstep" },
        { id: "e4", source: "logic-1", target: "integration-2", sourceHandle: "sales", type: "smoothstep" },
        { id: "e5", source: "logic-1", target: "integration-3", sourceHandle: "billing", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Social Post Scheduler",
    description: "Generate and schedule social media posts across Twitter, LinkedIn, and Reddit",
    category: "Marketing",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.schedule", position: { x: 100, y: 200 }, data: { label: "Every Monday 9am", config: { cron: "0 9 * * 1" } } },
        { id: "data-1", type: "data.airtable", position: { x: 350, y: 200 }, data: { label: "Get Content Queue", config: { view: "Ready to Post" } } },
        { id: "ai-1", type: "ai.chatCompletion", position: { x: 600, y: 150 }, data: { label: "Write Tweet", config: { model: "gpt-4o", systemPrompt: "Write an engaging tweet under 280 chars with hashtags." } } },
        { id: "ai-2", type: "ai.chatCompletion", position: { x: 600, y: 300 }, data: { label: "Write LinkedIn", config: { model: "gpt-4o", systemPrompt: "Write a professional LinkedIn post with a strong hook." } } },
        { id: "integration-1", type: "integration.twitter.createTweet", position: { x: 850, y: 150 }, data: { label: "Post Tweet", config: {} } },
        { id: "integration-2", type: "integration.linkedin.createPost", position: { x: 850, y: 300 }, data: { label: "Post LinkedIn", config: {} } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "data-1", type: "smoothstep" },
        { id: "e2", source: "data-1", target: "ai-1", type: "smoothstep" },
        { id: "e3", source: "data-1", target: "ai-2", type: "smoothstep" },
        { id: "e4", source: "ai-1", target: "integration-1", type: "smoothstep" },
        { id: "e5", source: "ai-2", target: "integration-2", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Data Sync Pipeline",
    description: "Sync PostgreSQL table changes to Google Sheets and Airtable in real-time",
    category: "Data",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.databaseChange", position: { x: 100, y: 200 }, data: { label: "DB Change (CDC)", config: { table: "orders", events: ["INSERT", "UPDATE"] } } },
        { id: "logic-1", type: "logic.filter", position: { x: 350, y: 200 }, data: { label: "Filter High Value", config: { condition: "{{data.total}} > 1000" } } },
        { id: "data-1", type: "data.googleSheets", position: { x: 600, y: 150 }, data: { label: "Append Sheet", config: { action: "append", range: "Orders!A:Z" } } },
        { id: "data-2", type: "data.airtable", position: { x: 600, y: 300 }, data: { label: "Sync Airtable", config: { action: "upsert" } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "logic-1", type: "smoothstep" },
        { id: "e2", source: "logic-1", target: "data-1", type: "smoothstep" },
        { id: "e3", source: "logic-1", target: "data-2", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
  {
    name: "Onboarding Drip Sequence",
    description: "Automated 7-day email onboarding with personalized AI content",
    category: "Marketing",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.webhook", position: { x: 100, y: 200 }, data: { label: "New Signup", config: {} } },
        { id: "logic-1", type: "logic.setVariable", position: { x: 350, y: 200 }, data: { label: "Set Day Counter", config: { variable: "day", value: 0 } } },
        { id: "logic-2", type: "logic.loop", position: { x: 600, y: 200 }, data: { label: "Loop 7 Days", config: { type: "forN", n: 7 } } },
        { id: "ai-1", type: "ai.chatCompletion", position: { x: 850, y: 200 }, data: { label: "Personalize Email", config: { model: "gpt-4o" } } },
        { id: "integration-1", type: "integration.sendgrid.sendEmail", position: { x: 1100, y: 200 }, data: { label: "Send Email", config: {} } },
        { id: "logic-3", type: "logic.wait", position: { x: 1350, y: 200 }, data: { label: "Wait 24 Hours", config: { duration: 86400000 } } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "logic-1", type: "smoothstep" },
        { id: "e2", source: "logic-1", target: "logic-2", type: "smoothstep" },
        { id: "e3", source: "logic-2", target: "ai-1", type: "smoothstep" },
        { id: "e4", source: "ai-1", target: "integration-1", type: "smoothstep" },
        { id: "e5", source: "integration-1", target: "logic-3", type: "smoothstep" },
        { id: "e6", source: "logic-3", target: "logic-2", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.6 },
    },
  },
  {
    name: "Price Monitor & Alert",
    description: "Monitor competitor prices, detect changes, alert team and update pricing",
    category: "E-commerce",
    definition: {
      nodes: [
        { id: "trigger-1", type: "trigger.schedule", position: { x: 100, y: 200 }, data: { label: "Every 6 Hours", config: { cron: "0 */6 * * *" } } },
        { id: "data-1", type: "data.httpRequest", position: { x: 350, y: 200 }, data: { label: "Scrape Prices", config: { url: "{{env.COMPETITOR_URL}}", method: "GET" } } },
        { id: "code-1", type: "code.javascript", position: { x: 600, y: 200 }, data: { label: "Parse & Compare", config: { code: "const prices = JSON.parse(input.body);\nconst changes = prices.filter(p => Math.abs(p.price - p.lastPrice) / p.lastPrice > 0.05);\nreturn { changes, hasChanges: changes.length > 0 };" } } },
        { id: "logic-1", type: "logic.ifElse", position: { x: 850, y: 200 }, data: { label: "Price Changed?", config: { condition: "{{code-1.hasChanges}} === true" } } },
        { id: "integration-1", type: "integration.slack.sendMessage", position: { x: 1100, y: 150 }, data: { label: "Alert #pricing", config: { channel: "#pricing" } } },
        { id: "integration-2", type: "integration.googleSheets.append", position: { x: 1100, y: 300 }, data: { label: "Log to Sheet", config: {} } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "data-1", type: "smoothstep" },
        { id: "e2", source: "data-1", target: "code-1", type: "smoothstep" },
        { id: "e3", source: "code-1", target: "logic-1", type: "smoothstep" },
        { id: "e4", source: "logic-1", target: "integration-1", sourceHandle: "true", type: "smoothstep" },
        { id: "e5", source: "logic-1", target: "integration-2", sourceHandle: "true", type: "smoothstep" },
      ],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    },
  },
];

async function main() {
  console.warn("Seeding FlowForge database...");

  // Create seed workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "seed-workspace" },
    update: {},
    create: {
      name: "FlowForge Demo",
      slug: "seed-workspace",
      description: "Demo workspace with example workflows",
      plan: "FREE",
    },
  });

  console.warn(`Workspace: ${workspace.name} (${workspace.id})`);

  // Seed templates (global, not workspace-specific)
  for (const wf of SEED_WORKFLOWS) {
    const template = await prisma.template.upsert({
      where: {
        id: `seed-template-${wf.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: { definition: wf.definition },
      create: {
        id: `seed-template-${wf.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: wf.name,
        description: wf.description,
        category: wf.category,
        tags: [wf.category.toLowerCase()],
        definition: wf.definition,
        isPublic: true,
        isOfficial: true,
      },
    });
    console.warn(`  Template: ${template.name}`);
  }

  // Seed workflows in demo workspace
  for (const wf of SEED_WORKFLOWS) {
    const workflow = await prisma.workflow.upsert({
      where: {
        id: `seed-workflow-${wf.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: { definition: wf.definition },
      create: {
        id: `seed-workflow-${wf.name.toLowerCase().replace(/\s+/g, "-")}`,
        workspaceId: workspace.id,
        name: wf.name,
        description: wf.description,
        definition: wf.definition,
      },
    });

    // Create initial version
    await prisma.workflowVersion.upsert({
      where: {
        workflowId_version: { workflowId: workflow.id, version: 1 },
      },
      update: {},
      create: {
        workflowId: workflow.id,
        version: 1,
        definition: wf.definition,
        message: "Initial version",
      },
    });

    console.warn(`  Workflow: ${workflow.name}`);
  }

  console.warn("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
