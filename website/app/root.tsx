import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { RootProvider } from 'fumadocs-ui/provider/react-router';
import './app.css';
import NotFound from './routes/not-found';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen">
        <RootProvider>{children}</RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = 'Unexpected Error';
  let details = 'The docs app hit an unexpected condition.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFound />;
    details = error.statusText;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-20">
      <section className="w-full rounded-2xl border bg-fd-card p-8 shadow-sm">
        <p className="text-sm text-fd-muted-foreground">EEAP docs</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{message}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-fd-muted-foreground">{details}</p>
        {stack ? (
          <pre className="mt-6 overflow-x-auto rounded-xl border bg-fd-secondary p-4 text-xs">
            <code>{stack}</code>
          </pre>
        ) : null}
      </section>
    </main>
  );
}
