import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type MyProfileResponse } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";
import { validateBirthYear } from "@/lib/member";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadProfilePhoto } from "@/lib/photo";
import { NICKNAME_PATTERN } from "@/lib/validation";

const BOTTOM_BAR_HEIGHT = 80;
const NICKNAME_MAX_LENGTH = 10;
const BIO_MAX_LENGTH = 1000;
const BIRTH_YEAR_LENGTH = 4;

const uploadPublicPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "PUBLIC");
const uploadSecretPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "SECRET");

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const NICKNAME_REQUIRED_MESSAGE = "닉네임을 입력해주시길 바랍니다.";
const INVALID_NICKNAME_MESSAGE = "닉네임이 올바르지 않습니다.";
const INVALID_BIRTH_YEAR_MESSAGE = "출생연도가 올바르지 않습니다.";
const EDITED_MESSAGE = "프로필이 편집되었습니다.";

function Centered({ children }: { children: ReactNode }) {
  return (
    <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
      {children}
    </YStack>
  );
}

function BioField({
  valueRef,
  initialValue,
}: {
  valueRef: { current: string };
  initialValue: string;
}) {
  const [length, setLength] = useState(initialValue.length);

  return (
    <FormField
      right={
        <Text theme="gray" color="$color11">
          {`${length} / ${BIO_MAX_LENGTH}`}
        </Text>
      }
    >
      <RetroInput
        multiline
        rows={7}
        textAlignVertical="top"
        defaultValue={initialValue}
        onChangeText={(text) => {
          valueRef.current = text;
          setLength(text.length);
        }}
        placeholder="자기소개"
        maxLength={BIO_MAX_LENGTH}
      />
    </FormField>
  );
}

function EditForm({ profile }: { profile: MyProfileResponse }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { alertElement, show, showApiError } = useRetroAlert();
  const publicPhotos = useUploadPhotos(
    uploadPublicPhoto,
    showApiError,
    profile.publicPhotos,
  );
  const secretPhotos = useUploadPhotos(
    uploadSecretPhoto,
    showApiError,
    profile.secretPhotos,
  );

  const nicknameRef = useRef(profile.nickname);
  const birthYearRef = useRef(String(profile.birthYear));
  const bioRef = useRef(profile.bio ?? "");

  const save = useMutation({
    mutationFn: (values: { nickname: string; birthYear: number }) =>
      api.members.editProfile({
        nickname: values.nickname,
        birthYear: values.birthYear,
        bio: bioRef.current || null,
        publicPhotoKeys: publicPhotos.objectKeys,
        secretPhotoKeys: secretPhotos.objectKeys,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      show("info", EDITED_MESSAGE, () => router.back());
    },
    onError: showApiError,
  });

  const uploading = publicPhotos.uploading || secretPhotos.uploading;

  useLoadingOverlay(uploading);
  const busy = save.isPending || uploading;

  const submit = () => {
    const nickname = nicknameRef.current.trim();

    if (!nickname) {
      show("error", NICKNAME_REQUIRED_MESSAGE);
      return;
    }

    if (!NICKNAME_PATTERN.test(nickname)) {
      show("error", INVALID_NICKNAME_MESSAGE);
      return;
    }

    const birthYear = Number(birthYearRef.current);

    if (birthYearRef.current.length !== BIRTH_YEAR_LENGTH || !birthYear) {
      show("error", INVALID_BIRTH_YEAR_MESSAGE);
      return;
    }

    const range = validateBirthYear(birthYearRef.current);

    if (range !== true) {
      show("error", range);
      return;
    }

    save.mutate({ nickname, birthYear });
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <YStack gap="$2">
            <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
              공개 사진
            </Text>
            <PhotoGrid
              photos={publicPhotos.urls}
              onAdd={publicPhotos.add}
              onRemove={publicPhotos.remove}
              onMove={publicPhotos.move}
              showPrimaryBadge
            />
          </YStack>

          <YStack gap="$2">
            <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
              비밀 사진
            </Text>
            <PhotoGrid
              photos={secretPhotos.urls}
              onAdd={secretPhotos.add}
              onRemove={secretPhotos.remove}
              onMove={secretPhotos.move}
            />
          </YStack>

          <FormField>
            <RetroInput
              defaultValue={profile.nickname}
              onChangeText={(text) => {
                nicknameRef.current = text;
              }}
              placeholder="닉네임"
              maxLength={NICKNAME_MAX_LENGTH}
              textContentType="nickname"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>

          <FormField>
            <RetroInput
              defaultValue={String(profile.birthYear)}
              onChangeText={(text) => {
                birthYearRef.current = text;
              }}
              placeholder="출생연도"
              keyboardType="number-pad"
              maxLength={BIRTH_YEAR_LENGTH}
            />
          </FormField>

          <BioField valueRef={bioRef} initialValue={profile.bio ?? ""} />
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <RetroButton
            disabled={busy}
            opacity={busy ? DISABLED_OPACITY : 1}
            onPress={submit}
          >
            {save.isPending ? <Spinner color="white" /> : "저장"}
          </RetroButton>
        </YStack>
      </KeyboardStickyView>

      {alertElement}
    </>
  );
}

export default function MemberEditScreen() {
  const { data, isError, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "프로필 편집" }} />

      {data ? (
        <EditForm profile={data} />
      ) : isError ? (
        <Centered>
          <ErrorState message={ERROR_MESSAGE} onRetry={() => refetch()} />
        </Centered>
      ) : (
        <Centered>
          <Spinner size="small" />
        </Centered>
      )}
    </SafeAreaView>
  );
}
