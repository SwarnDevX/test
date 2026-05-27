import type { Meta, StoryObj } from "@storybook/react";
import { Search, Mail, Eye } from "lucide-react";
import { Input } from "./input.js";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Type something..." },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <label className="text-xs font-medium text-[var(--fg-muted)]">Email</label>
      <Input type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithLeftIcon: Story = {
  render: () => (
    <div className="relative w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)]" />
      <Input className="pl-8" placeholder="Search workflows..." />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, value: "Cannot edit" },
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-64">
      <Input className="border-[var(--danger)]" placeholder="Invalid input" aria-invalid />
      <p className="text-xs text-[var(--danger)]">This field is required</p>
    </div>
  ),
};

export const Password: Story = {
  render: () => (
    <div className="relative w-64">
      <Input type="password" placeholder="Enter password" />
      <Eye className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)] cursor-pointer" />
    </div>
  ),
};
