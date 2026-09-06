"use client";

import { CampaignSelect } from "@/components/apple-ads/campaign-select";
import {
  DateRangeInputs,
  recentDateRange,
} from "@/components/apple-ads/date-range-inputs";
import { FilterResetButton } from "@/components/filter-reset-button";
import type { AppleAdsCampaign } from "@/lib/types";

export type RecommendationFilter = {
  startDate: string;
  endDate: string;
  campaignId: string;
};

const DEFAULT_DAYS = 30;
const ATTRIBUTION_LAG_DAYS = 3;

export function defaultRecommendationFilter(): RecommendationFilter {
  return {
    ...recentDateRange(DEFAULT_DAYS, ATTRIBUTION_LAG_DAYS),
    campaignId: "ALL",
  };
}

type Props = {
  value: RecommendationFilter;
  defaultValue: RecommendationFilter;
  campaigns: AppleAdsCampaign[];
  onChange: (value: RecommendationFilter) => void;
};

export function RecommendationFilters({
  value,
  defaultValue,
  campaigns,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeInputs value={value} onChange={onChange} />
      <CampaignSelect
        campaigns={campaigns}
        value={value.campaignId}
        onChange={(campaignId) => onChange({ ...value, campaignId })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultValue}
        onReset={onChange}
      />
    </div>
  );
}
