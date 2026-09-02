import { useMutation } from "@tanstack/react-query";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import { releaseDevice } from "@/lib/push/notifications";

export function useLogout({ showApiError }: RetroAlertApi) {
  const { mutate: logout, isPending: loggingOut } = useMutation({
    mutationFn: async () => {
      await releaseDevice();
      await api.auth.logout();
    },
    onError: showApiError,
  });

  return { logout, loggingOut };
}
