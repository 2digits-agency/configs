import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { RootProvider } from 'fumadocs-ui/provider/next';

import './global.css';

export const metadata: Metadata = {
  title: { default: '2digits Docs', template: '%s | 2digits Docs' },
  description: 'Shared configs, custom lint rules, and development tooling for 2digits projects.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
