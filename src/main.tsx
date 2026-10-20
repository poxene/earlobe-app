import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/App";
import "@/index.css";

//— the dev server is pinned to the loopback ip so the session cookie and the API origin match
if (window.location.hostname === "localhost") {
  const port = window.location.port || "5173";
  window.location.replace(
    `http://127.0.0.1:${port}${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("missing root");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
