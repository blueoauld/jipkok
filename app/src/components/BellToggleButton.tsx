import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BellSlashIcon } from "phosphor-react-native/src/icons/BellSlash";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MY_PROFILE_KEY } from "@/hooks/useMyProfile";
import { apiErrorMessage } from "@/lib/alert";
import type { MyProfileResponse } from "@/lib/api";
import { showToast } from "@/lib/toast/store";

type ToggleField = "noteReceiveEnabled" | "feedNotificationEnabled";

export function BellToggleButton({
  label,
  enabled,
  field,
  update,
  onMessage,
  offMessage,
}: {
  label: string;
  enabled: boolean;
  field: ToggleField;
  update: (enabled: boolean) => Promise<void>;
  onMessage: string;
  offMessage: string;
}) {
  const queryClient = useQueryClient();

  const apply = (next: boolean) =>
    queryClient.setQueryData<MyProfileResponse>(
      MY_PROFILE_KEY,
      (current) => current && { ...current, [field]: next },
    );

  // onMutate가 enabled의 출처인 프로필 캐시를 뒤집으므로, 나중에 실행되는 onError가
  // prop을 읽으면 이미 뒤집힌 값이다. 목표 값을 변수로 넘겨 세 콜백을 prop에서 떼어낸다.
  const toggle = useMutation({
    mutationFn: (next: boolean) => update(next),
    onMutate: (next) => {
      apply(next);
      showToast("info", next ? onMessage : offMessage);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY }),
    onError: (error, next) => {
      apply(!next);
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      showToast("error", apiErrorMessage(error));
    },
  });

  return (
    <HeaderIconButton
      icon={enabled ? BellIcon : BellSlashIcon}
      label={label}
      onPress={toggle.isPending ? undefined : () => toggle.mutate(!enabled)}
    />
  );
}
