import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  public state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public componentDidCatch(error: Error): void {
    console.error("ClassSync application error", error);
  }

  public render(): React.ReactNode {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-cream p-6">
          <section className="max-w-md rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
            <p className="eyebrow">ClassSync</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Something needs a refresh</h1>
            <p className="mt-2 text-sm text-ink-muted">This page hit an unexpected problem. Reloading usually fixes it.</p>
            <button className="mt-6 rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-cream hover:bg-plum-dark" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <App />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
