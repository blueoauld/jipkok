import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useState } from "react";

import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { alertApiError } from "@/lib/alert";
import type { ProfilePhoto } from "@/lib/api";

export function useUploadPhotos(
  upload: (asset: ImagePickerAsset) => Promise<ProfilePhoto>,
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
      alertApiError(error);
    } finally {
      setUploading(false);
    }
  }, [photos.length, upload]);

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

  return {
    urls: photos.map((photo) => photo.url),
    objectKeys: photos.map((photo) => photo.objectKey),
    uploading,
    add,
    remove,
    move,
  };
}
