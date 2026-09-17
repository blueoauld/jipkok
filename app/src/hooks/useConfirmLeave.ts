import { useNavigation } from "expo-router";
// expo-router가 usePreventRemove를 공개 export하지 않아 내장된 react-navigation에서 가져온다.
import { usePreventRemove } from "expo-router/build/react-navigation";
import { useTranslation } from "react-i18next";

import type { AlertApi } from "@/hooks/useAlert";

// 저장하지 않은 것이 있으면 뒤로 가기와 스와이프에 한 번 묻는다. 저장하는 중에는 막지 않아야
// 성공 직후의 뒤로 가기가 통과한다.
export function useConfirmLeave(
  unsaved: boolean,
  confirm: AlertApi["confirm"],
) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  usePreventRemove(unsaved, ({ data }) =>
    confirm({
      message: t("common.leaveUnsaved"),
      confirmLabel: t("action.leave"),
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );
}
