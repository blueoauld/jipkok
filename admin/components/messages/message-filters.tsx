"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { smsStatusLabels } from "@/lib/labels";
import type { SmsMessageStatus } from "@/lib/types";

export type MessageFilter = {
  status: SmsMessageStatus | "ALL";
  to: string;
};

export const defaultMessageFilter: MessageFilter = {
  status: "ALL",
  to: "",
};

const statusItems: Record<SmsMessageStatus | "ALL", string> = {
  ALL: "모든 상태",
  ...smsStatusLabels,
};

type Props = {
  value: MessageFilter;
  onChange: (value: MessageFilter) => void;
};

export function MessageFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <SearchInput
        numeric
        placeholder="수신번호"
        value={value.to}
        onChange={(to) => onChange({ ...value, to })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultMessageFilter}
        onReset={onChange}
      />
    </div>
  );
}
