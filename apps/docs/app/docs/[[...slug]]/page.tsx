import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';

import { getMDXComponents } from '@/components/mdx';
import { source } from '@/lib/source';

export const dynamicParams = false;

export default async function Page({ params }: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await params;

  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>

      <DocsDescription>{page.data.description}</DocsDescription>

      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await params;

  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  return { title: page.data.title, description: page.data.description };
}
