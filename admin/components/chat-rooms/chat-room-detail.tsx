"use client";

import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { MemberCell } from "@/components/member-cell";
import { PageHeader } from "@/components/page-header";
import { PendingButton } from "@/components/pending-button";
import { QuerySection } from "@/components/query-section";
import { ChatTranscript } from "@/components/reports/chat-transcript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChatMessages, fetchChatRoom } from "@/lib/api/chat-rooms";
import { formatDateTime } from "@/lib/format";
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
  const heightBeforeLoad = useRef<number | null>(null);

  const {
    data,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat-rooms", "messages", room.id],
    queryFn: ({ pageParam }) => fetchChatMessages(room.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.nextCursor == null ? undefined : String(page.nextCursor),
  });

  const pageCount = data?.pages.length ?? 0;
  const messages = data
    ? data.pages.flatMap((page) => page.items).sort((a, b) => a.id - b.id)
    : [];

  useLayoutEffect(() => {
    if (heightBeforeLoad.current === null) return;
    window.scrollBy(
      0,
      document.documentElement.scrollHeight - heightBeforeLoad.current,
    );
    heightBeforeLoad.current = null;
  }, [pageCount]);

  const loadOlder = () => {
    heightBeforeLoad.current = document.documentElement.scrollHeight;
    fetchNextPage();
  };

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
              <>
                {messages.length > 0 && (
                  <div className="mb-4 flex justify-center">
                    {hasNextPage ? (
                      <PendingButton
                        variant="outline"
                        size="sm"
                        pending={isFetchingNextPage}
                        onClick={loadOlder}
                      >
                        이전 메시지 더보기
                      </PendingButton>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        처음 대화입니다.
                      </p>
                    )}
                  </div>
                )}
                <ChatTranscript
                  messages={messages}
                  leftMemberId={low.id}
                  leftNickname={low.nickname}
                  rightNickname={high.nickname}
                />
              </>
            )}
          </QuerySection>
        </CardContent>
      </Card>
    </>
  );
}
