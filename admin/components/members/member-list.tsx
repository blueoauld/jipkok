"use client";

import { useState } from "react";
import {
  defaultMemberFilter,
  MemberFilters,
  type MemberFilter,
  type MemberStatus,
} from "@/components/members/member-filters";
import { MemberTable } from "@/components/members/member-table";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { MemberSummary } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  members: MemberSummary[];
};

export function MemberList({ members }: Props) {
  const [filter, setFilter] = useState(defaultMemberFilter);
  const [page, setPage] = useState(1);

  const filtered = members.filter((member) => matches(member, filter));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (next: MemberFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <MemberFilters value={filter} onChange={changeFilter} />
      </CardHeader>
      <CardContent>
        <MemberTable members={pageItems} />
      </CardContent>
      <CardFooter className="bg-transparent">
        <TablePagination
          page={page}
          size={PAGE_SIZE}
          totalCount={filtered.length}
          onPageChange={setPage}
        />
      </CardFooter>
    </Card>
  );
}

function matches(member: MemberSummary, filter: MemberFilter) {
  if (filter.gender !== "ALL" && member.gender !== filter.gender) return false;
  if (filter.status !== "ALL" && statusOf(member) !== filter.status)
    return false;

  const keyword = filter.keyword.trim();
  if (!keyword) return true;

  const digits = keyword.replace(/\D/g, "");
  return (
    member.nickname.includes(keyword) ||
    (digits.length > 0 &&
      (String(member.id) === digits || member.phoneNumber.includes(digits)))
  );
}

function statusOf(member: MemberSummary): MemberStatus {
  if (member.withdrawnAt) return "WITHDRAWN";
  if (member.suspended) return "SUSPENDED";
  return "NORMAL";
}
