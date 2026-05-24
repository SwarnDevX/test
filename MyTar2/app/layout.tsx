import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AdCreative AI — AI-Powered Ad Designer',
  description: 'Generate stunning static ad creatives with AI. Design, customize, and export in seconds.',
  keywords: ['ad creative', 'AI design', 'ad generator', 'marketing', 'SaaS'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111128',
              color: '#f0f0ff',
              border: '1px solid #1e1e40',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#111128' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#111128' } },
          }}
        />
      </body>
    </html>
  );
}
