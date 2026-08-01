import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";

export function useSessionGuard() {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      queryClient.clear();
      router.replace("/login");
    }
  }, [queryClient, status]);
}
