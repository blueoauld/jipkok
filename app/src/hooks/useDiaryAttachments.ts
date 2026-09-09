import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";

import type {
  DiaryAttachmentRequest,
  DiaryAttachmentResponse,
} from "@/lib/api";
import i18n from "@/lib/i18n";
import { uploadDiaryPhoto } from "@/lib/photo";
import { pickMedia } from "@/lib/photo/picker";
import { showToast } from "@/lib/toast/store";
import { describeUploadError } from "@/lib/upload";
import { DIARY_ATTACHMENTS_MAX } from "@/lib/validation";
import {
  compressVideo,
  createVideoThumbnail,
  isVideoTooLong,
  uploadDiaryVideo,
  VIDEO_TOO_LONG_MESSAGE,
  videoDurationSeconds,
} from "@/lib/video";

export type DiaryDraftAttachment =
  | { kind: "saved"; key: string; attachment: DiaryAttachmentResponse }
  | { kind: "photo"; key: string; asset: ImagePickerAsset }
  | {
      kind: "video";
      key: string;
      asset: ImagePickerAsset;
      thumbnailUri: string;
    };

const UNKNOWN_DURATION_MESSAGE = i18n.t("hook.videoDurationUnknown");
const KEEP_FOREGROUND_MESSAGE = i18n.t("hook.keepForeground");
const NO_PROGRESS = () => undefined;
const NEVER_ABORT = new AbortController().signal;

let draftSequence = 0;

function nextKey() {
  draftSequence += 1;

  return `draft-${draftSequence}`;
}

export function isDraftVideo(item: DiaryDraftAttachment) {
  return (
    item.kind === "video" ||
    (item.kind === "saved" && item.attachment.type === "VIDEO")
  );
}

export function draftPreviewUri(item: DiaryDraftAttachment) {
  switch (item.kind) {
    case "saved":
      return item.attachment.thumbnailUrl ?? item.attachment.url;
    case "photo":
      return item.asset.uri;
    case "video":
      return item.thumbnailUri;
  }
}

export function draftMediaUri(item: DiaryDraftAttachment) {
  return item.kind === "saved" ? item.attachment.url : item.asset.uri;
}

export function draftDurationSeconds(item: DiaryDraftAttachment) {
  switch (item.kind) {
    case "saved":
      return item.attachment.durationSeconds ?? null;
    case "photo":
      return null;
    case "video":
      return videoDurationSeconds(item.asset);
  }
}

export function useDiaryAttachments(
  initial: DiaryAttachmentResponse[],
  onError: (error: unknown) => void,
) {
  const [items, setItems] = useState<DiaryDraftAttachment[]>(() =>
    initial.map((attachment) => ({
      kind: "saved",
      key: attachment.objectKey,
      attachment,
    })),
  );
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const add = useCallback(async () => {
    let assets: ImagePickerAsset[];

    try {
      assets = await pickMedia(DIARY_ATTACHMENTS_MAX - items.length);
    } catch (error) {
      onError(error);
      return;
    }

    const picked: DiaryDraftAttachment[] = [];
    let unknownDuration = false;
    let tooLong = false;

    for (const asset of assets) {
      if (asset.type !== "video") {
        picked.push({ kind: "photo", key: nextKey(), asset });
        continue;
      }

      if (asset.duration == null) {
        unknownDuration = true;
        continue;
      }

      if (isVideoTooLong(asset)) {
        tooLong = true;
        continue;
      }

      try {
        const thumbnailUri = await createVideoThumbnail(asset.uri);

        picked.push({ kind: "video", key: nextKey(), asset, thumbnailUri });
      } catch (error) {
        onError(describeUploadError(error));
      }
    }

    if (unknownDuration) {
      showToast("warning", UNKNOWN_DURATION_MESSAGE);
    } else if (tooLong) {
      showToast("warning", VIDEO_TOO_LONG_MESSAGE);
    }

    if (picked.length > 0) {
      setItems((current) =>
        [...current, ...picked].slice(0, DIARY_ATTACHMENTS_MAX),
      );
    }
  }, [items.length, onError]);

  const remove = useCallback((index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setItems((current) => {
      if (to < 0 || to >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      return next;
    });
  }, []);

  const dirty = useMemo(
    () =>
      items.length !== initial.length ||
      items.some(
        (item, index) =>
          item.kind !== "saved" || item.key !== initial[index].objectKey,
      ),
    [initial, items],
  );

  // 새 첨부만 순서대로 올리고, 남긴 첨부는 키만 돌려준다. 순서는 화면에 보이는 그대로다.
  const upload = useCallback(async (): Promise<DiaryAttachmentRequest[]> => {
    const total = items.filter((item) => item.kind !== "saved").length;
    const requests: DiaryAttachmentRequest[] = [];
    let done = 0;

    // 안드로이드는 앱을 내리면 업로드가 끊긴다. iOS는 백그라운드 세션이라 이어진다.
    if (total > 0 && Platform.OS === "android") {
      showToast("info", KEEP_FOREGROUND_MESSAGE);
    }

    try {
      for (const item of items) {
        if (item.kind === "saved") {
          requests.push({ objectKey: item.attachment.objectKey });
          continue;
        }

        done += 1;
        setProgress({ done, total });

        if (item.kind === "photo") {
          requests.push({ objectKey: await uploadDiaryPhoto(item.asset) });
          continue;
        }

        const compressedUri = await compressVideo(
          item.asset.uri,
          NO_PROGRESS,
          NEVER_ABORT,
        );
        const keys = await uploadDiaryVideo(
          compressedUri,
          item.thumbnailUri,
          NO_PROGRESS,
          NEVER_ABORT,
        );

        requests.push({
          objectKey: keys.objectKey,
          thumbnailObjectKey: keys.thumbnailKey,
          durationSeconds: videoDurationSeconds(item.asset),
        });
      }

      return requests;
    } finally {
      setProgress({ done: 0, total: 0 });
    }
  }, [items]);

  return { items, add, remove, move, dirty, upload, progress };
}
