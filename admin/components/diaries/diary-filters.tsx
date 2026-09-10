"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { SearchInput } from "@/components/search-input";

export type DiaryFilter = {
  memberId: string;
};

export const defaultDiaryFilter: DiaryFilter = {
  memberId: "",
};

type Props = {
  value: DiaryFilter;
  onChange: (value: DiaryFilter) => void;
};

export function DiaryFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        numeric
        placeholder="회원 ID"
        value={value.memberId}
        onChange={(memberId) => onChange({ ...value, memberId })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultDiaryFilter}
        onReset={onChange}
      />
    </div>
  );
}
