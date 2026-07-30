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
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
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

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
      <Stack.Screen
        options={{
          title: "프로필",
          headerRight: () => (
            <HeaderIconButton icon={DotsThreeIcon} weight="bold" />
          ),
        }}
      />

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
    </SafeAreaView>
  );
}
