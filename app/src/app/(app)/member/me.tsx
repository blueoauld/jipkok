import { Stack } from "expo-router";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MemberMeta } from "@/components/MemberMeta";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { ProfileSection } from "@/components/ProfileSection";
import { ScreenState } from "@/components/ui/ScreenState";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/lib/design";
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
          pt="$4"
        />

        <YStack gap="$4" p="$4">
          <YStack gap="$1">
            <Text fontSize="$6" fontWeight="700">
              {nickname}
            </Text>
            <MemberMeta
              gender={gender}
              age={age}
              receivedLikeCount={receivedLikeCount}
              size="md"
            />
          </YStack>

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
        </YStack>
      </ScrollView>

      <PhotoGridToggle
        open={photoGridOpen}
        bottom={SCROLL_TO_TOP_BOTTOM_GAP}
        onPress={togglePhotoGrid}
      />

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
        <HeaderSoloIconButton
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
