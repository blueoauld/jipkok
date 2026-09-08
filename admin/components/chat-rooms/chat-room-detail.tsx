"use client";

import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/empty-state";
import { MemberCell } from "@/components/member-cell";
import { PageHeader } from "@/components/page-header";
import { QuerySection } from "@/components/query-section";
import { ChatTranscript } from "@/components/reports/chat-transcript";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchChatMessages, fetchChatRoom } from "@/lib/api/chat-rooms";
import { formatDateTime } from "@/lib/format";
import { useCursorPages } from "@/hooks/use-cursor-pages";
import type { ChatRoomDetail as ChatRoomDetailData } from "@/lib/types";

export function ChatRoomDetail() {
  const id = Number(useSearchParams().get("id"));

  const {
    data: room,
    isPending,
    error,
  } = useQuery({
    queryKey: ["chat-rooms", "detail", id],
    queryFn: () => fetchChatRoom(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="채팅방" />
        <EmptyState message="채팅방을 찾을 수 없습니다." />
      </>
    );
  }

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {room && <Loaded room={room} />}
    </QuerySection>
  );
}

function Loaded({ room }: { room: ChatRoomDetailData }) {
  const [low, high] = room.members;
  const pages = useCursorPages();

  const { data, isPending, error } = useQuery({
    queryKey: ["chat-rooms", "messages", room.id, pages.startKey],
    queryFn: () => fetchChatMessages(room.id, pages.startKey),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title={`채팅방 #${room.id}`}
        description={
          room.deletedAt != null
            ? `생성일 ${formatDateTime(room.createdAt)}, 삭제일 ${formatDateTime(room.deletedAt)}`
            : `생성일 ${formatDateTime(room.createdAt)}`
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-x-2">
            <MemberCell id={low.id} nickname={low.nickname} />
            <span className="text-muted-foreground">·</span>
            <MemberCell id={high.id} nickname={high.nickname} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuerySection isPending={isPending} error={error}>
            {data && (
              <ChatTranscript
                messages={data.items}
                leftMemberId={low.id}
                leftNickname={low.nickname}
                rightNickname={high.nickname}
              />
            )}
          </QuerySection>
        </CardContent>
        {data && (pages.hasPrevious || data.nextCursor != null) && (
          <CardFooter className="bg-transparent">
            <CursorPagination
              hasPrevious={pages.hasPrevious}
              hasNext={data.nextCursor != null}
              onPrevious={pages.previous}
              onNext={() =>
                data.nextCursor != null && pages.next(String(data.nextCursor))
              }
            />
          </CardFooter>
        )}
      </Card>
    </>
  );
}
