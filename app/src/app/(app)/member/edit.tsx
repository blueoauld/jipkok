import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { ScreenState } from "@/components/ui/ScreenState";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type MyProfileResponse } from "@/lib/api";
import { PROFILE_ERROR_MESSAGE } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadProfilePhoto } from "@/lib/photo";
import {
  BIO_MAX_LENGTH,
  BIRTH_YEAR_LENGTH,
  NICKNAME_MAX_LENGTH,
  validateBirthYear,
  validateNickname,
} from "@/lib/validation";

const uploadPublicPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "PUBLIC");
const uploadSecretPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "SECRET");

const EDITED_MESSAGE = "프로필을 저장했습니다.";

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
    const nickname = validateNickname(nicknameRef.current);

    if (nickname !== true) {
      show("error", nickname);
      return;
    }

    const birthYear = validateBirthYear(birthYearRef.current);

    if (birthYear !== true) {
      show("error", birthYear);
      return;
    }

    save.mutate({
      nickname: nicknameRef.current.trim(),
      birthYear: Number(birthYearRef.current),
    });
  };

  return (
    <>
      <FormScreen
        footer={
          <RetroButton disabled={busy} onPress={submit}>
            {save.isPending ? <Spinner color="white" /> : "저장"}
          </RetroButton>
        }
      >
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
      </FormScreen>

      {alertElement}
    </>
  );
}

const SCREEN_OPTIONS = { title: "프로필 편집" };

export default function MemberEditScreen() {
  const { data, isError, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      {data ? (
        <EditForm profile={data} />
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
