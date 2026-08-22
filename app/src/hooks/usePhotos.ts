import * as ImagePicker from "expo-image-picker";

import { ApiError } from "@/lib/api";
import i18n from "@/lib/i18n";
import { photoPermissionMessage } from "@/lib/message";
import { VIDEO_MAX_SECONDS } from "@/lib/video";

export const MAX_PHOTOS = 6;

const PICK_QUALITY = 1;

const PERMISSION_DENIED_CODE = "PERMISSION_DENIED";
const CAMERA_DENIED_MESSAGE = i18n.t("hook.cameraDenied");

// 취소는 빈 결과로, 권한 거부는 예외로 갈라 호출부가 구분할 수 있게 한다.
function denied(message: string) {
  return new ApiError(0, PERMISSION_DENIED_CODE, message);
}

async function requireLibrary() {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!granted) {
    throw denied(photoPermissionMessage());
  }
}

async function requireCamera() {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();

  if (!granted) {
    throw denied(CAMERA_DENIED_MESSAGE);
  }
}

// iOS의 HEVC/HDR 원본은 압축기가 못 다루는 경우가 있어 호환 표현(H.264)으로 받는다.
export async function pickChatMedia(remaining: number) {
  await requireLibrary();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: PICK_QUALITY,
    videoMaxDuration: VIDEO_MAX_SECONDS,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  return result.canceled ? [] : result.assets;
}

export async function pickPhotos(remaining: number) {
  await requireLibrary();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: PICK_QUALITY,
  });

  return result.canceled ? [] : result.assets;
}

export async function pickSinglePhoto() {
  await requireLibrary();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: PICK_QUALITY,
  });

  return result.canceled ? null : result.assets[0];
}

export async function takePhoto() {
  await requireCamera();

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: PICK_QUALITY,
  });

  return result.canceled ? null : result.assets[0];
}
