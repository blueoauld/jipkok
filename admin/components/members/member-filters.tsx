"use client";

import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { genderLabels } from "@/lib/labels";
import type { Gender } from "@/lib/types";

export type MemberSuspensionStatus = "ALL" | "NORMAL" | "SUSPENDED";

export type MemberFilter = {
  gender: Gender | "ALL";
  suspension: MemberSuspensionStatus;
  keyword: string;
};

export const defaultMemberFilter: MemberFilter = {
  gender: "ALL",
  suspension: "ALL",
  keyword: "",
};

const genderItems: Record<Gender | "ALL", string> = {
  ALL: "모든 성별",
  ...genderLabels,
};

const suspensionItems: Record<MemberSuspensionStatus, string> = {
  ALL: "전체",
  NORMAL: "정상",
  SUSPENDED: "정지",
};

type Props = {
  value: MemberFilter;
  onChange: (value: MemberFilter) => void;
};

export function MemberFilters({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        items={suspensionItems}
        value={value.suspension}
        onChange={(suspension) => onChange({ ...value, suspension })}
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
    </div>
  );
}
