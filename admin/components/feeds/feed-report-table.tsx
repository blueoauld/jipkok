import Image from "next/image";
import { MemberCell } from "@/components/member-cell";
import { StatusText } from "@/components/status-text";
import { DeletePostDialog } from "@/components/feeds/delete-post-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatDateTime } from "@/lib/format";
import type { FeedReport } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";

type Props = {
  reports: FeedReport[];
};

export function FeedReportTable({ reports }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>신고자</TableHead>
          <TableHead className="w-24">피드 ID</TableHead>
          <TableHead className="w-16">사진</TableHead>
          <TableHead>작성자</TableHead>
          <TableHead>문구</TableHead>
          <TableHead className="w-20 text-right">신고 수</TableHead>
          <TableHead className="w-24">상태</TableHead>
          <TableHead className="text-right">접수일</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              조건에 맞는 신고가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {reports.map((report) => (
          <TableRow
            key={report.id}
            className={report.postDeletedAt ? inactiveRowClassName : undefined}
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
              {formatCount(report.postReportCount)}
            </TableCell>
            <TableCell>
              {report.postDeletedAt ? (
                <StatusText tone="negative">삭제</StatusText>
              ) : (
                <StatusText tone="positive">게시</StatusText>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(report.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <DeletePostDialog
                postId={report.postId}
                authorNickname={report.authorNickname}
                disabled={report.postDeletedAt != null}
              />
            </TableCell>
          </TableRow>
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
