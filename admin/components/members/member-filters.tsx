"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { genderLabels } from "@/lib/labels";
import type { Gender } from "@/lib/types";

export type MemberStatus = "ALL" | "NORMAL" | "SUSPENDED" | "WITHDRAWN";

export type MemberFilter = {
  gender: Gender | "ALL";
  status: MemberStatus;
  keyword: string;
};

export const defaultMemberFilter: MemberFilter = {
  gender: "ALL",
  status: "ALL",
  keyword: "",
};

const genderItems: Record<Gender | "ALL", string> = {
  ALL: "모든 성별",
  ...genderLabels,
};

const statusItems: Record<MemberStatus, string> = {
  ALL: "전체",
  NORMAL: "정상",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

type Props = {
  value: MemberFilter;
  onChange: (value: MemberFilter) => void;
};

export function MemberFilters({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <FilterSelect
        items={genderItems}
        value={value.gender}
        onChange={(gender) => onChange({ ...value, gender })}
      />
      <SearchInput
        className="w-64"
        placeholder="ID, 닉네임, 전화번호"
        value={value.keyword}
        onChange={(keyword) => onChange({ ...value, keyword })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultMemberFilter}
        onReset={onChange}
      />
    </div>
  );
}
