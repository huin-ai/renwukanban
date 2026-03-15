import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import App from "./App.jsx";
import "./styles/app.css";

// ✅ 统一把 Query/Mutation 的错误用 toast 展示（面试加分点）
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => toast.error(err?.message || "请求失败")
  }),
  mutationCache: new MutationCache({
    onError: (err) => toast.error(err?.message || "操作失败")
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);