import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
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
    console.error("Timely application error", error);
  }

  public render(): React.ReactNode {
    if (this.state.failed) {
      return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft"><p className="text-sm font-semibold text-blue-700">Timely</p><h1 className="mt-2 text-xl font-bold text-slate-900">Something needs a refresh</h1><p className="mt-2 text-sm text-slate-500">The workspace could not load safely.</p><button className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Reload workspace</button></section></main>;
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
