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
import { reportReasonLabels, reportTypeLabels } from "@/lib/labels";
import type { MemberReport } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = {
  emptyMessage?: string;
  reports: MemberReport[];
};

export function MemberReportTable({
  reports,
  emptyMessage = "조건에 맞는 신고가 없습니다.",
}: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>신고자</TableHead>
          <TableHead className="w-20">종류</TableHead>
          <TableHead>피신고자</TableHead>
          <TableHead>사유</TableHead>
          <TableHead className="w-24">상태</TableHead>
          <TableHead className="text-right">접수일</TableHead>
          <TableHead className="text-right">처리일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {reports.map((report) => (
          <TableRow
            key={report.id}
            className={cn(
              "cursor-pointer",
              report.handledAt && inactiveRowClassName,
            )}
            onClick={() =>
              router.push(`/reports/members/detail?id=${report.id}`)
            }
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {report.id}
            </TableCell>
            <TableCell>
              <MemberCell
                id={report.reporterId}
                nickname={report.reporterNickname}
              />
            </TableCell>
            <TableCell>{reportTypeLabels[report.type]}</TableCell>
            <TableCell>
              <MemberCell
                id={report.reportedMemberId}
                nickname={report.reportedNickname}
              />
            </TableCell>
            <TableCell>{reportReasonLabels[report.reason]}</TableCell>
            <TableCell>
              {report.handledAt ? (
                <StatusText tone="positive">처리</StatusText>
              ) : (
                <StatusText tone="negative">미처리</StatusText>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(report.createdAt)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {report.handledAt ? formatDateTime(report.handledAt) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
