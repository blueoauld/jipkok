import { useMutation } from "@tanstack/react-query";

import { alertApiError } from "@/lib/alert";
import { api } from "@/lib/api";

export function useSecretPhotos(memberId: number) {
  return useMutation({
    mutationFn: () => api.secretPhotos.urls(memberId),
    onError: alertApiError,
  });
}
