import { Stack } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { PhotoPager } from "@/components/PhotoPager";
import { ProfileSection } from "@/components/ProfileSection";

const PROFILE = {
  nickname: "닉네임",
  gender: "남자",
  age: 20,
  likeCount: 100,
  comment: "코멘트 내용",
  bio: "자기소개 내용",
  photos: [0, 1, 2, 3].map(
    (seed) => `https://picsum.photos/seed/${seed}/800/1000`,
  ),
};

export default function MyProfileScreen() {
  const { nickname, gender, age, likeCount, comment, bio, photos } = PROFILE;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: "내 프로필" }} />

        <PhotoPager photos={photos} />

        <YStack gap="$4" p="$4">
          <YStack gap="$1">
            <Text fontSize="$6" fontWeight="700">
              {nickname}
            </Text>
            <Text theme="gray" color="$color10" fontSize="$4">
              {`${gender} · ${age}살 · ♥ ${likeCount}`}
            </Text>
          </YStack>

          <ProfileSection title="코멘트" body={comment} />
          <ProfileSection title="자기소개" body={bio} />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
