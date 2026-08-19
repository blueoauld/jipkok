"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { reportReasonLabels, reportTypeLabels } from "@/lib/labels";
import type { MemberReportType, ReportReason } from "@/lib/types";

export type MemberReportStatus = "ALL" | "HANDLED" | "PENDING";

export type MemberReportFilter = {
  status: MemberReportStatus;
  type: MemberReportType | "ALL";
  reason: ReportReason | "ALL";
  reportedMemberId: string;
};

export const defaultMemberReportFilter: MemberReportFilter = {
  status: "ALL",
  type: "ALL",
  reason: "ALL",
  reportedMemberId: "",
};

const statusItems: Record<MemberReportStatus, string> = {
  ALL: "전체",
  HANDLED: "처리",
  PENDING: "미처리",
};

const typeItems: Record<MemberReportType | "ALL", string> = {
  ALL: "모든 종류",
  PROFILE: reportTypeLabels.PROFILE,
  CHAT: reportTypeLabels.CHAT,
};

const reasonItems: Record<ReportReason | "ALL", string> = {
  ALL: "모든 사유",
  ...reportReasonLabels,
};

type Props = {
  value: MemberReportFilter;
  onChange: (value: MemberReportFilter) => void;
};

export function MemberReportFilters({ value, onChange }: Props) {
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
      <FilterSelect
        items={reasonItems}
        value={value.reason}
        onChange={(reason) => onChange({ ...value, reason })}
      />
      <SearchInput
        numeric
        placeholder="피신고자 ID"
        value={value.reportedMemberId}
        onChange={(reportedMemberId) =>
          onChange({ ...value, reportedMemberId })
        }
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultMemberReportFilter}
        onReset={onChange}
      />
    </div>
  );
}
