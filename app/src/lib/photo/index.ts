import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

import { api, type PhotoVisibility, type ProfilePhoto } from "@/lib/api";
import {
  type IssueUploadUrl,
  uploadFile,
  type UploadProgress,
} from "@/lib/upload";

// 같은 화질에서 JPEG보다 30% 가까이 작다. 사진은 한 번 올라가 여러 번 조회되므로
// 인코딩이 느려지는 대가를 치를 값어치가 있다. 서버는 image/webp를 이미 허용한다.
const CONTENT_TYPE = "image/webp";

const LOCAL_URI_PREFIX = "file://";

// WEBP 인코딩 비용은 픽셀 수에 비례한다. 1440에서 1280으로 낮추면 장당 80ms에서
// 65ms로 준다. 품질값을 낮추는 쪽은 시간에 거의 영향이 없어 해상도로 잡는다.
// PhotoViewer가 확대 보기를 지원하므로 더 낮추면 확대 시 뭉개짐이 보인다.
const MAX_LENGTH = 1280;
const COMPRESS = 0.8;

async function toUploadImage(asset: ImagePickerAsset) {
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
    format: SaveFormat.WEBP,
    compress: COMPRESS,
  });

  return result.uri;
}

const NO_PROGRESS = () => undefined;
const NEVER_ABORT = new AbortController().signal;

async function upload(
  asset: ImagePickerAsset,
  issue: IssueUploadUrl,
): Promise<ProfilePhoto> {
  const uri = await toUploadImage(asset);
  const objectKey = await uploadFile(
    uri,
    CONTENT_TYPE,
    issue,
    NO_PROGRESS,
    NEVER_ABORT,
  );

  return { objectKey, url: uri };
}

// 채팅은 진행률과 취소가 필요하고, 재전송 때 다시 줄이지 않도록 변환을 따로 뗀다.
export function toChatPhoto(asset: ImagePickerAsset) {
  return toUploadImage(asset);
}

export function uploadChatPhotoFile(
  uri: string,
  onProgress: UploadProgress,
  signal: AbortSignal,
) {
  return uploadFile(
    uri,
    CONTENT_TYPE,
    api.chats.createPhotoUploadUrl,
    onProgress,
    signal,
  );
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

export function photoCacheKey(url: string) {
  return url.split("?")[0];
}

export async function saveChatMedia(url: string) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);

  if (!permission.granted) {
    return false;
  }

  const local = url.startsWith(LOCAL_URI_PREFIX)
    ? url
    : (await File.downloadFileAsync(url, Paths.cache)).uri;

  await MediaLibrary.Asset.create(local);

  return true;
}

export function uploadReportPhoto(asset: ImagePickerAsset) {
  return upload(asset, api.reports.createPhotoUploadUrl);
}
