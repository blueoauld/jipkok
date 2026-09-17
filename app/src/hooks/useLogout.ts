import { useMutation } from "@tanstack/react-query";

import type { AlertApi } from "@/hooks/useAlert";
import { api } from "@/lib/api";
import { releaseDevice } from "@/lib/push/notifications";

export function useLogout({ showApiError }: AlertApi) {
  const { mutate: logout, isPending: loggingOut } = useMutation({
    mutationFn: async () => {
      await releaseDevice();
      await api.auth.logout();
    },
    onError: showApiError,
  });

  return { logout, loggingOut };
}
