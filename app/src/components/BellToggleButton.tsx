import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon, BellSlashIcon } from "phosphor-react-native";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MY_PROFILE_KEY } from "@/hooks/useMyProfile";
import { alertApiError, alertInfo } from "@/lib/alert";

export function BellToggleButton({
  enabled,
  update,
  onMessage,
  offMessage,
}: {
  enabled: boolean;
  update: (enabled: boolean) => Promise<void>;
  onMessage: string;
  offMessage: string;
}) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => update(!enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      alertInfo(enabled ? offMessage : onMessage);
    },
    onError: alertApiError,
  });

  return (
    <HeaderIconButton
      icon={enabled ? BellIcon : BellSlashIcon}
      onPress={toggle.isPending ? undefined : () => toggle.mutate()}
    />
  );
}
