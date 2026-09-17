import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { TranslateIcon } from "phosphor-react-native/src/icons/Translate";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView } from "react-native";
import { getTokens, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { AttendanceCard } from "@/components/setting/AttendanceCard";
import { SettingSection } from "@/components/setting/SettingSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAdReward } from "@/hooks/useAdReward";
import { useAlert } from "@/hooks/useAlert";
import { useAppLockToggle } from "@/hooks/useAppLockToggle";
import { ATTENDANCE_DAYS_KEY } from "@/hooks/useAttendanceDays";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useExportDiary } from "@/hooks/useExportDiary";
import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { useLogout } from "@/hooks/useLogout";
import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useProfileViewNewCount } from "@/hooks/useProfileViews";
import { useWithdraw } from "@/hooks/useWithdraw";
import { api } from "@/lib/api";
import { APP_VERSION } from "@/lib/device";
import i18n, {
  currentLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { useLocaleStore } from "@/lib/i18n/store";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { reloadApp } from "@/lib/reload";
import { pushOnce } from "@/lib/router";
import {
  SECTIONS,
  type SettingAction,
  type SettingItem,
} from "@/lib/setting/menu";
import {
  BROWSER_FAILED_MESSAGE,
  openSupportMail,
  openWebPage,
} from "@/lib/support";
import { type ThemeMode, useThemeStore } from "@/lib/theme/store";
import { showToast } from "@/lib/toast/store";
import { isOutdated } from "@/lib/version";

const THEME_MODES: ThemeMode[] = ["light", "dark"];

const THEME_ITEMS = THEME_MODES.map((value) => ({
  value,
  label: i18n.t(`setting.theme.${value}`),
}));

const LANGUAGE_LABEL_KEYS = {
  ko: "setting.languageKo",
  ja: "setting.languageJa",
  zh: "setting.languageZh",
  en: "setting.languageEn",
} as const satisfies Record<SupportedLocale, string>;

function versionText(current: string, latest: string) {
  return i18n.t("setting.versionText", { latest, current });
}

export default function SettingScreen() {
  const { t } = useTranslation();
  const space = getTokens().space;
  const tabBarOverlay = useTabBarOverlay();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const profileViewCount = useProfileViewNewCount();
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const { alertElement, show, showApiError, confirm } = useAlert();
  const locale = currentLocale();
  const setLocale = useLocaleStore((state) => state.setLocale);

  const changeLanguage = (next: SupportedLocale) => {
    if (next === locale) {
      return;
    }

    confirm({
      message: t("setting.languageChangeNotice"),
      confirmLabel: t("setting.languageChange"),
      onConfirm: () => {
        setLocale(next);
        reloadApp();
      },
    });
  };

  const { logout, loggingOut } = useLogout({ show, showApiError, confirm });
  const adReward = useAdReward();
  const appLock = useAppLockToggle({ show, showApiError, confirm });
  const gate = useInterstitialGate();

  const {
    exportDiary,
    exporting,
    progress: exportProgress,
  } = useExportDiary({ show, showApiError, confirm });

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

  const handleAction = useCallback(
    (action: SettingAction) => {
      if (action === "contact" || action === "suggest") {
        openSupportMail(
          action === "contact"
            ? t("setting.menu.contact")
            : t("setting.menu.suggest"),
          profile?.memberId,
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
      profile?.memberId,
      show,
      t,
    ],
  );

  const handlePress = useCallback(
    (item: SettingItem) => {
      if (item.action) {
        const action = item.action;

        if (item.gated) {
          gate.run(() => handleAction(action));
        } else {
          handleAction(action);
        }

        return;
      }

      if (item.url) {
        openWebPage(item.url, show);
        return;
      }

      if (!item.href) {
        return;
      }

      if (item.gated) {
        gate.open(item.href);
        return;
      }

      pushOnce(item.href);
    },
    [gate, handleAction, show],
  );

  const { confirmWithdraw } = useWithdraw({ show, showApiError, confirm });

  const accountMenu: MenuSheetItem[] = [
    {
      label: t("setting.menu.logout"),
      onPress: () =>
        confirm({
          message: t("setting.logoutNotice"),
          confirmLabel: t("setting.confirm"),
          onConfirm: () => logout(),
        }),
    },
    {
      label: t("setting.menu.withdraw"),
      destructive: true,
      onPress: confirmWithdraw,
    },
  ];
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const openLanguage = useCallback(() => setLanguageOpen(true), []);

  const languageItems: MenuSheetItem[] = SUPPORTED_LOCALES.map((value) => ({
    label: t(LANGUAGE_LABEL_KEYS[value]),
    selected: value === locale,
    onPress: () => changeLanguage(value),
  }));

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => (
        <HeaderIconButton
          icon={TranslateIcon}
          label={t("a11y.language")}
          onPress={openLanguage}
        />
      ),
      headerRight: () => (
        <HeaderIconButton
          icon={SignOutIcon}
          label={t("a11y.menu")}
          onPress={openMenu}
        />
      ),
    }),
    [openLanguage, openMenu, t],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <SegmentedControl
          items={THEME_ITEMS}
          value={themeMode}
          onChange={setThemeMode}
        />
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: space.$2.val,
          paddingBottom: space.$4.val + tabBarOverlay,
        }}
      >
        <YStack gap="$5">
          {SECTIONS.map((group) => (
            <YStack key={group.key} gap="$5">
              <SettingSection
                items={group.items}
                pendingAction={pendingAction}
                profileViewCount={profileViewCount}
                appLockEnabled={appLock.enabled}
                onItemPress={handlePress}
              />

              {group.attendance && <AttendanceCard />}
            </YStack>
          ))}
        </YStack>
      </ScrollView>

      <MenuSheet
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        items={languageItems}
      />

      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={accountMenu}
      />

      {alertElement}
    </YStack>
  );
}
