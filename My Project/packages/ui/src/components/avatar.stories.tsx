import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar.js";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: "https://avatars.githubusercontent.com/u/1?v=4",
    alt: "GitHub user",
    fallback: "GH",
  },
};

export const WithFallback: Story = {
  args: { fallback: "SW", alt: "Swarnendu" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar fallback="XS" size="xs" />
      <Avatar fallback="SM" size="sm" />
      <Avatar fallback="MD" size="md" />
      <Avatar fallback="LG" size="lg" />
      <Avatar fallback="XL" size="xl" />
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar fallback="A" size="sm" className="ring-2 ring-[var(--bg-base)]" />
      <Avatar fallback="B" size="sm" className="ring-2 ring-[var(--bg-base)]" />
      <Avatar fallback="C" size="sm" className="ring-2 ring-[var(--bg-base)]" />
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-surface-3)] ring-2 ring-[var(--bg-base)] text-xs text-[var(--fg-muted)]">
        +4
      </div>
    </div>
  ),
};
