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
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const add = useCallback(async () => {
    try {
      const assets = await pickPhotos(MAX_PHOTOS - photos.length);

      if (assets.length === 0) {
        return;
      }

      setUploading(true);

      for (const [index, asset] of assets.entries()) {
        setProgress({ done: index + 1, total: assets.length });

        const photo = await upload(asset);

        setPhotos((current) => [...current, photo].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
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

  return { urls, objectKeys, uploading, progress, add, remove, move };
}
