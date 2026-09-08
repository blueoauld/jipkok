import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack, useNavigation } from "expo-router";
// expo-router가 usePreventRemove를 공개 export하지 않아 내장된 react-navigation에서 가져온다.
import { usePreventRemove } from "expo-router/build/react-navigation";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
      rows={7}
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
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const navigation = useNavigation();
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
  const busy = save.isPending || uploading;

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

  usePreventRemove(dirty && !saved && !busy, ({ data }) =>
    confirm({
      message: t("profileEdit.discardConfirm"),
      confirmLabel: t("action.discard"),
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

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
          <SectionLabel>{t("profileEdit.publicPhotos")}</SectionLabel>
          <PhotoGrid
            photos={publicPhotos.urls}
            onAdd={publicPhotos.add}
            onRemove={publicPhotos.remove}
            onMove={publicPhotos.move}
            showPrimaryBadge
          />
        </YStack>

        <YStack gap="$2">
          <SectionLabel>{t("profileEdit.secretPhotos")}</SectionLabel>
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
