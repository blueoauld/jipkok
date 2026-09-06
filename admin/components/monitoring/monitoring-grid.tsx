"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FilterSelect } from "@/components/filter-select";
import { QuerySection } from "@/components/query-section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useListState } from "@/hooks/use-list-state";
import { fetchMonitoring } from "@/lib/api/monitoring";
import { formatDateTime } from "@/lib/format";
import type { MonitoringRange } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60 * 1000;
const GRID_COLUMNS = 24;

const rangeItems: Record<MonitoringRange, string> = {
  H3: "최근 3시간",
  H12: "최근 12시간",
  D1: "최근 1일",
  D3: "최근 3일",
  W1: "최근 1주",
};

const defaultFilter = { range: "H3" };

function rangeOf(value: string): MonitoringRange {
  return value in rangeItems ? (value as MonitoringRange) : "H3";
}

export function MonitoringGrid() {
  const { filter, changeFilter } = useListState(defaultFilter);
  const range = rangeOf(filter.range);

  const { data, isPending, error } = useQuery({
    queryKey: ["monitoring", range],
    queryFn: () => fetchMonitoring(range),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterSelect
            items={rangeItems}
            value={range}
            onChange={(next) => changeFilter({ range: next })}
          />
          {data && (
            <p className="text-sm text-muted-foreground">
              {formatDateTime(data.refreshedAt)} 기준, 1분마다 새로 고칩니다.
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <QuerySection
          isPending={isPending}
          error={error}
          skeletonClassName="h-96 w-full"
        >
          {data && !data.configured && (
            <div className="flex h-32 items-center justify-center border border-dashed text-sm text-muted-foreground">
              CloudWatch 대시보드 이름이 설정되어 있지 않습니다.
            </div>
          )}
          {data && data.configured && data.widgets.length === 0 && (
            <div className="flex h-32 items-center justify-center border border-dashed text-sm text-muted-foreground">
              대시보드에 지표 위젯이 없습니다.
            </div>
          )}
          {data && data.widgets.length > 0 && (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
              }}
            >
              {data.widgets.map((widget, index) => (
                <figure
                  key={`${widget.title ?? "widget"}-${index}`}
                  className="col-span-full overflow-hidden rounded-lg border bg-white lg:[grid-column:span_var(--span)]"
                  style={{ "--span": widget.width } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${widget.image}`}
                    alt={widget.title ?? "지표"}
                    className="h-auto w-full"
                  />
                </figure>
              ))}
            </div>
          )}
        </QuerySection>
      </CardContent>
    </Card>
  );
}
