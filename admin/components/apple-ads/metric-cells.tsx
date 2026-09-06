import { TableCell, TableHead } from "@/components/ui/table";
import { formatCount, formatMoney, formatPercent } from "@/lib/format";
import type { AppleAdsMetrics } from "@/lib/types";

export const METRIC_COLUMN_COUNT = 8;

const dash = <span className="text-muted-foreground">-</span>;

export function MetricHeads() {
  return (
    <>
      <TableHead className="text-right">노출</TableHead>
      <TableHead className="text-right">탭</TableHead>
      <TableHead className="text-right">TTR</TableHead>
      <TableHead className="text-right">설치</TableHead>
      <TableHead className="text-right">전환율</TableHead>
      <TableHead className="text-right">지출</TableHead>
      <TableHead className="text-right">CPT</TableHead>
      <TableHead className="text-right">CPA</TableHead>
    </>
  );
}

type Props = {
  metrics: AppleAdsMetrics;
};

export function MetricCells({ metrics }: Props) {
  const money = (value: number | null | undefined) =>
    value == null ? dash : formatMoney(value, metrics.currency);
  const percent = (value: number | null | undefined) =>
    value == null ? dash : formatPercent(value);

  return (
    <>
      <TableCell className="text-right tabular-nums">
        {formatCount(metrics.impressions)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCount(metrics.taps)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {percent(metrics.tapThroughRate)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCount(metrics.totalInstalls)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {percent(metrics.conversionRate)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(metrics.spend)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(metrics.costPerTap)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(metrics.costPerInstall)}
      </TableCell>
    </>
  );
}
