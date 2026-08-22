import { Stack } from "expo-router";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MemberMeta } from "@/components/MemberMeta";
import { PhotoPager } from "@/components/photo/PhotoPager";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ProfileSection } from "@/components/ProfileSection";
import {
  SCROLL_TO_TOP_BOTTOM_GAP,
  SCROLL_TO_TOP_SIDE_GAP,
} from "@/components/ScrollToTopButton";
import { RetroFloatingButton } from "@/components/ui/RetroFloatingButton";
import { ScreenState } from "@/components/ui/ScreenState";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { MyProfileResponse } from "@/lib/api";
import {
  PROFILE_BIO_EMPTY_MESSAGE,
  PROFILE_COMMENT_EMPTY_MESSAGE,
  PROFILE_ERROR_MESSAGE,
} from "@/lib/message";
import { usePhotoGridStore } from "@/lib/photo/grid-store";
import { pushOnce } from "@/lib/router";

function Profile({ profile }: { profile: MyProfileResponse }) {
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
        {photoGridOpen ? (
          <YStack px="$4" pt="$4">
            <PhotoGrid
              photos={photoUrls}
              showPlaceholders
              secretFrom={publicPhotos.length}
              onPressPhoto={setGridPhotoIndex}
            />
          </YStack>
        ) : (
          <PhotoPager photos={photoUrls} secretFrom={publicPhotos.length} />
        )}

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
            title="코멘트"
            body={comment}
            placeholder={PROFILE_COMMENT_EMPTY_MESSAGE}
          />

          <ProfileSection
            title="자기소개"
            body={bio}
            placeholder={PROFILE_BIO_EMPTY_MESSAGE}
          />
        </YStack>
      </ScrollView>

      <YStack
        position="absolute"
        r={SCROLL_TO_TOP_SIDE_GAP}
        b={SCROLL_TO_TOP_BOTTOM_GAP}
      >
        <RetroFloatingButton onPress={togglePhotoGrid}>
          <SquaresFourIcon
            size={20}
            weight={photoGridOpen ? "fill" : "regular"}
            color="white"
          />
        </RetroFloatingButton>
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

const SCREEN_OPTIONS = {
  title: "내 프로필",
  headerRight: () => (
    <HeaderSoloIconButton
      icon={PencilSimpleIcon}
      onPress={() => pushOnce("/member/edit")}
    />
  ),
};

export default function MyProfileScreen() {
  const { data, isError, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      {data ? (
        <Profile profile={data} />
      ) : (
        <ScreenState
          error={isError}
          message={PROFILE_ERROR_MESSAGE}
          onRetry={refetch}
        />
      )}
    </SafeAreaView>
  );
}
