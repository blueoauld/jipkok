import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
  type QueryClientConfig,
  QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
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
    // 기본값 "online"은 연결이 없으면 뮤테이션을 실패시키지 않고 멈춰 세운다. 그러면
    // onError가 오지 않아 재전송과 롤백이 죽고, isPending으로 띄우는 전체 화면 오버레이가
    // 풀리지 않아 화면이 잠긴다. 조회만 연결 상태를 따르게 두고 뮤테이션은 즉시 실패시킨다.
    mutations: {
      retry: false,
      networkMode: "always",
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

function useNetworkOnline() {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      // 리스너는 상태가 바뀔 때만 불리므로 첫 상태는 따로 읽어 채운다.
      let received = false;
      const subscription = Network.addNetworkStateListener((state) => {
        received = true;
        setOnline(!!state.isConnected);
      });

      Network.getNetworkStateAsync()
        .then((state) => {
          if (!received) {
            setOnline(!!state.isConnected);
          }
        })
        .catch(() => undefined);

      return () => subscription.remove();
    });
  }, []);
}

// 세션 중에 정지되면 어느 요청이든 이 코드를 받는다. 내 프로필을 다시 읽으면
// AppLayout의 가드가 정지 화면으로 보낸다.
export function createQueryClient() {
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
  useNetworkOnline();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
