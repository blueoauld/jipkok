"use client";

import Link from "next/link";

type Props = {
  id: number;
  nickname: string;
};

export function MemberCell({ id, nickname }: Props) {
  return (
    <Link
      href={`/members/detail?id=${id}`}
      onClick={(event) => event.stopPropagation()}
      className="group/member"
    >
      <span className="group-hover/member:underline">{nickname}</span>
      <span className="ml-1 tabular-nums text-muted-foreground">#{id}</span>
    </Link>
  );
}
