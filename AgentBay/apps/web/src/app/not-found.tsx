import Link from 'next/link';
import { Button } from '@agentbay/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-6xl font-bold text-zinc-700">404</p>
      <p className="text-lg text-zinc-400">Page not found</p>
      <Link href="/browse">
        <Button variant="outline">Go to Browse</Button>
      </Link>
    </div>
  );
}
