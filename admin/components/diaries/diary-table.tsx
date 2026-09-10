"use client";

import { useRouter } from "next/navigation";
import { MemberCell } from "@/components/member-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { diaryMoodEmojis } from "@/lib/labels";
import type { DiarySummary } from "@/lib/types";

type Props = {
  diaries: DiarySummary[];
};

export function DiaryTable({ diaries }: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead className="w-28">날짜</TableHead>
          <TableHead>회원</TableHead>
          <TableHead className="w-12">기분</TableHead>
          <TableHead>내용</TableHead>
          <TableHead className="w-16 text-right">첨부</TableHead>
          <TableHead className="text-right">작성 시각</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diaries.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 일기가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {diaries.map((diary) => (
          <TableRow
            key={diary.id}
            className="cursor-pointer"
            onClick={() => router.push(`/diaries/detail?id=${diary.id}`)}
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {diary.id}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatDate(diary.entryDate)}
            </TableCell>
            <TableCell>
              <MemberCell
                id={diary.member.id}
                nickname={diary.member.nickname}
              />
            </TableCell>
            <TableCell>
              {diary.mood ? diaryMoodEmojis[diary.mood] : "-"}
            </TableCell>
            <TableCell className="max-w-md truncate">
              {diary.contentPreview ?? (
                <span className="text-muted-foreground">없음</span>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {diary.attachmentCount > 0 ? diary.attachmentCount : "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(diary.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
