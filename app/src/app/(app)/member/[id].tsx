import { Stack, useLocalSearchParams } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  ChatCircleIcon,
  DotsThreeIcon,
  HeartIcon,
  ImageIcon,
  ProhibitIcon,
  StarIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sheet, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { PhotoPager } from "@/components/PhotoPager";
import { ProfileSection } from "@/components/ProfileSection";

const ACTION_ICON_SIZE = 30;
const ACTION_BAR_HEIGHT = ACTION_ICON_SIZE + 10 + 15 + 6;

const ACTIONS: { key: string; icon: Icon }[] = [
  { key: "like", icon: HeartIcon },
  { key: "favorite", icon: StarIcon },
  { key: "chat", icon: ChatCircleIcon },
  { key: "secretPhoto", icon: ImageIcon },
  { key: "block", icon: ProhibitIcon },
];

function ActionBar() {
  const theme = useTheme();

  return (
    <XStack
      height={ACTION_BAR_HEIGHT}
      items="center"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderColor="$borderColor"
    >
      {ACTIONS.map(({ key, icon: Icon }) => (
        <XStack
          key={key}
          flex={1}
          height="100%"
          items="center"
          justify="center"
          pressStyle={{ opacity: 0.6 }}
        >
          <Icon size={ACTION_ICON_SIZE} color={theme.color10.val} />
        </XStack>
      ))}
    </XStack>
  );
}

const MENU_ITEMS: { label: string; destructive?: boolean }[] = [
  { label: "비밀 사진 공개" },
  { label: "신고하기", destructive: true },
];

function MoreMenuSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay opacity={0.6} />
      <Sheet.Handle bg="$color3" />

      <Sheet.Frame bg="$color3" p="$4" pb="$6" gap="$2">
        {MENU_ITEMS.map(({ label, destructive }) => (
          <XStack
            key={label}
            items="center"
            p="$3"
            rounded="$5"
            pressStyle={{ bg: "$color4" }}
            onPress={() => onOpenChange(false)}
          >
            <Text fontSize="$4" color={destructive ? "$red10" : "$color"}>
              {label}
            </Text>
          </XStack>
        ))}
      </Sheet.Frame>
    </Sheet>
  );
}

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      title: "프로필",
      headerRight: () => (
        <HeaderCircleIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [openMenu],
  );

  const profile = {
    nickname: `닉네임 ${id}`,
    gender: "남자",
    age: 20,
    likeCount: 100,
    updatedAt: "3일 전",
    distance: "0.2km",
    comment: "코멘트 내용",
    bio: "자기소개 내용",
    photos: [0, 1, 2, 3].map(
      (seed) => `https://picsum.photos/seed/${id}-${seed}/800/1000`,
    ),
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <PhotoPager photos={profile.photos} />

        <YStack gap="$4" p="$4">
          <YStack gap="$1">
            <XStack items="center" justify="space-between" gap="$2">
              <Text flex={1} numberOfLines={1} fontSize="$6" fontWeight="700">
                {profile.nickname}
              </Text>
              <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
                {profile.updatedAt}
              </Text>
            </XStack>

            <XStack items="center" justify="space-between" gap="$2">
              <Text
                flex={1}
                numberOfLines={1}
                theme="gray"
                color="$color10"
                fontSize="$4"
              >
                {`${profile.gender} · ${profile.age}살 · ♥ ${profile.likeCount}`}
              </Text>
              <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
                {profile.distance}
              </Text>
            </XStack>
          </YStack>

          <ProfileSection title="코멘트" body={profile.comment} />
          <ProfileSection title="자기소개" body={profile.bio} />
        </YStack>
      </ScrollView>

      <ActionBar />

      <MoreMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </SafeAreaView>
  );
}
