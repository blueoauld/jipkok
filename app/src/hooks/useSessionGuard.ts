import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { useUploadStore } from "@/lib/chat/upload-store";

export function useSessionGuard() {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      queryClient.clear();
      useUploadStore.getState().clear();
      router.replace("/login");
    }
  }, [queryClient, status]);
}
