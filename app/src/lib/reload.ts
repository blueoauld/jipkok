import { reloadAsync } from "expo-updates";
import { DevSettings } from "react-native";

import { reportError } from "@/lib/crash";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

// DevSettings.reload는 __DEV__가 아니면 빈 함수이고,
// expo-updates는 개발 서버에 붙어 있으면 다시 불러오지 못한다.
export function reloadApp() {
  if (__DEV__) {
    DevSettings.reload();

    return;
  }

  reloadAsync().catch((error) => {
    reportError("reload", error);
    showToast("error", i18n.t("common.reloadFailed"));
  });
}
