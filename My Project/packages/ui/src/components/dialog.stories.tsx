import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./button.js";
import { Dialog } from "./dialog.js";
import { Input } from "./input.js";

const meta: Meta = {
  title: "UI/Dialog",
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Create Workflow">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--fg-muted)]">Name</label>
              <Input placeholder="My Workflow" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--fg-muted)]">Description</label>
              <Input placeholder="Optional description..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Create</Button>
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete Workflow</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Delete Workflow">
          <p className="text-sm text-[var(--fg-muted)] mb-6">
            This action is permanent. All executions, versions, and deployments for this workflow will be deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>Delete</Button>
          </div>
        </Dialog>
      </>
    );
  },
};
