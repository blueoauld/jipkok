import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";
import { PhotoGrid } from "@/components/PhotoGrid";

const BOTTOM_BAR_HEIGHT = 80;
const NICKNAME_MAX_LENGTH = 10;
const BIO_MAX_LENGTH = 1000;
const MAX_PHOTOS = 6;

const PROFILE = {
  nickname: "닉네임",
  birthYear: "2006",
  bio: "자기소개 내용",
};

async function pickPhotos(remaining: number) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("사진 접근 권한이 필요합니다.");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.8,
  });

  return result.canceled ? [] : result.assets.map((asset) => asset.uri);
}

function usePhotos() {
  const [photos, setPhotos] = useState<string[]>([]);

  const add = useCallback(async () => {
    const picked = await pickPhotos(MAX_PHOTOS - photos.length);
    setPhotos((current) => [...current, ...picked].slice(0, MAX_PHOTOS));
  }, [photos.length]);

  const remove = useCallback((index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }, []);

  return { photos, add, remove };
}

export default function MemberEditScreen() {
  const insets = useSafeAreaInsets();
  const publicPhotos = usePhotos();
  const secretPhotos = usePhotos();

  const nicknameRef = useRef(PROFILE.nickname);
  const birthYearRef = useRef(PROFILE.birthYear);
  const bioRef = useRef(PROFILE.bio);
  const [bioLength, setBioLength] = useState(PROFILE.bio.length);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "프로필 편집" }} />

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
              photos={publicPhotos.photos}
              onAdd={publicPhotos.add}
              onRemove={publicPhotos.remove}
            />
          </YStack>

          <YStack gap="$2">
            <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
              비밀 사진
            </Text>
            <PhotoGrid
              photos={secretPhotos.photos}
              onAdd={secretPhotos.add}
              onRemove={secretPhotos.remove}
            />
          </YStack>

          <FormField>
            <FormInput
              defaultValue={PROFILE.nickname}
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
              defaultValue={PROFILE.birthYear}
              onChangeText={(text) => {
                birthYearRef.current = text;
              }}
              placeholder="출생연도"
              keyboardType="number-pad"
              maxLength={4}
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
              defaultValue={PROFILE.bio}
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
          <Button size="$4" theme="blue" rounded="$7">
            저장
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
