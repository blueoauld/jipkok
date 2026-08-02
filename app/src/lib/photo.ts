import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

import {
  api,
  ApiError,
  type PhotoVisibility,
  type ProfilePhoto,
} from "@/lib/api";

const CONTENT_TYPE = "image/jpeg";

const MAX_LENGTH = 1440;
const COMPRESS = 0.8;

const UPLOAD_FAILED_CODE = "PHOTO_UPLOAD_FAILED";
const UPLOAD_FAILED_MESSAGE = "사진을 업로드하지 못했습니다.";

type IssueUploadUrl = (
  contentType: string,
) => Promise<{ uploadUrl: string; objectKey: string }>;

async function toJpeg(asset: ImagePickerAsset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);

  if (longest > MAX_LENGTH) {
    context.resize(
      asset.width >= asset.height
        ? { width: MAX_LENGTH }
        : { height: MAX_LENGTH },
    );
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: COMPRESS,
  });

  return result.uri;
}

async function upload(
  asset: ImagePickerAsset,
  issue: IssueUploadUrl,
): Promise<ProfilePhoto> {
  const uri = await toJpeg(asset);
  const { uploadUrl, objectKey } = await issue(CONTENT_TYPE);

  const result = await new File(uri).upload(uploadUrl, {
    httpMethod: "PUT",
    headers: { "Content-Type": CONTENT_TYPE },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(
      result.status,
      UPLOAD_FAILED_CODE,
      UPLOAD_FAILED_MESSAGE,
    );
  }

  return { objectKey, url: uri };
}

export function uploadProfilePhoto(
  asset: ImagePickerAsset,
  visibility: PhotoVisibility,
) {
  return upload(asset, (contentType) =>
    api.members.createPhotoUploadUrl({ contentType, visibility }),
  );
}

export function uploadFeedPhoto(asset: ImagePickerAsset) {
  return upload(asset, api.feeds.createPhotoUploadUrl).then(
    (photo) => photo.objectKey,
  );
}

export function uploadChatPhoto(asset: ImagePickerAsset) {
  return upload(asset, api.chats.createPhotoUploadUrl).then(
    (photo) => photo.objectKey,
  );
}

export function uploadReportPhoto(asset: ImagePickerAsset) {
  return upload(asset, api.reports.createPhotoUploadUrl);
}
