import { router } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";

export function useSessionGuard() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status]);
}
