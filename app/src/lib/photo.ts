import type { ImagePickerAsset } from "expo-image-picker";

import { api, ApiError, type ProfilePhoto } from "@/lib/api";

const DEFAULT_CONTENT_TYPE = "image/jpeg";

const UPLOAD_FAILED_CODE = "PHOTO_UPLOAD_FAILED";
const UPLOAD_FAILED_MESSAGE = "사진을 업로드하지 못했습니다.";

export async function uploadPhoto(
  asset: ImagePickerAsset,
): Promise<ProfilePhoto> {
  const contentType = asset.mimeType ?? DEFAULT_CONTENT_TYPE;
  const { uploadUrl, objectKey } =
    await api.members.createPhotoUploadUrl(contentType);

  const body = await (await fetch(asset.uri)).blob();
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      UPLOAD_FAILED_CODE,
      UPLOAD_FAILED_MESSAGE,
    );
  }

  return { objectKey, url: asset.uri };
}
