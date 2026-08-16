import * as ImagePicker from "expo-image-picker";

import { ApiError } from "@/lib/api";
import { PHOTO_PERMISSION_MESSAGE } from "@/lib/message";

export const MAX_PHOTOS = 6;

const PERMISSION_DENIED_CODE = "PERMISSION_DENIED";
const CAMERA_DENIED_MESSAGE = "카메라 권한이 필요합니다.";

// 취소는 빈 결과로, 권한 거부는 예외로 갈라 호출부가 구분할 수 있게 한다.
function denied(message: string) {
  return new ApiError(0, PERMISSION_DENIED_CODE, message);
}

async function requireLibrary() {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!granted) {
    throw denied(PHOTO_PERMISSION_MESSAGE);
  }
}

async function requireCamera() {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();

  if (!granted) {
    throw denied(CAMERA_DENIED_MESSAGE);
  }
}

export async function pickPhotos(remaining: number) {
  await requireLibrary();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.8,
  });

  return result.canceled ? [] : result.assets;
}

export async function pickSinglePhoto() {
  await requireLibrary();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0];
}

export async function takePhoto() {
  await requireCamera();

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0];
}
