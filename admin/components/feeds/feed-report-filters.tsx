"use client";

import { FilterSelect } from "@/components/filter-select";
import { IdSearchInput } from "@/components/id-search-input";

export type FeedReportStatus = "ALL" | "ACTIVE" | "DELETED";

export type FeedReportFilter = {
  status: FeedReportStatus;
  authorId: string;
};

export const defaultFeedReportFilter: FeedReportFilter = {
  status: "ALL",
  authorId: "",
};

const statusItems: Record<FeedReportStatus, string> = {
  ALL: "전체",
  ACTIVE: "게시",
  DELETED: "삭제",
};

type Props = {
  value: FeedReportFilter;
  onChange: (value: FeedReportFilter) => void;
};

export function FeedReportFilters({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <IdSearchInput
        placeholder="작성자 ID"
        value={value.authorId}
        onChange={(authorId) => onChange({ ...value, authorId })}
      />
    </div>
  );
}
