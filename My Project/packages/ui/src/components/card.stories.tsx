import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card.js";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="p-6 w-72">
      <h3 className="font-semibold text-[var(--fg)] mb-1">Workflow Card</h3>
      <p className="text-sm text-[var(--fg-muted)]">A basic card component with surface-1 background.</p>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card className="p-6 w-72 bg-[var(--bg-surface-2)]">
      <h3 className="font-semibold text-[var(--fg)] mb-1">Elevated Card</h3>
      <p className="text-sm text-[var(--fg-muted)]">Uses surface-2 elevation token.</p>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-80 overflow-hidden">
      <div className="h-1.5 bg-[var(--accent)]" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-[var(--fg)]">Lead-Gen Chatbot</h3>
          <span className="text-xs text-[var(--fg-muted)]">2h ago</span>
        </div>
        <p className="text-sm text-[var(--fg-muted)] mb-4">Captures leads from website via AI chat widget.</p>
        <div className="flex gap-2 text-xs text-[var(--fg-muted)]">
          <span>12 nodes</span>
          <span>·</span>
          <span>47 runs</span>
        </div>
      </div>
    </Card>
  ),
};
