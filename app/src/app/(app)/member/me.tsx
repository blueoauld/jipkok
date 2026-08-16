import { Stack } from "expo-router";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
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
import { genderLabel } from "@/lib/member";
import { PROFILE_ERROR_MESSAGE } from "@/lib/message";
import { usePhotoGridStore } from "@/lib/photo/grid-store";
import { pushOnce } from "@/lib/router";

const LIKE_ICON_SIZE = 14;

const COMMENT_PLACEHOLDER = "아직 코멘트를 작성하지 않았습니다.";
const BIO_PLACEHOLDER = "아직 자기소개를 작성하지 않았습니다.";

function Profile({ profile }: { profile: MyProfileResponse }) {
  const theme = useTheme();
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
            <XStack items="center">
              <Text fontSize="$4">
                {`${genderLabel(gender)} · ${age}살 · `}
              </Text>

              <XStack items="center" gap="$1">
                <HeartIcon
                  size={LIKE_ICON_SIZE}
                  weight="fill"
                  color={theme.color12.val}
                />

                <Text fontSize="$4">{receivedLikeCount}</Text>
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
    <HeaderCircleIconButton
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
