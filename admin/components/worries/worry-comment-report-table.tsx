"use client";

import { Fragment, useState } from "react";
import { DeleteDialogButton } from "@/components/delete-dialog-button";
import { MemberCell } from "@/components/member-cell";
import { ReporterList } from "@/components/reporter-list";
import { StatusText } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteWorryComment } from "@/lib/api/worry-reports";
import { formatCount, formatDateTime } from "@/lib/format";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { WorryCommentReport } from "@/lib/types";

type Props = {
  reports: WorryCommentReport[];
};

export function WorryCommentReportTable({ reports }: Props) {
  const [expandedCommentId, setExpandedCommentId] = useState<number | null>(
    null,
  );

  const toggle = (commentId: number) =>
    setExpandedCommentId((current) =>
      current === commentId ? null : commentId,
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">댓글 ID</TableHead>
          <TableHead className="w-24">고민 ID</TableHead>
          <TableHead>작성자</TableHead>
          <TableHead>내용</TableHead>
          <TableHead className="w-20 text-right">신고 수</TableHead>
          <TableHead className="w-24">상태</TableHead>
          <TableHead className="text-right">최근 신고일</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 신고가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {reports.map((report) => (
          <Fragment key={report.commentId}>
            <TableRow
              className={cn(
                "cursor-pointer",
                report.commentDeletedAt != null && inactiveRowClassName,
              )}
              onClick={() => toggle(report.commentId)}
            >
              <TableCell className="tabular-nums text-muted-foreground">
                {report.commentId}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {report.postId}
              </TableCell>
              <TableCell>
                <MemberCell
                  id={report.authorId}
                  nickname={report.authorNickname}
                />
              </TableCell>
              <TableCell className="max-w-md truncate">
                {report.content}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(report.reportCount)}
              </TableCell>
              <TableCell>
                <CommentStatus report={report} />
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDateTime(report.lastReportedAt)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(event) => event.stopPropagation()}
              >
                <DeleteDialogButton
                  title="고민 댓글 삭제"
                  description={`${report.authorNickname}의 댓글 #${report.commentId}을 삭제합니다. 되돌릴 수 없습니다.`}
                  invalidateKeys={[["worry-comment-reports"]]}
                  action={() => deleteWorryComment(report.commentId)}
                  disabled={report.commentDeletedAt != null}
                />
              </TableCell>
            </TableRow>
            {expandedCommentId === report.commentId && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="bg-muted/50 px-6 py-3">
                  <div className="mb-3 text-sm">
                    <p className="mb-1.5 text-muted-foreground">내용</p>
                    <p className="whitespace-pre-wrap">{report.content}</p>
                  </div>
                  <ReporterList reporters={report.reporters} />
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function CommentStatus({ report }: { report: WorryCommentReport }) {
  if (report.commentDeletedAt == null) {
    return <StatusText tone="positive">게시</StatusText>;
  }

  return (
    <StatusText tone="negative">
      {report.deletedByReport ? "신고 삭제" : "삭제"}
    </StatusText>
  );
}
