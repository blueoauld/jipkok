import { useCallback, useState } from "react";

import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { alertApiError } from "@/lib/alert";
import type { PhotoVisibility, ProfilePhoto } from "@/lib/api";
import { uploadPhoto } from "@/lib/photo";

export function useProfilePhotos(
  initial: ProfilePhoto[],
  visibility: PhotoVisibility,
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
      const uploaded = await Promise.all(
        assets.map((asset) => uploadPhoto(asset, visibility)),
      );
      setPhotos((current) => [...current, ...uploaded].slice(0, MAX_PHOTOS));
    } catch (error) {
      alertApiError(error);
    } finally {
      setUploading(false);
    }
  }, [photos.length, visibility]);

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
