import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CustomCursor } from "../components/CustomCursor";
import { supabase } from "../integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl tracking-widest spidey-gradient-text">404</h1>
        <h2 className="mt-4 font-display text-2xl tracking-widest">Lost in the Multiverse</h2>
        <p className="mt-2 text-sm text-muted-foreground">This reel doesn't exist. Swing back home.</p>
        <Link to="/" className="mt-6 inline-flex font-display tracking-wider uppercase px-6 py-3 bg-primary text-primary-foreground rounded-md hover:shadow-spidey transition">Go Home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl tracking-widest">Scene Cut</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong projecting this page.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="font-display uppercase tracking-wider px-5 py-2 bg-primary text-primary-foreground rounded-md">Try again</button>
          <a href="/" className="font-display uppercase tracking-wider px-5 py-2 border border-border rounded-md">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Spidey Cinema — Book Movie Tickets" },
      { name: "description", content: "Premium movie ticket booking with a cinematic, immersive experience. Now showing the biggest blockbusters." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "Spidey Cinema" },
      { property: "og:description", content: "Book your seats. Live the spectacle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
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
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CustomCursor />
      <Toaster theme="dark" position="top-center" richColors />
      <Outlet />
    </QueryClientProvider>
  );
}
