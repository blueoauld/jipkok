import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { useAdReward } from "@/hooks/useAdReward";
import type { AlertApi } from "@/hooks/useAlert";
import { useAppLockToggle } from "@/hooks/useAppLockToggle";
import { ATTENDANCE_DAYS_KEY } from "@/hooks/useAttendanceDays";
import { useExportDiary } from "@/hooks/useExportDiary";
import { useLogout } from "@/hooks/useLogout";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useWithdraw } from "@/hooks/useWithdraw";
import { api } from "@/lib/api";
import { APP_VERSION } from "@/lib/device";
import i18n from "@/lib/i18n";
import { useLoadingOverlay } from "@/lib/overlay/store";
import type { SettingAction } from "@/lib/setting/menu";
import { BROWSER_FAILED_MESSAGE, openSupportMail } from "@/lib/support";
import { showToast } from "@/lib/toast/store";
import { isOutdated } from "@/lib/version";

function versionText(current: string, latest: string) {
  return i18n.t("setting.versionText", { latest, current });
}

// 설정 목록의 행을 눌렀을 때 하는 일이다. 어느 행이 기다리는 중인지도 같이 알려 준다.
export function useSettingActions({
  alert,
  memberId,
}: {
  alert: AlertApi;
  memberId?: number;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { show, showApiError, confirm } = alert;

  const { logout, loggingOut } = useLogout(alert);
  const { confirmWithdraw } = useWithdraw(alert);
  const adReward = useAdReward();
  const appLock = useAppLockToggle(alert);
  const {
    exportDiary,
    exporting,
    progress: exportProgress,
  } = useExportDiary(alert);

  // 첨부를 내려받는 동안은 항목 스피너 대신 진행 숫자가 있는 오버레이를 띄운다.
  useLoadingOverlay(
    loggingOut || exportProgress.total > 0,
    exportProgress.done,
    exportProgress.total,
  );

  const earnAttendanceReward = useMutation({
    mutationFn: api.attendances.checkIn,
    onSuccess: (reward) => {
      if (!reward.earned) {
        showToast("warning", t("setting.alreadyEarned"));
        return;
      }

      queryClient.setQueryData(POINT_BALANCE_KEY, reward.balance);
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_DAYS_KEY });
      showToast(
        "info",
        t("setting.rewarded", { amount: reward.amount.toLocaleString() }),
      );
    },
    onError: showApiError,
  });

  const checkVersion = useMutation({
    mutationFn: api.app.latestVersion,
    onSuccess: ({ latestVersion, storeUrl }) => {
      const detail = versionText(APP_VERSION, latestVersion);

      if (!isOutdated(APP_VERSION, latestVersion)) {
        show("info", detail);
        return;
      }

      confirm({
        variant: "info",
        message: detail,
        confirmLabel: t("setting.update"),
        onConfirm: () =>
          Linking.openURL(storeUrl).catch(() =>
            show("error", BROWSER_FAILED_MESSAGE),
          ),
      });
    },
    onError: showApiError,
  });

  const pendingAction: SettingAction | null = earnAttendanceReward.isPending
    ? "attendanceReward"
    : checkVersion.isPending
      ? "version"
      : appLock.pending
        ? "appLock"
        : exporting
          ? "exportDiary"
          : !adReward.ready && !adReward.unavailable
            ? "adReward"
            : null;

  const run = useCallback(
    (action: SettingAction) => {
      if (action === "contact" || action === "suggest") {
        openSupportMail(
          action === "contact"
            ? t("setting.menu.contact")
            : t("setting.menu.suggest"),
          memberId,
          show,
        );
        return;
      }

      if (action === "adReward") {
        void adReward.watch();
        return;
      }

      if (action === "appLock") {
        appLock.toggle();
        return;
      }

      if (action === "version") {
        if (!checkVersion.isPending) {
          checkVersion.mutate();
        }

        return;
      }

      if (action === "exportDiary") {
        if (!exporting) {
          exportDiary();
        }

        return;
      }

      if (action === "attendanceReward" && !earnAttendanceReward.isPending) {
        earnAttendanceReward.mutate();
      }
    },
    [
      adReward,
      appLock,
      checkVersion,
      earnAttendanceReward,
      exportDiary,
      exporting,
      memberId,
      show,
      t,
    ],
  );

  return {
    pendingAction,
    appLockEnabled: appLock.enabled,
    run,
    logout,
    confirmWithdraw,
  };
}
