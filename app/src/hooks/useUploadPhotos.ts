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
    const assets = await pickPhotos(MAX_PHOTOS - photos.length);

    if (assets.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const uploaded = await Promise.all(assets.map(upload));
      setPhotos((current) => [...current, ...uploaded].slice(0, MAX_PHOTOS));
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
