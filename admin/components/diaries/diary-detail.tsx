"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { MemberCell } from "@/components/member-cell";
import { PageHeader } from "@/components/page-header";
import { QuerySection } from "@/components/query-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDiary } from "@/lib/api/diaries";
import { formatDate, formatDateTime } from "@/lib/format";
import { diaryMoodEmojis } from "@/lib/labels";
import type { DiaryDetail as DiaryDetailData } from "@/lib/types";

// 삽입 시에도 생성 시각과 수정 시각이 마이크로초 단위로 어긋나므로 1초 이상 벌어졌을 때만 고친 것으로 본다.
const EDITED_THRESHOLD_MILLIS = 1000;

function isEdited(diary: DiaryDetailData) {
  return (
    new Date(diary.updatedAt).getTime() - new Date(diary.createdAt).getTime() >=
    EDITED_THRESHOLD_MILLIS
  );
}

export function DiaryDetail() {
  const id = Number(useSearchParams().get("id"));

  const {
    data: diary,
    isPending,
    error,
  } = useQuery({
    queryKey: ["diaries", "detail", id],
    queryFn: () => fetchDiary(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="일기" />
        <EmptyState message="일기를 찾을 수 없습니다." />
      </>
    );
  }

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {diary && <Loaded diary={diary} />}
    </QuerySection>
  );
}

function Loaded({ diary }: { diary: DiaryDetailData }) {
  const emoji = diary.mood ? diaryMoodEmojis[diary.mood] : null;
  const description = isEdited(diary)
    ? `작성 ${formatDateTime(diary.createdAt)}, 수정 ${formatDateTime(diary.updatedAt)}`
    : `작성 ${formatDateTime(diary.createdAt)}`;

  return (
    <>
      <PageHeader
        title={`${emoji ? `${emoji} ` : ""}${formatDate(diary.entryDate)} #${diary.id}`}
        description={description}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <MemberCell id={diary.member.id} nickname={diary.member.nickname} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diary.content ? (
            <p className="text-sm whitespace-pre-wrap">{diary.content}</p>
          ) : (
            <p className="text-sm text-muted-foreground">본문이 없습니다.</p>
          )}

          {diary.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {diary.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative inline-block"
                >
                  <Image
                    src={attachment.thumbnailUrl ?? attachment.url}
                    alt=""
                    width={160}
                    height={160}
                    className="size-40 object-cover"
                  />
                  {attachment.type === "VIDEO" && (
                    <Video className="absolute right-2 bottom-2 size-5 text-white drop-shadow" />
                  )}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
