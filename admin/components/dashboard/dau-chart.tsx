"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDate } from "@/lib/format";
import type { DauPoint } from "@/lib/types";

const config = {
  dau: { label: "DAU", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Props = {
  data: DauPoint[];
};

export function DauChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 14일 DAU</CardTitle>
        <CardDescription>하루에 한 번 이상 접속한 회원 수</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDate(String(label))}
                />
              }
            />
            <Line
              dataKey="dau"
              type="monotone"
              stroke="var(--color-dau)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
