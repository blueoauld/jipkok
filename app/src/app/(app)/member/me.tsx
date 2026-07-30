import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

const PHOTO_RATIO = 0.8;

const PROFILE = {
  nickname: "닉네임",
  gender: "남자",
  age: 20,
  likeCount: 100,
  comment: "코멘트 내용",
  bio: "자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용자기소개 내용",
  photos: [0, 1, 2, 3].map(
    (seed) => `https://picsum.photos/seed/${seed}/800/1000`,
  ),
};

function PhotoPager({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  return (
    <YStack>
      <FlatList
        data={photos}
        keyExtractor={(uri) => uri}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <Image
            source={item}
            contentFit="cover"
            style={{ width, height: width * PHOTO_RATIO }}
          />
        )}
      />

      <XStack position="absolute" b="$3" l={0} r={0} justify="center" gap="$2">
        {photos.map((uri, photoIndex) => (
          <YStack
            key={uri}
            width={6}
            height={6}
            rounded={9999}
            bg="white"
            opacity={photoIndex === index ? 1 : 0.4}
          />
        ))}
      </XStack>
    </YStack>
  );
}

function ProfileSection({ title, body }: { title: string; body: string }) {
  return (
    <YStack gap="$2">
      <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
        {title}
      </Text>
      <Text fontSize="$4" bg="$gray4" rounded="$5" p="$4">
        {body}
      </Text>
    </YStack>
  );
}

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
