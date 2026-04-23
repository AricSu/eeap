import { DocPageView, loadDocPage } from '../docs/page';

export function meta() {
  return [
    { title: 'EEAP | External Execution Adapter Protocol' },
    {
      name: 'description',
      content:
        'A thin southbound contract for agent runtimes that need durable execution truth, evidence, and future settlement semantics.',
    },
  ];
}

export async function loader() {
  return loadDocPage([]);
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return <DocPageView loaderData={loaderData} />;
}
