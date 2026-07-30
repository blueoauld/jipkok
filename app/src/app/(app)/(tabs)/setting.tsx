import { router, type Href } from "expo-router";
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
  StarIcon,
  TrayArrowDownIcon,
  UserIcon,
} from "phosphor-react-native";
import { ScrollView } from "react-native";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

const ICON_SIZE = 22;

type SettingItem = { label: string; icon: Icon; href?: Href };

const SECTIONS: SettingItem[][] = [
  [{ label: "내 프로필", icon: UserIcon, href: "/member/me" }],
  [
    { label: "좋아요 목록", icon: HeartIcon },
    { label: "즐겨찾기 목록", icon: StarIcon },
    { label: "비밀 사진 목록", icon: ImagesIcon },
    { label: "차단 목록", icon: ProhibitIcon },
  ],
  [
    { label: "받은 좋아요 목록", icon: HandHeartIcon },
    { label: "받은 즐겨찾기 목록", icon: TrayArrowDownIcon },
    { label: "공개된 비밀 사진 목록", icon: EyeIcon },
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
      onPress={href ? () => router.push(href) : undefined}
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
    </ScrollView>
  );
}
