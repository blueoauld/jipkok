"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPhoneNumber } from "@/lib/format";
import { genderLabels } from "@/lib/labels";
import type { MemberSummary } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = {
  members: MemberSummary[];
};

export function MemberTable({ members }: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead className="w-16">성별</TableHead>
          <TableHead className="w-16 text-right">나이</TableHead>
          <TableHead>전화번호</TableHead>
          <TableHead className="w-24 text-right">공개 사진</TableHead>
          <TableHead className="w-24 text-right">비밀 사진</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="text-right">가입일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 회원이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {members.map((member) => (
          <TableRow
            key={member.id}
            className={cn(
              "cursor-pointer",
              member.suspended && inactiveRowClassName,
            )}
            onClick={() => router.push(`/members/detail?id=${member.id}`)}
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {member.id}
            </TableCell>
            <TableCell>{member.nickname}</TableCell>
            <TableCell>{genderLabels[member.gender]}</TableCell>
            <TableCell className="text-right tabular-nums">
              {member.age}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatPhoneNumber(member.phoneNumber)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {member.publicPhotoCount}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {member.secretPhotoCount}
            </TableCell>
            <TableCell>{member.suspended ? "정지" : "정상"}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(member.joinedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
