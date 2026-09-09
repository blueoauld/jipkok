import { useCallback, useMemo, useState } from "react";

import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import {
  type DiaryDraftAttachment,
  draftMediaUri,
  isDraftVideo,
} from "@/hooks/useDiaryAttachments";

// 사진은 뷰어에서 넘겨 보고 동영상은 전체화면 플레이어로 연다. 읽기와 편집이 같이 쓴다.
export function useDiaryAttachmentViewer(items: DiaryDraftAttachment[]) {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const photoUris = useMemo(
    () => items.filter((item) => !isDraftVideo(item)).map(draftMediaUri),
    [items],
  );

  const open = useCallback(
    (index: number) => {
      const item = items[index];

      if (isDraftVideo(item)) {
        setVideoUrl(draftMediaUri(item));
        return;
      }

      setPhotoIndex(photoUris.indexOf(draftMediaUri(item)));
    },
    [items, photoUris],
  );

  const element = (
    <>
      <PhotoViewer
        photos={photoUris}
        initialIndex={photoIndex ?? 0}
        open={photoIndex !== null}
        onClose={() => setPhotoIndex(null)}
      />

      <VideoPlayerModal url={videoUrl} onClose={() => setVideoUrl(null)} />
    </>
  );

  return { open, element };
}
