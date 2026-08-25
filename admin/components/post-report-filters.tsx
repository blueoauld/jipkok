"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";

export type PostReportStatus = "ALL" | "ACTIVE" | "DELETED";

export type PostReportFilter = {
  status: PostReportStatus;
  authorId: string;
};

export const defaultPostReportFilter: PostReportFilter = {
  status: "ALL",
  authorId: "",
};

const statusItems: Record<PostReportStatus, string> = {
  ALL: "전체",
  ACTIVE: "게시",
  DELETED: "삭제",
};

type Props = {
  value: PostReportFilter;
  onChange: (value: PostReportFilter) => void;
};

export function PostReportFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <SearchInput
        numeric
        placeholder="작성자 ID"
        value={value.authorId}
        onChange={(authorId) => onChange({ ...value, authorId })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultPostReportFilter}
        onReset={onChange}
      />
    </div>
  );
}
