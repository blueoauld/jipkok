import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { CalendarCheckIcon } from "phosphor-react-native/src/icons/CalendarCheck";
import { ChatCircleTextIcon } from "phosphor-react-native/src/icons/ChatCircleText";
import { CoinsIcon } from "phosphor-react-native/src/icons/Coins";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { FootprintsIcon } from "phosphor-react-native/src/icons/Footprints";
import { HandHeartIcon } from "phosphor-react-native/src/icons/HandHeart";
import { HeadsetIcon } from "phosphor-react-native/src/icons/Headset";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { LightbulbIcon } from "phosphor-react-native/src/icons/Lightbulb";
import { MonitorPlayIcon } from "phosphor-react-native/src/icons/MonitorPlay";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { ShieldCheckIcon } from "phosphor-react-native/src/icons/ShieldCheck";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { TranslateIcon } from "phosphor-react-native/src/icons/Translate";
import { TrayArrowDownIcon } from "phosphor-react-native/src/icons/TrayArrowDown";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView } from "react-native";
import { getTokens, Spinner, Text, useTheme, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { useAdReward } from "@/hooks/useAdReward";
import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useProfileViewNewCount } from "@/hooks/useProfileViews";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWithdraw } from "@/hooks/useWithdraw";
import { api } from "@/lib/api";
import { APP_VERSION } from "@/lib/device";
import i18n from "@/lib/i18n";
import {
  currentLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { ko } from "@/lib/i18n/ko";
import { useLocaleStore } from "@/lib/i18n/store";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { releaseDevice } from "@/lib/push/notifications";
import { reloadApp } from "@/lib/reload";
import { pushOnce } from "@/lib/router";
import {
  BROWSER_FAILED_MESSAGE,
  openSupportMail,
  openWebPage,
  PRIVACY_URL,
  TERMS_URL,
} from "@/lib/support";
import { type ThemeMode, useThemeStore } from "@/lib/theme/store";
import { showToast } from "@/lib/toast/store";

const ICON_SIZE = 22;

const THEME_MODES: ThemeMode[] = ["blue", "pink", "dark"];

const THEME_ITEMS = THEME_MODES.map((value) => ({
  value,
  label: i18n.t(`setting.theme.${value}`),
}));

const LANGUAGE_LABEL_KEYS = {
  ko: "setting.languageKo",
  ja: "setting.languageJa",
  en: "setting.languageEn",
  zh: "setting.languageZh",
} as const satisfies Record<SupportedLocale, string>;

type SettingAction =
  "attendanceReward" | "adReward" | "contact" | "suggest" | "version";

type SettingLabelKey =
  | `setting.menu.${keyof (typeof ko)["setting"]["menu"]}`
  | `list.${keyof (typeof ko)["list"]}`
  | `legal.${keyof (typeof ko)["legal"]}`;

type SettingItem = {
  labelKey: SettingLabelKey;
  icon: Icon;
  href?: Href;
  url?: string;
  action?: SettingAction;
  gated?: boolean;
};

const PROFILE_VIEW_HREF = "/activity/profile-view";

const SECTIONS: SettingItem[][] = [
  [{ labelKey: "list.myProfile", icon: UserIcon, href: "/member/me" }],
  [
    { labelKey: "list.likes", icon: HeartIcon, href: "/activity/like" },
    {
      labelKey: "list.favorites",
      icon: StarIcon,
      href: "/activity/favorite",
    },
    {
      labelKey: "list.secretPhotos",
      icon: ImagesIcon,
      href: "/activity/secret-photo",
    },
    {
      labelKey: "list.blocks",
      icon: ProhibitIcon,
      href: "/activity/block",
    },
    {
      labelKey: "list.worries",
      icon: ChatCircleTextIcon,
      href: "/activity/worry",
    },
  ],
  [
    {
      labelKey: "list.likesReceived",
      icon: HandHeartIcon,
      href: "/activity/like-received",
      gated: true,
    },
    {
      labelKey: "list.favoritesReceived",
      icon: TrayArrowDownIcon,
      href: "/activity/favorite-received",
      gated: true,
    },
    {
      labelKey: "list.secretPhotosOpened",
      icon: EyeIcon,
      href: "/activity/secret-photo-opened",
      gated: true,
    },
    {
      labelKey: "list.profileViews",
      icon: FootprintsIcon,
      href: PROFILE_VIEW_HREF,
      gated: true,
    },
  ],
  [
    {
      labelKey: "list.pointHistory",
      icon: CoinsIcon,
      href: "/point/history",
    },
    {
      labelKey: "setting.menu.attendanceReward",
      icon: CalendarCheckIcon,
      action: "attendanceReward",
    },
    {
      labelKey: "setting.menu.adReward",
      icon: MonitorPlayIcon,
      action: "adReward",
    },
  ],
  [
    { labelKey: "setting.menu.contact", icon: HeadsetIcon, action: "contact" },
    {
      labelKey: "setting.menu.suggest",
      icon: LightbulbIcon,
      action: "suggest",
    },
    { labelKey: "legal.terms", icon: FileTextIcon, url: TERMS_URL },
    {
      labelKey: "legal.privacy",
      icon: ShieldCheckIcon,
      url: PRIVACY_URL,
    },
    { labelKey: "setting.menu.version", icon: InfoIcon, action: "version" },
  ],
];

function versionText(latest: string, current: string) {
  return i18n.t("setting.versionText", { latest, current });
}

function isOutdated(current: string, latest: string) {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const gap = (latestParts[i] ?? 0) - (currentParts[i] ?? 0);

    if (gap !== 0) {
      return gap > 0;
    }
  }

  return false;
}

function SettingRow({
  item,
  pending,
  divider,
  hasNew,
  onPress,
}: {
  item: SettingItem;
  pending: boolean;
  divider: boolean;
  hasNew: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { labelKey, icon: Icon } = item;

  return (
    <RetroListRow divider={divider} gap="$3" onPress={onPress}>
      <Icon size={ICON_SIZE} color={theme.color12.val} />
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {t(labelKey)}
      </Text>
      {hasNew && <RetroBadge>N</RetroBadge>}
      {pending && <Spinner size="small" />}
    </RetroListRow>
  );
}

function SettingSection({
  items,
  pendingAction,
  profileViewCount,
  onItemPress,
}: {
  items: SettingItem[];
  pendingAction: SettingAction | null;
  profileViewCount: number;
  onItemPress: (item: SettingItem) => void;
}) {
  return (
    <YStack mx="$4">
      <RetroListPanel>
        {items.map((item, index) => (
          <SettingRow
            key={item.labelKey}
            item={item}
            pending={item.action === pendingAction}
            divider={index < items.length - 1}
            hasNew={item.href === PROFILE_VIEW_HREF && profileViewCount > 0}
            onPress={
              item.href || item.url || item.action
                ? () => onItemPress(item)
                : undefined
            }
          />
        ))}
      </RetroListPanel>
    </YStack>
  );
}

export default function SettingScreen() {
  const { t } = useTranslation();
  const space = getTokens().space;
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const profileViewCount = useProfileViewNewCount();
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
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

  const logout = useMutation({
    mutationFn: async () => {
      await releaseDevice();
      await api.auth.logout();
    },
  });
  const adReward = useAdReward();
  const gate = useInterstitialGate();

  useLoadingOverlay(logout.isPending);

  const earnAttendanceReward = useMutation({
    mutationFn: api.attendances.checkIn,
    onSuccess: async (reward) => {
      if (!reward.earned) {
        showToast("warning", t("setting.alreadyEarned"));
        return;
      }

      queryClient.setQueryData(POINT_BALANCE_KEY, reward.balance);
      await queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
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
      const detail = versionText(latestVersion, APP_VERSION);

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
      : !adReward.ready
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
        adReward.watch();
        return;
      }

      if (action === "version") {
        if (!checkVersion.isPending) {
          checkVersion.mutate();
        }

        return;
      }

      if (!earnAttendanceReward.isPending) {
        earnAttendanceReward.mutate();
      }
    },
    [adReward, checkVersion, earnAttendanceReward, profile?.memberId, show, t],
  );

  const handlePress = useCallback(
    (item: SettingItem) => {
      if (item.action) {
        handleAction(item.action);
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
          onConfirm: () => logout.mutate(),
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
        <HeaderIconButton icon={TranslateIcon} onPress={openLanguage} />
      ),
      headerRight: () => (
        <HeaderIconButton icon={SignOutIcon} onPress={openMenu} />
      ),
    }),
    [openLanguage, openMenu],
  );

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
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
          paddingBottom: space.$4.val,
        }}
      >
        <YStack gap="$5">
          {SECTIONS.map((items) => (
            <SettingSection
              key={items[0].labelKey}
              items={items}
              pendingAction={pendingAction}
              profileViewCount={profileViewCount}
              onItemPress={handlePress}
            />
          ))}
        </YStack>

        <Tabs.Screen options={screenOptions} />

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
      </ScrollView>
    </YStack>
  );
}
