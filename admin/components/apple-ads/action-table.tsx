import { ArrowRight } from "lucide-react";
import { RevertButton } from "@/components/apple-ads/revert-button";
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
import { formatDateTime, formatMoney } from "@/lib/format";
import { appleAdsActionTypeLabels, matchTypeLabels } from "@/lib/labels";
import { inactiveRowClassName } from "@/lib/styles";
import type { AppleAdsAction } from "@/lib/types";

const dash = <span className="text-muted-foreground">-</span>;

function changeOf(action: AppleAdsAction) {
  if (action.previousBid != null || action.newBid != null) {
    return (
      <span className="inline-flex items-center gap-1 tabular-nums">
        {action.previousBid == null ? null : (
          <>
            <span className="text-muted-foreground">
              {formatMoney(action.previousBid, action.currency)}
            </span>
            <ArrowRight className="size-3 text-muted-foreground" />
          </>
        )}
        {action.newBid == null
          ? dash
          : formatMoney(action.newBid, action.currency)}
      </span>
    );
  }

  if (action.previousStatus || action.newStatus) {
    return (
      <span className="inline-flex items-center gap-1">
        {action.previousStatus && (
          <>
            <span className="text-muted-foreground">
              {action.previousStatus}
            </span>
            <ArrowRight className="size-3 text-muted-foreground" />
          </>
        )}
        {action.newStatus ?? dash}
      </span>
    );
  }

  return dash;
}

type Props = {
  actions: AppleAdsAction[];
};

export function ActionTable({ actions }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>처리자</TableHead>
          <TableHead className="w-28">조치</TableHead>
          <TableHead>대상</TableHead>
          <TableHead>변경</TableHead>
          <TableHead>근거</TableHead>
          <TableHead className="text-right">시각</TableHead>
          <TableHead className="w-24 text-right">되돌리기</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {actions.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              적용한 조치가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {actions.map((action) => (
          <TableRow
            key={action.id}
            className={action.revertedAt ? inactiveRowClassName : undefined}
          >
            <TableCell className="tabular-nums text-muted-foreground">
              {action.id}
            </TableCell>
            <TableCell>
              {action.automatic || action.actorId == null ? (
                <StatusText tone="muted">자동</StatusText>
              ) : (
                <MemberCell
                  id={action.actorId}
                  nickname={action.actorNickname ?? String(action.actorId)}
                />
              )}
            </TableCell>
            <TableCell>
              <StatusText tone={action.revertedAt ? "muted" : "default"}>
                {appleAdsActionTypeLabels[action.type]}
              </StatusText>
            </TableCell>
            <TableCell>
              <div className="font-medium">
                {action.searchTerm ?? action.keyword ?? dash}
              </div>
              <div className="text-xs text-muted-foreground">
                {action.matchType
                  ? `${matchTypeLabels[action.matchType] ?? action.matchType} 일치`
                  : "키워드"}
                {action.adGroupName && ` · ${action.adGroupName}`}
              </div>
            </TableCell>
            <TableCell>{changeOf(action)}</TableCell>
            <TableCell
              className="max-w-md truncate text-muted-foreground"
              title={action.reason ?? undefined}
            >
              {action.reason ?? dash}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDateTime(action.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              {action.revertedAt ? (
                <span
                  className="tabular-nums text-muted-foreground"
                  title={
                    action.revertedByNickname
                      ? `${action.revertedByNickname}이(가) 되돌림`
                      : undefined
                  }
                >
                  {formatDateTime(action.revertedAt)}
                </span>
              ) : (
                <RevertButton action={action} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
