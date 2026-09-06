"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { Input } from "@/components/ui/input";
import { formatIsoDate } from "@/lib/format";
import { searchTermSourceLabels } from "@/lib/labels";
import type { AppleAdsCampaign } from "@/lib/types";

export type AppleAdsFilter = {
  startDate: string;
  endDate: string;
  campaignId: string;
  source: string;
};

const DEFAULT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function defaultAppleAdsFilter(): AppleAdsFilter {
  const now = Date.now();
  return {
    startDate: formatIsoDate(new Date(now - (DEFAULT_DAYS - 1) * DAY_MS)),
    endDate: formatIsoDate(new Date(now)),
    campaignId: "ALL",
    source: "ALL",
  };
}

const sourceItems: Record<string, string> = {
  ALL: "모든 출처",
  ...searchTermSourceLabels,
};

type Props = {
  value: AppleAdsFilter;
  defaultValue: AppleAdsFilter;
  campaigns: AppleAdsCampaign[];
  onChange: (value: AppleAdsFilter) => void;
};

export function ReportFilters({
  value,
  defaultValue,
  campaigns,
  onChange,
}: Props) {
  const campaignItems: FilterItem<string>[] = [
    { value: "ALL", label: "모든 캠페인" },
    ...campaigns.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const campaignId = campaignItems.some((c) => c.value === value.campaignId)
    ? value.campaignId
    : "ALL";

  const changeDate = (key: "startDate" | "endDate", next: string) => {
    if (next) onChange({ ...value, [key]: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        className="w-36"
        value={value.startDate}
        max={value.endDate}
        onChange={(event) => changeDate("startDate", event.target.value)}
      />
      <span className="text-muted-foreground">~</span>
      <Input
        type="date"
        className="w-36"
        value={value.endDate}
        min={value.startDate}
        onChange={(event) => changeDate("endDate", event.target.value)}
      />
      <FilterSelect
        items={campaignItems}
        value={campaignId}
        onChange={(campaignId) => onChange({ ...value, campaignId })}
      />
      <FilterSelect
        items={sourceItems}
        value={value.source in sourceItems ? value.source : "ALL"}
        onChange={(source) => onChange({ ...value, source })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultValue}
        onReset={onChange}
      />
    </div>
  );
}
