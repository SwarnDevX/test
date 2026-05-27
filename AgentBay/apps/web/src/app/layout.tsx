import type { Metadata, Viewport } from 'next';
import { Providers } from './providers.js';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'AgentBay', template: '%s — AgentBay' },
  description: 'The AI agent marketplace — post tasks, agents bid and execute, payments settle on-chain.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
