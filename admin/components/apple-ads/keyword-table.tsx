import {
  METRIC_COLUMN_COUNT,
  MetricCells,
  MetricHeads,
} from "@/components/apple-ads/metric-cells";
import { StatusText } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { keywordStatusLabels, matchTypeLabels } from "@/lib/labels";
import type { AppleAdsKeywordList } from "@/lib/types";

const LABEL_COLUMN_COUNT = 5;

const dash = <span className="text-muted-foreground">-</span>;

type Props = {
  data: AppleAdsKeywordList;
};

export function KeywordTable({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>키워드</TableHead>
          <TableHead className="w-16">일치</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="text-right">입찰가</TableHead>
          <TableHead>광고그룹</TableHead>
          <MetricHeads />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={LABEL_COLUMN_COUNT + METRIC_COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              기간에 해당하는 키워드 리포트가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {data.items.map((item) => (
          <TableRow key={item.keywordId}>
            <TableCell className="font-medium">{item.keyword}</TableCell>
            <TableCell>
              {item.matchType
                ? (matchTypeLabels[item.matchType] ?? item.matchType)
                : dash}
            </TableCell>
            <TableCell>
              {item.deleted ? (
                <StatusText tone="muted">삭제됨</StatusText>
              ) : item.keywordStatus ? (
                <StatusText
                  tone={item.keywordStatus === "ACTIVE" ? "positive" : "muted"}
                >
                  {keywordStatusLabels[item.keywordStatus] ??
                    item.keywordStatus}
                </StatusText>
              ) : (
                dash
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {item.bidAmount == null
                ? dash
                : formatMoney(item.bidAmount, item.metrics.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.adGroupName ?? dash}
            </TableCell>
            <MetricCells metrics={item.metrics} />
          </TableRow>
        ))}
      </TableBody>
      {data.items.length > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={LABEL_COLUMN_COUNT}>합계</TableCell>
            <MetricCells metrics={data.total} />
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
