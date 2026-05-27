import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./switch.js";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithLabel: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <div className="flex items-center gap-2">
        <Switch checked={on} onCheckedChange={setOn} id="mute" />
        <label htmlFor="mute" className="text-sm text-[var(--fg)] cursor-pointer select-none">
          {on ? "Node active" : "Node muted"}
        </label>
      </div>
    );
  },
};

export const SettingsRow: Story = {
  render: () => (
    <div className="w-80 space-y-0 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-1)] overflow-hidden">
      {[
        { label: "Email notifications", sub: "Receive alerts on execution failures" },
        { label: "Slack alerts", sub: "Post to #ops-alerts channel on error" },
        { label: "Audit logging", sub: "Log all credential access to audit trail" },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
          <div>
            <p className="text-sm font-medium text-[var(--fg)]">{item.label}</p>
            <p className="text-xs text-[var(--fg-muted)]">{item.sub}</p>
          </div>
          <Switch defaultChecked={i === 0} />
        </div>
      ))}
    </div>
  ),
};
