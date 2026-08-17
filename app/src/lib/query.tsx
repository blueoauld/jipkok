import {
  focusManager,
  MutationCache,
  QueryCache,
  QueryClient,
  type QueryClientConfig,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";

import { MY_PROFILE_KEY } from "@/hooks/useMyProfile";
import { isApiError } from "@/lib/api";

const RETRY_COUNT = 2;

const SERVICE_SUSPENDED_CODE = "SUSPENSION_003";

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

// 세션 중에 정지되면 어느 요청이든 이 코드를 받는다. 내 프로필을 다시 읽으면
// AppLayout의 가드가 정지 화면으로 보낸다.
function createQueryClient() {
  const onError = (error: unknown) => {
    if (isApiError(error) && error.code === SERVICE_SUSPENDED_CODE) {
      client.invalidateQueries({ queryKey: MY_PROFILE_KEY });
    }
  };
  const client = new QueryClient({
    ...config,
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  });

  return client;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  useAppStateFocus();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
