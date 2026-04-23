import { Link } from 'react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '../lib/layout.shared';

export function meta() {
  return [{ title: 'EEAP | Not Found' }];
}

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border bg-fd-card p-8 shadow-sm md:p-10">
          <p className="text-sm text-fd-muted-foreground">404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-fd-muted-foreground">
            The static site could not resolve this route. Use the docs index or go back
            to the root document page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-lg border bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
              to="/docs"
            >
              Open docs
            </Link>
            <Link
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              to="/"
            >
              Return home
            </Link>
          </div>
        </section>
      </main>
    </HomeLayout>
  );
}
