import Link from "next/link";
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
import { reportReasonLabels, reportTypeLabels } from "@/lib/labels";
import type { RecentReport } from "@/lib/types";

type Props = {
  reports: RecentReport[];
};

export function RecentReports({ reports }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 신고</CardTitle>
        <CardAction>
          <Link
            href="/reports/members"
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
              <TableHead className="w-20">종류</TableHead>
              <TableHead>피신고자</TableHead>
              <TableHead>사유</TableHead>
              <TableHead className="text-right">접수일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {report.id}
                </TableCell>
                <TableCell>{reportTypeLabels[report.type]}</TableCell>
                <TableCell>{report.reportedNickname}</TableCell>
                <TableCell>{reportReasonLabels[report.reason]}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatDateTime(report.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
