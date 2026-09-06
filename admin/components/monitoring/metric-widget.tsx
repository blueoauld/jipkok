"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDateTime } from "@/lib/format";
import type { MonitoringRange, MonitoringWidget } from "@/lib/types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const timeOnly = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

const dateAndHour = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

const dateOnly = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

const timeFormats: Record<MonitoringRange, Intl.DateTimeFormat> = {
  H3: timeOnly,
  H12: timeOnly,
  D1: timeOnly,
  D3: dateAndHour,
  W1: dateOnly,
};

const valueFormat = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

function formatValue(value: number) {
  return valueFormat.format(value);
}

function rowsOf(widget: MonitoringWidget) {
  const rows = new Map<number, Record<string, number>>();
  for (const series of widget.series) {
    for (const point of series.points) {
      const time = new Date(point.time).getTime();
      const row = rows.get(time) ?? { time };
      row[series.id] = point.value;
      rows.set(time, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.time - b.time);
}

function configOf(widget: MonitoringWidget): ChartConfig {
  return Object.fromEntries(
    widget.series.map((series, index) => [
      series.id,
      {
        label: series.label,
        color: series.color ?? PALETTE[index % PALETTE.length],
      },
    ]),
  );
}

function latestOf(series: MonitoringWidget["series"][number]) {
  return series.points.length > 0
    ? series.points[series.points.length - 1].value
    : null;
}

type Props = {
  widget: MonitoringWidget;
  range: MonitoringRange;
  start: string;
  end: string;
};

export function MetricWidget({ widget, range, start, end }: Props) {
  const config = configOf(widget);
  const rows = rowsOf(widget);
  const single = widget.view === "singleValue" || widget.view === "gauge";
  const tickFormat = timeFormats[range];
  const empty = widget.series.every((series) => series.points.length === 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{widget.title ?? "지표"}</CardTitle>
        {widget.period != null && (
          <CardDescription>{widget.period / 60}분 단위</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            기간에 데이터가 없습니다.
          </div>
        ) : single ? (
          <div className="flex flex-wrap gap-6">
            {widget.series.map((series) => {
              const latest = latestOf(series);
              return (
                <div key={series.id}>
                  <div className="text-sm text-muted-foreground">
                    {series.label}
                  </div>
                  <div className="text-3xl font-semibold tabular-nums">
                    {latest == null ? "-" : formatValue(latest)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <ComposedChart data={rows} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={[new Date(start).getTime(), new Date(end).getTime()]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => tickFormat.format(new Date(value))}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                domain={[widget.yAxisMin ?? 0, widget.yAxisMax ?? "auto"]}
                tickFormatter={formatValue}
                label={
                  widget.yAxisLabel
                    ? {
                        value: widget.yAxisLabel,
                        angle: -90,
                        position: "insideLeft",
                      }
                    : undefined
                }
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      formatDateTime(
                        new Date(payload?.[0]?.payload?.time).toISOString(),
                      )
                    }
                  />
                }
              />
              {widget.series.length > 1 && (
                <ChartLegend content={<ChartLegendContent />} />
              )}
              {widget.annotations.map((annotation, index) => (
                <ReferenceLine
                  key={index}
                  y={annotation.value}
                  stroke={annotation.color ?? "var(--muted-foreground)"}
                  strokeDasharray="4 4"
                  label={{
                    value: annotation.label
                      ? `${annotation.label} (${formatValue(annotation.value)})`
                      : formatValue(annotation.value),
                    position: "insideTopRight",
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />
              ))}
              {widget.series.map((series) =>
                widget.stacked ? (
                  <Area
                    key={series.id}
                    dataKey={series.id}
                    type="monotone"
                    stackId="stack"
                    stroke={`var(--color-${series.id})`}
                    fill={`var(--color-${series.id})`}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    connectNulls
                  />
                ) : (
                  <Line
                    key={series.id}
                    dataKey={series.id}
                    type="monotone"
                    stroke={`var(--color-${series.id})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ),
              )}
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
