import { Stack } from "expo-router";
import { PencilSimpleIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { PhotoPager } from "@/components/PhotoPager";
import { ProfileSection } from "@/components/ProfileSection";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import { genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const COMMENT_PLACEHOLDER = "아직 코멘트를 작성하지 않았습니다.";
const BIO_PLACEHOLDER = "아직 자기소개를 작성하지 않았습니다.";

function Centered({ children }: { children: ReactNode }) {
  return (
    <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
      {children}
    </YStack>
  );
}

function Profile({ profile }: { profile: MyProfileResponse }) {
  const {
    nickname,
    gender,
    age,
    receivedLikeCount,
    comment,
    bio,
    publicPhotoUrls,
    secretPhotoUrls,
  } = profile;

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <PhotoPager
        photos={[...publicPhotoUrls, ...secretPhotoUrls]}
        secretFrom={publicPhotoUrls.length}
      />

      <YStack gap="$4" p="$4">
        <YStack gap="$1">
          <Text fontSize="$6" fontWeight="700">
            {nickname}
          </Text>
          <Text theme="gray" color="$color10" fontSize="$4">
            {`${genderLabel(gender)} · ${age}살 · ♥ ${receivedLikeCount}`}
          </Text>
        </YStack>

        <ProfileSection
          title="코멘트"
          body={comment}
          placeholder={COMMENT_PLACEHOLDER}
        />

        <ProfileSection
          title="자기소개"
          body={bio}
          placeholder={BIO_PLACEHOLDER}
        />
      </YStack>
    </ScrollView>
  );
}

export default function MyProfileScreen() {
  const { data, isPending, isError, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "내 프로필",
          headerRight: () => (
            <HeaderCircleIconButton
              icon={PencilSimpleIcon}
              onPress={() => pushOnce("/member/edit")}
            />
          ),
        }}
      />

      {isPending && (
        <Centered>
          <Spinner size="small" />
        </Centered>
      )}

      {isError && (
        <Centered>
          <Text color="$gray10" fontSize="$4">
            {ERROR_MESSAGE}
          </Text>

          <Button size="$3" theme="blue" rounded="$7" onPress={() => refetch()}>
            다시 시도
          </Button>
        </Centered>
      )}

      {data && <Profile profile={data} />}
    </SafeAreaView>
  );
}
