import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon, BellSlashIcon } from "phosphor-react-native";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MY_PROFILE_KEY } from "@/hooks/useMyProfile";
import { alertApiError, alertInfo } from "@/lib/alert";
import type { MyProfileResponse } from "@/lib/api";

type ToggleField = "noteReceiveEnabled" | "feedNotificationEnabled";

export function BellToggleButton({
  enabled,
  field,
  update,
  onMessage,
  offMessage,
}: {
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

  const toggle = useMutation({
    mutationFn: () => update(!enabled),
    onMutate: () => {
      apply(!enabled);
      alertInfo(enabled ? offMessage : onMessage);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY }),
    onError: (error) => {
      apply(enabled);
      alertApiError(error);
    },
  });

  return (
    <HeaderIconButton
      icon={enabled ? BellIcon : BellSlashIcon}
      onPress={toggle.isPending ? undefined : () => toggle.mutate()}
    />
  );
}
