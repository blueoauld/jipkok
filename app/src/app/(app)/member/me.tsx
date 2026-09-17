import { Stack } from "expo-router";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { ProfileSection } from "@/components/ProfileSection";
import { ScreenState } from "@/components/ui/ScreenState";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import { SCREEN_PADDING } from "@/lib/design";
import {
  bioCopiedMessage,
  commentCopiedMessage,
  profileBioEmptyMessage,
  profileCommentEmptyMessage,
  profileErrorMessage,
} from "@/lib/message";
import { usePhotoGridStore } from "@/lib/photo/grid-store";
import { pushOnce } from "@/lib/router";

function Profile({ profile }: { profile: MyProfileResponse }) {
  const { t } = useTranslation();
  const photoGridOpen = usePhotoGridStore((state) => state.open);
  const togglePhotoGrid = usePhotoGridStore((state) => state.toggle);
  const [gridPhotoIndex, setGridPhotoIndex] = useState<number | null>(null);
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
        <ProfilePhotos
          photos={photoUrls}
          secretFrom={publicPhotos.length}
          gridOpen={photoGridOpen}
          onPressPhoto={setGridPhotoIndex}
        />

        <ProfileHeader
          nickname={nickname}
          gender={gender}
          age={age}
          receivedLikeCount={receivedLikeCount}
        />

        <ProfileSection
          title={t("profile.comment")}
          body={comment}
          placeholder={profileCommentEmptyMessage()}
          copiedMessage={commentCopiedMessage()}
        />

        <ProfileSection
          title={t("profile.bio")}
          body={bio}
          placeholder={profileBioEmptyMessage()}
          copiedMessage={bioCopiedMessage()}
        />
      </ScrollView>

      <YStack position="absolute" r={SCREEN_PADDING} b={SCREEN_PADDING}>
        <PhotoGridToggle open={photoGridOpen} onPress={togglePhotoGrid} />
      </YStack>

      <PhotoViewer
        photos={photoUrls}
        initialIndex={gridPhotoIndex ?? 0}
        open={gridPhotoIndex !== null}
        onClose={() => setGridPhotoIndex(null)}
      />
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
