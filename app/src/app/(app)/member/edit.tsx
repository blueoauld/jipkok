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
import { Button, Spinner, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";
import { PhotoGrid } from "@/components/PhotoGrid";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { alertApiError, alertMessage } from "@/lib/alert";
import { api, type MyProfileResponse } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadProfilePhoto } from "@/lib/photo";

const BOTTOM_BAR_HEIGHT = 80;
const NICKNAME_MAX_LENGTH = 10;
const BIO_MAX_LENGTH = 1000;
const BIRTH_YEAR_LENGTH = 4;

const uploadPublicPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "PUBLIC");
const uploadSecretPhoto = (asset: ImagePickerAsset) =>
  uploadProfilePhoto(asset, "SECRET");

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const INVALID_BIRTH_YEAR_MESSAGE = "출생연도가 올바르지 않습니다.";

function Centered({ children }: { children: ReactNode }) {
  return (
    <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
      {children}
    </YStack>
  );
}

function EditForm({ profile }: { profile: MyProfileResponse }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const publicPhotos = useUploadPhotos(uploadPublicPhoto, profile.publicPhotos);
  const secretPhotos = useUploadPhotos(uploadSecretPhoto, profile.secretPhotos);

  const nicknameRef = useRef(profile.nickname);
  const birthYearRef = useRef(String(profile.birthYear));
  const bioRef = useRef(profile.bio ?? "");
  const [bioLength, setBioLength] = useState((profile.bio ?? "").length);

  const save = useMutation({
    mutationFn: (birthYear: number) =>
      api.members.editProfile({
        nickname: nicknameRef.current,
        birthYear,
        bio: bioRef.current || null,
        publicPhotoKeys: publicPhotos.objectKeys,
        secretPhotoKeys: secretPhotos.objectKeys,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      router.back();
    },
    onError: alertApiError,
  });

  const uploading = publicPhotos.uploading || secretPhotos.uploading;

  useLoadingOverlay(uploading);
  const busy = save.isPending || uploading;

  const submit = () => {
    const birthYear = Number(birthYearRef.current);

    if (birthYearRef.current.length !== BIRTH_YEAR_LENGTH || !birthYear) {
      alertMessage(INVALID_BIRTH_YEAR_MESSAGE);
      return;
    }

    save.mutate(birthYear);
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
            <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
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
            <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
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
            <FormInput
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
            <FormInput
              defaultValue={String(profile.birthYear)}
              onChangeText={(text) => {
                birthYearRef.current = text;
              }}
              placeholder="출생연도"
              keyboardType="number-pad"
              maxLength={BIRTH_YEAR_LENGTH}
            />
          </FormField>

          <FormField
            right={
              <Text theme="gray" color="$color10">
                {`${bioLength} / ${BIO_MAX_LENGTH}`}
              </Text>
            }
          >
            <FormInput
              multiline
              rows={7}
              textAlignVertical="top"
              defaultValue={profile.bio ?? ""}
              onChangeText={(text) => {
                bioRef.current = text;
                setBioLength(text.length);
              }}
              placeholder="자기소개"
              maxLength={BIO_MAX_LENGTH}
            />
          </FormField>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button
            size="$4"
            theme="blue"
            rounded="$7"
            opacity={busy ? DISABLED_OPACITY : 1}
            onPress={() => {
              if (!busy) {
                submit();
              }
            }}
          >
            저장
          </Button>
        </YStack>
      </KeyboardStickyView>
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
          <Text color="$gray10" fontSize="$4">
            {ERROR_MESSAGE}
          </Text>

          <Button size="$3" theme="blue" rounded="$7" onPress={() => refetch()}>
            다시 시도
          </Button>
        </Centered>
      ) : (
        <Centered>
          <Spinner size="small" />
        </Centered>
      )}
    </SafeAreaView>
  );
}
