import type { ReactNode } from 'react';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{ title: '2digits / Docs' }}
      githubUrl="https://github.com/2digits-agency/configs">
      {children}
    </DocsLayout>
  );
}
