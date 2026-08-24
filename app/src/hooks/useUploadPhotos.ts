import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";

import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import type { ProfilePhoto } from "@/lib/api";

export function useUploadPhotos(
  upload: (asset: ImagePickerAsset) => Promise<ProfilePhoto>,
  onError: (error: unknown) => void,
  initial: ProfilePhoto[] = [],
) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);

  const add = useCallback(async () => {
    try {
      const assets = await pickPhotos(MAX_PHOTOS - photos.length);

      if (assets.length === 0) {
        return;
      }

      setUploading(true);

      // iOS는 expo 모듈의 비동기 호출이 하나의 직렬 큐를 공유한다. 한꺼번에 밀어 넣으면
      // 인코딩이 빨라지지도 않으면서 그동안 다른 모듈 호출까지 뒤에서 막힌다.
      // 한 장씩 넣고 끝나는 대로 반영해, 중간에 실패해도 앞의 것은 남는다.
      for (const asset of assets) {
        const photo = await upload(asset);

        setPhotos((current) => [...current, photo].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
    }
  }, [onError, photos.length, upload]);

  const remove = useCallback((index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setPhotos((current) => {
      if (to < 0 || to >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const urls = useMemo(() => photos.map((photo) => photo.url), [photos]);
  const objectKeys = useMemo(
    () => photos.map((photo) => photo.objectKey),
    [photos],
  );

  return { urls, objectKeys, uploading, add, remove, move };
}
