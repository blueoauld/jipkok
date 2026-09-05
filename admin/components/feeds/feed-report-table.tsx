"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
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
import { deleteFeedPost } from "@/lib/api/feed-reports";
import { formatCount, formatDateTime } from "@/lib/format";
import { inactiveRowClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { FeedReport } from "@/lib/types";

type Props = {
  reports: FeedReport[];
};

export function FeedReportTable({ reports }: Props) {
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const toggle = (postId: number) =>
    setExpandedPostId((current) => (current === postId ? null : postId));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">피드 ID</TableHead>
          <TableHead className="w-16">사진</TableHead>
          <TableHead>작성자</TableHead>
          <TableHead>문구</TableHead>
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
              colSpan={8}
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
                <Thumbnail url={report.thumbnailUrl} />
              </TableCell>
              <TableCell>
                <MemberCell
                  id={report.authorId}
                  nickname={report.authorNickname}
                />
              </TableCell>
              <TableCell
                className={report.caption ? "" : "text-muted-foreground"}
              >
                {report.caption ?? "-"}
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
                <DeleteDialogButton
                  title="피드 삭제"
                  description={`${report.authorNickname}의 피드 #${report.postId}을 삭제합니다. 되돌릴 수 없습니다.`}
                  invalidateKeys={[["feed-reports"], ["actions"]]}
                  action={() => deleteFeedPost(report.postId)}
                  disabled={report.postDeletedAt != null}
                />
              </TableCell>
            </TableRow>
            {expandedPostId === report.postId && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="bg-muted/50 px-6 py-3">
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

function Thumbnail({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt=""
      width={40}
      height={40}
      className="size-10 object-cover"
    />
  );
}
