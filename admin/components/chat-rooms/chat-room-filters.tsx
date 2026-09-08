"use client";

import { FilterResetButton } from "@/components/filter-reset-button";
import { FilterSelect } from "@/components/filter-select";
import { SearchInput } from "@/components/search-input";
import { chatRoomStatusLabels } from "@/lib/labels";
import type { ChatRoomStatus } from "@/lib/types";

export type ChatRoomFilter = {
  status: ChatRoomStatus | "ALL";
  memberId: string;
};

export const defaultChatRoomFilter: ChatRoomFilter = {
  status: "ALL",
  memberId: "",
};

const statusItems: Record<ChatRoomStatus | "ALL", string> = {
  ALL: "전체",
  ...chatRoomStatusLabels,
};

type Props = {
  value: ChatRoomFilter;
  onChange: (value: ChatRoomFilter) => void;
};

export function ChatRoomFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        items={statusItems}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <SearchInput
        numeric
        placeholder="회원 ID"
        value={value.memberId}
        onChange={(memberId) => onChange({ ...value, memberId })}
      />
      <FilterResetButton
        value={value}
        defaultValue={defaultChatRoomFilter}
        onReset={onChange}
      />
    </div>
  );
}
