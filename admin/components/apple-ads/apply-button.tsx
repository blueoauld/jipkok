"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { applyAppleAdsAction } from "@/lib/api/apple-ads";
import { formatMoney } from "@/lib/format";
import { recommendationTypeLabels } from "@/lib/labels";
import type { AppleAdsRecommendation } from "@/lib/types";

function describe(item: AppleAdsRecommendation) {
  const target = item.searchTerm ?? item.keyword ?? "";
  const bid =
    item.suggestedBid == null
      ? ""
      : ` 입찰가 ${formatMoney(item.suggestedBid, item.currency)}.`;

  switch (item.type) {
    case "PAUSE_KEYWORD":
      return `키워드 "${target}"를 일시정지합니다.`;
    case "ADD_NEGATIVE_KEYWORD":
      return `"${target}"를 광고그룹의 정확 일치 제외 키워드로 추가합니다.`;
    case "LOWER_BID":
    case "RAISE_BID":
      return `키워드 "${target}"의 입찰가를 ${formatMoney(item.currentBid ?? 0, item.currency)}에서 ${formatMoney(item.suggestedBid ?? 0, item.currency)}로 바꿉니다.`;
    case "ADD_KEYWORD":
      return `"${target}"를 광고그룹에 정확 일치 키워드로 추가합니다.${bid}`;
  }
}

type Props = {
  item: AppleAdsRecommendation;
};

export function ApplyButton({ item }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        적용
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${recommendationTypeLabels[item.type]} 적용`}
        description={`${describe(item)} 애플 광고에 바로 반영되고, 조치 이력에서 되돌릴 수 있습니다.`}
        confirmLabel="적용"
        confirmVariant="default"
        errorFallback="적용하지 못했습니다."
        invalidateKeys={[["apple-ads"]]}
        action={() =>
          applyAppleAdsAction({
            type: item.type,
            campaignId: item.campaignId,
            adGroupId: item.adGroupId,
            adGroupName: item.adGroupName,
            keywordId: item.keywordId,
            keyword: item.keyword,
            matchType: item.matchType,
            searchTerm: item.searchTerm,
            currentBid: item.currentBid,
            suggestedBid: item.suggestedBid,
            currency: item.currency,
            reason: item.reason,
          })
        }
        onSuccess={() =>
          toast.success(
            `${recommendationTypeLabels[item.type]}를 적용했습니다.`,
          )
        }
      />
    </>
  );
}
