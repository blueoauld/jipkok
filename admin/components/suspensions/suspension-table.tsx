import { MemberCell } from "@/components/member-cell";
import { ReleaseButton } from "@/components/release-button";
import { StatusText, type StatusTone } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import {
  suspensionReasonLabels,
  suspensionStatusLabels,
  suspensionTypeLabels,
} from "@/lib/labels";
import type { Suspension, SuspensionStatus } from "@/lib/types";
import { inactiveRowClassName } from "@/lib/styles";

const suspensionStatusTones: Record<SuspensionStatus, StatusTone> = {
  ACTIVE: "negative",
  EXPIRED: "positive",
  RELEASED: "muted",
};

type Props = {
  emptyMessage?: string;
  suspensions: Suspension[];
};

export function SuspensionTable({
  suspensions,
  emptyMessage = "조건에 맞는 정지가 없습니다.",
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>회원</TableHead>
          <TableHead className="w-24">유형</TableHead>
          <TableHead>사유</TableHead>
          <TableHead>상세 사유</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="text-right">시작일</TableHead>
          <TableHead className="text-right">종료일</TableHead>
          <TableHead className="text-right">해제일</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {suspensions.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {suspensions.map((suspension) => (
          <TableRow
            key={suspension.id}
            className={
              suspension.status === "ACTIVE" ? undefined : inactiveRowClassName
            }
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {suspension.id}
            </TableCell>
            <TableCell>
              <MemberCell
                id={suspension.memberId}
                nickname={suspension.nickname}
              />
            </TableCell>
            <TableCell>{suspensionTypeLabels[suspension.type]}</TableCell>
            <TableCell>{suspensionReasonLabels[suspension.reason]}</TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={suspension.detail ?? undefined}
            >
              {suspension.detail ?? (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <StatusText tone={suspensionStatusTones[suspension.status]}>
                {suspensionStatusLabels[suspension.status]}
              </StatusText>
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(suspension.startedAt)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {suspension.expiresAt
                ? formatDateTime(suspension.expiresAt)
                : "영구"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {suspension.releasedAt
                ? formatDateTime(suspension.releasedAt)
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              {suspension.status === "ACTIVE" && (
                <ReleaseButton suspensionId={suspension.id} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
