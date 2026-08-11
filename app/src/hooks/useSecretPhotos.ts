import { useMutation, useQueryClient } from "@tanstack/react-query";

import { memberDetailKey } from "@/hooks/useMemberDetail";
import { api, isApiError, type MemberDetailResponse } from "@/lib/api";

const FORBIDDEN_CODE = "SECRET_PHOTO_002";

export function useSecretPhotos(
  memberId: number,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();

  const setGranted = (granted: boolean) =>
    queryClient.setQueryData<MemberDetailResponse>(
      memberDetailKey(memberId),
      (current) => current && { ...current, secretPhotoGrantedToMe: granted },
    );

  return useMutation({
    mutationFn: () => api.secretPhotos.urls(memberId),
    onSuccess: () => setGranted(true),
    onError: (error) => {
      if (isApiError(error) && error.code === FORBIDDEN_CODE) {
        setGranted(false);
      }

      onError(error);
    },
  });
}
