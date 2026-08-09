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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { useAdReward } from "@/hooks/useAdReward";
import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useWithdraw } from "@/hooks/useWithdraw";
import {
  alertApiError,
  alertInfo,
  alertMessage,
  confirmAlert,
} from "@/lib/alert";
import { api } from "@/lib/api";
import { tabBarOverlayHeight } from "@/lib/design";
import { setBadgeCount, unregisterPushToken } from "@/lib/push/notifications";
import { pushOnce } from "@/lib/router";
import { MAIL_FAILED_MESSAGE, openSupportMail } from "@/lib/support";

const ICON_SIZE = 22;

const LOGOUT_DESCRIPTION = "로그아웃하면 다시 로그인해야 이용할 수 있습니다.";

const TERMS_URL = "https://jipkok.app/terms";
const PRIVACY_URL = "https://jipkok.app/privacy";

const BROWSER_FAILED_MESSAGE = "페이지를 열지 못했습니다.";

const ALREADY_EARNED_MESSAGE = "오늘 출석 보상은 이미 받았습니다.";

type SettingAction = "attendanceReward" | "adReward" | "contact" | "suggest";

type SettingItem = {
  label: string;
  icon: Icon;
  href?: Href;
  url?: string;
  action?: SettingAction;
  gated?: boolean;
};

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
      href: "/activity/profile-view",
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
  onPress,
}: {
  item: SettingItem;
  pending: boolean;
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
      pressStyle={{ bg: "$gray5" }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} color={theme.color10.val} />
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>
      {pending && <Spinner size="small" />}
    </XStack>
  );
}

export default function SettingScreen() {
  const space = getTokens().space;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile } = useMyProfile();

  const logout = useMutation({
    mutationFn: async () => {
      await unregisterPushToken().catch(() => undefined);
      setBadgeCount(0);
      await api.auth.logout();
    },
  });
  const adReward = useAdReward();
  const gate = useInterstitialGate();

  const earnAttendanceReward = useMutation({
    mutationFn: api.attendances.checkIn,
    onSuccess: async (reward) => {
      if (!reward.earned) {
        alertMessage(ALREADY_EARNED_MESSAGE);
        return;
      }

      queryClient.setQueryData(POINT_BALANCE_KEY, reward.balance);
      await queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      alertInfo(`${reward.amount.toLocaleString()} 포인트를 받았습니다.`);
    },
    onError: alertApiError,
  });

  const pendingAction: SettingAction | null = earnAttendanceReward.isPending
    ? "attendanceReward"
    : null;

  const handleAction = useCallback(
    (action: SettingAction) => {
      if (action === "contact" || action === "suggest") {
        openSupportMail(
          action === "contact" ? "문의하기" : "건의하기",
          profile?.memberId,
        ).catch(() => alertMessage(MAIL_FAILED_MESSAGE));
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
    [adReward, earnAttendanceReward, profile?.memberId],
  );

  const handlePress = useCallback(
    (item: SettingItem) => {
      if (item.action) {
        handleAction(item.action);
        return;
      }

      if (item.url) {
        WebBrowser.openBrowserAsync(item.url).catch(() =>
          alertMessage(BROWSER_FAILED_MESSAGE),
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
    [gate, handleAction],
  );

  const confirmWithdraw = useWithdraw();

  const accountMenu: MenuSheetItem[] = [
    {
      label: "로그아웃",
      onPress: () =>
        confirmAlert({
          title: "로그아웃",
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
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: space.$4.val,
        paddingBottom: space.$4.val + tabBarOverlayHeight(insets.bottom),
      }}
    >
      <YStack gap="$4">
        {SECTIONS.map((items) => (
          <YStack
            key={items[0].label}
            mx="$4"
            bg="$gray4"
            rounded="$7"
            overflow="hidden"
          >
            {items.map((item) => (
              <SettingRow
                key={item.label}
                item={item}
                pending={item.action === pendingAction}
                onPress={
                  item.href || item.url || item.action
                    ? () => handlePress(item)
                    : undefined
                }
              />
            ))}
          </YStack>
        ))}
      </YStack>

      <Tabs.Screen options={screenOptions} />

      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={accountMenu}
      />
    </ScrollView>
  );
}
