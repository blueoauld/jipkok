"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";

export type AiMemberEnabled = "ALL" | "ON" | "OFF";

export type AiMemberFilter = {
  enabled: AiMemberEnabled;
  keyword: string;
};

export const defaultAiMemberFilter: AiMemberFilter = {
  enabled: "ALL",
  keyword: "",
};

const enabledItems: Record<AiMemberEnabled, string> = {
  ALL: "전체",
  ON: "활성",
  OFF: "비활성",
};

type Props = {
  value: AiMemberFilter;
  onChange: (value: AiMemberFilter) => void;
};

export function AiMemberFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        items={enabledItems}
        value={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />
      <SearchInput
        className="w-64"
        placeholder="닉네임"
        value={value.keyword}
        onChange={(keyword) => onChange({ ...value, keyword })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultAiMemberFilter}
        onReset={onChange}
      />
    </div>
  );
}
