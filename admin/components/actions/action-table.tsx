import Link from "next/link";
import { MemberCell } from "@/components/member-cell";
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
  adminActionLabels,
  profileTargetLabels,
  suspensionReasonLabels,
  suspensionTypeLabels,
} from "@/lib/labels";
import type { AdminAction, AdminActionType } from "@/lib/types";

const targetHrefs: Partial<Record<AdminActionType, (id: number) => string>> = {
  SUSPEND: (id) => `/members/detail?id=${id}`,
  RELEASE_SUSPENSION: (id) => `/members/detail?id=${id}`,
  RESET_PROFILE: (id) => `/members/detail?id=${id}`,
  WITHDRAW_MEMBER: (id) => `/members/detail?id=${id}`,
  HANDLE_REPORT: (id) => `/reports/members/detail?id=${id}`,
};

const detailLabels: Record<string, string> = {
  ...suspensionTypeLabels,
  ...suspensionReasonLabels,
  ...profileTargetLabels,
};

function describeDetail(detail: string) {
  return detail
    .split(" ")
    .map((token) => detailLabels[token] ?? token)
    .join(" ");
}

type Props = {
  actions: AdminAction[];
};

export function ActionTable({ actions }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>처리자</TableHead>
          <TableHead className="w-32">조치</TableHead>
          <TableHead className="w-24">대상</TableHead>
          <TableHead>상세</TableHead>
          <TableHead className="text-right">시각</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {actions.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              조치 이력이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {actions.map((action) => {
          const href = targetHrefs[action.action]?.(action.targetId);

          return (
            <TableRow key={action.id}>
              <TableCell className="tabular-nums text-muted-foreground">
                {action.id}
              </TableCell>
              <TableCell>
                <MemberCell
                  id={action.actorId}
                  nickname={action.actorNickname}
                />
              </TableCell>
              <TableCell>{adminActionLabels[action.action]}</TableCell>
              <TableCell className="tabular-nums">
                {href ? (
                  <Link href={href} className="hover:underline">
                    #{action.targetId}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    #{action.targetId}
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-md truncate">
                {action.detail ? (
                  describeDetail(action.detail)
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDateTime(action.createdAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
