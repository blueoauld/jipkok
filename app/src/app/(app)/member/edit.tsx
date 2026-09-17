import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack } from "expo-router";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Button } from "@/components/ui/Button";
import { CountedInput } from "@/components/ui/CountedInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAlert } from "@/hooks/useAlert";
import { useConfirmLeave } from "@/hooks/useConfirmLeave";
import { FEEDS_KEY } from "@/hooks/useFeedPosts";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type MyProfileResponse } from "@/lib/api";
import { FIELD_TEXT_GAP, SHORT_CONTENT_INPUT_ROWS } from "@/lib/design";
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
  onChangeText,
}: {
  valueRef: RefObject<string>;
  initialValue: string;
  onChangeText: (text: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <CountedInput
      valueRef={valueRef}
      multiline
      rows={SHORT_CONTENT_INPUT_ROWS}
      textAlignVertical="top"
      defaultValue={initialValue}
      placeholder={t("auth.setup.bioPlaceholder")}
      maxLength={BIO_MAX_LENGTH}
      onChangeText={onChangeText}
    />
  );
}

function sameKeys(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((key, i) => key === right[i])
  );
}

function EditForm({ profile }: { profile: MyProfileResponse }) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { alertElement, show, showApiError, confirm } = useAlert();
  const [bioDirty, setBioDirty] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<EditValues>({
    defaultValues: {
      nickname: profile.nickname,
      birthYear: String(profile.birthYear),
    },
  });
  const initialBio = profile.bio ?? "";
  const bioRef = useRef(initialBio);

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
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: FEEDS_KEY });
      show("info", t("profileEdit.saved"), () => router.back());
    },
    onError: showApiError,
  });

  const uploading = publicPhotos.uploading || secretPhotos.uploading;
  const progress = publicPhotos.uploading
    ? publicPhotos.progress
    : secretPhotos.progress;

  useLoadingOverlay(uploading, progress.done, progress.total);

  // 사진은 고르는 즉시 올라가므로 저장 없이 나가면 그 변경까지 조용히 버려진다. 한 번 묻는다.
  const dirty =
    isDirty ||
    bioDirty ||
    !sameKeys(
      publicPhotos.objectKeys,
      profile.publicPhotos.map((photo) => photo.objectKey),
    ) ||
    !sameKeys(
      secretPhotos.objectKeys,
      profile.secretPhotos.map((photo) => photo.objectKey),
    );

  // 올리는 중에도 물어야 한다. objectKeys는 한 장씩 끝날 때마다 늘어나므로 그때까지는
  // dirty가 아직 false이고, 저장 없이 나가면 적어 둔 것과 올라간 사진이 함께 버려진다.
  useConfirmLeave((dirty || uploading) && !saved && !save.isPending, confirm);

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
          <Button
            size="xlarge"
            disabled={uploading}
            loading={save.isPending}
            onPress={submit}
          >
            {t("profileEdit.save")}
          </Button>
        }
      >
        <YStack gap={FIELD_TEXT_GAP}>
          <FieldLabel>{t("profileEdit.publicPhotos")}</FieldLabel>
          <PhotoGrid
            photos={publicPhotos.urls}
            onAdd={publicPhotos.add}
            onRemove={publicPhotos.remove}
            onMove={publicPhotos.move}
            showPrimaryBadge
          />
        </YStack>

        <YStack gap={FIELD_TEXT_GAP}>
          <FieldLabel>{t("profileEdit.secretPhotos")}</FieldLabel>
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

        <BioField
          valueRef={bioRef}
          initialValue={initialBio}
          onChangeText={(text) => setBioDirty(text !== initialBio)}
        />
      </FormScreen>

      {alertElement}
    </>
  );
}

export default function MemberEditScreen() {
  const { t } = useTranslation();
  // 네이티브 스택은 이탈 확인 중에 뒤로가기 메뉴로 여러 화면을 건너뛰면 상태가 어긋난다.
  const screenOptions = useMemo(
    () => ({
      title: t("profileEdit.title"),
      headerBackButtonMenuEnabled: false,
    }),
    [t],
  );

  const { data, error, refetch } = useMyProfile();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {data ? (
        <EditForm profile={data} />
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
