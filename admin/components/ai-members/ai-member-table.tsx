"use client";

import { useRouter } from "next/navigation";
import { StatusText } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatDateTime } from "@/lib/format";
import { genderLabels } from "@/lib/labels";
import type { AiMemberSummary } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = {
  members: AiMemberSummary[];
};

export function AiMemberTable({ members }: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead className="w-16">성별</TableHead>
          <TableHead className="w-16 text-right">나이</TableHead>
          <TableHead className="w-24 text-right">공개 사진</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="w-24 text-right">오늘 응답</TableHead>
          <TableHead className="w-24 text-right">오늘 토큰</TableHead>
          <TableHead className="w-24 text-right">누적 응답</TableHead>
          <TableHead className="w-24 text-right">누적 토큰</TableHead>
          <TableHead className="text-right">위치 갱신</TableHead>
          <TableHead className="text-right">생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={12}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 AI 계정이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {members.map((member) => (
          <TableRow
            key={member.id}
            className={cn(
              "cursor-pointer",
              !member.enabled && inactiveRowClassName,
            )}
            onClick={() => router.push(`/ai-members/detail?id=${member.id}`)}
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {member.id}
            </TableCell>
            <TableCell>{member.nickname}</TableCell>
            <TableCell>{genderLabels[member.gender]}</TableCell>
            <TableCell className="text-right tabular-nums">
              {member.age}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {member.publicPhotoCount}
            </TableCell>
            <TableCell>
              {member.enabled ? (
                <StatusText tone="positive">활성</StatusText>
              ) : (
                <StatusText tone="muted">비활성</StatusText>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(member.today.replyCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(member.today.tokenCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(member.total.replyCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(member.total.tokenCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {member.locatedAt ? formatDateTime(member.locatedAt) : "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(member.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
