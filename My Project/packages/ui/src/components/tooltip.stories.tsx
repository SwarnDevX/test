import type { Meta, StoryObj } from "@storybook/react";
import { Info, Keyboard, HelpCircle } from "lucide-react";
import { Button } from "./button.js";
import { Tooltip } from "./tooltip.js";

const meta: Meta = {
  title: "UI/Tooltip",
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button variant="ghost" size="sm">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </Tooltip>
  ),
};

export const WithShortcut: Story = {
  render: () => (
    <Tooltip content={<span>Save workflow <kbd className="ml-1 rounded bg-[var(--bg-surface-3)] px-1 py-0.5 text-[10px] font-mono">⌘S</kbd></span>}>
      <Button size="sm">Save</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div className="flex gap-8 items-center justify-center h-32">
      <Tooltip content="Top tooltip" side="top"><Button variant="outline" size="sm">Top</Button></Tooltip>
      <Tooltip content="Right tooltip" side="right"><Button variant="outline" size="sm">Right</Button></Tooltip>
      <Tooltip content="Bottom tooltip" side="bottom"><Button variant="outline" size="sm">Bottom</Button></Tooltip>
      <Tooltip content="Left tooltip" side="left"><Button variant="outline" size="sm">Left</Button></Tooltip>
    </div>
  ),
};
