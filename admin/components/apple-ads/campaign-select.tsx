"use client";

import { FilterSelect, type FilterItem } from "@/components/filter-select";
import type { AppleAdsCampaign } from "@/lib/types";

type Props = {
  campaigns: AppleAdsCampaign[];
  value: string;
  onChange: (value: string) => void;
};

export function CampaignSelect({ campaigns, value, onChange }: Props) {
  const items: FilterItem<string>[] = [
    { value: "ALL", label: "모든 캠페인" },
    ...campaigns.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <FilterSelect
      items={items}
      value={items.some((c) => c.value === value) ? value : "ALL"}
      onChange={onChange}
    />
  );
}
