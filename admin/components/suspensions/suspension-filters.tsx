"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { suspensionStatusLabels, suspensionTypeLabels } from "@/lib/labels";
import type { SuspensionStatus, SuspensionType } from "@/lib/types";

export type SuspensionFilter = {
  status: SuspensionStatus | "ALL";
  type: SuspensionType | "ALL";
  memberId: string;
};

export const defaultSuspensionFilter: SuspensionFilter = {
  status: "ALL",
  type: "ALL",
  memberId: "",
};

const statusItems: Record<SuspensionStatus | "ALL", string> = {
  ALL: "전체",
  ...suspensionStatusLabels,
};

const typeItems: Record<SuspensionType | "ALL", string> = {
  ALL: "모든 유형",
  ...suspensionTypeLabels,
};

type Props = {
  value: SuspensionFilter;
  onChange: (value: SuspensionFilter) => void;
};

export function SuspensionFilters({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <FilterSelect
        items={typeItems}
        value={value.type}
        onChange={(type) => onChange({ ...value, type })}
      />
      <SearchInput
        numeric
        placeholder="회원 ID"
        value={value.memberId}
        onChange={(memberId) => onChange({ ...value, memberId })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultSuspensionFilter}
        onReset={onChange}
      />
    </div>
  );
}
