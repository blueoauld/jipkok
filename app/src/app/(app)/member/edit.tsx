import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack } from "expo-router";
import { type RefObject, useRef } from "react";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { ScreenState } from "@/components/ui/ScreenState";
import { FEEDS_KEY } from "@/hooks/useFeedPosts";
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
  BIRTH_YEAR_RULES,
  NICKNAME_MAX_LENGTH,
  NICKNAME_RULES,
} from "@/lib/validation";

const uploadPublicPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "PUBLIC");
const uploadSecretPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "SECRET");

const EDITED_MESSAGE = "프로필을 저장했습니다.";

type EditValues = { nickname: string; birthYear: string };

function BioField({
  valueRef,
  initialValue,
}: {
  valueRef: RefObject<string>;
  initialValue: string;
}) {
  return (
    <CountedInput
      valueRef={valueRef}
      multiline
      rows={7}
      textAlignVertical="top"
      defaultValue={initialValue}
      placeholder="자기소개"
      maxLength={BIO_MAX_LENGTH}
    />
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

  const { control, handleSubmit } = useForm<EditValues>({
    defaultValues: {
      nickname: profile.nickname,
      birthYear: String(profile.birthYear),
    },
  });
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
      queryClient.invalidateQueries({ queryKey: FEEDS_KEY });
      show("info", EDITED_MESSAGE, () => router.back());
    },
    onError: showApiError,
  });

  const uploading = publicPhotos.uploading || secretPhotos.uploading;

  useLoadingOverlay(uploading);
  const busy = save.isPending || uploading;

  const submit = handleSubmit((values) =>
    save.mutate({
      nickname: values.nickname.trim(),
      birthYear: Number(values.birthYear),
    }),
  );

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

        <ControlledInput
          control={control}
          name="nickname"
          rules={NICKNAME_RULES}
          placeholder="닉네임"
          maxLength={NICKNAME_MAX_LENGTH}
          textContentType="nickname"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ControlledInput
          control={control}
          name="birthYear"
          rules={BIRTH_YEAR_RULES}
          placeholder="출생연도"
          keyboardType="number-pad"
          maxLength={BIRTH_YEAR_LENGTH}
        />

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
