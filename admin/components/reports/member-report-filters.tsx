"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportReasonLabels, reportTypeLabels } from "@/lib/labels";
import type { MemberReportType, ReportReason } from "@/lib/types";

export type MemberReportStatus = "PENDING" | "HANDLED" | "ALL";

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
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="w-40 pr-8 focus-visible:border-input focus-visible:ring-0"
          inputMode="numeric"
          placeholder="피신고자 ID"
          value={value.reportedMemberId}
          onChange={(event) =>
            onChange({
              ...value,
              reportedMemberId: event.target.value.replace(/\D/g, ""),
            })
          }
        />
      </div>
    </div>
  );
}

type FilterSelectProps<T extends string> = {
  items: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

function FilterSelect<T extends string>({
  items,
  value,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next as T)}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {(Object.keys(items) as T[]).map((key) => (
          <SelectItem key={key} value={key}>
            {items[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
