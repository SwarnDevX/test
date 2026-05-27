import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./tabs.js";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Tabs>;

const items = [
  { value: "overview", label: "Overview", content: <p className="text-sm text-[var(--fg-muted)] pt-2">Overview content goes here.</p> },
  { value: "executions", label: "Executions", content: <p className="text-sm text-[var(--fg-muted)] pt-2">Execution history goes here.</p> },
  { value: "settings", label: "Settings", content: <p className="text-sm text-[var(--fg-muted)] pt-2">Settings panel goes here.</p> },
];

export const Default: Story = {
  args: { items, defaultValue: "overview" },
};

export const WithBadge: Story = {
  render: () => (
    <Tabs
      defaultValue="overview"
      items={[
        { value: "overview", label: "Overview", content: <p className="text-sm pt-2 text-[var(--fg-muted)]">Overview</p> },
        {
          value: "executions",
          label: (
            <span className="flex items-center gap-1.5">
              Executions
              <span className="rounded-full bg-[var(--bg-surface-3)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-muted)]">
                47
              </span>
            </span>
          ),
          content: <p className="text-sm pt-2 text-[var(--fg-muted)]">Execution logs</p>,
        },
      ]}
    />
  ),
};
