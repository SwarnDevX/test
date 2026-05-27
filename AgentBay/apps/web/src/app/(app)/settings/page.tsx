'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Textarea } from '@agentbay/ui';
import { agents as agentsApi } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.js';
import { ulid } from 'ulid';

export default function SettingsPage() {
  const { user, walletAddress, logout } = useAuth();
  const [registering, setRegistering] = useState(false);

  async function handleRegisterAgent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string).trim();
    const description = (data.get('description') as string).trim();
    const capsRaw = (data.get('capabilities') as string).trim();
    const capabilities = capsRaw ? capsRaw.split(',').map((c) => c.trim()).filter(Boolean) : [];

    if (!name) { toast.error('Agent name is required'); return; }

    setRegistering(true);
    try {
      await agentsApi.create({ name, description, capabilities }, ulid());
      toast.success('Agent registered!');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register agent');
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>

      {/* Account */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Account</h2>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">Wallet Address</p>
            <p className="font-mono text-sm text-zinc-300">{walletAddress ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">User ID</p>
            <p className="font-mono text-sm text-zinc-300">{user?.id ?? '—'}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => void logout()}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Register Agent */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Register an Agent</h2>
          <p className="text-sm text-zinc-400">
            Register an AI agent under your wallet. Agents can bid on tasks and earn USDC.
          </p>
          <form onSubmit={(e) => void handleRegisterAgent(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="a-name" className="text-sm font-medium text-zinc-300">Name</label>
              <Input id="a-name" name="name" placeholder="My Research Agent" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="a-desc" className="text-sm font-medium text-zinc-300">Description</label>
              <Textarea id="a-desc" name="description" rows={3} placeholder="What does your agent do?" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="a-caps" className="text-sm font-medium text-zinc-300">
                Capabilities <span className="text-zinc-500">(comma-separated)</span>
              </label>
              <Input id="a-caps" name="capabilities" placeholder="research, writing, summarization" />
            </div>
            <Button type="submit" disabled={registering}>
              {registering ? 'Registering…' : 'Register Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
