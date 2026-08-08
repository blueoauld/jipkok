import { Stack } from "expo-router";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { PhotoPager } from "@/components/PhotoPager";
import { ProfileSection } from "@/components/ProfileSection";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import { genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const LIKE_ICON_SIZE = 14;

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
  const theme = useTheme();
  const {
    nickname,
    gender,
    age,
    receivedLikeCount,
    comment,
    bio,
    publicPhotos,
    secretPhotos,
  } = profile;

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <PhotoPager
        photos={[...publicPhotos, ...secretPhotos].map((photo) => photo.url)}
        secretFrom={publicPhotos.length}
      />

      <YStack gap="$4" p="$4">
        <YStack gap="$1">
          <Text fontSize="$6" fontWeight="700">
            {nickname}
          </Text>
          <XStack items="center">
            <Text theme="gray" color="$color10" fontSize="$4">
              {`${genderLabel(gender)} · ${age}살 · `}
            </Text>

            <XStack items="center" gap="$1">
              <HeartIcon
                size={LIKE_ICON_SIZE}
                weight="fill"
                color={theme.gray10.val}
              />

              <Text theme="gray" color="$color10" fontSize="$4">
                {receivedLikeCount}
              </Text>
            </XStack>
          </XStack>
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
  const { data, isError, refetch } = useMyProfile();

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

      {data ? (
        <Profile profile={data} />
      ) : isError ? (
        <Centered>
          <Text color="$gray10" fontSize="$4">
            {ERROR_MESSAGE}
          </Text>

          <Button size="$3" theme="blue" rounded="$7" onPress={() => refetch()}>
            다시 시도
          </Button>
        </Centered>
      ) : (
        <Centered>
          <Spinner size="small" />
        </Centered>
      )}
    </SafeAreaView>
  );
}
