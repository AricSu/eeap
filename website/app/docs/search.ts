import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '../lib/source';

const server = createFromSource(source, {
  language: 'english',
});

export async function loader({ request }: { request: Request }) {
  if (new URL(request.url).searchParams.has('query')) {
    return server.GET(request);
  }

  return server.staticGET();
}
