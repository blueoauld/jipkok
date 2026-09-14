"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createAiMemberPhotoUploadUrl,
  updateAiMemberPhotos,
} from "@/lib/api/ai-members";
import { ApiError } from "@/lib/api/client";
import { putToStorage, toWebp, uploadContentType } from "@/lib/photo-upload";
import type { PhotoVisibility, ProfilePhoto } from "@/lib/types";

const MAX_COUNT_PER_VISIBILITY = 6;

const visibilityLabels: Record<PhotoVisibility, string> = {
  PUBLIC: "공개 사진",
  SECRET: "비밀 사진",
};

type Props = {
  memberId: number;
  publicPhotos: ProfilePhoto[];
  secretPhotos: ProfilePhoto[];
};

export function AiMemberPhotos({
  memberId,
  publicPhotos,
  secretPhotos,
}: Props) {
  const queryClient = useQueryClient();
  const photos: Record<PhotoVisibility, ProfilePhoto[]> = {
    PUBLIC: publicPhotos,
    SECRET: secretPhotos,
  };

  const save = useMutation({
    mutationFn: (next: Record<PhotoVisibility, string[]>) =>
      updateAiMemberPhotos(memberId, next.PUBLIC, next.SECRET),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-members"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (caught) => {
      toast.error(
        caught instanceof ApiError
          ? caught.message
          : "사진을 저장하지 못했습니다.",
      );
    },
  });

  const keysOf = (visibility: PhotoVisibility) =>
    photos[visibility].map((photo) => photo.objectKey);

  const saveWith = (visibility: PhotoVisibility, keys: string[]) =>
    save.mutate({
      PUBLIC: visibility === "PUBLIC" ? keys : keysOf("PUBLIC"),
      SECRET: visibility === "SECRET" ? keys : keysOf("SECRET"),
    });

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
      {(Object.keys(visibilityLabels) as PhotoVisibility[]).map(
        (visibility) => (
          <PhotoSection
            key={visibility}
            memberId={memberId}
            visibility={visibility}
            photos={photos[visibility]}
            pending={save.isPending}
            onChange={(keys) => saveWith(visibility, keys)}
          />
        ),
      )}
    </div>
  );
}

type SectionProps = {
  memberId: number;
  visibility: PhotoVisibility;
  photos: ProfilePhoto[];
  pending: boolean;
  onChange: (keys: string[]) => void;
};

function PhotoSection({
  memberId,
  visibility,
  photos,
  pending,
  onChange,
}: SectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const keys = photos.map((photo) => photo.objectKey);
  const busy = pending || uploading;

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_COUNT_PER_VISIBILITY - keys.length;
    const selected = Array.from(files).slice(0, room);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const blob = await toWebp(file);
        const { uploadUrl, objectKey } = await createAiMemberPhotoUploadUrl(
          memberId,
          visibility,
          uploadContentType,
        );
        await putToStorage(uploadUrl, blob);
        uploaded.push(objectKey);
      }
      onChange([...keys, ...uploaded]);
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "사진을 올리지 못했습니다.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (index: number, offset: number) => {
    const next = [...keys];
    const [key] = next.splice(index, 1);
    next.splice(index + offset, 0, key);
    onChange(next);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>
          {visibilityLabels[visibility]} {photos.length}장
        </CardTitle>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => upload(event.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={busy || keys.length >= MAX_COUNT_PER_VISIBILITY}
          onClick={() => inputRef.current?.click()}
        >
          <Plus data-icon="inline-start" />
          {uploading ? "올리는 중" : "추가"}
        </Button>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {visibilityLabels[visibility]}이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={photo.objectKey} className="group relative">
                <a href={photo.url} target="_blank" rel="noreferrer">
                  <Image
                    src={photo.url}
                    alt=""
                    width={320}
                    height={320}
                    className="aspect-square w-full object-cover"
                  />
                </a>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                  disabled={busy}
                  onClick={() =>
                    onChange(keys.filter((k) => k !== photo.objectKey))
                  }
                  aria-label="삭제"
                >
                  <X />
                </Button>
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="앞으로"
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    disabled={busy || index === photos.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="뒤로"
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
