import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import {
  readContactNumbers,
  requestContactsPermission,
} from "@/lib/contact-block/contacts";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

export const CONTACT_BLOCK_COUNT_KEY = ["contact-blocks", "count"] as const;

const NOTICE = i18n.t("contactBlock.notice");
const TURN_ON_LABEL = i18n.t("contactBlock.turnOn");
const PERMISSION_DENIED_MESSAGE = i18n.t("contactBlock.permissionDenied");
const DISABLED_MESSAGE = i18n.t("contactBlock.disabled");

// 켜짐 여부는 기기에 두지 않고 서버의 차단 번호 수로 본다. 같은 기기에서 다른 계정으로
// 들어와도 남의 설정을 이어받지 않고, 다른 기기에서도 같은 상태가 보인다.
export function useContactBlockToggle({
  show,
  showApiError,
  confirm,
}: RetroAlertApi) {
  const queryClient = useQueryClient();
  const { data: count } = useQuery({
    queryKey: CONTACT_BLOCK_COUNT_KEY,
    queryFn: api.contactBlocks.count,
  });
  const enabled = (count ?? 0) > 0;

  const turnOn = useMutation({
    mutationFn: async () => {
      if (!(await requestContactsPermission())) {
        return null;
      }

      const numbers = await readContactNumbers();
      await api.contactBlocks.replace(numbers);

      return numbers.length;
    },
    onSuccess: (blocked) => {
      if (blocked === null) {
        show("warning", PERMISSION_DENIED_MESSAGE);
        return;
      }

      queryClient.setQueryData(CONTACT_BLOCK_COUNT_KEY, blocked);
      showToast("info", i18n.t("contactBlock.enabled", { count: blocked }));
    },
    onError: showApiError,
  });

  const turnOff = useMutation({
    mutationFn: api.contactBlocks.clear,
    onSuccess: () => {
      queryClient.setQueryData(CONTACT_BLOCK_COUNT_KEY, 0);
      showToast("info", DISABLED_MESSAGE);
    },
    onError: showApiError,
  });

  const pending = turnOn.isPending || turnOff.isPending;

  const toggle = useCallback(() => {
    if (pending) {
      return;
    }

    if (enabled) {
      turnOff.mutate();
      return;
    }

    confirm({
      message: NOTICE,
      confirmLabel: TURN_ON_LABEL,
      onConfirm: () => turnOn.mutate(),
    });
  }, [confirm, enabled, pending, turnOff, turnOn]);

  return { enabled, pending, toggle };
}
