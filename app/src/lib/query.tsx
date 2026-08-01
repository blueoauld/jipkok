import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { isApiError } from "@/lib/api";

const RETRY_COUNT = 2;

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status < 500) {
          return false;
        }

        return failureCount < RETRY_COUNT;
      },
    },
    mutations: {
      retry: false,
    },
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient(config));

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
