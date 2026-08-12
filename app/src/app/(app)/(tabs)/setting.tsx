import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, Tabs } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { Icon } from "phosphor-react-native";
import { CalendarCheckIcon } from "phosphor-react-native/src/icons/CalendarCheck";
import { CoinsIcon } from "phosphor-react-native/src/icons/Coins";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { FootprintsIcon } from "phosphor-react-native/src/icons/Footprints";
import { HandHeartIcon } from "phosphor-react-native/src/icons/HandHeart";
import { HeadsetIcon } from "phosphor-react-native/src/icons/Headset";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { LightbulbIcon } from "phosphor-react-native/src/icons/Lightbulb";
import { MonitorPlayIcon } from "phosphor-react-native/src/icons/MonitorPlay";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { ShieldCheckIcon } from "phosphor-react-native/src/icons/ShieldCheck";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { TrayArrowDownIcon } from "phosphor-react-native/src/icons/TrayArrowDown";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { useAdReward } from "@/hooks/useAdReward";
import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useProfileViewNewCount } from "@/hooks/useProfileViews";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWithdraw } from "@/hooks/useWithdraw";
import { api } from "@/lib/api";
import { RETRO_SHADOW_OFFSET } from "@/lib/design";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { setBadgeCount, unregisterPushToken } from "@/lib/push/notifications";
import { pushOnce } from "@/lib/router";
import {
  BROWSER_FAILED_MESSAGE,
  MAIL_FAILED_MESSAGE,
  openSupportMail,
  PRIVACY_URL,
  TERMS_URL,
} from "@/lib/support";
import { type ThemeMode, useThemeStore } from "@/lib/theme/store";

const ICON_SIZE = 22;

const MAX_BADGE_COUNT = 99;

function formatBadgeCount(count: number) {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${count}`;
}

const LOGOUT_DESCRIPTION = "로그아웃하면 다시 로그인해야 이용할 수 있습니다.";

const ALREADY_EARNED_MESSAGE = "오늘 출석 보상은 이미 받았습니다.";

const THEME_LABELS = ["라이트", "다크"] as const;
type ThemeLabel = (typeof THEME_LABELS)[number];

const THEME_VALUES: Record<ThemeLabel, ThemeMode> = {
  라이트: "light",
  다크: "dark",
};

type SettingAction = "attendanceReward" | "adReward" | "contact" | "suggest";

type SettingItem = {
  label: string;
  icon: Icon;
  href?: Href;
  url?: string;
  action?: SettingAction;
  gated?: boolean;
};

const PROFILE_VIEW_HREF = "/activity/profile-view";

const BADGE_SIZE = 20;
const BADGE_FONT_SIZE = 11;

const SECTIONS: SettingItem[][] = [
  [{ label: "내 프로필", icon: UserIcon, href: "/member/me" }],
  [
    { label: "좋아요 목록", icon: HeartIcon, href: "/activity/like" },
    { label: "즐겨찾기 목록", icon: StarIcon, href: "/activity/favorite" },
    {
      label: "비밀 사진 목록",
      icon: ImagesIcon,
      href: "/activity/secret-photo",
    },
    { label: "차단 목록", icon: ProhibitIcon, href: "/activity/block" },
  ],
  [
    {
      label: "받은 좋아요 목록",
      icon: HandHeartIcon,
      href: "/activity/like-received",
      gated: true,
    },
    {
      label: "받은 즐겨찾기 목록",
      icon: TrayArrowDownIcon,
      href: "/activity/favorite-received",
      gated: true,
    },
    {
      label: "공개된 비밀 사진 목록",
      icon: EyeIcon,
      href: "/activity/secret-photo-opened",
      gated: true,
    },
    {
      label: "내 프로필 조회 목록",
      icon: FootprintsIcon,
      href: PROFILE_VIEW_HREF,
      gated: true,
    },
  ],
  [
    { label: "포인트 내역", icon: CoinsIcon, href: "/point/history" },
    { label: "출석 보상", icon: CalendarCheckIcon, action: "attendanceReward" },
    { label: "광고 보상", icon: MonitorPlayIcon, action: "adReward" },
  ],
  [
    { label: "문의하기", icon: HeadsetIcon, action: "contact" },
    { label: "건의하기", icon: LightbulbIcon, action: "suggest" },
    { label: "서비스 이용약관", icon: FileTextIcon, url: TERMS_URL },
    { label: "개인정보 처리방침", icon: ShieldCheckIcon, url: PRIVACY_URL },
  ],
];

function SettingRow({
  item,
  pending,
  divider,
  badge,
  onPress,
}: {
  item: SettingItem;
  pending: boolean;
  divider: boolean;
  badge?: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { label, icon: Icon } = item;

  return (
    <XStack
      items="center"
      gap="$3"
      px="$4"
      py="$3"
      borderBottomWidth={divider ? 2 : 0}
      borderColor="$color12"
      pressStyle={{ bg: "$color3" }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} color={theme.color12.val} />
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>
      {!!badge && (
        <XStack
          minW={BADGE_SIZE}
          height={BADGE_SIZE}
          px="$1.5"
          rounded={0}
          borderWidth={2}
          borderColor="$color12"
          bg="$red10"
          items="center"
          justify="center"
        >
          <Text color="white" fontSize={BADGE_FONT_SIZE} fontWeight="700">
            {formatBadgeCount(badge)}
          </Text>
        </XStack>
      )}
      {pending && <Spinner size="small" />}
    </XStack>
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
  profileViewCount?: number;
  onItemPress: (item: SettingItem) => void;
}) {
  return (
    <YStack mx="$4">
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray8"
      />
      <YStack borderWidth={2} borderColor="$color12" bg="$color1">
        {items.map((item, index) => (
          <SettingRow
            key={item.label}
            item={item}
            pending={item.action === pendingAction}
            divider={index < items.length - 1}
            badge={
              item.href === PROFILE_VIEW_HREF ? profileViewCount : undefined
            }
            onPress={
              item.href || item.url || item.action
                ? () => onItemPress(item)
                : undefined
            }
          />
        ))}
      </YStack>
    </YStack>
  );
}

export default function SettingScreen() {
  const space = getTokens().space;
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const profileViewCount = useProfileViewNewCount();
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const logout = useMutation({
    mutationFn: async () => {
      await unregisterPushToken().catch(() => undefined);
      setBadgeCount(0);
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
        show("info", ALREADY_EARNED_MESSAGE);
        return;
      }

      queryClient.setQueryData(POINT_BALANCE_KEY, reward.balance);
      await queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      show("info", `${reward.amount.toLocaleString()} 포인트를 받았습니다.`);
    },
    onError: showApiError,
  });

  const pendingAction: SettingAction | null = earnAttendanceReward.isPending
    ? "attendanceReward"
    : !adReward.ready
      ? "adReward"
      : null;

  const handleAction = useCallback(
    (action: SettingAction) => {
      if (action === "contact" || action === "suggest") {
        openSupportMail(
          action === "contact" ? "문의하기" : "건의하기",
          profile?.memberId,
        ).catch(() => show("error", MAIL_FAILED_MESSAGE));
        return;
      }

      if (action === "adReward") {
        adReward.watch();
        return;
      }

      if (!earnAttendanceReward.isPending) {
        earnAttendanceReward.mutate();
      }
    },
    [adReward, earnAttendanceReward, profile?.memberId, show],
  );

  const handlePress = useCallback(
    (item: SettingItem) => {
      if (item.action) {
        handleAction(item.action);
        return;
      }

      if (item.url) {
        WebBrowser.openBrowserAsync(item.url).catch(() =>
          show("error", BROWSER_FAILED_MESSAGE),
        );
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

  const { confirmWithdraw, withdrawElement } = useWithdraw();

  const accountMenu: MenuSheetItem[] = [
    {
      label: "로그아웃",
      onPress: () =>
        confirm({
          message: LOGOUT_DESCRIPTION,
          confirmLabel: "확인",
          onConfirm: () => logout.mutate(),
        }),
    },
    {
      label: "회원탈퇴",
      destructive: true,
      onPress: confirmWithdraw,
    },
  ];
  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      headerRight: () => (
        <HeaderIconButton icon={SignOutIcon} onPress={openMenu} />
      ),
    }),
    [openMenu],
  );

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={THEME_LABELS}
          value={themeMode === "dark" ? "다크" : "라이트"}
          onChange={(label) => setThemeMode(THEME_VALUES[label])}
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
              key={items[0].label}
              items={items}
              pendingAction={pendingAction}
              profileViewCount={profileViewCount}
              onItemPress={handlePress}
            />
          ))}
        </YStack>

        <Tabs.Screen options={screenOptions} />

        <MenuSheet
          open={menuOpen}
          onOpenChange={setMenuOpen}
          items={accountMenu}
        />

        {alertElement}
        {withdrawElement}
        {adReward.adRewardElement}
      </ScrollView>
    </YStack>
  );
}
