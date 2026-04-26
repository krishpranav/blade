import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router, queryClient } from "./router";
import { WalletProvider } from "./lib/wallet";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <RouterProvider router={router} />
    </WalletProvider>
  </QueryClientProvider>,
);
