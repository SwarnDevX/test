import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./select.js";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Select>;

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "gemini-2-0-flash", label: "Gemini 2.0 Flash" },
];

export const Default: Story = {
  args: {
    options: MODEL_OPTIONS,
    placeholder: "Select model...",
  },
};

export const WithValue: Story = {
  args: {
    options: MODEL_OPTIONS,
    value: "claude-sonnet-4-6",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <label className="text-xs font-medium text-[var(--fg-muted)]">LLM Model</label>
      <Select options={MODEL_OPTIONS} placeholder="Choose a model..." />
      <p className="text-[11px] text-[var(--fg-muted)]">This model runs in the Chat Completion node.</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    options: MODEL_OPTIONS,
    value: "gpt-4o",
    disabled: true,
  },
};
