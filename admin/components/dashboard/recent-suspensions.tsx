"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { suspensionReasonLabels, suspensionTypeLabels } from "@/lib/labels";
import type { RecentSuspension } from "@/lib/types";

type Props = {
  suspensions: RecentSuspension[];
};

export function RecentSuspensions({ suspensions }: Props) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 정지</CardTitle>
        <CardAction>
          <Link
            href="/suspensions"
            className="text-sm text-muted-foreground hover:underline"
          >
            전체 보기
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-24">유형</TableHead>
              <TableHead>회원</TableHead>
              <TableHead>사유</TableHead>
              <TableHead className="text-right">종료일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suspensions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  최근 정지가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {suspensions.map((suspension) => (
              <TableRow
                key={suspension.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/members/detail?id=${suspension.memberId}`)
                }
              >
                <TableCell className="tabular-nums text-muted-foreground">
                  {suspension.id}
                </TableCell>
                <TableCell>{suspensionTypeLabels[suspension.type]}</TableCell>
                <TableCell>{suspension.nickname}</TableCell>
                <TableCell>
                  {suspensionReasonLabels[suspension.reason]}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {suspension.expiresAt
                    ? formatDateTime(suspension.expiresAt)
                    : "영구"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
