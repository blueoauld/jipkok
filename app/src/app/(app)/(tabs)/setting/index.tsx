import { Stack } from "expo-router";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { TranslateIcon } from "phosphor-react-native/src/icons/Translate";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { AttendanceSection } from "@/components/setting/AttendanceSection";
import { SettingSection } from "@/components/setting/SettingSection";
import { Border } from "@/components/ui/Border";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAlert } from "@/hooks/useAlert";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useProfileViewNewCount } from "@/hooks/useProfileViews";
import { useSettingActions } from "@/hooks/useSettingActions";
import { LIST_ROW_PADDING_X, LIST_ROW_VERTICAL_PADDING } from "@/lib/design";
import i18n, {
  currentLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { useLocaleStore } from "@/lib/i18n/store";
import { reloadApp } from "@/lib/reload";
import { pushOnce } from "@/lib/router";
import { SECTIONS, type SettingItem } from "@/lib/setting/menu";
import { openWebPage } from "@/lib/support";
import { type ThemeMode, useThemeStore } from "@/lib/theme/store";

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

// 설정 행의 좌우 여백만큼 테마 세그먼트 둘레와 목록 끝을 띄운다. 행 쪽은 행이 가진 위아래 여백을 뺀다.
const EDGE = LIST_ROW_PADDING_X.medium;
const EDGE_BESIDE_ROW = EDGE - LIST_ROW_VERTICAL_PADDING.medium;

export default function SettingScreen() {
  const { t } = useTranslation();
  const tabBarOverlay = useTabBarOverlay();
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

  const gate = useInterstitialGate();
  const { pendingAction, appLockEnabled, run, logout, confirmWithdraw } =
    useSettingActions({
      alert: { show, showApiError, confirm },
      memberId: profile?.memberId,
    });

  const handlePress = useCallback(
    (item: SettingItem) => {
      if (item.action) {
        const action = item.action;

        if (item.gated) {
          gate.run(() => run(action));
        } else {
          run(action);
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
    [gate, run, show],
  );

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
      title: t("tabs.setting"),
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
      <Stack.Screen options={screenOptions} />

      <YStack px={EDGE} pt={EDGE} pb={EDGE_BESIDE_ROW}>
        <SegmentedControl
          size="small"
          items={THEME_ITEMS}
          value={themeMode}
          onChange={setThemeMode}
        />
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: EDGE_BESIDE_ROW + tabBarOverlay,
        }}
      >
        {SECTIONS.map((group, index) => (
          <YStack key={group.key}>
            {index > 0 && <Border variant="height16" />}
            <SettingSection
              items={group.items}
              pendingAction={pendingAction}
              profileViewCount={profileViewCount}
              appLockEnabled={appLockEnabled}
              onItemPress={handlePress}
            />

            {group.attendance && (
              <>
                <Border variant="height16" />
                <AttendanceSection />
              </>
            )}
          </YStack>
        ))}
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
