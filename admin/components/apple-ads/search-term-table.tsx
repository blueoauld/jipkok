import {
  METRIC_COLUMN_COUNT,
  MetricCells,
  MetricHeads,
} from "@/components/apple-ads/metric-cells";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matchTypeLabels, searchTermSourceLabels } from "@/lib/labels";
import type { AppleAdsSearchTermList } from "@/lib/types";

const LABEL_COLUMN_COUNT = 4;

const dash = <span className="text-muted-foreground">-</span>;

type Props = {
  data: AppleAdsSearchTermList;
};

export function SearchTermTable({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>검색어</TableHead>
          <TableHead className="w-28">출처</TableHead>
          <TableHead>매칭 키워드</TableHead>
          <TableHead className="w-16">국가</TableHead>
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
              기간에 해당하는 검색어 리포트가 없습니다.
            </TableCell>
          </TableRow>
        )}
        {data.items.map((item) => (
          <TableRow
            key={`${item.adGroupId}-${item.keywordId ?? 0}-${item.searchTerm}`}
          >
            <TableCell className="font-medium">{item.searchTerm}</TableCell>
            <TableCell>
              {item.searchTermSource
                ? (searchTermSourceLabels[item.searchTermSource] ??
                  item.searchTermSource)
                : dash}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.keyword ? (
                <>
                  {item.keyword}
                  {item.matchType && (
                    <span className="ml-1 text-xs">
                      ({matchTypeLabels[item.matchType] ?? item.matchType})
                    </span>
                  )}
                </>
              ) : (
                dash
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.countryOrRegion ?? dash}
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
