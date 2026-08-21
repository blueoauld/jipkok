"use client";

import { Fragment, useState } from "react";
import { DeleteWorryDialog } from "@/components/worries/delete-worry-dialog";
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
import { formatCount, formatDateTime } from "@/lib/format";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { WorryReport } from "@/lib/types";

type Props = {
  reports: WorryReport[];
};

export function WorryReportTable({ reports }: Props) {
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const toggle = (postId: number) =>
    setExpandedPostId((current) => (current === postId ? null : postId));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">고민 ID</TableHead>
          <TableHead>작성자</TableHead>
          <TableHead>내용</TableHead>
          <TableHead className="w-20 text-right">신고 수</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="text-right">최근 신고일</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 신고가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {reports.map((report) => (
          <Fragment key={report.postId}>
            <TableRow
              className={cn(
                "cursor-pointer",
                report.postDeletedAt != null && inactiveRowClassName,
              )}
              onClick={() => toggle(report.postId)}
            >
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
                {report.postDeletedAt ? (
                  <StatusText tone="negative">삭제</StatusText>
                ) : (
                  <StatusText tone="positive">게시</StatusText>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDateTime(report.lastReportedAt)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(event) => event.stopPropagation()}
              >
                <DeleteWorryDialog
                  postId={report.postId}
                  authorNickname={report.authorNickname}
                  disabled={report.postDeletedAt != null}
                />
              </TableCell>
            </TableRow>
            {expandedPostId === report.postId && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="bg-muted/50 px-6 py-3">
                  <div className="mb-3 text-sm">
                    <p className="mb-1.5 text-muted-foreground">내용</p>
                    <p className="whitespace-pre-wrap">{report.content}</p>
                  </div>
                  <div className="grid w-fit grid-cols-[12rem_auto] gap-x-8 gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">신고자</span>
                    <span className="text-muted-foreground">신고일</span>
                    {report.reporters.map((reporter) => (
                      <Fragment key={reporter.id}>
                        <MemberCell
                          id={reporter.id}
                          nickname={reporter.nickname}
                        />
                        <span className="tabular-nums">
                          {formatDateTime(reporter.reportedAt)}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
