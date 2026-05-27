import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Tokens/Colors",
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj;

const TOKEN_GROUPS = [
  {
    label: "Backgrounds",
    tokens: [
      { name: "--bg-base", desc: "Canvas / page base" },
      { name: "--bg-surface-1", desc: "Card base" },
      { name: "--bg-surface-2", desc: "Elevated card" },
      { name: "--bg-surface-3", desc: "Tooltip / popover" },
      { name: "--bg-surface-4", desc: "Modal" },
      { name: "--bg-surface-5", desc: "Drawer" },
      { name: "--bg-surface-6", desc: "Topmost overlay" },
    ],
  },
  {
    label: "Foreground",
    tokens: [
      { name: "--fg", desc: "Primary text" },
      { name: "--fg-muted", desc: "Secondary / subdued text" },
    ],
  },
  {
    label: "Semantic",
    tokens: [
      { name: "--accent", desc: "Electric blue — primary brand" },
      { name: "--success", desc: "Green — completed / healthy" },
      { name: "--warning", desc: "Amber — degraded / pending" },
      { name: "--danger", desc: "Red — error / destructive" },
    ],
  },
  {
    label: "Border",
    tokens: [{ name: "--border", desc: "Default border" }],
  },
];

export const ColorTokenGrid: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      {TOKEN_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map(({ name, desc }) => (
              <div
                key={name}
                className="rounded-lg border border-[var(--border)] overflow-hidden"
              >
                <div
                  className="h-14"
                  style={{ background: `var(${name})` }}
                />
                <div className="p-2 bg-[var(--bg-surface-1)]">
                  <p className="font-mono text-[11px] text-[var(--fg)]">{name}</p>
                  <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const ElevationLadder: Story = {
  render: () => (
    <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-[var(--border)] w-72">
      {["--bg-base", "--bg-surface-1", "--bg-surface-2", "--bg-surface-3", "--bg-surface-4", "--bg-surface-5", "--bg-surface-6"].map((token, i) => (
        <div
          key={token}
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0"
          style={{ background: `var(${token})` }}
        >
          <span className="font-mono text-xs text-[var(--fg)]">{token}</span>
          <span className="text-xs text-[var(--fg-muted)]">elevation {i}</span>
        </div>
      ))}
    </div>
  ),
};
