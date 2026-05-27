"use client";

import { use, useState } from "react";
import { User, Bell, Shield, CreditCard, Users, Key, Webhook, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "general", label: "General", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "scheduled-jobs", label: "Scheduled Jobs", icon: Clock },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input
              defaultValue=""
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              defaultValue=""
              disabled
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm text-fg-muted cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4">Workspace</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Workspace name</label>
            <input
              defaultValue=""
              placeholder="My Workspace"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>
      </div>
      <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
        Save changes
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-1">Change password</h3>
        <p className="text-sm text-fg-muted mb-4">Update your account password.</p>
        <div className="space-y-3">
          <input type="password" placeholder="Current password" className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input type="password" placeholder="New password" className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">Update password</button>
        </div>
      </div>
      <div className="border-t border-border/60 pt-6">
        <h3 className="font-medium mb-1">Two-factor authentication</h3>
        <p className="text-sm text-fg-muted mb-4">Add an extra layer of security to your account.</p>
        <button className="px-4 py-2 border border-border/60 hover:bg-bg-surface-2 rounded-lg text-sm font-medium transition-colors">
          Enable 2FA
        </button>
      </div>
    </div>
  );
}

const SECTION_CONTENT: Record<string, React.ReactNode> = {
  general: <GeneralSettings />,
  security: <SecuritySettings />,
  notifications: <div className="text-sm text-fg-muted">Notification settings coming soon.</div>,
  team: <div className="text-sm text-fg-muted">Team management coming soon.</div>,
  "api-keys": <div className="text-sm text-fg-muted">API key management coming soon.</div>,
  webhooks: <div className="text-sm text-fg-muted">Webhook management coming soon.</div>,
  "scheduled-jobs": <div className="text-sm text-fg-muted">Scheduled jobs coming soon.</div>,
  billing: <div className="text-sm text-fg-muted">Billing settings coming soon.</div>,
};

export default function SettingsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="flex gap-6">
        <nav className="w-48 flex-shrink-0">
          <div className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`/settings/${id}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  section === id
                    ? "bg-bg-surface-3 text-fg font-medium"
                    : "text-fg-muted hover:bg-bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex-1 min-w-0 p-6 rounded-xl border border-border/60 bg-bg-surface-1">
          {SECTION_CONTENT[section] ?? (
            <div className="text-sm text-fg-muted">Section not found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
