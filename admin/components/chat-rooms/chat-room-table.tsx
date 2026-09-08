"use client";

import { useRouter } from "next/navigation";
import { MemberCell } from "@/components/member-cell";
import { StatusText } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { chatMessageTypeLabels } from "@/lib/labels";
import type { ChatRoomSummary } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = {
  rooms: ChatRoomSummary[];
};

export function ChatRoomTable({ rooms }: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>A</TableHead>
          <TableHead>B</TableHead>
          <TableHead>마지막 메시지</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="text-right">마지막 시각</TableHead>
          <TableHead className="text-right">생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 채팅방이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {rooms.map((room) => (
          <TableRow
            key={room.id}
            className={cn(
              "cursor-pointer",
              room.deletedAt != null && inactiveRowClassName,
            )}
            onClick={() => router.push(`/chat-rooms/detail?id=${room.id}`)}
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {room.id}
            </TableCell>
            <TableCell>
              <MemberCell id={room.low.id} nickname={room.low.nickname} />
            </TableCell>
            <TableCell>
              <MemberCell id={room.high.id} nickname={room.high.nickname} />
            </TableCell>
            <TableCell className="max-w-md truncate">
              {room.lastMessageType == null ? (
                <span className="text-muted-foreground">없음</span>
              ) : room.lastMessageType === "TEXT" ? (
                room.lastMessageContent
              ) : (
                <span className="text-muted-foreground">
                  {chatMessageTypeLabels[room.lastMessageType]}
                </span>
              )}
            </TableCell>
            <TableCell>
              {room.deletedAt != null ? (
                <StatusText tone="muted">삭제됨</StatusText>
              ) : (
                <StatusText tone="positive">활성</StatusText>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {room.lastMessageAt ? formatDateTime(room.lastMessageAt) : "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(room.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
