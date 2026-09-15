import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "@/lib/format";
import type { AiReplyStat } from "@/lib/types";

type Props = {
  today: AiReplyStat;
  total: AiReplyStat;
};

export function AiMemberStats({ today, total }: Props) {
  const rows = [
    { label: "오늘", stat: today },
    { label: "누적", stat: total },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>응답 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-fit grid-cols-[4rem_auto_auto_auto_auto_auto] gap-x-8 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">기간</span>
          <span className="text-right text-muted-foreground">응답</span>
          <span className="text-right text-muted-foreground">토큰</span>
          <span className="text-right text-muted-foreground">캐시</span>
          <span className="text-right text-muted-foreground">인사</span>
          <span className="text-right text-muted-foreground">답장</span>
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <span>{row.label}</span>
              <span className="text-right tabular-nums">
                {formatCount(row.stat.replyCount)}
              </span>
              <span className="text-right tabular-nums">
                {formatCount(row.stat.tokenCount)}
              </span>
              <span className="text-right tabular-nums">
                {formatCount(row.stat.cachedTokenCount)}
              </span>
              <span className="text-right tabular-nums">
                {formatCount(row.stat.greetingCount)}
              </span>
              <span className="text-right tabular-nums">
                {formatCount(row.stat.greetingReplyCount)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          토큰은 입력과 출력을 합친 값이고, 캐시는 그중 프롬프트 캐시에서 읽은
          입력 토큰입니다. 응답 로그는 90일 뒤 지워집니다. 인사는 먼저 보낸 첫
          쪽지 수, 답장은 그중 상대가 답한 방 수입니다.
        </p>
      </CardContent>
    </Card>
  );
}
