import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

// Public pages are static HTML files; short addresses such as /account map to them.
const STATIC_PAGES = new Set(["about", "account", "admin", "au-info", "blog", "brokers", "calculator", "cart", "confirm", "contact", "extension", "faq", "index", "legal", "marketplace", "order", "payment", "reset-password", "resources", "sell"]);

function NotFoundComponent() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const page = pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "").toLowerCase();
    if (STATIC_PAGES.has(page)) window.location.replace(`/${page}.html${search}${hash}`);
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/index.html"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
          <a href="/marketplace.html" className="ml-3 inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            Browse tradelines
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0b2a5b" },
      { title: "Tradelines Marketplace | Authorized User Tradelines" },
      {
        name: "description",
        content:
          "The smartest marketplace for authorized user tradelines. Guaranteed to post. Build credit and shop online in minutes.",
      },
      { property: "og:title", content: "Tradelines Marketplace | Authorized User Tradelines" },
      {
        property: "og:description",
        content:
          "The smartest marketplace for authorized user tradelines. Guaranteed to post. Build credit and shop online in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tradelines Marketplace | Authorized User Tradelines" },
      { name: "twitter:description", content: "The smartest marketplace for authorized user tradelines. Guaranteed to post. Build credit and shop online in minutes." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/assets/favicon-48x48.png?v=3" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/favicon-32x32.png?v=3" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/assets/favicon-16x16.png?v=3" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/apple-touch-icon.png" },
      { rel: "manifest", href: "/assets/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
