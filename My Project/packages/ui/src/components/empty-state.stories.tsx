import type { Meta, StoryObj } from "@storybook/react";
import { GitBranch, Database, Key, Zap } from "lucide-react";
import { EmptyState } from "./empty-state.js";
import { Button } from "./button.js";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoWorkflows: Story = {
  render: () => (
    <EmptyState
      icon={<GitBranch className="h-8 w-8" />}
      title="No workflows yet"
      description="Create your first workflow to start automating tasks."
      action={<Button leftIcon={<span>+</span>}>New Workflow</Button>}
    />
  ),
};

export const NoResults: Story = {
  render: () => (
    <EmptyState
      icon={<Database className="h-8 w-8" />}
      title="No results found"
      description='Try adjusting your search query or removing filters.'
    />
  ),
};

export const NoCredentials: Story = {
  render: () => (
    <EmptyState
      icon={<Key className="h-8 w-8" />}
      title="No credentials stored"
      description="Add API keys and OAuth connections to use in your workflows. All secrets are encrypted at rest."
      action={<Button>Add Credential</Button>}
    />
  ),
};

export const NoExecutions: Story = {
  render: () => (
    <EmptyState
      icon={<Zap className="h-8 w-8" />}
      title="No executions yet"
      description="Run a workflow to see execution history, logs, and output data here."
    />
  ),
};
