"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { revertAppleAdsAction } from "@/lib/api/apple-ads";
import { formatMoney } from "@/lib/format";
import type { AppleAdsAction } from "@/lib/types";

function describe(action: AppleAdsAction) {
  const target = action.searchTerm ?? action.keyword ?? "";

  switch (action.type) {
    case "PAUSE_KEYWORD":
      return `키워드 "${target}"를 다시 활성화합니다.`;
    case "ADD_NEGATIVE_KEYWORD":
      return `제외 키워드 "${target}"를 지웁니다.`;
    case "LOWER_BID":
    case "RAISE_BID":
      return `키워드 "${target}"의 입찰가를 ${formatMoney(action.previousBid ?? 0, action.currency)}로 되돌립니다.`;
    case "ADD_KEYWORD":
      return `추가한 키워드 "${target}"를 지웁니다.`;
  }
}

type Props = {
  action: AppleAdsAction;
};

export function RevertButton({ action }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        되돌리기
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="조치 되돌리기"
        description={`${describe(action)} 애플 광고에 바로 반영됩니다.`}
        confirmLabel="되돌리기"
        errorFallback="되돌리지 못했습니다."
        invalidateKeys={[["apple-ads"]]}
        action={() => revertAppleAdsAction(action.id)}
        onSuccess={() => toast.success("조치를 되돌렸습니다.")}
      />
    </>
  );
}
