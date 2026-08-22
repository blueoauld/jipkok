import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack } from "expo-router";
import { type RefObject, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { profileErrorMessage } from "@/lib/message";
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

type EditValues = { nickname: string; birthYear: string };

function BioField({
  valueRef,
  initialValue,
}: {
  valueRef: RefObject<string>;
  initialValue: string;
}) {
  const { t } = useTranslation();

  return (
    <CountedInput
      valueRef={valueRef}
      multiline
      rows={7}
      textAlignVertical="top"
      defaultValue={initialValue}
      placeholder={t("auth.setup.bioPlaceholder")}
      maxLength={BIO_MAX_LENGTH}
    />
  );
}

function EditForm({ profile }: { profile: MyProfileResponse }) {
  const { t } = useTranslation();

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
      show("info", t("profileEdit.saved"), () => router.back());
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
            {save.isPending ? <Spinner color="white" /> : t("profileEdit.save")}
          </RetroButton>
        }
      >
        <YStack gap="$2">
          <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
            {t("profileEdit.publicPhotos")}
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
            {t("profileEdit.secretPhotos")}
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
          placeholder={t("auth.setup.nicknamePlaceholder")}
          maxLength={NICKNAME_MAX_LENGTH}
          textContentType="nickname"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ControlledInput
          control={control}
          name="birthYear"
          rules={BIRTH_YEAR_RULES}
          placeholder={t("auth.setup.birthYearPlaceholder")}
          keyboardType="number-pad"
          maxLength={BIRTH_YEAR_LENGTH}
        />

        <BioField valueRef={bioRef} initialValue={profile.bio ?? ""} />
      </FormScreen>

      {alertElement}
    </>
  );
}

export default function MemberEditScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("profileEdit.title") }), [t]);

  const { data, isError, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {data ? (
        <EditForm profile={data} />
      ) : (
        <ScreenState
          error={isError}
          message={profileErrorMessage()}
          onRetry={refetch}
        />
      )}
    </SafeAreaView>
  );
}
