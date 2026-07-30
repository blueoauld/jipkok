import { Tabs, type Href } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  CalendarCheckIcon,
  CoinsIcon,
  EyeIcon,
  FileTextIcon,
  HandHeartIcon,
  HeadsetIcon,
  HeartIcon,
  ImagesIcon,
  LightbulbIcon,
  MonitorPlayIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  SignOutIcon,
  StarIcon,
  TrayArrowDownIcon,
  UserIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { pushOnce } from "@/lib/router";

const ICON_SIZE = 22;

const LOGOUT_DESCRIPTION = "로그아웃하면 다시 로그인해야 이용할 수 있습니다.";
const WITHDRAW_DESCRIPTION =
  "탈퇴하면 프로필과 주고받은 대화, 활동 내역이 모두 삭제되며 복구할 수 없습니다.";

type SettingItem = { label: string; icon: Icon; href?: Href };

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
    },
    {
      label: "받은 즐겨찾기 목록",
      icon: TrayArrowDownIcon,
      href: "/activity/favorite-received",
    },
    {
      label: "공개된 비밀 사진 목록",
      icon: EyeIcon,
      href: "/activity/secret-photo-opened",
    },
  ],
  [
    { label: "포인트 내역", icon: CoinsIcon },
    { label: "출석 보상", icon: CalendarCheckIcon },
    { label: "광고 보상", icon: MonitorPlayIcon },
  ],
  [
    { label: "문의하기", icon: HeadsetIcon },
    { label: "건의하기", icon: LightbulbIcon },
    { label: "서비스 이용약관", icon: FileTextIcon },
    { label: "개인정보 처리방침", icon: ShieldCheckIcon },
  ],
];

function SettingRow({ item }: { item: SettingItem }) {
  const theme = useTheme();
  const { label, icon: Icon, href } = item;

  return (
    <XStack
      items="center"
      gap="$3"
      px="$4"
      py="$3"
      pressStyle={{ bg: "$gray5" }}
      onPress={href ? () => pushOnce(href) : undefined}
    >
      <Icon size={ICON_SIZE} color={theme.color10.val} />
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>
    </XStack>
  );
}

export default function SettingScreen() {
  const space = getTokens().space;
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const accountMenu: MenuSheetItem[] = [
    { label: "로그아웃", onPress: () => setLogoutOpen(true) },
    {
      label: "회원탈퇴",
      destructive: true,
      onPress: () => setWithdrawOpen(true),
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
      contentContainerStyle={{ paddingVertical: space.$4.val }}
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
              <SettingRow key={item.label} item={item} />
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

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="로그아웃"
        description={LOGOUT_DESCRIPTION}
        confirmLabel="확인"
      />

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="회원탈퇴"
        description={WITHDRAW_DESCRIPTION}
        confirmLabel="탈퇴"
        destructive
      />
    </ScrollView>
  );
}
