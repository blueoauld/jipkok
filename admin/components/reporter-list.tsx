import { Fragment } from "react";
import { MemberCell } from "@/components/member-cell";
import { formatDateTime } from "@/lib/format";

type Reporter = {
  id: number;
  nickname: string;
  reportedAt: string;
};

export function ReporterList({ reporters }: { reporters: Reporter[] }) {
  return (
    <div className="grid w-fit grid-cols-[12rem_auto] gap-x-8 gap-y-1.5 text-sm">
      <span className="text-muted-foreground">신고자</span>
      <span className="text-muted-foreground">신고일</span>
      {reporters.map((reporter) => (
        <Fragment key={reporter.id}>
          <MemberCell id={reporter.id} nickname={reporter.nickname} />
          <span className="tabular-nums">
            {formatDateTime(reporter.reportedAt)}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
