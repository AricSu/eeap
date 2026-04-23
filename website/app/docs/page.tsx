import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import browserCollections from 'collections/browser';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { useMDXComponents } from '../components/mdx';
import { baseOptions } from '../lib/layout.shared';
import { source } from '../lib/source';

export async function loadDocPage(slugs: string[]) {
  const page = source.getPage(slugs);

  if (!page) {
    throw new Response('Not found', { status: 404 });
  }

  return {
    path: page.path,
    pageTree: await source.serializePageTree(source.getPageTree()),
  };
}

export async function loader({ params }: { params: { '*': string | undefined } }) {
  const slugs = (params['*'] ?? '').split('/').filter((segment) => segment.length > 0);
  return loadDocPage(slugs);
}

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: Content }) {
    return (
      <DocsPage toc={toc}>
        <title>{frontmatter.title}</title>
        <meta name="description" content={frontmatter.description} />
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <Content components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

type DocPageData = Awaited<ReturnType<typeof loadDocPage>>;

export function DocPageView({
  loaderData,
}: {
  loaderData: DocPageData;
}) {
  const { pageTree } = useFumadocsLoader(loaderData);

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      {clientLoader.useContent(loaderData.path)}
    </DocsLayout>
  );
}

export default function Page({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return <DocPageView loaderData={loaderData} />;
}
