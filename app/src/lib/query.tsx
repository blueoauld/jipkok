import {
  focusManager,
  QueryClient,
  type QueryClientConfig,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";

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

function useAppStateFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );

    return () => subscription.remove();
  }, []);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient(config));

  useAppStateFocus();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
