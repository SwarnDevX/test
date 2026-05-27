import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress.js";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = { args: { value: 60 } };
export const Zero: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100 } };

export const ExecutionProgress: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {[
        { label: "Fetch data", value: 100 },
        { label: "Process chunks", value: 72 },
        { label: "Generate embeddings", value: 40 },
        { label: "Store to vector DB", value: 0 },
      ].map((step) => (
        <div key={step.label} className="space-y-1">
          <div className="flex justify-between text-xs text-[var(--fg-muted)]">
            <span>{step.label}</span>
            <span>{step.value}%</span>
          </div>
          <Progress value={step.value} />
        </div>
      ))}
    </div>
  ),
};
