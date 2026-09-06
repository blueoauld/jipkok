import { ArrowRight } from "lucide-react";
import { StatusText, type StatusTone } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatMoney } from "@/lib/format";
import { matchTypeLabels, recommendationTypeLabels } from "@/lib/labels";
import type {
  AppleAdsRecommendation,
  AppleAdsRecommendationType,
} from "@/lib/types";

const typeTones: Record<AppleAdsRecommendationType, StatusTone> = {
  PAUSE_KEYWORD: "negative",
  ADD_NEGATIVE_KEYWORD: "negative",
  LOWER_BID: "default",
  RAISE_BID: "positive",
  ADD_KEYWORD: "positive",
};

const dash = <span className="text-muted-foreground">-</span>;

type Props = {
  items: AppleAdsRecommendation[];
};

export function RecommendationTable({ items }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">유형</TableHead>
          <TableHead>대상</TableHead>
          <TableHead>근거</TableHead>
          <TableHead className="w-40 text-right">입찰가</TableHead>
          <TableHead className="text-right">노출</TableHead>
          <TableHead className="text-right">탭</TableHead>
          <TableHead className="text-right">설치</TableHead>
          <TableHead className="text-right">지출</TableHead>
          <TableHead className="text-right">CPA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              기준을 채운 추천이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {items.map((item) => (
          <TableRow
            key={`${item.type}-${item.adGroupId}-${item.keywordId ?? ""}-${item.searchTerm ?? ""}`}
          >
            <TableCell>
              <StatusText tone={typeTones[item.type]}>
                {recommendationTypeLabels[item.type]}
              </StatusText>
            </TableCell>
            <TableCell>
              <div className="font-medium">
                {item.searchTerm ?? item.keyword}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.searchTerm
                  ? "Search Match 검색어"
                  : item.matchType
                    ? `${matchTypeLabels[item.matchType] ?? item.matchType} 일치`
                    : "키워드"}
                {item.adGroupName && ` · ${item.adGroupName}`}
              </div>
            </TableCell>
            <TableCell className="max-w-md whitespace-normal text-muted-foreground">
              {item.reason}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {item.suggestedBid == null ? (
                dash
              ) : (
                <span className="inline-flex items-center justify-end gap-1">
                  {item.currentBid == null ? null : (
                    <>
                      <span className="text-muted-foreground">
                        {formatMoney(item.currentBid, item.currency)}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </>
                  )}
                  <span className="font-medium">
                    {formatMoney(item.suggestedBid, item.currency)}
                  </span>
                </span>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(item.impressions)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(item.taps)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(item.totalInstalls)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(item.spend, item.currency)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {item.costPerInstall == null
                ? dash
                : formatMoney(item.costPerInstall, item.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
