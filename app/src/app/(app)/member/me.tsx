import { Stack } from "expo-router";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { ProfileBody } from "@/components/ProfileBody";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { ScreenState } from "@/components/ui/ScreenState";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import { SCREEN_PADDING } from "@/lib/design";
import { profileErrorMessage } from "@/lib/message";
import { pushOnce } from "@/lib/router";

function Profile({ profile }: { profile: MyProfileResponse }) {
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

  const photoUrls = useMemo(
    () => [...publicPhotos, ...secretPhotos].map((photo) => photo.url),
    [publicPhotos, secretPhotos],
  );

  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <ProfilePhotos photos={photoUrls} secretFrom={publicPhotos.length} />

        <ProfileHeader
          nickname={nickname}
          gender={gender}
          age={age}
          receivedLikeCount={receivedLikeCount}
        />

        <ProfileBody comment={comment} bio={bio} />
      </ScrollView>

      <YStack position="absolute" r={SCREEN_PADDING} b={SCREEN_PADDING}>
        <PhotoGridToggle />
      </YStack>
    </YStack>
  );
}

export default function MyProfileScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({
      title: t("list.myProfile"),
      headerRight: () => (
        <HeaderIconButton
          icon={PencilSimpleIcon}
          label={t("a11y.editProfile")}
          onPress={() => pushOnce("/member/edit")}
        />
      ),
    }),
    [t],
  );

  const { data, error, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {data ? (
        <Profile profile={data} />
      ) : (
        <ScreenState
          error={error}
          message={profileErrorMessage()}
          onRetry={refetch}
        />
      )}
    </SafeAreaView>
  );
}
