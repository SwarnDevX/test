import type { Meta, StoryObj } from "@storybook/react";
import { Download, Plus, Trash2 } from "lucide-react";

import { Button } from "./button.js";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Loading: Story = { args: { loading: true } };

export const WithLeftIcon: Story = {
  args: { leftIcon: <Plus className="h-3.5 w-3.5" />, children: "New Workflow" },
};

export const WithRightIcon: Story = {
  args: { rightIcon: <Download className="h-3.5 w-3.5" />, children: "Export" },
};

export const DangerWithIcon: Story = {
  args: { variant: "danger", leftIcon: <Trash2 className="h-3.5 w-3.5" />, children: "Delete" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="xs">XSmall</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XLarge</Button>
    </div>
  ),
};
