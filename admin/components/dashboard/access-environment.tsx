import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount } from "@/lib/format";
import { devicePlatformLabels } from "@/lib/labels";
import type { AccessEnvironment, DevicePlatform } from "@/lib/types";

type Props = {
  data: AccessEnvironment;
};

export function AccessEnvironmentCard({ data }: Props) {
  const platforms = Object.keys(data.platforms) as DevicePlatform[];
  const total = platforms.reduce((sum, p) => sum + data.platforms[p], 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>접속 환경</CardTitle>
        <CardDescription>최근 7일 접속 회원 기준</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-2 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          {platforms.map((platform, index) => (
            <div
              key={platform}
              style={{
                width: `${total === 0 ? 0 : (data.platforms[platform] / total) * 100}%`,
                background: `var(--chart-${index + 1})`,
              }}
            />
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          {platforms.map((platform, index) => (
            <span key={platform} className="flex items-center gap-1.5">
              <span
                className="size-2"
                style={{ background: `var(--chart-${index + 1})` }}
              />
              {devicePlatformLabels[platform]}{" "}
              {formatCount(data.platforms[platform])}명
              {total > 0 &&
                ` (${Math.round((data.platforms[platform] / total) * 100)}%)`}
            </span>
          ))}
        </div>
        <VersionTable versions={data.versions} />
      </CardContent>
    </Card>
  );
}

function VersionTable({
  versions,
}: {
  versions: AccessEnvironment["versions"];
}) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        버전 기록이 아직 없습니다. 기록이 쌓이면 표시됩니다.
      </p>
    );
  }

  const total = versions.reduce((sum, row) => sum + row.count, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>버전</TableHead>
          <TableHead>플랫폼</TableHead>
          <TableHead className="text-right">회원 수</TableHead>
          <TableHead className="w-20 text-right">비율</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((row) => (
          <TableRow key={`${row.version}-${row.platform}`}>
            <TableCell className="tabular-nums">{row.version}</TableCell>
            <TableCell>{devicePlatformLabels[row.platform]}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.count)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {total === 0 ? 0 : Math.round((row.count / total) * 100)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
